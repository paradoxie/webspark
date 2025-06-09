import NextAuth, { NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import { userApi } from './api';

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
      authorization: {
        params: {
          scope: 'read:user user:email',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'github') {
        try {
          const githubProfile = profile as GitHubProfile;
          // 这里需要调用Strapi的用户创建/登录API
          // 将GitHub用户信息同步到Strapi
          const strapiUser = await createOrUpdateStrapiUser({
            githubId: user.id,
            username: githubProfile?.login || user.name || '',
            email: user.email || '',
            avatar: user.image || '',
            githubUsername: githubProfile?.login || '',
          });
          
          // 将Strapi用户信息附加到session
          (user as any).strapiId = strapiUser.id;
          (user as any).strapiToken = strapiUser.jwt;
          
          return true;
        } catch (error) {
          console.error('Failed to create/update Strapi user:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // 首次登录时，将用户信息保存到token
      if (account && user) {
        token.strapiId = (user as any).strapiId;
        token.strapiToken = (user as any).strapiToken;
        token.githubId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // 将token中的信息传递给session
      if (token) {
        (session.user as any).strapiId = token.strapiId as number;
        (session.user as any).strapiToken = token.strapiToken as string;
        (session.user as any).githubId = token.githubId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// 创建或更新Strapi用户
async function createOrUpdateStrapiUser(userData: {
  githubId: string;
  username: string;
  email: string;
  avatar: string;
  githubUsername: string;
}) {
  try {
    // 首先尝试通过GitHub ID查找现有用户
    const existingUser = await fetch(`${process.env.STRAPI_API_URL}/users?filters[githubId][$eq]=${userData.githubId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`,
      },
    });

    const existingUserData = await existingUser.json();

    if (existingUserData.length > 0) {
      // 用户已存在，更新信息
      const user = existingUserData[0];
      const updatedUser = await fetch(`${process.env.STRAPI_API_URL}/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`,
        },
        body: JSON.stringify({
          username: userData.username,
          email: userData.email,
          avatar: userData.avatar,
          githubUsername: userData.githubUsername,
        }),
      });

      const updatedUserData = await updatedUser.json();
      
      // 生成JWT
      const loginResponse = await fetch(`${process.env.STRAPI_API_URL}/auth/local`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: userData.email,
          password: userData.githubId, // 使用GitHub ID作为密码
        }),
      });

      const loginData = await loginResponse.json();
      
      return {
        id: updatedUserData.id,
        jwt: loginData.jwt,
        ...updatedUserData,
      };
    } else {
      // 创建新用户
      const newUser = await fetch(`${process.env.STRAPI_API_URL}/auth/local/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userData.username,
          email: userData.email,
          password: userData.githubId, // 使用GitHub ID作为密码
          githubId: userData.githubId,
          githubUsername: userData.githubUsername,
          avatar: userData.avatar,
        }),
      });

      const newUserData = await newUser.json();
      
      return {
        id: newUserData.user.id,
        jwt: newUserData.jwt,
        ...newUserData.user,
      };
    }
  } catch (error) {
    console.error('Error creating/updating Strapi user:', error);
    throw error;
  }
}

export default NextAuth(authOptions); 