/**
 * Development Script for React + Electron
 * 
 * This script runs both the React dev server and the Electron app concurrently
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const reactProjectDir = path.resolve(rootDir, '..', 'vite-react');

console.log('🚀 Starting React development server...');

// Start React dev server
const reactProcess = spawn('npm', ['run', 'dev'], {
  cwd: reactProjectDir,
  stdio: 'pipe',
  shell: true
});

// Handle React process output
reactProcess.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(`[React] ${output}`);
});

reactProcess.stderr.on('data', (data) => {
  const output = data.toString();
  console.error(`[React] ${output}`);
});

// Wait for React server to start before launching Electron
let reactServerStarted = false;
const waitForReactServer = (data) => {
  const output = data.toString();
  
  // Check if React server has started
  if (output.includes('Local:') && !reactServerStarted) {
    reactServerStarted = true;
    console.log('✅ React server started');
    
    // Start Electron app
    console.log('🚀 Starting Electron app...');
    const electronProcess = spawn('npm', ['run', 'dev'], {
      cwd: rootDir,
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        VITE_DEV_SERVER_URL: 'http://localhost:3000' // React dev server URL
      }
    });
    
    // Handle Electron process exit
    electronProcess.on('close', (code) => {
      console.log(`Electron process exited with code ${code}`);
      // Kill React process when Electron exits
      reactProcess.kill();
      process.exit(code);
    });
  }
};

reactProcess.stdout.on('data', waitForReactServer);
reactProcess.stderr.on('data', waitForReactServer);

// Handle process termination
process.on('SIGINT', () => {
  console.log('Terminating processes...');
  reactProcess.kill();
  process.exit(0);
});
