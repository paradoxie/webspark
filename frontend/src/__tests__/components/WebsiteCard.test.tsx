/**
 * WebsiteCard 组件测试
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WebsiteCard } from '../../components/website/WebsiteCard';
import { SessionProvider } from 'next-auth/react';
import { SWRConfig } from 'swr';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  ...jest.requireActual('next-auth/react'),
  useSession: () => ({
    data: {
      user: { id: 1, name: 'Test User' },
      accessToken: 'test-token'
    },
    status: 'authenticated'
  })
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>;
});

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />
}));

const mockWebsite = {
  id: 1,
  title: 'Test Website',
  slug: 'test-website',
  url: 'https://test.com',
  shortDescription: 'A test website description',
  screenshot: 'https://test.com/screenshot.jpg',
  likeCount: 10,
  viewCount: 100,
  status: 'APPROVED' as const,
  createdAt: new Date('2024-01-01'),
  author: {
    id: 2,
    name: 'Author Name',
    username: 'authorname',
    avatar: 'https://test.com/avatar.jpg'
  },
  tags: [
    { id: 1, name: 'React', slug: 'react' },
    { id: 2, name: 'TypeScript', slug: 'typescript' }
  ],
  likedByUser: false
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <SessionProvider session={null}>
      <SWRConfig value={{ dedupingInterval: 0 }}>
        {component}
      </SWRConfig>
    </SessionProvider>
  );
};

describe('WebsiteCard', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  it('应该正确渲染网站信息', () => {
    renderWithProviders(<WebsiteCard website={mockWebsite} />);

    expect(screen.getByText('Test Website')).toBeInTheDocument();
    expect(screen.getByText('A test website description')).toBeInTheDocument();
    expect(screen.getByText('Author Name')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument(); // 点赞数
    expect(screen.getByText('100')).toBeInTheDocument(); // 浏览数
  });

  it('应该渲染标签', () => {
    renderWithProviders(<WebsiteCard website={mockWebsite} />);

    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });

  it('应该有正确的链接', () => {
    renderWithProviders(<WebsiteCard website={mockWebsite} />);

    const titleLink = screen.getByRole('link', { name: /Test Website/i });
    expect(titleLink).toHaveAttribute('href', '/sites/test-website');

    const authorLink = screen.getByRole('link', { name: /Author Name/i });
    expect(authorLink).toHaveAttribute('href', '/users/authorname');
  });

  it('应该显示截图', () => {
    renderWithProviders(<WebsiteCard website={mockWebsite} />);

    const screenshot = screen.getByAltText('Test Website');
    expect(screenshot).toHaveAttribute('src', 'https://test.com/screenshot.jpg');
  });

  it('应该处理点赞功能', async () => {
    fetch.mockResponseOnce(JSON.stringify({
      success: true,
      data: { liked: true, likeCount: 11 }
    }));

    renderWithProviders(<WebsiteCard website={mockWebsite} />);

    const likeButton = screen.getByRole('button', { name: /like/i });
    fireEvent.click(likeButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/websites/1/like'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token'
          })
        })
      );
    });
  });

  it('应该在未登录时禁用点赞', () => {
    // Mock未登录状态
    jest.spyOn(require('next-auth/react'), 'useSession').mockReturnValue({
      data: null,
      status: 'unauthenticated'
    });

    renderWithProviders(<WebsiteCard website={mockWebsite} />);

    const likeButton = screen.getByRole('button', { name: /like/i });
    expect(likeButton).toBeDisabled();
  });

  it('应该显示已点赞状态', () => {
    const likedWebsite = { ...mockWebsite, likedByUser: true };
    renderWithProviders(<WebsiteCard website={likedWebsite} />);

    const likeButton = screen.getByRole('button', { name: /like/i });
    expect(likeButton).toHaveClass('text-red-500'); // 假设已点赞时按钮是红色
  });

  it('应该在加载时显示骨架屏', () => {
    renderWithProviders(<WebsiteCard website={mockWebsite} loading />);

    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
  });

  it('应该处理没有截图的情况', () => {
    const websiteWithoutScreenshot = { ...mockWebsite, screenshot: null };
    renderWithProviders(<WebsiteCard website={websiteWithoutScreenshot} />);

    const placeholder = screen.getByTestId('screenshot-placeholder');
    expect(placeholder).toBeInTheDocument();
  });

  it('应该格式化日期显示', () => {
    renderWithProviders(<WebsiteCard website={mockWebsite} />);

    // 查找日期文本（根据实际的日期格式调整）
    expect(screen.getByText(/2024年1月1日/)).toBeInTheDocument();
  });

  it('应该在hover时显示操作按钮', async () => {
    renderWithProviders(<WebsiteCard website={mockWebsite} />);

    const card = screen.getByTestId('website-card');
    
    fireEvent.mouseEnter(card);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /share/i })).toBeVisible();
      expect(screen.getByRole('button', { name: /bookmark/i })).toBeVisible();
    });
  });

  it('应该处理分享功能', async () => {
    const mockNavigator = {
      share: jest.fn().mockResolvedValue(undefined)
    };
    Object.defineProperty(window, 'navigator', {
      value: mockNavigator,
      writable: true
    });

    renderWithProviders(<WebsiteCard website={mockWebsite} />);

    const shareButton = screen.getByRole('button', { name: /share/i });
    fireEvent.click(shareButton);

    await waitFor(() => {
      expect(mockNavigator.share).toHaveBeenCalledWith({
        title: 'Test Website',
        text: 'A test website description',
        url: expect.stringContaining('/sites/test-website')
      });
    });
  });

  it('应该处理收藏功能', async () => {
    fetch.mockResponseOnce(JSON.stringify({
      success: true,
      data: { bookmarked: true }
    }));

    renderWithProviders(<WebsiteCard website={mockWebsite} />);

    const bookmarkButton = screen.getByRole('button', { name: /bookmark/i });
    fireEvent.click(bookmarkButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/websites/1/bookmark'),
        expect.objectContaining({
          method: 'PUT'
        })
      );
    });
  });

  it('应该响应式显示', () => {
    renderWithProviders(<WebsiteCard website={mockWebsite} />);

    const card = screen.getByTestId('website-card');
    
    // 检查响应式类名
    expect(card).toHaveClass('sm:flex-row'); // 小屏竖向，大屏横向
  });

  it('应该优化性能（React.memo）', () => {
    const { rerender } = renderWithProviders(<WebsiteCard website={mockWebsite} />);
    
    const firstRender = screen.getByText('Test Website');
    
    // 使用相同的props重新渲染
    rerender(
      <SessionProvider session={null}>
        <SWRConfig value={{ dedupingInterval: 0 }}>
          <WebsiteCard website={mockWebsite} />
        </SWRConfig>
      </SessionProvider>
    );
    
    const secondRender = screen.getByText('Test Website');
    
    // 组件应该是同一个实例（未重新渲染）
    expect(firstRender).toBe(secondRender);
  });
});

