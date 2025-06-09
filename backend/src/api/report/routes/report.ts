/**
 * report router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::report.report', {
  config: {
    find: {
      auth: false, // 管理员可以查看举报列表
    },
    findOne: {
      auth: false,
    },
    create: {
      auth: false, // 允许匿名举报
    },
    update: {
      auth: false, // 只有管理员可以更新
    },
    delete: {
      auth: false, // 只有管理员可以删除
    },
  },
}); 