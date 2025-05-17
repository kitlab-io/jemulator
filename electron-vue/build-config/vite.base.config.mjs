/**
 * Base Vite configuration that can be extended for each renderer
 * @param {Object} options - Configuration options
 * @returns {import('vite').UserConfig}
 */
export default async function createBaseConfig(options = {}) {
  const { defineConfig } = await import('vite');
  const { resolve } = await import('path');
  
  const {
    root = process.cwd(),
    outDir,
    rendererType,
    plugins = [],
    alias = {},
    server = {},
    build = {}
  } = options;

  return defineConfig({
    root,
    base: './',
    plugins,
    resolve: {
      alias: {
        '@': resolve(root, 'src'),
        ...alias
      }
    },
    server: {
      port: getPortForRenderer(rendererType),
      strictPort: true,
      hmr: {
        port: getPortForRenderer(rendererType),
      },
      ...server
    },
    build: {
      outDir: outDir || `dist/${rendererType}`,
      emptyOutDir: true,
      target: 'esnext',
      ...build
    },
    optimizeDeps: {
      exclude: ['electron']
    }
  });
}

/**
 * Get a port number for a specific renderer type
 * @param {string} rendererType - Type of renderer (vue, svelte, threejs)
 * @returns {number} Port number
 */
function getPortForRenderer(rendererType) {
  switch (rendererType) {
    case 'vue':
      return 5173; // Default Vite port
    case 'svelte':
      return 5174;
    case 'threejs':
      return 5175;
    default:
      return 5173;
  }
}
