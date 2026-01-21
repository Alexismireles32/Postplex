// Ayrshare webhook handler - will be implemented in Stage 3
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { message: 'Ayrshare webhook will be implemented in Stage 3' },
    { status: 501 }
  );
}
