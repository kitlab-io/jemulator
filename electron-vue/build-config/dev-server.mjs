// Use ESM format with top-level await
import { spawn } from 'child_process';
import { createServer } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import waitOn from 'wait-on';
import colors from 'picocolors';
import { createRequire } from 'module';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Start development servers for all renderer processes and the main process
 */
async function startDevServers() {
  console.log(colors.cyan('Starting development servers...'));
  
  // Start Vite dev servers for each renderer
  const vueServer = await createViteServer('vue');
  const svelteServer = await createViteServer('svelte');
  const threejsServer = await createViteServer('threejs');
  
  // Wait for all servers to be ready
  const urls = [
    `http://localhost:${vueServer.config.server.port}`,
    `http://localhost:${svelteServer.config.server.port}`,
    `http://localhost:${threejsServer.config.server.port}`
  ];
  
  console.log(colors.yellow('Waiting for dev servers to start...'));
  
  try {
    // Wait for all servers to be available
    await waitOn({
      resources: urls,
      timeout: 10000,
      verbose: true
    });
    
    console.log(colors.green('All dev servers are running!'));
    
    // Set environment variables for Electron to know the URLs
    process.env.VITE_DEV_SERVER_URL = urls[0]; // Main URL for Electron
    process.env.VITE_VUE_SERVER_URL = urls[0];
    process.env.VITE_SVELTE_SERVER_URL = urls[1];
    process.env.VITE_THREEJS_SERVER_URL = urls[2];
    
    // Start Electron
    await startElectron();
    
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
    const configPath = resolve(__dirname, `./vite.${type}.config.mjs`);
    
    // All configs are now ESM modules with async default export functions
    console.log(colors.yellow(`Loading ${type} configuration...`));
    const configModule = await import(configPath);
    const config = await configModule.default();
    
    console.log(colors.yellow(`Creating ${type} dev server...`));
    const server = await createServer(config);
    
    console.log(colors.yellow(`Starting ${type} dev server...`));
    await server.listen();
    
    const port = server.config.server.port;
    console.log(colors.green(`${type.toUpperCase()} dev server running at: http://localhost:${port}`));
    
    return server;
  } catch (err) {
    console.error(colors.red(`Error starting ${type} dev server:`), err);
    console.error(err.stack);
    process.exit(1);
  }
}

/**
 * Start the Electron app
 */
async function startElectron() {
  console.log(colors.yellow('Starting Electron...'));
  
  // Create a require function to import CommonJS modules
  const require = createRequire(import.meta.url);
  
  try {
    // Import the Electron launcher (CommonJS module)
    const { launchElectron } = require('./electron-launcher.js');
    
    // Launch Electron with the dev server URLs
    launchElectron({
      urls: [
        process.env.VITE_DEV_SERVER_URL,
        process.env.VITE_SVELTE_SERVER_URL,
        process.env.VITE_THREEJS_SERVER_URL
      ]
    });
  } catch (err) {
    console.error(colors.red('Failed to launch Electron:'), err);
    process.exit(1);
  }
}

// Start the dev servers
startDevServers().catch((err) => {
  console.error(colors.red('Failed to start dev servers:'), err);
  process.exit(1);
});
