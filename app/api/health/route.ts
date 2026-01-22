import { NextResponse } from 'next/server';
import { checkDatabaseConnection } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Read DATABASE_URL at runtime
  const dbUrl = process.env.DATABASE_URL || 'NOT_SET';
  const dbHost = dbUrl.includes('@') ? dbUrl.split('@')[1]?.split('/')[0] : 'unknown';
  
  console.log('[Health] DATABASE_URL host:', dbHost);
  
  try {
    const dbConnected = await checkDatabaseConnection();

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'connected' : 'connecting',
      app: 'running',
      dbHost: dbHost,
    });
  } catch (error) {
    console.error('[Health] DB error:', error);
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'error',
      app: 'running',
      dbHost: dbHost,
    });
  }
}
