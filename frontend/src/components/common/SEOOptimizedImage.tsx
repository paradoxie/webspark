'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface SEOOptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  fill?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

export default function SEOOptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality = 75,
  placeholder = 'blur',
  blurDataURL,
  sizes,
  fill = false,
  objectFit = 'cover',
  loading = 'lazy',
  onLoad,
  onError
}: SEOOptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // 默认的模糊占位符
  const defaultBlurDataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyztHTlbZbL5pJWjYHxQB4aB8QQSgAAIbCaAAAB/9k=';

  // 使用 Intersection Observer 检测图片是否进入视口
  useEffect(() => {
    if (!imgRef.current || priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // 提前50px开始加载
        threshold: 0.1
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    onError?.();
  };

  // 错误占位符
  const ErrorPlaceholder = () => (
    <div className={`flex items-center justify-center bg-gray-200 ${className}`} style={{ width, height }}>
      <div className="text-center text-gray-400">
        <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
        </svg>
        <p className="text-xs">图片加载失败</p>
      </div>
    </div>
  );

  // 加载占位符
  const LoadingPlaceholder = () => (
    <div className={`animate-pulse bg-gray-200 ${className}`} style={{ width, height }}>
      <div className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
    </div>
  );

  if (hasError) {
    return <ErrorPlaceholder />;
  }

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {isInView ? (
        <>
          {isLoading && <LoadingPlaceholder />}
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            fill={fill}
            quality={quality}
            priority={priority}
            placeholder={placeholder}
            blurDataURL={blurDataURL || defaultBlurDataURL}
            sizes={sizes}
            className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${
              fill ? 'object-cover' : ''
            }`}
            style={!fill ? { objectFit } : undefined}
            onLoad={handleLoad}
            onError={handleError}
            loading={loading}
          />
        </>
      ) : (
        <LoadingPlaceholder />
      )}
    </div>
  );
}