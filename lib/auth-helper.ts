/**
 * Authentication Helper
 * Provides user authentication context for API routes and server components
 * Uses Supabase Auth for authentication
 */

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

export async function getAuthUser() {
  const supabase = await createClient()

  // Get the current user session
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { user: null }
  }

  // Get or create user in database
  let dbUser = await prisma.user.findUnique({
    where: { authUserId: user.id }, // We're reusing the authUserId field for Supabase user ID
  })

  if (!dbUser) {
    // Auto-create user on first auth (they just signed up)
    dbUser = await prisma.user.create({
      data: {
        authUserId: user.id, // Store Supabase user ID here
        email: user.email || 'unknown@postplex.com',
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      },
    })
  }

  return {
    user: {
      id: dbUser.id,
      authUserId: dbUser.authUserId,
      email: dbUser.email,
    },
  }
}
