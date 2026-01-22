/**
 * Cron Job: Process Scheduled Posts
 * 
 * This endpoint should be called every minute by a cron service (Railway, Vercel, etc.)
 * It processes posts that are due to be published.
 * 
 * Recommended cron schedule: "* * * * *" (every minute)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ayrshare } from '@/lib/ayrshare';

// Maximum posts to process per cron run
const MAX_POSTS_PER_RUN = 10;

// Maximum retry attempts
const MAX_RETRIES = 3;

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret (security)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Allow bypass in development
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Cron] Starting scheduled post processing...');

    // Find posts that are due (scheduled time has passed and status is 'scheduled')
    const duePosts = await prisma.scheduledPost.findMany({
      where: {
        status: 'scheduled',
        scheduledAt: {
          lte: new Date(),
        },
        retryCount: {
          lt: MAX_RETRIES,
        },
      },
      include: {
        processedVideo: true,
        sourceVideo: true,
        connectedAccount: true,
        campaign: true,
      },
      take: MAX_POSTS_PER_RUN,
      orderBy: {
        scheduledAt: 'asc',
      },
    });

    if (duePosts.length === 0) {
      console.log('[Cron] No posts to process');
      return NextResponse.json({
        success: true,
        message: 'No posts to process',
        processed: 0,
      });
    }

    console.log(`[Cron] Found ${duePosts.length} posts to process`);

    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ postId: string; error: string }>,
    };

    // Process each post
    for (const post of duePosts) {
      try {
        console.log(`[Cron] Processing post ${post.id} for ${post.connectedAccount.platform}`);

        // Update status to processing
        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: { status: 'processing' },
        });

        // Get video URL
        const videoUrl = post.processedVideo?.processedUrl || post.sourceVideo?.downloadedUrl;

        if (!videoUrl) {
          throw new Error('No video URL available');
        }

        // Post to social media via Ayrshare
        const ayrshareResponse = await ayrshare.createPost({
          post: post.caption,
          platforms: [post.connectedAccount.platform],
          mediaUrls: [videoUrl],
          profileKey: post.connectedAccount.ayrshareProfileKey,
        });

        // Find the platform-specific post ID and URL
        const platformResult = ayrshareResponse.postIds?.find(
          (p) => p.platform.toLowerCase() === post.connectedAccount.platform.toLowerCase()
        );

        // Update post as successful
        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: {
            status: 'posted',
            ayrsharePostId: ayrshareResponse.id,
            platformPostUrl: platformResult?.postUrl || null,
            postedAt: new Date(),
          },
        });

        console.log(`[Cron] Successfully posted ${post.id}`);
        results.success++;

      } catch (error: unknown) {
        const err = error as { message?: string };
        console.error(`[Cron] Failed to process post ${post.id}:`, err.message);

        // Update post with error
        const newRetryCount = post.retryCount + 1;
        const newStatus = newRetryCount >= MAX_RETRIES ? 'failed' : 'scheduled';

        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: {
            status: newStatus,
            errorMessage: err.message || 'Unknown error',
            retryCount: newRetryCount,
          },
        });

        results.failed++;
        results.errors.push({
          postId: post.id,
          error: err.message || 'Unknown error',
        });
      }
    }

    console.log(`[Cron] Completed: ${results.success} success, ${results.failed} failed`);

    return NextResponse.json({
      success: true,
      message: `Processed ${duePosts.length} posts`,
      processed: duePosts.length,
      results,
    });

  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('[Cron] Fatal error:', err);
    return NextResponse.json(
      { error: 'Cron job failed', details: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET endpoint for health checks and manual testing
export async function GET() {
  try {
    // Get scheduled posts count
    const [scheduledCount, processingCount, postedToday, failedCount] = await Promise.all([
      prisma.scheduledPost.count({
        where: { status: 'scheduled' },
      }),
      prisma.scheduledPost.count({
        where: { status: 'processing' },
      }),
      prisma.scheduledPost.count({
        where: {
          status: 'posted',
          postedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.scheduledPost.count({
        where: { status: 'failed' },
      }),
    ]);

    // Get next 5 posts due
    const upcomingPosts = await prisma.scheduledPost.findMany({
      where: {
        status: 'scheduled',
        scheduledAt: {
          gte: new Date(),
        },
      },
      select: {
        id: true,
        scheduledAt: true,
        connectedAccount: {
          select: {
            platform: true,
            platformAccountName: true,
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 5,
    });

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      stats: {
        scheduled: scheduledCount,
        processing: processingCount,
        postedToday,
        failed: failedCount,
      },
      upcomingPosts: upcomingPosts.map((p) => ({
        id: p.id,
        scheduledAt: p.scheduledAt,
        platform: p.connectedAccount.platform,
        account: p.connectedAccount.platformAccountName,
      })),
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { error: 'Health check failed', details: err.message },
      { status: 500 }
    );
  }
}
