import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createAuthenticatedFetchOptions } from '@/lib/auth-utils';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/websites/featured`;
    
    const fetchOptions = session 
      ? createAuthenticatedFetchOptions(session)
      : {};

    const response = await fetch(backendUrl, {
      method: 'GET',
      ...fetchOptions,
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch featured websites' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Featured websites API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}