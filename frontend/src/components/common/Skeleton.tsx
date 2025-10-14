import { ReactNode } from 'react';

interface SkeletonProps {
  className?: string;
  children?: ReactNode;
  loading?: boolean;
  count?: number;
  height?: string | number;
  width?: string | number;
  circle?: boolean;
  rounded?: boolean;
}

// 基础骨架屏组件
export default function Skeleton({
  className = '',
  children,
  loading = true,
  count = 1,
  height,
  width,
  circle = false,
  rounded = false
}: SkeletonProps) {
  if (!loading && children) {
    return <>{children}</>;
  }

  const baseClasses = 'animate-pulse bg-slate-200 dark:bg-slate-700';
  const shapeClasses = circle ? 'rounded-full' : rounded ? 'rounded-md' : '';
  
  const style = {
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined
  };

  if (count > 1) {
    return (
      <>
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${shapeClasses} ${className}`}
            style={style}
          />
        ))}
      </>
    );
  }

  return (
    <div
      className={`${baseClasses} ${shapeClasses} ${className}`}
      style={style}
    />
  );
}

// 文本骨架屏
export function TextSkeleton({ lines = 1, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={16}
          width={index === lines - 1 ? '80%' : '100%'}
          rounded
        />
      ))}
    </div>
  );
}

// 作品卡片骨架屏
export function WebsiteCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
      {/* 图片区域 */}
      <Skeleton height={200} className="w-full" />
      
      {/* 内容区域 */}
      <div className="p-6">
        {/* 标题 */}
        <Skeleton height={24} width="75%" rounded className="mb-3" />
        
        {/* 描述 */}
        <TextSkeleton lines={2} className="mb-4" />
        
        {/* 标签 */}
        <div className="flex gap-2 mb-4">
          <Skeleton height={24} width={60} rounded className="rounded-full" />
          <Skeleton height={24} width={80} rounded className="rounded-full" />
        </div>
        
        {/* 底部信息 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton circle width={32} height={32} />
            <Skeleton height={16} width={100} rounded />
          </div>
          <div className="flex gap-4">
            <Skeleton height={16} width={40} rounded />
            <Skeleton height={16} width={40} rounded />
          </div>
        </div>
      </div>
    </div>
  );
}

// 用户卡片骨架屏
export function UserCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-4">
        <Skeleton circle width={64} height={64} />
        <div className="flex-1">
          <Skeleton height={20} width="60%" rounded className="mb-2" />
          <Skeleton height={16} width="40%" rounded />
        </div>
      </div>
      <div className="mt-4">
        <TextSkeleton lines={2} />
      </div>
      <div className="mt-4 flex justify-between">
        <Skeleton height={16} width={60} rounded />
        <Skeleton height={16} width={60} rounded />
        <Skeleton height={16} width={60} rounded />
      </div>
    </div>
  );
}

// 列表骨架屏
export function ListSkeleton({ items = 5, itemHeight = 80 }: { items?: number; itemHeight?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4">
          <div className="flex items-center space-x-4">
            <Skeleton width={itemHeight - 32} height={itemHeight - 32} rounded />
            <div className="flex-1 space-y-2">
              <Skeleton height={20} width="70%" rounded />
              <Skeleton height={16} width="100%" rounded />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// 表格骨架屏
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index} className="px-6 py-3">
                <Skeleton height={16} width="80%" rounded />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <Skeleton height={16} width={colIndex === 0 ? '60%' : '80%'} rounded />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 详情页骨架屏
export function DetailPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 主要内容 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 标题区域 */}
          <div>
            <Skeleton height={40} width="80%" rounded className="mb-4" />
            <TextSkeleton lines={2} />
          </div>
          
          {/* 图片 */}
          <Skeleton height={400} rounded />
          
          {/* 内容 */}
          <div className="prose">
            <TextSkeleton lines={10} />
          </div>
        </div>
        
        {/* 侧边栏 */}
        <div className="space-y-6">
          {/* 作者信息 */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Skeleton circle width={48} height={48} />
              <div className="flex-1">
                <Skeleton height={20} width="70%" rounded className="mb-2" />
                <Skeleton height={16} width="50%" rounded />
              </div>
            </div>
            <Skeleton height={36} rounded />
          </div>
          
          {/* 统计信息 */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6">
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index}>
                  <Skeleton height={24} width="60%" rounded className="mb-2" />
                  <Skeleton height={16} width="80%" rounded />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
