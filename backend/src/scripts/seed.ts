import { prisma } from '../lib/prisma';

const defaultTags = [
  { name: 'React', slug: 'react', description: 'React.js applications', color: '#61DAFB' },
  { name: 'Vue.js', slug: 'vue', description: 'Vue.js applications', color: '#4FC08D' },
  { name: 'Angular', slug: 'angular', description: 'Angular applications', color: '#DD0031' },
  { name: 'Next.js', slug: 'nextjs', description: 'Next.js applications', color: '#000000' },
  { name: 'Nuxt.js', slug: 'nuxtjs', description: 'Nuxt.js applications', color: '#00DC82' },
  { name: 'Svelte', slug: 'svelte', description: 'Svelte applications', color: '#FF3E00' },
  { name: 'TypeScript', slug: 'typescript', description: 'TypeScript applications', color: '#3178C6' },
  { name: 'JavaScript', slug: 'javascript', description: 'JavaScript applications', color: '#F7DF1E' },
  { name: 'Node.js', slug: 'nodejs', description: 'Node.js backend applications', color: '#339933' },
  { name: 'Python', slug: 'python', description: 'Python web applications', color: '#3776AB' },
  { name: 'PHP', slug: 'php', description: 'PHP applications', color: '#777BB4' },
  { name: 'Ruby', slug: 'ruby', description: 'Ruby applications', color: '#CC342D' },
  { name: 'Go', slug: 'go', description: 'Go applications', color: '#00ADD8' },
  { name: 'Rust', slug: 'rust', description: 'Rust applications', color: '#000000' },
  { name: 'Portfolio', slug: 'portfolio', description: 'Personal portfolio websites', color: '#6366F1' },
  { name: 'E-commerce', slug: 'ecommerce', description: 'E-commerce websites', color: '#10B981' },
  { name: 'Blog', slug: 'blog', description: 'Blog websites', color: '#F59E0B' },
  { name: 'Dashboard', slug: 'dashboard', description: 'Admin dashboards', color: '#8B5CF6' },
  { name: 'Landing Page', slug: 'landing-page', description: 'Landing pages', color: '#EF4444' },
  { name: 'SaaS', slug: 'saas', description: 'SaaS applications', color: '#06B6D4' }
];

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create tags
  console.log('Creating tags...');
  for (const tag of defaultTags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag
    });
  }

  console.log('✅ Database seeding completed!');
  console.log(`📊 Created ${defaultTags.length} tags`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 