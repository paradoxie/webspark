'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface InfiniteScrollProps<T> {
  items: T[];
  hasMore: boolean;
  loading: boolean;
  loadMore: () => Promise<void>;
  renderItem: (item: T, index: number) => React.ReactNode;
  threshold?: number; // 距离底部多少像素时开始加载
  className?: string;
  loadingComponent?: React.ReactNode;
  endMessage?: React.ReactNode;
  errorMessage?: React.ReactNode;
  onError?: (error: Error) => void;
  retryDelay?: number; // 重试延迟（毫秒）
  maxRetries?: number; // 最大重试次数
}

export default function InfiniteScroll<T>({
  items,
  hasMore,
  loading,
  loadMore,
  renderItem,
  threshold = 200,
  className = '',
  loadingComponent,
  endMessage,
  errorMessage,
  onError,
  retryDelay = 1000,
  maxRetries = 3
}: InfiniteScrollProps<T>) {
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  // 防抖加载函数
  const debouncedLoadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore || error) return;
    
    loadingRef.current = true;
    
    try {
      await loadMore();
      setError(null);
      setRetryCount(0);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
    } finally {
      loadingRef.current = false;
    }
  }, [hasMore, loadMore, onError, error]);

  // 自动重试机制
  const retryLoad = useCallback(async () => {
    if (retryCount >= maxRetries) return;
    
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    setTimeout(async () => {
      try {
        await loadMore();
        setError(null);
        setRetryCount(0);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        onError?.(error);
      } finally {
        setIsRetrying(false);
      }
    }, retryDelay);
  }, [retryCount, maxRetries, loadMore, onError, retryDelay]);

  // 使用 Intersection Observer 监听滚动
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading && !error) {
          debouncedLoadMore();
        }
      },
      {
        rootMargin: `0px 0px ${threshold}px 0px`,
        threshold: 0.1
      }
    );

    const currentRef = observerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, loading, debouncedLoadMore, threshold, error]);

  // 手动重试按钮
  const handleRetry = () => {
    setError(null);
    retryLoad();
  };

  // 默认加载组件
  const DefaultLoadingComponent = () => (
    <div className="flex justify-center items-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-gray-600">加载中...</span>
    </div>
  );

  // 默认结束消息
  const DefaultEndMessage = () => (
    <div className="text-center py-8 text-gray-500">
      <div className="text-4xl mb-2">🎉</div>
      <p>已经到底了！没有更多内容了</p>
    </div>
  );

  // 错误状态组件
  const ErrorComponent = () => (
    <div className="text-center py-8">
      <div className="text-red-500 text-4xl mb-4">⚠️</div>
      <p className="text-red-600 mb-4">
        {error?.message || '加载失败，请重试'}
      </p>
      <div className="space-x-3">
        <button
          onClick={handleRetry}
          disabled={isRetrying || retryCount >= maxRetries}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRetrying ? '重试中...' : `重试 (${retryCount}/${maxRetries})`}
        </button>
        {retryCount >= maxRetries && (
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            刷新页面
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className={className}>
      {/* 渲染现有项目 */}
      {items.map((item, index) => (
        <div key={index}>
          {renderItem(item, index)}
        </div>
      ))}

      {/* 加载更多触发器 */}
      <div ref={observerRef} />

      {/* 状态显示 */}
      {error ? (
        errorMessage || <ErrorComponent />
      ) : loading ? (
        loadingComponent || <DefaultLoadingComponent />
      ) : !hasMore && items.length > 0 ? (
        endMessage || <DefaultEndMessage />
      ) : null}

      {/* 空状态 */}
      {!loading && items.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📭</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            暂无内容
          </h3>
          <p className="text-gray-500">
            还没有任何内容，来提交第一个作品吧！
          </p>
        </div>
      )}
    </div>
  );
}

// 导出便捷的预设组件
export function WebsiteInfiniteScroll({ 
  websites, 
  hasMore, 
  loading, 
  loadMore, 
  className 
}: {
  websites: any[];
  hasMore: boolean;
  loading: boolean;
  loadMore: () => Promise<void>;
  className?: string;
}) {
  return (
    <InfiniteScroll
      items={websites}
      hasMore={hasMore}
      loading={loading}
      loadMore={loadMore}
      className={className}
      renderItem={(website) => (
        <div key={website.id} className="mb-6">
          {/* 这里可以导入并使用 WebsiteCard 组件 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-2">{website.title}</h3>
            <p className="text-gray-600 mb-4">{website.shortDescription}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                by {website.author?.name || website.author?.username}
              </span>
              <div className="flex space-x-4 text-sm text-gray-500">
                <span>👍 {website.likeCount}</span>
                <span>👁️ {website.viewCount}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    />
  );
} 