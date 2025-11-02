import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.info('[web-vitals]', payload);
  } catch (error) {
    console.error('Invalid vitals payload', error);
  }
  return NextResponse.json({ received: true });
}
