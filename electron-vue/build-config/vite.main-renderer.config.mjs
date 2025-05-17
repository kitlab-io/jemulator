// Main renderer configuration for the App.vue in the root src directory
export default async () => {
  const { resolve, dirname } = await import('path');
  const { fileURLToPath } = await import('url');
  const { default: vue } = await import('@vitejs/plugin-vue');
  const { default: createBaseConfig } = await import('./vite.base.config.mjs');

  // Create __dirname equivalent for ESM
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  
  // Use the root src directory as the root for this renderer
  const root = resolve(__dirname, '../src');

  return createBaseConfig({
    root,
    rendererType: 'main-renderer',
    plugins: [vue()],
    build: {
      outDir: '../dist/main-renderer',
      rollupOptions: {
        input: {
          main: resolve(root, 'index.html')
        }
      }
    }
  });
}
