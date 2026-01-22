import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { VideoIcon, CalendarIcon, SparklesIcon } from 'lucide-react';

// Auth pages (using Supabase Auth)
const ctaLink = '/sign-up';
const signInLink = '/sign-in';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <VideoIcon className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Postplex</span>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" asChild>
              <Link href={signInLink}>Sign In</Link>
            </Button>
            <Button asChild>
              <Link href={ctaLink}>Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Automate Your Video Content Strategy
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Import videos from social media, process them for uniqueness, and schedule automated posts across TikTok, Instagram, and Facebook.
        </p>
        <div className="flex justify-center gap-4">
          <Button size="lg" asChild>
            <Link href={ctaLink}>Start Free Trial</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href={signInLink}>Sign In</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Everything You Need to Scale Your Content
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <VideoIcon className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Video Discovery</h3>
            <p className="text-gray-600">
              Import videos from any social media profile. Discover high-performing content in seconds.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <SparklesIcon className="h-12 w-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Smart Processing</h3>
            <p className="text-gray-600">
              Automatically modify videos to avoid detection. Generate multiple unique versions.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <CalendarIcon className="h-12 w-12 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Auto Scheduling</h3>
            <p className="text-gray-600">
              Schedule posts across multiple platforms. Set it and forget it with automated posting.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="bg-blue-600 text-white rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Content Strategy?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join creators automating their social media presence with Postplex.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href={ctaLink}>Get Started Now</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t">
        <div className="text-center text-gray-600">
          <p>&copy; 2026 Postplex. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
