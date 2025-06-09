import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // 这里可以添加额外的中间件逻辑
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // 检查受保护的路由
        const { pathname } = req.nextUrl;
        
        // 需要登录的路由
        const protectedRoutes = [
          '/dashboard',
          '/submit',
        ];

        // 检查是否是受保护的路由
        const isProtectedRoute = protectedRoutes.some(route => 
          pathname.startsWith(route)
        );

        // 如果是受保护的路由但没有token，则拒绝访问
        if (isProtectedRoute && !token) {
          return false;
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/submit/:path*',
  ],
}; 