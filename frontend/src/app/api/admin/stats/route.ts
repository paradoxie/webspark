import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createUserToken } from '@/lib/auth-utils';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 检查用户是否为管理员 - 使用角色属性而非硬编码ID
    const userRole = (session.user as any)?.role;
    if (userRole !== 'ADMIN' && userRole !== 'MODERATOR') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const userToken = createUserToken(session);
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/stats`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Admin stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}