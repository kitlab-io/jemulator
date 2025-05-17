/**
 * Development script for the multi-renderer system
 * This script starts all Vite dev servers and launches Electron
 */
const { spawn } = require('child_process');
const { createServer } = require('vite');
const path = require('path');
const electron = require('electron');
const waitOn = require('wait-on');

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
 * Start development servers for all renderer processes and the main process
 */
async function startDevServers() {
  console.log(colors.cyan('Starting development servers...'));
  
  try {
    // Start Vite dev servers for each renderer
    const vueServer = await createViteServer('vue');
    const svelteServer = await createViteServer('svelte');
    const threejsServer = await createViteServer('threejs');
    
    // URLs for each dev server
    const urls = [
      `http://localhost:${PORTS.vue}`,
      `http://localhost:${PORTS.svelte}`,
      `http://localhost:${PORTS.threejs}`
    ];
    
    console.log(colors.yellow('Waiting for dev servers to start...'));
    
    // Wait for all servers to be available
    await waitOn({
      resources: urls,
      timeout: 10000,
      verbose: true
    });
    
    console.log(colors.green('All dev servers are running!'));
    
    // Start Electron
    await startElectron(urls);
    
    // Handle process exit
    process.on('exit', () => {
      vueServer.close();
      svelteServer.close();
      threejsServer.close();
    });
  } catch (err) {
    console.error(colors.red('Error starting dev servers:'), err);
    process.exit(1);
  }
}

/**
 * Create a Vite dev server for a specific renderer type
 * @param {string} type - Renderer type (vue, svelte, threejs)
 * @returns {import('vite').ViteDevServer}
 */
async function createViteServer(type) {
  try {
    console.log(colors.yellow(`Creating ${type} dev server...`));
    
    // Create server with the appropriate configuration
    const server = await createServer({
      configFile: path.resolve(__dirname, `vite.${type}.config.mjs`),
      server: {
        port: PORTS[type],
        strictPort: true
      },
      mode: 'development'
    });
    
    console.log(colors.yellow(`Starting ${type} dev server...`));
    await server.listen();
    
    console.log(colors.green(`${type.toUpperCase()} dev server running at: http://localhost:${PORTS[type]}`));
    
    return server;
  } catch (err) {
    console.error(colors.red(`Error starting ${type} dev server:`), err);
    console.error(err.stack);
    process.exit(1);
  }
}

/**
 * Start the Electron app
 * @param {string[]} urls - URLs for the dev servers
 */
async function startElectron(urls) {
  console.log(colors.yellow('Starting Electron...'));
  
  // Use the electron-dev.js script to launch Electron
  const electronDev = require('./electron-dev.js');
  
  // Launch Electron with the dev server URLs
  electronDev.launchElectron({ urls });
}

// Start the dev servers
startDevServers().catch((err) => {
  console.error(colors.red('Failed to start dev servers:'), err);
  process.exit(1);
});
