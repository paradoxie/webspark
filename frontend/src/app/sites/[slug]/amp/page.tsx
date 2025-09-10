import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface Website {
  id: number
  title: string
  slug: string
  url: string
  shortDescription: string
  description: string
  sourceUrl?: string
  status: string
  featured: boolean
  likeCount: number
  viewCount: number
  createdAt: string
  updatedAt: string
  author: {
    id: number
    name: string
    username: string
    avatar?: string
  }
  tags: Array<{
    id: number
    name: string
    slug: string
    color: string
  }>
  category?: {
    id: number
    name: string
    slug: string
    icon: string
    color: string
  }
}

interface PageProps {
  params: { slug: string }
}

async function getWebsite(slug: string): Promise<Website | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/websites/slug/${slug}`,
      { 
        next: { revalidate: 300 },
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    
    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error('Failed to fetch website')
    }
    
    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Error fetching website:', error)
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const website = await getWebsite(params.slug)
  
  if (!website) {
    return {
      title: '作品未找到 - WebSpark.club AMP',
      description: '您访问的作品可能已被删除或不存在'
    }
  }

  const title = `${website.title} - WebSpark.club AMP`
  const description = website.shortDescription.length > 160 
    ? website.shortDescription.substring(0, 157) + '...'
    : website.shortDescription

  return {
    title,
    description,
    keywords: [
      website.title,
      ...website.tags.map(tag => tag.name),
      'web开发',
      'AMP',
      'mobile优化',
      website.author.name
    ].join(', '),
    openGraph: {
      type: 'website',
      locale: 'zh_CN',
      url: `https://webspark.club/sites/${website.slug}/amp`,
      title,
      description,
      siteName: 'WebSpark.club',
    },
    alternates: {
      canonical: `https://webspark.club/sites/${website.slug}`,
      amphtml: `https://webspark.club/sites/${website.slug}/amp`,
    },
  }
}

