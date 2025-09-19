import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/users/me`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch user info' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // 只返回角色和基本信息
    return NextResponse.json({
      role: data.data?.role || 'USER',
      isActive: data.data?.isActive || false,
      user: {
        id: data.data?.id,
        username: data.data?.username,
        name: data.data?.name,
        email: session.user?.email
      }
    });
  } catch (error) {
    console.error('User role API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}