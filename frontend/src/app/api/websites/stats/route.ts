import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/websites/stats`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch website stats' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Website stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}