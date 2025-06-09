import NextAuth from 'next-auth';
import GithubProvider from 'next-auth/providers/github';

// 创建NextAuth处理程序
const handler = NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    }),
  ],
  // 自定义页面
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin', // 错误会显示在登录页
  },
  // 会话配置
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30天
  },
  // JWT配置
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30天
  },
  // 回调函数
  callbacks: {
    // 处理JWT令牌
    async jwt({ token, account, profile }) {
      // 如果是首次登录，account包含访问令牌
      if (account) {
        token.accessToken = account.access_token;
        
        // 这里可以添加与Strapi的交互，例如:
        try {
          const strapiRes = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_API_URL}/auth/github/callback`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              access_token: account.access_token,
            }),
          });
          
          if (strapiRes.ok) {
            const data = await strapiRes.json();
            token.strapiToken = data.jwt;
            token.strapiUser = data.user;
          }
        } catch (error) {
          console.error('Error authenticating with Strapi:', error);
        }
      }
      return token;
    },
    
    // 从JWT令牌填充会话
    async session({ session, token }) {
      // 将令牌信息添加到会话中
      session.accessToken = token.accessToken as string;
      session.strapiToken = token.strapiToken as string;
      session.user = {
        ...session.user,
        ...(token.strapiUser || {}),
      };
      return session;
    },
  },
});

export { handler as GET, handler as POST }; 