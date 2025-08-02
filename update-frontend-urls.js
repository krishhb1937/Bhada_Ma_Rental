#!/usr/bin/env node

/**
 * Script to update frontend URLs for production deployment
 * Usage: node update-frontend-urls.js <backend-url>
 * Example: node update-frontend-urls.js https://rental-management-backend.onrender.com
 */

const fs = require('fs');
const path = require('path');

const backendUrl = process.argv[2];

if (!backendUrl) {
  console.error('Please provide the backend URL as an argument');
  console.error('Usage: node update-frontend-urls.js <backend-url>');
  console.error('Example: node update-frontend-urls.js https://rental-management-backend.onrender.com');
  process.exit(1);
}

// Remove trailing slash if present
const cleanBackendUrl = backendUrl.replace(/\/$/, '');

const frontendDir = path.join(__dirname, 'frontend', 'assets', 'js');
const filesToUpdate = [
  'auth.js',
  'dashboard.js',
  'home.js',
  'messages.js',
  'notifications.js',
  'payment.js',
  'profile-settings.js',
  'property-detail.js',
  'property.js',
  'utils.js'
];

const localhostPatterns = [
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'localhost:5000',
  '127.0.0.1:5000'
];

console.log(`Updating frontend files to use backend URL: ${cleanBackendUrl}`);
console.log('Files to update:', filesToUpdate.join(', '));

let totalReplacements = 0;

filesToUpdate.forEach(file => {
  const filePath = path.join(frontendDir, file);
  
  if (!fs.existsSync(filePath)) {
    console.warn(`Warning: File ${file} not found, skipping...`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let fileReplacements = 0;
  
  localhostPatterns.forEach(pattern => {
    const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, cleanBackendUrl);
      fileReplacements += matches.length;
    }
  });
  
  if (fileReplacements > 0) {
    fs.writeFileSync(filePath, content);
    console.log(`✓ Updated ${file}: ${fileReplacements} replacements`);
    totalReplacements += fileReplacements;
  } else {
    console.log(`- No changes needed in ${file}`);
  }
});

console.log(`\n✅ Update complete! Total replacements: ${totalReplacements}`);
console.log('\nNext steps:');
console.log('1. Commit and push your changes to Git');
console.log('2. Redeploy your frontend on Render');
console.log('3. Test your application to ensure everything works correctly'); 