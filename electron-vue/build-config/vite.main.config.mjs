// Use dynamic import for consistency with other configs
export default async () => {
  const { resolve, dirname } = await import('path');
  const { fileURLToPath } = await import('url');
  const { defineConfig } = await import('vite');
  
  // Create __dirname equivalent for ESM
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  
  // https://vitejs.dev/config/
  return defineConfig({
    resolve: {
      alias: {
        '@': resolve('src')
      }
    },
    build: {
      outDir: 'dist/main',
      emptyOutDir: true,
      target: 'node16',
      lib: {
        entry: resolve(__dirname, '../src/main.js'),
        formats: ['cjs'],
        fileName: () => 'main.js'
      },
      rollupOptions: {
        external: [
          'electron',
          'electron-devtools-installer',
          'better-sqlite3',
          'sqlite3',
          'sqlite',
          'ws',
          'path',
          'fs',
          'fs/promises',
          'url',
          'events',
          'http',
          'crypto',
          'os',
          'stream',
          'util'
        ],
        output: {
          entryFileNames: '[name].js'
        }
      }
    }
  });
};
