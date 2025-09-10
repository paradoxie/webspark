import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createAuthenticatedFetchOptions } from '@/lib/auth-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { count: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/categories/top/${params.count}`;
    
    const fetchOptions = session 
      ? createAuthenticatedFetchOptions(session)
      : {};

    const response = await fetch(backendUrl, {
      method: 'GET',
      ...fetchOptions,
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch top categories' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Top categories API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}