import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { VideoIcon, CalendarIcon, TrendingUpIcon, PlusCircleIcon } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  // Get user from database
  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId: user.id },
  })

  if (!dbUser) {
    // Create user if doesn't exist
    await prisma.user.create({
      data: {
        clerkUserId: user.id,
        email: user.email || 'unknown@postplex.com',
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      },
    })
  }

  // Get user stats
  const [campaignCount, videoCount, scheduledPostCount] = await Promise.all([
    prisma.campaign.count({
      where: { userId: dbUser?.id || user.id },
    }),
    prisma.sourceVideo.count({
      where: {
        campaign: {
          userId: dbUser?.id || user.id,
        },
      },
    }),
    prisma.scheduledPost.count({
      where: {
        userId: dbUser?.id || user.id,
      },
    }),
  ])

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent mb-2">
          Welcome back! 👋
        </h1>
        <p className="text-gray-600">
          Here&apos;s what&apos;s happening with your content
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-2 border-purple-100 hover:border-purple-300 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-600">
              <VideoIcon className="w-5 h-5" />
              Campaigns
            </CardTitle>
            <CardDescription>Total campaigns created</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-purple-600">{campaignCount}</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-cyan-100 hover:border-cyan-300 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-cyan-600">
              <TrendingUpIcon className="w-5 h-5" />
              Videos
            </CardTitle>
            <CardDescription>Videos in your library</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-cyan-600">{videoCount}</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-100 hover:border-green-300 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CalendarIcon className="w-5 h-5" />
              Scheduled
            </CardTitle>
            <CardDescription>Posts ready to go</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-green-600">{scheduledPostCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-br from-purple-50 to-cyan-50 border-2 border-purple-200">
        <CardHeader>
          <CardTitle className="text-2xl">Quick Actions</CardTitle>
          <CardDescription>Get started with your content workflow</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/campaigns/new">
            <Button className="w-full h-24 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white flex flex-col items-center justify-center gap-2">
              <PlusCircleIcon className="w-8 h-8" />
              <span className="font-semibold">New Campaign</span>
            </Button>
          </Link>

          <Link href="/library">
            <Button className="w-full h-24 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white flex flex-col items-center justify-center gap-2">
              <VideoIcon className="w-8 h-8" />
              <span className="font-semibold">Video Library</span>
            </Button>
          </Link>

          <Link href="/schedule">
            <Button className="w-full h-24 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white flex flex-col items-center justify-center gap-2">
              <CalendarIcon className="w-8 h-8" />
              <span className="font-semibold">Schedule Posts</span>
            </Button>
          </Link>

          <Link href="/campaigns">
            <Button className="w-full h-24 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white flex flex-col items-center justify-center gap-2">
              <TrendingUpIcon className="w-8 h-8" />
              <span className="font-semibold">View Campaigns</span>
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Getting Started */}
      {campaignCount === 0 && (
        <Card className="mt-8 border-2 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-xl">🎉 Getting Started</CardTitle>
            <CardDescription>Welcome to Postplex! Here&apos;s how to get started:</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <p className="font-semibold">Create a Campaign</p>
                <p className="text-sm text-gray-600">
                  Import videos from TikTok, Instagram, or Facebook
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-cyan-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <p className="font-semibold">Make Videos Unique</p>
                <p className="text-sm text-gray-600">
                  Apply smart modifications to avoid detection
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <p className="font-semibold">Schedule & Post</p>
                <p className="text-sm text-gray-600">
                  Automate your posting schedule across platforms
                </p>
              </div>
            </div>
            <div className="pt-4">
              <Link href="/campaigns/new">
                <Button className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-bold">
                  Create Your First Campaign →
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
