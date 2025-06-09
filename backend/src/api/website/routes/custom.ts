/**
 * 自定义网站 API 路由
 */

export default {
  routes: [
    // 混合排序列表
    {
      method: 'GET',
      path: '/websites/sorted-list',
      handler: 'website.getSortedList',
      config: {
        policies: [],
        middlewares: [],
        auth: false, // 公开访问
      },
    },
    // 点赞/取消点赞
    {
      method: 'PUT',
      path: '/websites/:id/toggle-like',
      handler: 'website.toggleLike',
      config: {
        policies: [],
        middlewares: [],
        auth: {
          scope: ['api::website.website.toggleLike'],
        },
      },
    },
    // 收藏/取消收藏
    {
      method: 'PUT', 
      path: '/websites/:id/toggle-bookmark',
      handler: 'website.toggleBookmark',
      config: {
        policies: [],
        middlewares: [],
        auth: {
          scope: ['api::website.website.toggleBookmark'],
        },
      },
    },
  ],
}; 