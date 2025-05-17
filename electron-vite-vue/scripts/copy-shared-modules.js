/**
 * Copy Shared Modules
 * 
 * This script copies the shared modules to all web app variants
 * to ensure they can all access the same database client and WebSocket client.
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

// Source directory for shared modules
const sharedDir = path.resolve(rootDir, 'electron-vite-vue/src/shared');

// Target directories
const targetDirs = [
  // React app
  path.resolve(rootDir, 'vite-react/src/shared'),
  // Threlte app
  path.resolve(rootDir, 'vite-threlte/src/shared'),
  // Needle app variants
  path.resolve(rootDir, 'needle-engine-samples/src/shared'),
  // RenJS app variants
  path.resolve(rootDir, 'renjs-samples/src/shared')
];

// Files to copy
const filesToCopy = [
  'database-client.ts',
  'websocket-client.ts'
];

// Create the target directories and copy files
targetDirs.forEach(targetDir => {
  // Create the target directory if it doesn't exist
  fs.ensureDirSync(targetDir);
  
  // Copy each file
  filesToCopy.forEach(file => {
    const sourceFile = path.join(sharedDir, file);
    const targetFile = path.join(targetDir, file);
    
    if (fs.existsSync(sourceFile)) {
      fs.copySync(sourceFile, targetFile, { overwrite: true });
      console.log(`📦 Copied ${file} to ${targetDir}`);
    } else {
      console.warn(`⚠️ Source file not found: ${sourceFile}`);
    }
  });
});

console.log('✅ Shared modules copied successfully');
