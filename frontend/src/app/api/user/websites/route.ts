import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '../../../../lib/auth';
import { getServerSession } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 创建用户token，包含用户信息
    const userToken = Buffer.from(JSON.stringify({
      sub: session.user.id || '1',
      email: session.user.email,
      name: session.user.name,
      login: (session as any).user?.login
    })).toString('base64');

    // 转发到后端API
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/user/websites`;
    const response = await fetch(backendUrl, {
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend API error:', response.status, errorText);
      return NextResponse.json({ 
        error: 'Failed to fetch websites',
        details: errorText 
      }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('User websites API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 