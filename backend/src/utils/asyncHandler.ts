import { Request, Response, NextFunction } from 'express';

// 用于包装异步路由处理函数，自动捕获异常并传递给Express错误处理中间件
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
}; 