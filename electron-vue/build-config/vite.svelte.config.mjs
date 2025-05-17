// Use dynamic import for ESM-only packages
export default async () => {
  const { resolve, dirname } = await import('path');
  const { fileURLToPath } = await import('url');
  const { svelte } = await import('@sveltejs/vite-plugin-svelte');
  const { default: createBaseConfig } = await import('./vite.base.config.mjs');

  // Create __dirname equivalent for ESM
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  
  const root = resolve(__dirname, '../src/svelte-app');

  return createBaseConfig({
    root,
    rendererType: 'svelte',
    plugins: [svelte()],
    build: {
      rollupOptions: {
        input: {
          main: resolve(root, 'index.html')
        }
      }
    }
  });
}
