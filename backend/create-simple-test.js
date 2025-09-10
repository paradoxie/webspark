const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('开始创建测试数据...');
  
  try {
    // 创建一个简单的网站记录
    const website = await prisma.website.create({
      data: {
        title: '测试网站',
        slug: 'test-website-' + Date.now(),
        url: 'https://example.com',
        shortDescription: '这是一个测试网站，用于验证系统功能。',
        description: '详细描述：这是一个完整的测试网站记录。',
        authorId: 1,
        status: 'APPROVED',
        likeCount: 5,
        viewCount: 20
      }
    });
    
    console.log('✅ 创建网站成功:', website.title);
    
    // 检查总数
    const count = await prisma.website.count();
    console.log('📊 数据库中的网站总数:', count);
    
  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 