#!/usr/bin/env node

/**
 * Fix dependency compatibility issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function fixDependencies() {
  console.log('🔧 Fixing dependency compatibility issues...\n');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  console.log('📦 Current problematic versions:');
  console.log(`   React: ${packageJson.dependencies.react}`);
  console.log(`   React-DOM: ${packageJson.dependencies['react-dom']}`);
  console.log(`   Next.js: ${packageJson.dependencies.next}`);
  console.log(`   NextAuth: ${packageJson.dependencies['next-auth']}`);
  
  // Update to stable versions
  packageJson.dependencies.react = '^18.3.1';
  packageJson.dependencies['react-dom'] = '^18.3.1';
  packageJson.dependencies.next = '^14.2.15';
  packageJson.dependencies['next-auth'] = '^4.24.11';
  
  // Update dev dependencies
  packageJson.devDependencies['@types/react'] = '^18.3.12';
  packageJson.devDependencies['@types/react-dom'] = '^18.3.1';
  
  console.log('\n🔄 Updating to stable versions:');
  console.log(`   React: ${packageJson.dependencies.react}`);
  console.log(`   React-DOM: ${packageJson.dependencies['react-dom']}`);
  console.log(`   Next.js: ${packageJson.dependencies.next}`);
  console.log(`   NextAuth: ${packageJson.dependencies['next-auth']}`);
  
  // Write updated package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  
  console.log('\n✅ Updated package.json');
  console.log('\n🏃 Next steps:');
  console.log('1. Run: npm install');
  console.log('2. Run: npm run dev');
  console.log('3. Test the application');
}

fixDependencies();