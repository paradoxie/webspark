import NextAuth from 'next-auth';

declare module 'next-auth' {
  /**
   * 扩展Session类型，添加accessToken
   */
  interface Session {
    accessToken?: string;
    strapiToken?: string;
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      username?: string;
      avatar?: string;
      login?: string;
    };
  }

  interface User {
    username?: string;
    avatar?: string;
  }
}

declare module 'next-auth/jwt' {
  /**
   * 扩展JWT类型，添加accessToken
   */
  interface JWT {
    accessToken?: string;
    strapiToken?: string;
    strapiUser?: any;
    username?: string;
    avatar?: string;
    login?: string;
  }
} 