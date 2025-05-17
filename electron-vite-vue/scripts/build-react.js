/**
 * Build React App and Copy to Electron Dist
 * 
 * This script builds the React app and copies the output to the Electron dist folder
 * It also creates a backup of the React build to restore it after the Vite build if needed
 */

import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const reactProjectDir = path.resolve(rootDir, '..', 'vite-react');
const electronDistDir = path.resolve(rootDir, 'dist', 'react');
const backupDir = path.resolve(rootDir, '.react-build-backup');

console.log('📦 Building React app...');

try {
  // Build the React app
  execSync('npm run build', {
    cwd: reactProjectDir,
    stdio: 'inherit'
  });
  
  console.log('✅ React app built successfully');
  
  // Ensure the target directory exists
  fs.ensureDirSync(electronDistDir);
  
  // Copy the React build output to the Electron dist folder
  fs.copySync(
    path.resolve(reactProjectDir, 'dist'),
    electronDistDir,
    { overwrite: true }
  );

  // Fix asset paths in the HTML file for Electron compatibility
  const htmlFilePath = path.resolve(electronDistDir, 'index.html');
  // if (fs.existsSync(htmlFilePath)) {
  //   console.log('📝 Fixing asset paths in index.html for Electron...');
  //   let htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
  
  //   // Replace absolute paths with relative paths
  //   htmlContent = htmlContent.replace(/src="\//g, 'src="');
  //   htmlContent = htmlContent.replace(/href="\//g, 'href="');
  
  //   // Write the modified HTML back to the file
  //   fs.writeFileSync(htmlFilePath, htmlContent);
  //   console.log('✅ Fixed asset paths in index.html');
  // }
  
  console.log(`✅ React build copied to ${electronDistDir}`);
  
  // Create a backup of the React build
  console.log('📦 Creating backup of React build...');
  fs.ensureDirSync(backupDir);
  fs.copySync(electronDistDir, backupDir, { overwrite: true });
  console.log(`✅ React build backed up to ${backupDir}`);
  
  // Register a post-build hook to restore the React build if needed
  process.on('exit', () => {
    // Check if the React build directory still exists
    if (!fs.existsSync(electronDistDir) || fs.readdirSync(electronDistDir).length === 0) {
      console.log('🔄 Restoring React build from backup...');
      fs.ensureDirSync(path.dirname(electronDistDir));
      fs.copySync(backupDir, electronDistDir, { overwrite: true });
      console.log(`✅ React build restored to ${electronDistDir}`);
    }
  });
  
  // Create a restore script that can be called by the build:with-react script
  const restoreScriptPath = path.resolve(__dirname, 'restore-react-build.js');
  const restoreScript = `
    import fs from 'fs-extra';
    import path from 'path';
    import { fileURLToPath } from 'url';
    
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const rootDir = path.resolve(__dirname, '..');
    const electronDistDir = path.resolve(rootDir, 'dist', 'react');
    const backupDir = path.resolve(rootDir, '.react-build-backup');
    
    console.log('🔄 Restoring React build from backup...');
    fs.ensureDirSync(path.dirname(electronDistDir));
    fs.copySync(backupDir, electronDistDir, { overwrite: true });
    console.log(\`✅ React build restored to \${electronDistDir}\`);
  `;
  
  fs.writeFileSync(restoreScriptPath, restoreScript);
  console.log(`✅ Created restore script at ${restoreScriptPath}`);
} catch (error) {
  console.error('❌ Error building or copying React app:', error);
  process.exit(1);
}
