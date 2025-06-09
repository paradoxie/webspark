/**
 * report controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::report.report', ({ strapi }) => ({
  // 自定义创建举报的方法
  async create(ctx) {
    try {
      const { websiteId, reason, details } = ctx.request.body.data || ctx.request.body;
      const userId = ctx.state.user?.id; // 可能为空（匿名举报）

      // 验证必填字段
      if (!websiteId || !reason) {
        return ctx.badRequest('Website ID and reason are required');
      }

      // 验证网站是否存在
      const website = await strapi.entityService.findOne('api::website.website', websiteId);
      if (!website) {
        return ctx.notFound('Website not found');
      }

      // 创建举报记录
      const report = await strapi.entityService.create('api::report.report', {
        data: {
          reason,
          details: details || null,
          status: 'OPEN',
          website: websiteId,
          reporter: userId || null,
        },
      });

      // 检查是否需要触发通知（当某个网站的未处理举报超过阈值时）
      const openReportsCount = await strapi.entityService.count('api::report.report', {
        filters: {
          website: websiteId,
          status: 'OPEN'
        }
      });

      // 如果未处理举报超过3个，可以在这里添加通知逻辑
      // 比如发邮件给管理员或设置网站状态等
      if (openReportsCount >= 3) {
        strapi.log.warn(`Website ${websiteId} has ${openReportsCount} open reports`);
        // TODO: 在这里添加通知逻辑
      }

      ctx.body = {
        data: report,
        message: '举报已收到，感谢您的反馈'
      };

    } catch (error) {
      ctx.throw(500, `Error creating report: ${error.message}`);
    }
  }
})); 