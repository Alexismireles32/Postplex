// Stripe webhook handler - will be implemented later
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { message: 'Stripe webhook will be implemented in future stages' },
    { status: 501 }
  );
}
