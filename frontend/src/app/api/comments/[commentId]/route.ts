import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createUserToken } from '@/lib/auth-utils';

export async function PUT(request: NextRequest, { params }: { params: { commentId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { commentId } = params;
    
    // 创建用户token
    const userToken = createUserToken(session);
    
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/comments/${commentId}`;
    const response = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend API error:', response.status, errorText);
      return NextResponse.json({ 
        error: 'Failed to update comment',
        details: errorText 
      }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Edit comment API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { commentId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { commentId } = params;
    
    // 创建用户token
    const userToken = createUserToken(session);
    
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/comments/${commentId}`;
    const response = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${userToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend API error:', response.status, errorText);
      return NextResponse.json({ 
        error: 'Failed to delete comment',
        details: errorText 
      }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Delete comment API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}