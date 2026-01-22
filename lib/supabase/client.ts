/**
 * Supabase Client for Client Components
 * Use this in 'use client' components
 */

import { createBrowserClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate at module load time for better error messages
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] Missing environment variables:', {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? 'SET' : 'MISSING',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ? 'SET' : 'MISSING',
  })
}

export function createClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase client cannot be created: Missing environment variables.')
    return null
  }
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
