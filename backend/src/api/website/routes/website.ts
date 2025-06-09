/**
 * website router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::website.website', {
  config: {
    find: {
      auth: false, // 公开查看
    },
    findOne: {
      auth: false, // 公开查看
    },
    create: {
      auth: { scope: ['api::website.website.create'] }, // 需要登录
    },
    update: {
      auth: { scope: ['api::website.website.update'] }, // 需要登录
    },
    delete: {
      auth: { scope: ['api::website.website.delete'] }, // 需要登录  
    },
  },
}); 