import NextAuth from 'next-auth';

declare module 'next-auth' {
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
    };
  }

  interface User {
    username?: string;
    avatar?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    strapiToken?: string;
    strapiUser?: any;
    username?: string;
    avatar?: string;
  }
} 