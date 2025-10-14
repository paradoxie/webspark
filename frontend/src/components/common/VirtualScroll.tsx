'use client';

import { useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { useInView } from 'react-intersection-observer';

interface VirtualScrollProps<T> {
  items: T[];
  itemHeight: number | ((index: number) => number);
  renderItem: (item: T, index: number) => ReactNode;
  buffer?: number;
  className?: string;
  loadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  endMessage?: ReactNode;
  loader?: ReactNode;
  scrollThreshold?: number;
  initialScrollTop?: number;
  onScroll?: (scrollTop: number) => void;
}

export default function VirtualScroll<T>({
  items,
  itemHeight,
  renderItem,
  buffer = 5,
  className = '',
  loadMore,
  hasMore = false,
  loading = false,
  endMessage,
  loader,
  scrollThreshold = 0.8,
  initialScrollTop = 0,
  onScroll
}: VirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = useState(initialScrollTop);
  const [containerHeight, setContainerHeight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollingRef = useRef(false);
  const { ref: endRef, inView } = useInView();

  // 计算项目高度
  const getItemHeight = useCallback((index: number) => {
    return typeof itemHeight === 'function' ? itemHeight(index) : itemHeight;
  }, [itemHeight]);

  // 计算累积高度
  const getItemOffset = useCallback((index: number) => {
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += getItemHeight(i);
    }
    return offset;
  }, [getItemHeight]);

  // 计算总高度
  const totalHeight = items.reduce((acc, _, index) => acc + getItemHeight(index), 0);

  // 计算可见范围
  const getVisibleRange = useCallback(() => {
    const start = Math.max(0, Math.floor(scrollTop / getItemHeight(0)) - buffer);
    const end = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / getItemHeight(0)) + buffer
    );
    return { start, end };
  }, [scrollTop, containerHeight, items.length, buffer, getItemHeight]);

  // 处理滚动
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const newScrollTop = target.scrollTop;
    
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);

    // 检查是否需要加载更多
    if (loadMore && hasMore && !loading) {
      const scrollPercentage = (newScrollTop + containerHeight) / target.scrollHeight;
      if (scrollPercentage > scrollThreshold) {
        loadMore();
      }
    }
  }, [containerHeight, loadMore, hasMore, loading, scrollThreshold, onScroll]);

  // 更新容器高度
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // 无限滚动触发
  useEffect(() => {
    if (inView && hasMore && !loading && loadMore) {
      loadMore();
    }
  }, [inView, hasMore, loading, loadMore]);

  const { start, end } = getVisibleRange();
  const visibleItems = items.slice(start, end + 1);
  const offsetY = getItemOffset(start);

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      onScroll={handleScroll}
      style={{ height: '100%' }}
    >
      {/* 虚拟占位符，维持滚动条位置 */}
      <div style={{ height: totalHeight }}>
        {/* 可见项目容器 */}
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={start + index}
              style={{ height: getItemHeight(start + index) }}
            >
              {renderItem(item, start + index)}
            </div>
          ))}
        </div>
      </div>

      {/* 加载指示器 */}
      {loading && loader && (
        <div className="flex justify-center py-4">
          {loader}
        </div>
      )}

      {/* 无限滚动触发器 */}
      {hasMore && !loading && (
        <div ref={endRef} className="h-1" />
      )}

      {/* 结束消息 */}
      {!hasMore && endMessage && items.length > 0 && (
        <div className="text-center py-4 text-slate-500">
          {endMessage}
        </div>
      )}
    </div>
  );
}

// 简化版虚拟列表（固定高度项目）
export function SimpleVirtualList<T>({
  items,
  itemHeight,
  renderItem,
  className = '',
  buffer = 5
}: {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
  buffer?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    container.addEventListener('scroll', handleScroll);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, []);

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + buffer
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const offsetY = startIndex * itemHeight;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      style={{ height: '100%' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
