const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

async function testConnection() {
  try {
    console.log('🔗 测试数据库连接...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    
    // 解析数据库URL
    const url = new URL(process.env.DATABASE_URL);
    
    const connection = await mysql.createConnection({
      host: url.hostname,
      port: url.port || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1) // 去掉开头的 /
    });
    
    console.log('✅ 数据库连接成功！');
    
    // 测试查询
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ 查询测试成功:', rows);
    
    // 检查数据库是否存在
    const [databases] = await connection.execute('SHOW DATABASES LIKE "webspark"');
    if (databases.length > 0) {
      console.log('✅ webspark 数据库存在');
    } else {
      console.log('❌ webspark 数据库不存在，正在创建...');
      await connection.execute('CREATE DATABASE webspark CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
      console.log('✅ webspark 数据库创建成功');
    }
    
    await connection.end();
  } catch (error) {
    console.error('❌ 数据库连接失败:');
    console.error('错误信息:', error.message);
    console.error('');
    console.error('💡 可能的解决方案:');
    console.error('1. 检查MySQL是否运行: brew services start mysql');
    console.error('2. 检查用户名和密码是否正确');
    console.error('3. 确保数据库存在: CREATE DATABASE webspark;');
    process.exit(1);
  }
}

testConnection(); 