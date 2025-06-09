/**
 * Custom routes for report API
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/reports',
      handler: 'api::report.report.create',
      config: {
        policies: [],
        middlewares: [],
        auth: false, // 允许匿名举报
      },
    },
  ],
}; 