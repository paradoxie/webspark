'use client';

import { useState } from 'react';
import Head from 'next/head';

interface SocialShareProps {
  url: string;
  title: string;
  description: string;
  image?: string;
  hashtags?: string[];
  author?: string;
  type?: 'website' | 'article';
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'floating';
}

interface SocialPlatform {
  name: string;
  icon: React.ReactNode;
  getShareUrl: (props: SocialShareProps) => string;
  color: string;
}

export default function SocialShare({
  url,
  title,
  description,
  image,
  hashtags = [],
  author,
  type = 'website',
  showLabels = false,
  size = 'md',
  variant = 'default'
}: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // 编码URL和文本
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);
  const encodedImage = image ? encodeURIComponent(image) : '';
  const hashtagText = hashtags.length > 0 ? encodeURIComponent(hashtags.join(' ')) : '';

  // 社交平台配置
  const platforms: SocialPlatform[] = [
    {
      name: 'Twitter',
      icon: (
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
        </svg>
      ),
      getShareUrl: ({ url, title, hashtags }) => 
        `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}&hashtags=${hashtagText}`,
      color: 'hover:text-blue-400'
    },
    {
      name: 'Facebook',
      icon: (
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      getShareUrl: ({ url }) => 
        `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: 'hover:text-blue-600'
    },
    {
      name: 'LinkedIn',
      icon: (
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
      getShareUrl: ({ url, title, description }) => 
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDescription}`,
      color: 'hover:text-blue-700'
    },
    {
      name: 'Telegram',
      icon: (
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
      ),
      getShareUrl: ({ url, title }) => 
        `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      color: 'hover:text-blue-500'
    },
    {
      name: 'WhatsApp',
      icon: (
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
        </svg>
      ),
      getShareUrl: ({ url, title }) => 
        `https://wa.me/?text=${encodedTitle} ${encodedUrl}`,
      color: 'hover:text-green-500'
    },
    {
      name: 'QQ',
      icon: (
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.007,0 C5.925,0 1,4.925 1,11.007 C1,17.089 5.925,22.014 12.007,22.014 C18.089,22.014 23.014,17.089 23.014,11.007 C23.014,4.925 18.089,0 12.007,0 Z M12.007,20.542 C6.745,20.542 2.472,16.269 2.472,11.007 C2.472,5.745 6.745,1.472 12.007,1.472 C17.269,1.472 21.542,5.745 21.542,11.007 C21.542,16.269 17.269,20.542 12.007,20.542 Z"/>
        </svg>
      ),
      getShareUrl: ({ url, title, description }) => 
        `https://connect.qq.com/widget/shareqq/index.html?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDescription}`,
      color: 'hover:text-blue-600'
    }
  ];

  // 尺寸样式
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  // 复制链接
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  // 原生分享API
  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title,
          text: description,
          url
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    }
  };

  // 渲染分享按钮
  const renderShareButton = (platform: SocialPlatform, index: number) => {
    const baseClass = `inline-flex items-center justify-center transition-colors duration-200 text-gray-600 ${platform.color} ${sizeClasses[size]}`;
    
    return (
      <a
        key={platform.name}
        href={platform.getShareUrl({ url, title, description, hashtags, author, image, type })}
        target="_blank"
        rel="noopener noreferrer"
        className={baseClass}
        title={`分享到 ${platform.name}`}
        onClick={(e) => {
          e.preventDefault();
          window.open(
            platform.getShareUrl({ url, title, description, hashtags, author, image, type }),
            '_blank',
            'width=600,height=400,scrollbars=yes,resizable=yes'
          );
        }}
      >
        {platform.icon}
        {showLabels && (
          <span className="ml-2 text-sm font-medium">{platform.name}</span>
        )}
      </a>
    );
  };

  // 浮动变体
  if (variant === 'floating') {
    return (
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50">
        <div className={`flex flex-col space-y-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 ${isOpen ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-600 hover:text-blue-600 transition-colors"
            title="分享"
          >
            <svg className={sizeClasses[size]} fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92S19.61 16.08 18 16.08z"/>
            </svg>
          </button>
          
          {isOpen && (
            <div className="flex flex-col space-y-2">
              {platforms.slice(0, 4).map(renderShareButton)}
              <button
                onClick={copyToClipboard}
                className={`${sizeClasses[size]} text-gray-600 hover:text-green-600 transition-colors`}
                title="复制链接"
              >
                {copied ? (
                  <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                ) : (
                  <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 默认和简约变体
  const containerClass = variant === 'minimal' 
    ? 'flex items-center space-x-3'
    : 'flex flex-wrap items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg';

  return (
    <>
      {/* SEO Meta Tags */}
      <Head>
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={url} />
        <meta property="og:type" content={type} />
        {image && <meta property="og:image" content={image} />}
        {author && <meta property="article:author" content={author} />}
        
        <meta name="twitter:card" content={image ? "summary_large_image" : "summary"} />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        {image && <meta name="twitter:image" content={image} />}
        
        <link rel="canonical" href={url} />
      </Head>

      <div className={containerClass}>
        {variant !== 'minimal' && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            分享到：
          </span>
        )}
        
        <div className={`flex ${showLabels ? 'flex-col space-y-2' : 'items-center space-x-3'}`}>
          {platforms.map(renderShareButton)}
          
          {/* 原生分享按钮 */}
          {typeof navigator !== 'undefined' && navigator.share && (
            <button
              onClick={handleNativeShare}
              className={`${sizeClasses[size]} text-gray-600 hover:text-blue-600 transition-colors`}
              title="系统分享"
            >
              <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92S19.61 16.08 18 16.08z"/>
              </svg>
            </button>
          )}
          
          {/* 复制链接按钮 */}
          <button
            onClick={copyToClipboard}
            className={`${sizeClasses[size]} text-gray-600 hover:text-green-600 transition-colors`}
            title="复制链接"
          >
            {copied ? (
              <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            ) : (
              <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
              </svg>
            )}
          </button>
        </div>
        
        {copied && (
          <span className="text-sm text-green-600 font-medium">
            链接已复制！
          </span>
        )}
      </div>
    </>
  );
}