import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createAuthenticatedFetchOptions } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    
    // 构建后端API URL
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/websites/search?${searchParams}`;
    
    // 根据是否有session决定请求头
    const fetchOptions = session 
      ? createAuthenticatedFetchOptions(session)
      : {};

    const response = await fetch(backendUrl, {
      method: 'GET',
      ...fetchOptions,
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to search websites' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}