import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 清理现有数据
  await prisma.category.deleteMany();
  
  // 创建测试分类
  const categories = [
    {
      name: '前端开发',
      slug: 'frontend',
      description: '展示优秀的前端开发项目，包括React、Vue、Angular等框架的应用',
      icon: '🎨',
      color: '#3B82F6'
    },
    {
      name: '后端开发',
      slug: 'backend',
      description: '展示各类后端开发项目，包括Node.js、Java、Python、Go等技术栈',
      icon: '⚙️',
      color: '#10B981'
    },
    {
      name: '全栈应用',
      slug: 'fullstack',
      description: '集前端与后端于一体的完整应用项目',
      icon: '🔄',
      color: '#8B5CF6'
    },
    {
      name: '移动应用',
      slug: 'mobile',
      description: '包括iOS、Android和跨平台移动应用',
      icon: '📱',
      color: '#EC4899'
    },
    {
      name: '人工智能',
      slug: 'ai',
      description: '展示AI、机器学习和数据科学相关的创新项目',
      icon: '🧠',
      color: '#6366F1'
    },
    {
      name: '游戏开发',
      slug: 'game',
      description: '网页游戏、小游戏和游戏相关的开发项目',
      icon: '🎮',
      color: '#F59E0B'
    },
    {
      name: '工具与插件',
      slug: 'tools',
      description: '实用的开发工具、浏览器插件和效率应用',
      icon: '🔧',
      color: '#4B5563'
    },
    {
      name: '设计与创意',
      slug: 'design',
      description: '注重设计和用户体验的创意项目',
      icon: '✨',
      color: '#EC4899'
    }
  ];
  
  // 创建分类并保存引用
  const createdCategories: Record<string, any> = {};
  for (const category of categories) {
    const created = await prisma.category.create({
      data: category
    });
    createdCategories[category.slug] = created;
  }
  
  // 为现有作品添加分类
  const websites = await prisma.website.findMany({
    where: {
      status: 'APPROVED'
    }
  });
  
  // 分类映射规则（基于标签或标题关键词）
  const categoryMapping = {
    'react': 'frontend',
    'vue': 'frontend',
    'angular': 'frontend',
    'svelte': 'frontend',
    'html': 'frontend',
    'css': 'frontend',
    'javascript': 'frontend',
    'typescript': 'frontend',
    'ui': 'design',
    'ux': 'design',
    'design': 'design',
    'node': 'backend',
    'express': 'backend',
    'django': 'backend',
    'flask': 'backend',
    'spring': 'backend',
    'java': 'backend',
    'python': 'backend',
    'php': 'backend',
    'laravel': 'backend',
    'api': 'backend',
    'database': 'backend',
    'mobile': 'mobile',
    'ios': 'mobile',
    'android': 'mobile',
    'flutter': 'mobile',
    'react native': 'mobile',
    'game': 'game',
    'unity': 'game',
    'ai': 'ai',
    'machine learning': 'ai',
    'ml': 'ai',
    'deep learning': 'ai',
    'tool': 'tools',
    'extension': 'tools',
    'plugin': 'tools',
    'utility': 'tools'
  };
  
  // 确保每个分类都有作品
  const ensureWebsitesInCategory = async () => {
    // 获取所有分类
    const allCategories = await prisma.category.findMany();
    const websitesByCategory: Record<number, number> = {};
    
    // 统计每个分类下的作品数量
    for (const website of websites) {
      if (website.categoryId) {
        websitesByCategory[website.categoryId] = (websitesByCategory[website.categoryId] || 0) + 1;
      }
    }
    
    // 确保每个分类至少有2个作品
    for (const category of allCategories) {
      const count = websitesByCategory[category.id] || 0;
      if (count < 2) {
        // 找出需要添加的作品数量
        const neededCount = 2 - count;
        
        // 从其他分类中随机选择一些作品，并复制到这个分类
        const websitesToCopy = await prisma.website.findMany({
          where: {
            status: 'APPROVED',
            categoryId: {
              not: category.id
            }
          },
          take: neededCount,
          orderBy: {
            likeCount: 'desc'
          }
        });
        
        // 为每个要复制的作品创建一个副本，并分配到当前分类
        for (const website of websitesToCopy) {
          // 创建新标题，添加分类名称
          const newTitle = `${website.title} (${category.name})`;
          
          // 创建新的slug
          const newSlug = `${website.slug}-${category.slug}-${Date.now()}`;
          
          // 复制作品到新分类
          await prisma.website.create({
            data: {
              title: newTitle,
              slug: newSlug,
              url: website.url,
              shortDescription: website.shortDescription,
              description: website.description,
              sourceUrl: website.sourceUrl,
              status: 'APPROVED',
              featured: false,
              likeCount: Math.floor(Math.random() * 100),
              viewCount: Math.floor(Math.random() * 1000),
              isHiring: website.isHiring,
              categoryId: category.id,
              authorId: website.authorId,
              // 复制标签关联
              tags: {
                connect: await prisma.tag.findMany({
                  where: {
                    websites: {
                      some: {
                        id: website.id
                      }
                    }
                  },
                  select: {
                    id: true
                  }
                })
              }
            }
          });
        }
        
        console.log(`为分类 "${category.name}" 添加了 ${neededCount} 个作品`);
      }
    }
  };
  
  // 先更新现有作品的分类
  for (const website of websites) {
    // 获取网站的标签
    const websiteTags = await prisma.tag.findMany({
      where: {
        websites: {
          some: {
            id: website.id
          }
        }
      }
    });
    
    // 尝试根据标签或标题匹配分类
    let matchedCategory = null;
    
    // 先检查标签
    for (const tag of websiteTags) {
      const tagName = tag.name.toLowerCase();
      for (const [keyword, categorySlug] of Object.entries(categoryMapping)) {
        if (tagName.includes(keyword)) {
          matchedCategory = createdCategories[categorySlug];
          break;
        }
      }
      if (matchedCategory) break;
    }
    
    // 如果标签没匹配到，检查标题
    if (!matchedCategory) {
      const title = website.title.toLowerCase();
      for (const [keyword, categorySlug] of Object.entries(categoryMapping)) {
        if (title.includes(keyword)) {
          matchedCategory = createdCategories[categorySlug];
          break;
        }
      }
    }
    
    // 如果仍然没匹配到，随机分配一个分类
    if (!matchedCategory) {
      const categoryKeys = Object.keys(createdCategories);
      const randomCategory = categoryKeys[Math.floor(Math.random() * categoryKeys.length)];
      matchedCategory = createdCategories[randomCategory];
    }
    
    // 更新作品的分类
    await prisma.website.update({
      where: {
        id: website.id
      },
      data: {
        categoryId: matchedCategory!.id
      }
    });
  }
  
  console.log('已成功添加测试分类数据并更新作品分类');
  
  // 确保每个分类都有足够的作品
  await ensureWebsitesInCategory();
  
  console.log('已确保每个分类都有作品');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 