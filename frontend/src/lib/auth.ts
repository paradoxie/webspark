import NextAuth, { NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import { JWT } from 'next-auth/jwt';
import { Session } from 'next-auth';

// GitHub profile 类型定义
interface GitHubProfile {
  login: string;
  id: number;
  avatar_url: string;
  name: string;
  email: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    // 测试用的凭证提供者
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // 这是测试用的认证逻辑
        if (credentials?.username === 'admin' && credentials?.password === 'admin') {
          return {
            id: '1',
            name: 'Administrator',
            email: 'admin@webspark.club',
            image: 'https://avatars.githubusercontent.com/u/1?v=4'
          };
        }
        return null;
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // 初始登录
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          // 对于GitHub登录，我们将GitHub用户名存储在token中
          login: account.provider === 'github' ? (user as any).login : user.name?.toLowerCase().replace(/\s+/g, ''),
        };
      }
      
      // 确保token中始终有accessToken
      if (!token.accessToken) {
        token.accessToken = token.sub; // 使用用户ID作为访问令牌
      }

      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      // 将accessToken添加到会话中，使其在客户端可用
      return {
        ...session,
        accessToken: token.accessToken as string,
        user: {
          ...session.user,
          id: token.sub,
          login: token.login || token.name?.toLowerCase().replace(/\s+/g, ''),
        }
      };
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
};

export default NextAuth(authOptions); 