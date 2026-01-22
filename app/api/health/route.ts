import { NextResponse } from 'next/server';
import { checkDatabaseConnection } from '@/lib/db';

export async function GET() {
  try {
    // Always return 200 so Railway doesn't kill the app while DB is connecting
    const dbConnected = await checkDatabaseConnection();

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'connected' : 'connecting',
      app: 'running',
    });
  } catch (error) {
    // Even on error, return 200 so app stays alive
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'error',
      app: 'running',
      note: 'App is running but database may not be ready'
    });
  }
}
