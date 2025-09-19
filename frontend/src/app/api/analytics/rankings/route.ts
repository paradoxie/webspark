import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    const sortBy = searchParams.get('sortBy') || 'engagement';
    
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/analytics/website-rankings?period=${period}&sortBy=${sortBy}`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch website rankings' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Website rankings API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}