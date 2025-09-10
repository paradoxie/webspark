import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    // 这里可以添加额外的中间件逻辑
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // 允许API路由通过
        if (req.nextUrl.pathname.startsWith('/api/')) {
          return true;
        }
        
        // 受保护的路由需要token
        if (req.nextUrl.pathname.startsWith('/submit')) {
          return !!token;
        }
        if (req.nextUrl.pathname.startsWith('/dashboard')) {
          return !!token;
        }
        if (req.nextUrl.pathname.startsWith('/admin')) {
          return !!token;
        }
        
        // 其他路由都允许访问
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/submit/:path*',
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/user/:path*',
    '/api/websites/:path*/like',
    '/api/websites/:path*/view'
  ]
}; 