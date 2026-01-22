import { NextResponse } from 'next/server';
import { checkDatabaseConnection } from '@/lib/db';

export async function GET() {
  // Debug: log DATABASE_URL (masked)
  const dbUrl = process.env.DATABASE_URL || 'NOT_SET';
  const maskedUrl = dbUrl.includes('@') 
    ? dbUrl.replace(/:([^@]+)@/, ':***@').substring(0, 80) + '...'
    : dbUrl.substring(0, 50);
  console.log('[Health] DATABASE_URL:', maskedUrl);
  
  try {
    const dbConnected = await checkDatabaseConnection();

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'connected' : 'connecting',
      app: 'running',
      dbHost: dbUrl.includes('@') ? dbUrl.split('@')[1]?.split('/')[0] : 'unknown',
    });
  } catch (error) {
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'error',
      app: 'running',
      dbHost: dbUrl.includes('@') ? dbUrl.split('@')[1]?.split('/')[0] : 'unknown',
    });
  }
}
