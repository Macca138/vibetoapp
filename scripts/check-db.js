// Check database status
const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🗄️  Checking Database Status');
    console.log('============================');
    
    // Check users
    const userCount = await prisma.user.count();
    console.log(`👥 Users: ${userCount}`);
    
    // Check waitlist
    const waitlistCount = await prisma.waitlist.count();
    console.log(`📝 Waitlist: ${waitlistCount}`);
    
    // Check projects
    const projectCount = await prisma.project.count();
    console.log(`📁 Projects: ${projectCount}`);
    
    // Check if our test user exists
    const testUser = await prisma.user.findUnique({
      where: { email: 'testuser@example.com' }
    });
    console.log(`🧪 Test User: ${testUser ? 'EXISTS' : 'NOT FOUND'}`);
    
    console.log('\n✅ Database is connected and functional');
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();