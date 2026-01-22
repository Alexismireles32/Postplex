/**
 * Post Scheduling API
 * Handles creating scheduled posts for processed videos
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-helper';
import { prisma } from '@/lib/db';
import { addPostScheduleJob } from '@/lib/queue';

interface SchedulePostRequest {
  processedVideoId?: string;
  sourceVideoId?: string;
  connectedAccountId: string;
  campaignId: string;
  caption: string;
  scheduledAt: string; // ISO date string
}

interface BulkScheduleRequest {
  videoIds: string[]; // Can be either processed or source video IDs
  useProcessed: boolean; // Whether to use processed or source videos
  connectedAccountIds: string[];
  campaignId: string;
  schedule: {
    startDate: string;
    postsPerDay: number;
    timeSlots: string[]; // Array of times like ["09:00", "14:00", "19:00"]
  };
  captionTemplate?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Check if this is a bulk schedule request
    if ('videoIds' in body && Array.isArray(body.videoIds)) {
      return handleBulkSchedule(user.id, body as BulkScheduleRequest);
    }

    // Single post scheduling
    return handleSingleSchedule(user.id, body as SchedulePostRequest);
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Error scheduling post:', err);
    return NextResponse.json(
      { error: 'Failed to schedule post', details: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handleSingleSchedule(userId: string, data: SchedulePostRequest) {
  const { processedVideoId, sourceVideoId, connectedAccountId, campaignId, caption, scheduledAt } = data;

  // Validate required fields
  if (!connectedAccountId || !campaignId || !caption || !scheduledAt) {
    return NextResponse.json(
      { error: 'Missing required fields: connectedAccountId, campaignId, caption, scheduledAt' },
      { status: 400 }
    );
  }

  if (!processedVideoId && !sourceVideoId) {
    return NextResponse.json(
      { error: 'Either processedVideoId or sourceVideoId is required' },
      { status: 400 }
    );
  }

  // Verify ownership of connected account
  const account = await prisma.connectedAccount.findUnique({
    where: { id: connectedAccountId },
  });

  if (!account || account.userId !== userId) {
    return NextResponse.json({ error: 'Connected account not found' }, { status: 404 });
  }

  // Get video URL for posting
  let videoUrl: string | null = null;
  
  if (processedVideoId) {
    const processedVideo = await prisma.processedVideo.findUnique({
      where: { id: processedVideoId },
      include: { campaign: true },
    });
    
    if (!processedVideo || processedVideo.campaign.userId !== userId) {
      return NextResponse.json({ error: 'Processed video not found' }, { status: 404 });
    }
    
    videoUrl = processedVideo.processedUrl;
  } else if (sourceVideoId) {
    const sourceVideo = await prisma.sourceVideo.findUnique({
      where: { id: sourceVideoId },
      include: { campaign: true },
    });
    
    if (!sourceVideo || sourceVideo.campaign.userId !== userId) {
      return NextResponse.json({ error: 'Source video not found' }, { status: 404 });
    }
    
    videoUrl = sourceVideo.downloadedUrl;
  }

  if (!videoUrl) {
    return NextResponse.json(
      { error: 'Video has not been processed yet. Wait for processing to complete.' },
      { status: 400 }
    );
  }

  const scheduledDate = new Date(scheduledAt);
  if (scheduledDate <= new Date()) {
    return NextResponse.json(
      { error: 'Scheduled time must be in the future' },
      { status: 400 }
    );
  }

  // Create scheduled post
  const scheduledPost = await prisma.scheduledPost.create({
    data: {
      userId,
      processedVideoId: processedVideoId || null,
      sourceVideoId: sourceVideoId || null,
      connectedAccountId,
      campaignId,
      caption,
      scheduledAt: scheduledDate,
      status: 'scheduled',
    },
    include: {
      connectedAccount: true,
    },
  });

  // Add to post schedule queue
  await addPostScheduleJob(
    {
      scheduledPostId: scheduledPost.id,
      videoUrl,
      caption,
      platform: account.platform,
      profileKey: account.ayrshareProfileKey,
    },
    scheduledDate
  );

  return NextResponse.json({
    success: true,
    message: `Post scheduled for ${scheduledDate.toLocaleString()} 📅`,
    scheduledPost: {
      id: scheduledPost.id,
      scheduledAt: scheduledPost.scheduledAt,
      platform: scheduledPost.connectedAccount.platform,
    },
  });
}

async function handleBulkSchedule(userId: string, data: BulkScheduleRequest) {
  const { videoIds, useProcessed, connectedAccountIds, campaignId, schedule, captionTemplate } = data;

  if (!videoIds.length || !connectedAccountIds.length) {
    return NextResponse.json(
      { error: 'videoIds and connectedAccountIds are required' },
      { status: 400 }
    );
  }

  // Verify ownership of all connected accounts
  const accounts = await prisma.connectedAccount.findMany({
    where: {
      id: { in: connectedAccountIds },
      userId,
    },
  });

  if (accounts.length !== connectedAccountIds.length) {
    return NextResponse.json(
      { error: 'One or more connected accounts not found' },
      { status: 404 }
    );
  }

  // Get videos with their URLs
  let videos: Array<{ id: string; url: string | null; caption: string }> = [];

  if (useProcessed) {
    const processedVideos = await prisma.processedVideo.findMany({
      where: {
        id: { in: videoIds },
        campaign: { userId },
        status: 'completed',
      },
      include: {
        sourceVideo: true,
      },
    });
    
    videos = processedVideos.map((v) => ({
      id: v.id,
      url: v.processedUrl,
      caption: v.sourceVideo.caption,
    }));
  } else {
    const sourceVideos = await prisma.sourceVideo.findMany({
      where: {
        id: { in: videoIds },
        campaign: { userId },
        downloaded: true,
      },
    });
    
    videos = sourceVideos.map((v) => ({
      id: v.id,
      url: v.downloadedUrl,
      caption: v.caption,
    }));
  }

  const readyVideos = videos.filter((v) => v.url !== null);
  
  if (readyVideos.length === 0) {
    return NextResponse.json(
      { error: 'No videos are ready for scheduling. Make sure they are processed/downloaded.' },
      { status: 400 }
    );
  }

  // Generate schedule dates
  const startDate = new Date(schedule.startDate);
  const timeSlots = schedule.timeSlots || ['09:00', '14:00', '19:00'];
  const postsPerDay = Math.min(schedule.postsPerDay || 3, timeSlots.length);

  const scheduledPosts: Array<{
    id: string;
    scheduledAt: Date;
    platform: string;
    videoId: string;
  }> = [];

  const currentDate = new Date(startDate);

  // Create posts for each video across all accounts
  for (const video of readyVideos) {
    for (const account of accounts) {
      // Get time slot for this post
      const timeSlotIndex = scheduledPosts.length % postsPerDay;
      const timeSlot = timeSlots[timeSlotIndex] || '09:00';
      const timeParts = timeSlot.split(':').map(Number);
      const hours = timeParts[0] ?? 9;
      const minutes = timeParts[1] ?? 0;
      
      const scheduledAt = new Date(currentDate);
      scheduledAt.setHours(hours, minutes, 0, 0);

      // Skip if scheduled time is in the past
      if (scheduledAt <= new Date()) {
        currentDate.setDate(currentDate.getDate() + 1);
        scheduledAt.setDate(scheduledAt.getDate() + 1);
      }

      const caption = captionTemplate 
        ? captionTemplate.replace('{{original}}', video.caption)
        : video.caption;

      // Create scheduled post
      const post = await prisma.scheduledPost.create({
        data: {
          userId,
          processedVideoId: useProcessed ? video.id : null,
          sourceVideoId: !useProcessed ? video.id : null,
          connectedAccountId: account.id,
          campaignId,
          caption,
          scheduledAt,
          status: 'scheduled',
        },
      });

      // Add to queue
      await addPostScheduleJob(
        {
          scheduledPostId: post.id,
          videoUrl: video.url!,
          caption,
          platform: account.platform,
          profileKey: account.ayrshareProfileKey,
        },
        scheduledAt
      );

      scheduledPosts.push({
        id: post.id,
        scheduledAt,
        platform: account.platform,
        videoId: video.id,
      });

      // Move to next time slot or next day
      if ((scheduledPosts.length % postsPerDay) === 0) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

  }

  return NextResponse.json({
    success: true,
    message: `Scheduled ${scheduledPosts.length} posts across ${accounts.length} accounts! 🚀`,
    totalPosts: scheduledPosts.length,
    videosScheduled: readyVideos.length,
    accountsUsed: accounts.length,
    scheduledPosts: scheduledPosts.slice(0, 10), // Return first 10 for preview
  });
}

// GET endpoint to fetch scheduled posts
export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {
      userId: user.id,
    };

    if (campaignId) {
      where.campaignId = campaignId;
    }

    if (status) {
      where.status = status;
    }

    const [posts, total] = await Promise.all([
      prisma.scheduledPost.findMany({
        where,
        include: {
          processedVideo: {
            include: {
              sourceVideo: {
                select: {
                  thumbnailUrl: true,
                  caption: true,
                },
              },
            },
          },
          sourceVideo: {
            select: {
              thumbnailUrl: true,
              caption: true,
            },
          },
          connectedAccount: {
            select: {
              platform: true,
              platformAccountName: true,
            },
          },
          campaign: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { scheduledAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.scheduledPost.count({ where }),
    ]);

    return NextResponse.json({
      posts,
      total,
      page,
      pageSize: limit,
      hasMore: total > page * limit,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Error fetching scheduled posts:', err);
    return NextResponse.json(
      { error: 'Failed to fetch posts', details: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to cancel a scheduled post
export async function DELETE(request: NextRequest) {
  try {
    const { user } = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('id');

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const post = await prisma.scheduledPost.findUnique({
      where: { id: postId },
    });

    if (!post || post.userId !== user.id) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.status === 'posted') {
      return NextResponse.json(
        { error: 'Cannot cancel a post that has already been published' },
        { status: 400 }
      );
    }

    // Update status to cancelled
    await prisma.scheduledPost.update({
      where: { id: postId },
      data: { status: 'paused' },
    });

    return NextResponse.json({
      success: true,
      message: 'Post cancelled successfully',
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Error cancelling post:', err);
    return NextResponse.json(
      { error: 'Failed to cancel post', details: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
