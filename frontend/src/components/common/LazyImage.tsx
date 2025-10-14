'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
  priority?: boolean;
  quality?: number;
  onLoad?: () => void;
  onError?: () => void;
  sizes?: string;
  fill?: boolean;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

export default function LazyImage({
  src,
  alt,
  width,
  height,
  className = '',
  placeholder = '/images/placeholder.jpg',
  priority = false,
  quality = 75,
  onLoad,
  onError,
  sizes,
  fill = false,
  objectFit = 'cover'
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  // 使用Intersection Observer实现懒加载
  useEffect(() => {
    if (priority) {
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsIntersecting(true);
          }
        });
      },
      {
        rootMargin: '50px' // 提前50px开始加载
      }
    );

    if (imageRef.current) {
      observer.observe(imageRef.current);
    }

    return () => {
      if (imageRef.current) {
        observer.unobserve(imageRef.current);
      }
    };
  }, [priority]);

  // 当进入视口时加载真实图片
  useEffect(() => {
    if (isIntersecting && src) {
      // 预加载图片
      const img = new window.Image();
      img.src = src;
      
      img.onload = () => {
        setImageSrc(src);
        setIsLoading(false);
        setHasError(false);
        onLoad?.();
      };
      
      img.onerror = () => {
        setHasError(true);
        setIsLoading(false);
        onError?.();
      };
    }
  }, [isIntersecting, src, onLoad, onError]);

  // 错误状态显示
  if (hasError) {
    return (
      <div 
        ref={imageRef}
        className={`bg-slate-100 flex items-center justify-center ${className}`}
        style={fill ? {} : { width, height }}
      >
        <div className="text-center p-4">
          <svg
            className="mx-auto h-12 w-12 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="mt-2 text-sm text-slate-500">加载失败</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={imageRef}
      className={`relative ${className} ${isLoading ? 'animate-pulse' : ''}`}
      style={fill ? {} : { width, height }}
    >
      {/* 占位符背景 */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-200 rounded-lg" />
      )}
      
      {/* 图片组件 */}
      {isIntersecting && (
        <Image
          src={imageSrc}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          quality={quality}
          sizes={sizes}
          fill={fill}
          style={fill ? { objectFit } : {}}
          priority={priority}
          placeholder="empty"
        />
      )}
    </div>
  );
}

// 图片预加载Hook
export function useImagePreloader(urls: string[]) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadImage = (url: string) => {
      return new Promise<void>((resolve, reject) => {
        const img = new window.Image();
        img.src = url;
        
        img.onload = () => {
          setLoadedImages(prev => new Set([...prev, url]));
          resolve();
        };
        
        img.onerror = () => {
          setFailedImages(prev => new Set([...prev, url]));
          reject();
        };
      });
    };

    urls.forEach(url => {
      if (!loadedImages.has(url) && !failedImages.has(url)) {
        loadImage(url).catch(() => {
          // 错误已在onerror中处理
        });
      }
    });
  }, [urls]);

  return { loadedImages, failedImages };
}

// 响应式图片组件
export function ResponsiveImage({
  src,
  alt,
  aspectRatio = 16 / 9,
  className = '',
  ...props
}: LazyImageProps & { aspectRatio?: number }) {
  return (
    <div 
      className={`relative w-full ${className}`}
      style={{ paddingBottom: `${(1 / aspectRatio) * 100}%` }}
    >
      <LazyImage
        src={src}
        alt={alt}
        fill
        className="absolute inset-0 w-full h-full object-cover"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        {...props}
      />
    </div>
  );
}
