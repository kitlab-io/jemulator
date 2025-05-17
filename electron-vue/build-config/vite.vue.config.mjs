// Use dynamic import for consistency with Svelte config
export default async () => {
  const { resolve, dirname } = await import('path');
  const { fileURLToPath } = await import('url');
  const { default: vue } = await import('@vitejs/plugin-vue');
  const { default: createBaseConfig } = await import('./vite.base.config.mjs');

  // Create __dirname equivalent for ESM
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  
  const root = resolve(__dirname, '../src/vue-app');

  return createBaseConfig({
    root,
    rendererType: 'vue',
    plugins: [vue()],
    build: {
      rollupOptions: {
        input: {
          main: resolve(root, 'index.html')
        }
      }
    }
  });
}
