/**
 * Copy Shared Modules
 * 
 * This script copies the shared modules to the React and Needle apps
 * to ensure they can all access the same database client.
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Source directory for shared modules
const sharedDir = path.resolve(rootDir, 'src', 'shared');

// Target directories
const reactSharedDir = path.resolve(rootDir, 'react-app', 'src', 'shared');
const needleSharedDir = path.resolve(rootDir, 'needle-app', 'src', 'shared');

// Create the target directories if they don't exist
fs.ensureDirSync(reactSharedDir);
fs.ensureDirSync(needleSharedDir);

// Copy the shared modules to the React app
console.log('📦 Copying shared modules to React app...');
fs.copySync(sharedDir, reactSharedDir, { overwrite: true });

// Copy the shared modules to the Needle app
console.log('📦 Copying shared modules to Needle app...');
fs.copySync(sharedDir, needleSharedDir, { overwrite: true });

console.log('✅ Shared modules copied successfully');
