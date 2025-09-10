const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addMoreData() {
  const websites = [
    {
      title: 'React Dashboard Pro',
      url: 'https://react-dashboard.demo.com',
      shortDescription: '一个功能完整的React管理面板，包含图表、表格、表单等组件。',
      description: '详细的React Dashboard项目，使用最新技术栈。',
      likeCount: 25,
      viewCount: 150
    },
    {
      title: 'Vue 3 商城系统',
      url: 'https://vue-shop.demo.com', 
      shortDescription: '基于Vue 3的现代电商系统，功能齐全，界面美观。',
      description: '完整的电商解决方案，包含购物车、支付、订单管理等功能。',
      likeCount: 32,
      viewCount: 200
    },
    {
      title: 'AI 聊天机器人',
      url: 'https://ai-chat.demo.com',
      shortDescription: '智能聊天机器人，支持多轮对话和上下文理解。', 
      description: '基于最新AI技术的智能对话系统。',
      likeCount: 45,
      viewCount: 300
    },
    {
      title: 'Next.js 博客系统',
      url: 'https://nextjs-blog.demo.com',
      shortDescription: '使用Next.js构建的现代博客系统，支持SSG和SSR。',
      description: '功能丰富的博客平台，支持Markdown、标签、分类等功能。',
      likeCount: 18,
      viewCount: 120
    }
  ];

  for (const site of websites) {
    try {
      await prisma.website.create({
        data: {
          ...site,
          slug: site.title.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
          authorId: 1,
          status: 'APPROVED'
        }
      });
      console.log('✅ 创建网站:', site.title);
    } catch (error) {
      console.log('⚠️ 跳过已存在的网站:', site.title);
    }
  }

  const count = await prisma.website.count();
  console.log('📊 总网站数:', count);
  await prisma.$disconnect();
}

addMoreData(); 