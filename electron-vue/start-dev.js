/**
 * Simplified development script for the multi-renderer Electron app
 * This script handles starting all Vite dev servers and launching Electron
 */
const { spawn } = require('child_process');
const path = require('path');
const electron = require('electron');
const waitOn = require('wait-on');
const { createServer } = require('vite');
const fs = require('fs');

// Log with colors
const colors = {
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`
};

// Port configuration for each renderer
const PORTS = {
  vue: 5173,
  svelte: 5174,
  threejs: 5175
};

/**
 * Main function to start the development environment
 */
async function main() {
  try {
    console.log(colors.cyan('Starting multi-renderer development environment...'));
    
    // Start all renderer dev servers
    const vueServer = await startViteServer('vue', PORTS.vue);
    const svelteServer = await startViteServer('svelte', PORTS.svelte);
    const threejsServer = await startViteServer('threejs', PORTS.threejs);
    
    // Get URLs for each dev server
    const urls = [
      `http://localhost:${PORTS.vue}`,
      `http://localhost:${PORTS.svelte}`,
      `http://localhost:${PORTS.threejs}`
    ];
    
    // Wait for all servers to be available
    console.log(colors.yellow('Waiting for dev servers to start...'));
    await waitOn({
      resources: urls,
      timeout: 10000,
      verbose: true
    });
    console.log(colors.green('All dev servers are running!'));
    
    // Set environment variables for the Electron process
    process.env.ELECTRON_IS_DEV = '1';
    process.env.NODE_ENV = 'development';
    process.env.VITE_DEV_SERVER_URL = urls[0];
    process.env.VITE_VUE_SERVER_URL = urls[0];
    process.env.VITE_SVELTE_SERVER_URL = urls[1];
    process.env.VITE_THREEJS_SERVER_URL = urls[2];
    
    // Launch Electron using our shell script
    console.log(colors.yellow('Launching Electron with shell script...'));
    const electronProcess = spawn('./launch-electron.sh', [], {
      stdio: 'inherit',
      env: process.env
    });
    
    console.log(colors.green('Electron launcher started!'));
    
    // Handle process exit
    electronProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(colors.red(`Electron process exited with code ${code}`));
      }
      
      // Close all servers
      vueServer.close();
      svelteServer.close();
      threejsServer.close();
      
      process.exit(code);
    });
    
    // Handle process errors
    electronProcess.on('error', (err) => {
      console.error(colors.red('Failed to start Electron:'), err);
      process.exit(1);
    });
    
    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
      console.log(colors.yellow('\nGracefully shutting down...'));
      
      // Close all servers
      vueServer.close();
      svelteServer.close();
      threejsServer.close();
      
      // Kill Electron process
      electronProcess.kill('SIGINT');
      
      // Exit after a short delay
      setTimeout(() => {
        process.exit(0);
      }, 100);
    });
  } catch (err) {
    console.error(colors.red('Error starting development environment:'), err);
    process.exit(1);
  }
}

/**
 * Start a Vite dev server for a specific renderer type
 * @param {string} type - Renderer type (vue, svelte, threejs)
 * @param {number} port - Port to run the server on
 * @returns {Promise<import('vite').ViteDevServer>}
 */
async function startViteServer(type, port) {
  try {
    console.log(colors.yellow(`Starting ${type} dev server...`));
    
    // Create server with the appropriate configuration
    const configFile = path.resolve(__dirname, `build-config/vite.${type}.config.mjs`);
    
    // Check if config file exists
    if (!fs.existsSync(configFile)) {
      throw new Error(`Config file not found: ${configFile}`);
    }
    
    // Create a child process to run the ESM config
    const server = await createServer({
      configFile,
      server: {
        port,
        strictPort: true
      },
      mode: 'development'
    });
    
    await server.listen();
    
    console.log(colors.green(`${type.toUpperCase()} dev server running at: http://localhost:${port}`));
    
    return server;
  } catch (err) {
    console.error(colors.red(`Error starting ${type} dev server:`), err);
    throw err;
  }
}

// Start the development environment
main().catch((err) => {
  console.error(colors.red('Failed to start development environment:'), err);
  process.exit(1);
});
