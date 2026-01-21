// Video processing API - will be implemented in Stage 2
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { message: 'Video processing will be implemented in Stage 2' },
    { status: 501 }
  );
}
