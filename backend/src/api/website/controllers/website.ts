/**
 * website controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::website.website', ({ strapi }) => ({
  // 获取按混合算法排序的作品列表
  async getSortedList(ctx) {
    try {
      const { page = 1, pageSize = 12 } = ctx.query;
      
      // 计算分页参数
      const start = (Number(page) - 1) * Number(pageSize);
      const limit = Number(pageSize);

      // 使用原生查询计算热度分数并排序
      const knex = strapi.db.connection;
      
      const websites = await knex('websites')
        .select([
          'websites.*',
          knex.raw('(websites.like_count * 5) + (EXTRACT(EPOCH FROM websites.created_at) / 10000) as score')
        ])
        .where('websites.status', 'APPROVED')
        .whereNull('websites.deleted_at')
        .orderBy('score', 'desc')
        .offset(start)
        .limit(limit);

      // 获取总数用于分页信息
      const totalResult = await knex('websites')
        .count('* as count')
        .where('websites.status', 'APPROVED')
        .whereNull('websites.deleted_at')
        .first();

      const total = parseInt(String(totalResult.count));
      const pageCount = Math.ceil(total / Number(pageSize));

      // 优化: 批量获取关联数据，避免N+1查询问题
      const websiteIds = websites.map((w: any) => w.id);
      const populatedWebsites = await strapi.entityService.findMany('api::website.website', {
        filters: {
          id: {
            $in: websiteIds,
          },
        },
        populate: {
          author: {
            fields: ['id', 'username', 'email']
          },
          tags: {
            fields: ['id', 'name', 'slug', 'color']
          },
          screenshot: true
        }
      });

      // 将分数合并到结果中，并按原有顺序排列
      const scoreMap = new Map(websites.map((w: any) => [w.id, w.score]));
      const orderedResults = websiteIds.map(id => {
        const website = populatedWebsites.find((w: any) => w.id === id);
        return { ...website, score: scoreMap.get(id) };
      });

      ctx.body = {
        data: orderedResults,
        meta: {
          pagination: {
            page: Number(page),
            pageSize: Number(pageSize),
            pageCount,
            total
          }
        }
      };
    } catch (error) {
      ctx.throw(500, `Error fetching sorted websites: ${error.message}`);
    }
  },

  // 点赞/取消点赞功能
  async toggleLike(ctx) {
    try {
      const { id } = ctx.params;
      const userId = ctx.state.user?.id;

      if (!userId) {
        return ctx.unauthorized('You must be logged in to like a website');
      }

      // 查找网站
      const website = await strapi.entityService.findOne('api::website.website', id, {
        populate: ['likes']
      });

      if (!website) {
        return ctx.notFound('Website not found');
      }

      // 检查用户是否已经点赞
      const hasLiked = (website as any).likes?.some((like: any) => like.id === userId) || false;

      if (hasLiked) {
        // 取消点赞 - 使用原生查询更新
        await strapi.db.connection.raw(`
          DELETE FROM websites_likes_links 
          WHERE website_id = ? AND user_id = ?
        `, [id, userId]);
        
        await strapi.db.connection.raw(`
          UPDATE websites 
          SET like_count = GREATEST(0, like_count - 1) 
          WHERE id = ?
        `, [id]);

        const updatedWebsite = await strapi.entityService.findOne('api::website.website', id);

        ctx.body = {
          message: 'Like removed successfully',
          action: 'unlike',
          likeCount: updatedWebsite.likeCount
        };
      } else {
        // 添加点赞 - 使用原生查询更新
        await strapi.db.connection.raw(`
          INSERT INTO websites_likes_links (website_id, user_id) 
          VALUES (?, ?)
        `, [id, userId]);
        
        await strapi.db.connection.raw(`
          UPDATE websites 
          SET like_count = like_count + 1 
          WHERE id = ?
        `, [id]);

        const updatedWebsite = await strapi.entityService.findOne('api::website.website', id);

        ctx.body = {
          message: 'Like added successfully',
          action: 'like',
          likeCount: updatedWebsite.likeCount
        };
      }
    } catch (error) {
      ctx.throw(500, `Error toggling like: ${error.message}`);
    }
  },

  // 收藏/取消收藏功能
  async toggleBookmark(ctx) {
    try {
      const { id } = ctx.params;
      const userId = ctx.state.user?.id;

      if (!userId) {
        return ctx.unauthorized('You must be logged in to bookmark a website');
      }

      // 查找网站
      const website = await strapi.entityService.findOne('api::website.website', id, {
        populate: ['bookmarks']
      });

      if (!website) {
        return ctx.notFound('Website not found');
      }

      // 检查用户是否已经收藏
      const hasBookmarked = (website as any).bookmarks?.some((bookmark: any) => bookmark.id === userId) || false;

      if (hasBookmarked) {
        // 取消收藏 - 使用原生查询
        await strapi.db.connection.raw(`
          DELETE FROM websites_bookmarks_links 
          WHERE website_id = ? AND user_id = ?
        `, [id, userId]);

        ctx.body = {
          message: 'Bookmark removed successfully',
          action: 'unbookmark'
        };
      } else {
        // 添加收藏 - 使用原生查询
        await strapi.db.connection.raw(`
          INSERT INTO websites_bookmarks_links (website_id, user_id) 
          VALUES (?, ?)
        `, [id, userId]);

        ctx.body = {
          message: 'Bookmark added successfully',
          action: 'bookmark'
        };
      }
    } catch (error) {
      ctx.throw(500, `Error toggling bookmark: ${error.message}`);
    }
  }
})); 