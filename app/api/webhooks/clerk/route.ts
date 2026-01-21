/**
 * Supabase Auth Webhook Handler
 * This file is kept for compatibility but Supabase Auth uses different webhook patterns
 * You can delete this file or repurpose it for Supabase webhooks if needed
 */

import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  // Supabase Auth doesn't use webhooks the same way Clerk does
  // If you need to handle Supabase auth events, you can use Database Webhooks
  // or Auth Hooks in your Supabase dashboard
  
  return NextResponse.json({ message: 'Webhook endpoint (not in use with Supabase Auth)' }, { status: 200 })
}
