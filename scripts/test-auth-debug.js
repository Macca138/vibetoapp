// Debug authentication issues
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function debugAuth() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Debugging Authentication Issue');
    console.log('================================');
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: 'testuser@example.com' }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      name: user.name,
      hasPasswordHash: !!user.passwordHash
    });
    
    // Test password verification
    if (user.passwordHash) {
      const isValidPassword = await bcrypt.compare('testpassword123', user.passwordHash);
      console.log('🔑 Password verification:', isValidPassword ? '✅ Valid' : '❌ Invalid');
      
      if (!isValidPassword) {
        // Try to reset the password hash
        console.log('🔧 Regenerating password hash...');
        const newHash = await bcrypt.hash('testpassword123', 12);
        
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: newHash }
        });
        
        console.log('✅ Password hash updated');
      }
    } else {
      console.log('❌ No password hash found');
    }
    
    // Check sessions table
    const sessions = await prisma.session.count();
    console.log(`📊 Active sessions: ${sessions}`);
    
    // Check accounts table
    const accounts = await prisma.account.count();
    console.log(`🔗 Linked accounts: ${accounts}`);
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugAuth();