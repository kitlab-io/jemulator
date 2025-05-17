/**
 * Build Needle JS App and Copy to Electron Dist
 * 
 * This script copies the Needle JS build output to the Electron dist folder
 * It creates a backup of the Needle JS build to restore it after the Vite build if needed
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const needleProjectDir = path.resolve(rootDir, '..', 'needleengine/Exports/Sidescroller');
const needleBuildDir = path.resolve(needleProjectDir, 'dist');
const electronDistDir = path.resolve(rootDir, 'dist', 'needle');
const backupDir = path.resolve(rootDir, '.needle-build-backup');

console.log('📦 Processing Needle JS app...');

try {
  // Check if the Needle JS build exists
  if (!fs.existsSync(needleBuildDir)) {
    console.error('❌ Needle JS build not found at:', needleBuildDir);
    console.error('Please build the Needle JS app first using "npm run build:production" in the Needle project directory');
    process.exit(1);
  }
  
  console.log('✅ Needle JS build found');
  
  // Create a backup of the Needle JS build
  console.log('📦 Creating backup of Needle JS build...');
  if (fs.existsSync(backupDir)) {
    fs.removeSync(backupDir);
  }
  fs.ensureDirSync(backupDir);
  fs.copySync(needleBuildDir, backupDir);
  
  // Ensure the target directory exists
  fs.ensureDirSync(electronDistDir);
  
  // Copy the Needle JS build output to the Electron dist folder
  fs.copySync(
    needleBuildDir,
    electronDistDir,
    { overwrite: true }
  );

  // Fix asset paths in the HTML file for Electron compatibility
  const htmlFilePath = path.resolve(electronDistDir, 'index.html');
  if (fs.existsSync(htmlFilePath)) {
    console.log('📝 Fixing asset paths in index.html for Electron...');
    let htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
  
    // Replace absolute paths with relative paths
    htmlContent = htmlContent.replace(/src="\//g, 'src="./');
    htmlContent = htmlContent.replace(/href="\//g, 'href="./');
  
    // Write the modified HTML back to the file
    fs.writeFileSync(htmlFilePath, htmlContent);
  }
  
  console.log('✅ Needle JS app copied to Electron dist folder');
} catch (error) {
  console.error('❌ Error processing Needle JS app:', error);
  process.exit(1);
}

// Export functions to restore the backup
export function createNeedleBackup() {
  console.log('📦 Creating backup of Needle JS build...');
  if (fs.existsSync(backupDir)) {
    fs.removeSync(backupDir);
  }
  
  if (fs.existsSync(electronDistDir)) {
    fs.ensureDirSync(backupDir);
    fs.copySync(electronDistDir, backupDir);
  }
}

export function restoreNeedleBackup() {
  console.log('📦 Restoring Needle JS build from backup...');
  if (fs.existsSync(backupDir)) {
    if (fs.existsSync(electronDistDir)) {
      fs.removeSync(electronDistDir);
    }
    fs.ensureDirSync(path.dirname(electronDistDir));
    fs.copySync(backupDir, electronDistDir);
    console.log('✅ Needle JS build restored from backup');
  } else {
    console.log('⚠️ No Needle JS backup found to restore');
  }
}
