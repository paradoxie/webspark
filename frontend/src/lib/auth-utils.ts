import { Session } from 'next-auth';

/**
 * 创建用户认证token，用于后端API调用
 */
export function createUserToken(session: Session | null): string {
  if (!session?.user) {
    throw new Error('No valid session');
  }

  const tokenPayload = {
    sub: session.user.id || '1',
    email: session.user.email,
    name: session.user.name,
    login: (session as any).user?.login
  };

  return Buffer.from(JSON.stringify(tokenPayload)).toString('base64');
}

/**
 * 创建带认证头的fetch选项
 */
export function createAuthenticatedFetchOptions(
  session: Session | null,
  options: RequestInit = {}
): RequestInit {
  if (!session?.user) {
    throw new Error('Authentication required');
  }

  const token = createUserToken(session);
  
  return {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  };
}

/**
 * 检查用户是否已认证
 */
export function isAuthenticated(session: Session | null): boolean {
  return !!(session?.user?.email);
}