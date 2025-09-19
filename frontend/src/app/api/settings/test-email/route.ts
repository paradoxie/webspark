import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createUserToken } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 创建用户token
    const userToken = createUserToken(session);
    
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/settings/test-email`;
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend API error:', response.status, errorText);
      return NextResponse.json({ 
        error: 'Failed to send test email',
        details: errorText 
      }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Test email API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}