export default async function AMPWebsiteDetailPage({ params }: PageProps) {
  const website = await getWebsite(params.slug)
  
  if (!website || website.status !== 'APPROVED') {
    notFound()
  }

  const ampJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: website.title,
    description: website.shortDescription,
    applicationCategory: 'WebApplication',
    operatingSystem: 'Web',
    url: website.url,
    author: {
      '@type': 'Person',
      name: website.author.name,
      url: `https://webspark.club/users/${website.author.username}`,
    },
    creator: {
      '@type': 'Person',
      name: website.author.name,
    },
    datePublished: website.createdAt,
    dateModified: website.updatedAt,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: Math.min(5, Math.max(1, website.likeCount / 10 + 3)),
      ratingCount: Math.max(1, website.likeCount),
      bestRating: 5,
      worstRating: 1,
    },
    keywords: website.tags.map(tag => tag.name).join(', '),
  }

  return (
    <html amp="true" lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <script async src="https://cdn.ampproject.org/v0.js"></script>
        <script async custom-element="amp-social-share" src="https://cdn.ampproject.org/v0/amp-social-share-0.1.js"></script>
        <script async custom-element="amp-iframe" src="https://cdn.ampproject.org/v0/amp-iframe-0.1.js"></script>
        <title>{website.title} - WebSpark.club AMP</title>
        <link rel="canonical" href={`https://webspark.club/sites/${website.slug}`} />
        <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1" />
        
        <style amp-boilerplate="">{`
          body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}
        `}</style>
        <noscript>
          <style amp-boilerplate="">{`
            body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}
          `}</style>
        </noscript>
        
        <style amp-custom="">{`
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
            color: #334155;
            line-height: 1.6;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 16px;
          }
          .header {
            background: white;
            padding: 24px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            margin-bottom: 24px;
          }
          .header h1 {
            margin: 0 0 16px 0;
            font-size: 2rem;
            font-weight: 700;
            color: #1e293b;
            line-height: 1.2;
          }
          .header p {
            margin: 0 0 16px 0;
            color: #64748b;
            font-size: 1.125rem;
          }
          .tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin: 16px 0;
          }
          .tag {
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 0.875rem;
            font-weight: 500;
            background-color: #e0f2fe;
            color: #0369a1;
            text-decoration: none;
          }
          .author {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px 0;
            border-top: 1px solid #e2e8f0;
          }
          .author-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #3b82f6;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
          }
          .author-info h3 {
            margin: 0;
            font-size: 1rem;
            color: #1e293b;
          }
          .author-info p {
            margin: 0;
            font-size: 0.875rem;
            color: #64748b;
          }
          .content {
            background: white;
            padding: 24px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            margin-bottom: 24px;
          }
          .content h2 {
            margin: 0 0 16px 0;
            font-size: 1.25rem;
            font-weight: 600;
            color: #1e293b;
          }
          .content p {
            margin: 0 0 16px 0;
            line-height: 1.7;
          }
          .visit-btn {
            display: inline-block;
            padding: 12px 24px;
            background: #3b82f6;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 16px 0;
            text-align: center;
          }
          .stats {
            display: flex;
            gap: 24px;
            margin: 16px 0;
            font-size: 0.875rem;
            color: #64748b;
          }
          .stats span {
            display: flex;
            align-items: center;
            gap: 4px;
          }
          .footer {
            text-align: center;
            padding: 24px;
            font-size: 0.875rem;
            color: #64748b;
          }
          .footer a {
            color: #3b82f6;
            text-decoration: none;
          }
          .social-share {
            background: white;
            padding: 24px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            margin-bottom: 24px;
          }
          .social-share h3 {
            margin: 0 0 16px 0;
            font-size: 1.125rem;
            font-weight: 600;
            color: #1e293b;
          }
          .social-buttons {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
          }
          .breadcrumb {
            margin-bottom: 16px;
            font-size: 0.875rem;
          }
          .breadcrumb a {
            color: #3b82f6;
            text-decoration: none;
            margin-right: 8px;
          }
          .breadcrumb span {
            color: #64748b;
            margin-right: 8px;
          }
        `}</style>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ampJsonLd) }} />
      </head>
      <body>
        <div className="container">
          {/* 面包屑导航 */}
          <div className="breadcrumb">
            <a href="https://webspark.club/">首页</a>
            <span>›</span>
            <a href="https://webspark.club/sites">作品</a>
            <span>›</span>
            {website.category && (
              <>
                <a href={`https://webspark.club/categories/${website.category.slug}`}>{website.category.name}</a>
                <span>›</span>
              </>
            )}
            <span>{website.title}</span>
          </div>

          {/* 主要内容 */}
          <div className="header">
            <h1>{website.title}</h1>
            <p>{website.shortDescription}</p>
            
            {/* 标签 */}
            <div className="tags">
              {website.tags.map((tag) => (
                <a 
                  key={tag.id}
                  href={`https://webspark.club/tags/${tag.slug}`}
                  className="tag"
                  style={{ backgroundColor: tag.color + '20', color: tag.color }}
                >
                  {tag.name}
                </a>
              ))}
            </div>

            {/* 统计信息 */}
            <div className="stats">
              <span>❤️ {website.likeCount} 点赞</span>
              <span>👁️ {website.viewCount} 浏览</span>
              <span>📅 {new Date(website.createdAt).toLocaleDateString('zh-CN')}</span>
            </div>

            {/* 作者信息 */}
            <div className="author">
              <div className="author-avatar">
                {website.author.name.charAt(0).toUpperCase()}
              </div>
              <div className="author-info">
                <h3>{website.author.name}</h3>
                <p>@{website.author.username}</p>
              </div>
            </div>

            {/* 访问按钮 */}
            <a href={website.url} target="_blank" rel="noopener noreferrer" className="visit-btn">
              访问网站 →
            </a>
          </div>

          {/* 详细描述 */}
          <div className="content">
            <h2>详细描述</h2>
            {website.description.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          {/* 网站预览 */}
          <div className="content">
            <h2>网站预览</h2>
            <amp-iframe
              width="800"
              height="450"
              layout="responsive"
              sandbox="allow-scripts allow-same-origin"
              src={`https://webspark.club/api/iframe-preview?url=${encodeURIComponent(website.url)}`}
            >
              <div placeholder>
                <p>正在加载网站预览...</p>
              </div>
            </amp-iframe>
          </div>

          {/* 社交分享 */}
          <div className="social-share">
            <h3>分享这个项目</h3>
            <div className="social-buttons">
              <amp-social-share 
                type="twitter" 
                width="60" 
                height="44"
                data-param-text={`${website.title} - 开发者作品 | WebSpark.club`}
                data-param-url={`https://webspark.club/sites/${website.slug}`}
              ></amp-social-share>
              <amp-social-share 
                type="facebook" 
                width="60" 
                height="44"
                data-param-href={`https://webspark.club/sites/${website.slug}`}
              ></amp-social-share>
              <amp-social-share 
                type="linkedin" 
                width="60" 
                height="44"
                data-param-url={`https://webspark.club/sites/${website.slug}`}
                data-param-text={website.shortDescription}
              ></amp-social-share>
              <amp-social-share 
                type="email" 
                width="60" 
                height="44"
                data-param-subject={`${website.title} - 开发者作品`}
                data-param-body={`查看这个优秀的开发者作品：${website.title} - ${website.shortDescription} https://webspark.club/sites/${website.slug}`}
              ></amp-social-share>
            </div>
          </div>

          {/* 页脚 */}
          <div className="footer">
            <p>
              <a href={`https://webspark.club/sites/${website.slug}`}>查看完整版页面</a> | 
              <a href="https://webspark.club">WebSpark.club</a> - 开发者作品展示平台
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}