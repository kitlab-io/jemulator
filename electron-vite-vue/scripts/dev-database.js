/**
 * Development Script for Database Integration
 * 
 * This script watches for changes to the shared database client modules
 * and copies them to the renderer process directories.
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

console.log('🔄 Starting database development mode...');

// Watch for changes to the shared database client
function watchSharedModules() {
  const sharedDir = path.resolve(rootDir, 'src', 'shared');
  const reactSharedDir = path.resolve(rootDir, 'react-app', 'src', 'shared');
  const needleSharedDir = path.resolve(rootDir, 'needle-app', 'src', 'shared');
  
  console.log('👀 Watching for changes to shared database client...');
  
  // First, copy all existing files
  fs.ensureDirSync(reactSharedDir);
  fs.ensureDirSync(needleSharedDir);
  
  const files = fs.readdirSync(sharedDir);
  for (const file of files) {
    const sourceFile = path.resolve(sharedDir, file);
    const reactTargetFile = path.resolve(reactSharedDir, file);
    const needleTargetFile = path.resolve(needleSharedDir, file);
    
    fs.copyFileSync(sourceFile, reactTargetFile);
    fs.copyFileSync(sourceFile, needleTargetFile);
    
    console.log(`✅ Copied ${file} to React and Needle apps`);
  }
  
  // Then watch for changes
  fs.watch(sharedDir, { recursive: true }, (eventType, filename) => {
    if (filename) {
      console.log(`🔄 Detected change in shared module: ${filename}`);
      
      // Copy the changed file to the React app
      const sourceFile = path.resolve(sharedDir, filename);
      const reactTargetFile = path.resolve(reactSharedDir, filename);
      const needleTargetFile = path.resolve(needleSharedDir, filename);
      
      if (fs.existsSync(sourceFile)) {
        // Ensure target directories exist
        fs.ensureDirSync(path.dirname(reactTargetFile));
        fs.ensureDirSync(path.dirname(needleTargetFile));
        
        // Copy the file
        fs.copyFileSync(sourceFile, reactTargetFile);
        fs.copyFileSync(sourceFile, needleTargetFile);
        
        console.log(`✅ Copied ${filename} to React and Needle apps`);
      }
    }
  });
}

// Start watching shared modules
watchSharedModules();

// Handle process termination
process.on('SIGINT', () => {
  console.log('👋 Shutting down database development mode...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('👋 Shutting down database development mode...');
  process.exit(0);
});
