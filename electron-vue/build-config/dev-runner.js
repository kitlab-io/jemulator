/**
 * Development runner script that can handle both ESM and CommonJS modules
 * This script acts as a bridge between CommonJS and ESM modules
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Log with colors
const colors = {
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`
};

console.log(colors.cyan('Starting multi-renderer development environment...'));

// Run the ESM dev server script with the --experimental-modules flag
const devProcess = spawn('node', ['--experimental-modules', path.join(__dirname, 'dev-server.mjs')], {
  stdio: 'inherit',
  env: {
    ...process.env,
    FORCE_COLOR: '1' // Enable colors in child process
  }
});

// Handle process exit
devProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(colors.red(`Development server exited with code ${code}`));
    process.exit(code);
  }
});

// Handle process errors
devProcess.on('error', (err) => {
  console.error(colors.red('Failed to start development server:'), err);
  process.exit(1);
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  console.log(colors.yellow('\nGracefully shutting down development servers...'));
  devProcess.kill('SIGINT');
});
