// Post scheduling API - will be implemented in Stage 3
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { message: 'Post scheduling will be implemented in Stage 3' },
    { status: 501 }
  );
}
