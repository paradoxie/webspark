import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  {
    name: '游戏',
    slug: 'games',
    description: '各种类型的网页游戏和游戏相关项目',
    icon: '🎮',
    color: '#FF6B6B',
    sortOrder: 1,
  },
  {
    name: '工具',
    slug: 'tools',
    description: '实用工具和生产力应用',
    icon: '🔧',
    color: '#4ECDC4',
    sortOrder: 2,
  },
  {
    name: '导航',
    slug: 'navigation',
    description: '导航网站和资源目录',
    icon: '🧭',
    color: '#45B7D1',
    sortOrder: 3,
  },
  {
    name: '作品集',
    slug: 'portfolio',
    description: '个人和团队的作品展示',
    icon: '👨‍💻',
    color: '#96CEB4',
    sortOrder: 4,
  },
  {
    name: '博客',
    slug: 'blog',
    description: '个人博客和技术分享',
    icon: '📝',
    color: '#FFEAA7',
    sortOrder: 5,
  },
  {
    name: '商城',
    slug: 'ecommerce',
    description: '电商网站和购物平台',
    icon: '🛒',
    color: '#DDA0DD',
    sortOrder: 6,
  },
  {
    name: '社交',
    slug: 'social',
    description: '社交网络和社区平台',
    icon: '👥',
    color: '#98D8C8',
    sortOrder: 7,
  },
  {
    name: '其他',
    slug: 'others',
    description: '其他类型的Web项目',
    icon: '✨',
    color: '#A8E6CF',
    sortOrder: 8,
  },
];

async function seedCategories() {
  console.log('🌱 开始创建分类数据...');
  
  for (const category of categories) {
    try {
      const existingCategory = await prisma.category.findUnique({
        where: { slug: category.slug },
      });

      if (!existingCategory) {
        await prisma.category.create({
          data: category,
        });
        console.log(`✅ 创建分类: ${category.name}`);
      } else {
        console.log(`⏭️ 分类已存在: ${category.name}`);
      }
    } catch (error) {
      console.error(`❌ 创建分类失败: ${category.name}`, error);
    }
  }

  console.log('🎉 分类数据创建完成！');
}

async function main() {
  try {
    await seedCategories();
  } catch (error) {
    console.error('脚本执行失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 