import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '../../../lib/auth';
import { getServerSession } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');

    // 构建查询参数
    const params = new URLSearchParams({ page });
    if (tag) params.append('tag', tag);
    if (search) params.append('search', search);

    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/websites?${params}`;
    const response = await fetch(backendUrl);

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch websites' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Websites API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/websites`;
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(session as any).testToken || 'test-token'}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Create website API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 