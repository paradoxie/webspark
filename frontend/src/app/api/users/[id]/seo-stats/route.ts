import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 只允许用户查看自己的SEO统计
    if (session.user.id !== parseInt(params.id)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // 从后端API获取用户的作品和点击统计
    const [websitesRes, clicksRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/websites?authorId=${params.id}&status=APPROVED`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`
        }
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${params.id}/link-clicks`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`
        }
      })
    ]);

    const websitesData = await websitesRes.json();
    const clicksData = clicksRes.ok ? await clicksRes.json() : { totalClicks: 0 };

    // 计算SEO统计
    const websites = websitesData.data || [];
    const doFollowCount = websites.filter((w: any) => w.likeCount >= 50 || w.featured).length;
    const ugcCount = websites.filter((w: any) => w.likeCount >= 10 && w.likeCount < 50 && !w.featured).length;
    const noFollowCount = websites.filter((w: any) => w.likeCount < 10 && !w.featured).length;

    // SEO价值估算（简单计算）
    const seoValue = doFollowCount * 200 + ugcCount * 50;

    return NextResponse.json({
      totalWebsites: websites.length,
      doFollowLinks: doFollowCount,
      ugcLinks: ugcCount,
      noFollowLinks: noFollowCount,
      totalClicks: clicksData.totalClicks || 0,
      estimatedValue: seoValue,
      websites: websites.map((w: any) => ({
        id: w.id,
        title: w.title,
        slug: w.slug,
        likeCount: w.likeCount,
        viewCount: w.viewCount,
        featured: w.featured,
        linkType: w.likeCount >= 50 || w.featured ? 'dofollow' : 
                 w.likeCount >= 10 ? 'ugc' : 'nofollow'
      }))
    });
  } catch (error) {
    console.error('Failed to fetch SEO stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
