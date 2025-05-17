// Use dynamic import for consistency with other configs
export default async () => {
  const { resolve, dirname } = await import('path');
  const { fileURLToPath } = await import('url');
  const { default: createBaseConfig } = await import('./vite.base.config.mjs');

  // Create __dirname equivalent for ESM
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  
  const root = resolve(__dirname, '../src/threejs-app');

  return createBaseConfig({
    root,
    rendererType: 'threejs',
    build: {
      rollupOptions: {
        input: {
          main: resolve(root, 'index.html')
        }
      }
    }
  });
}
