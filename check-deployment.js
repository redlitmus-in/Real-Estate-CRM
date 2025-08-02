#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Real Estate CRM Deployment Configuration...\n');

// Check if dist folder exists and has content
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  console.log('✅ Build output exists in dist/ folder');
  
  const files = fs.readdirSync(distPath);
  console.log('📁 Files in dist/:', files.join(', '));
  
  // Check if index.html exists
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf8');
    if (content.includes('/Real-Estate-CRM/')) {
      console.log('✅ index.html has correct base path for GitHub Pages');
    } else {
      console.log('❌ index.html missing correct base path');
    }
  } else {
    console.log('❌ index.html not found in dist/');
  }
} else {
  console.log('❌ dist/ folder not found - run npm run build first');
}

// Check package.json configuration
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  if (packageJson.homepage === 'https://redlitmus-in.github.io/Real-Estate-CRM') {
    console.log('✅ homepage correctly configured in package.json');
  } else {
    console.log('❌ homepage not configured correctly in package.json');
  }
  
  if (packageJson.scripts.build) {
    console.log('✅ build script exists');
  } else {
    console.log('❌ build script missing');
  }
} else {
  console.log('❌ package.json not found');
}

// Check vite.config.ts
const viteConfigPath = path.join(__dirname, 'vite.config.ts');
if (fs.existsSync(viteConfigPath)) {
  const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
  if (viteConfig.includes('/Real-Estate-CRM/')) {
    console.log('✅ vite.config.ts has correct base path');
  } else {
    console.log('❌ vite.config.ts missing correct base path');
  }
} else {
  console.log('❌ vite.config.ts not found');
}

// Check GitHub workflow
const workflowPath = path.join(__dirname, '.github', 'workflows', 'deploy.yml');
if (fs.existsSync(workflowPath)) {
  console.log('✅ GitHub Pages deployment workflow exists');
} else {
  console.log('❌ GitHub Pages deployment workflow not found');
}

console.log('\n📋 Next Steps:');
console.log('1. Ensure your repository is named "Real-Estate-CRM"');
console.log('2. Go to Settings > Pages in your GitHub repository');
console.log('3. Set Source to "GitHub Actions"');
console.log('4. Push changes to trigger deployment');
console.log('5. Check Actions tab for deployment status');

console.log('\n🚀 To manually trigger deployment:');
console.log('1. Go to Actions tab in your GitHub repository');
console.log('2. Click "Deploy to GitHub Pages" workflow');
console.log('3. Click "Run workflow" button'); 