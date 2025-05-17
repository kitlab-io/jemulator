// Use ESM format with top-level await
import { build } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import colors from 'picocolors';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Build all renderer processes and the main process for production
 */
async function buildAll() {
  console.log(colors.cyan('Building all apps for production...'));
  
  try {
    // Create dist directory if it doesn't exist
    const distDir = resolve(__dirname, '../dist');
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }
    
    // Build all renderer processes in parallel
    await Promise.all([
      buildRenderer('vue'),
      buildRenderer('svelte'),
      buildRenderer('threejs'),
      buildMainRenderer(),
      buildMain()
    ]);
    
    // Copy package.json to dist folder (for Electron Forge)
    copyPackageJson();
    
    console.log(colors.green('Build completed successfully!'));
  } catch (err) {
    console.error(colors.red('Build failed:'), err);
    process.exit(1);
  }
}

/**
 * Build a specific renderer process
 * @param {string} type - Renderer type (vue, svelte, threejs)
 */
async function buildRenderer(type) {
  console.log(colors.yellow(`Building ${type} renderer...`));
  
  try {
    const configPath = resolve(__dirname, `./vite.${type}.config.mjs`);
    
    // All configs are now ESM modules with async default export functions
    console.log(colors.yellow(`Loading ${type} configuration...`));
    const configModule = await import(configPath);
    const config = await configModule.default();
    
    console.log(colors.yellow(`Building ${type} with Vite...`));
    await build(config);
    
    console.log(colors.green(`${type.toUpperCase()} renderer built successfully!`));
  } catch (err) {
    console.error(colors.red(`Error building ${type} renderer:`), err);
    console.error(err.stack);
    throw err;
  }
}

/**
 * Build the main renderer (control panel)
 */
async function buildMainRenderer() {
  console.log(colors.yellow('Building main renderer (control panel)...'));
  
  try {
    const configPath = resolve(__dirname, './vite.main-renderer.config.mjs');
    await build({
      configFile: configPath,
      mode: 'production'
    });
    
    console.log(colors.green('Main renderer built successfully!'));
  } catch (err) {
    console.error(colors.red('Error building main renderer:'), err);
    throw err;
  }
}

/**
 * Build the main process
 */
async function buildMain() {
  console.log(colors.yellow('Building main process...'));
  
  try {
    const configPath = resolve(__dirname, './vite.main.config.mjs');
    await build({
      configFile: configPath,
      mode: 'production'
    });
    
    console.log(colors.green('Main process built successfully!'));
  } catch (err) {
    console.error(colors.red('Error building main process:'), err);
    throw err;
  }
}

/**
 * Copy package.json to dist folder with production settings
 */
function copyPackageJson() {
  const packageJsonPath = resolve(__dirname, '../package.json');
  const distPackageJsonPath = resolve(__dirname, '../dist/package.json');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Modify package.json for production
    const productionPackageJson = {
      name: packageJson.name,
      productName: packageJson.productName,
      version: packageJson.version,
      description: packageJson.description,
      main: 'main/main.js',
      author: packageJson.author,
      license: packageJson.license,
      dependencies: {
        // Include only production dependencies
        'better-sqlite3': packageJson.dependencies['better-sqlite3'],
        'electron-squirrel-startup': packageJson.dependencies['electron-squirrel-startup'],
        'svelte': packageJson.dependencies['svelte'],
        'three': packageJson.dependencies['three'],
        'uuid': packageJson.dependencies['uuid'],
        'vue': packageJson.dependencies['vue'],
        'ws': packageJson.dependencies['ws']
      }
    };
    
    fs.writeFileSync(
      distPackageJsonPath,
      JSON.stringify(productionPackageJson, null, 2)
    );
    
    console.log(colors.green('package.json copied to dist folder'));
  } catch (err) {
    console.error(colors.red('Error copying package.json:'), err);
    throw err;
  }
}

// Start the build process
buildAll().catch((err) => {
  console.error(colors.red('Build process failed:'), err);
  process.exit(1);
});
