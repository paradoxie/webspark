import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createAuthenticatedFetchOptions } from '@/lib/auth-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/categories/${params.slug}/websites?${searchParams}`;
    
    const fetchOptions = session 
      ? createAuthenticatedFetchOptions(session)
      : {};

    const response = await fetch(backendUrl, {
      method: 'GET',
      ...fetchOptions,
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch category websites' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Category websites API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}