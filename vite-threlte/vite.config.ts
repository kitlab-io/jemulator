import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// import { sveltekit } from '@sveltejs/kit/vite'
import { threlteStudio } from '@threlte/studio/vite'

// export default {
//   plugins: [threlteStudio(), sveltekit()]
// }

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [threlteStudio(), svelte()],
  ssr: {
		noExternal: ['three', 'troika-three-text']
	},
  build:
    {
        outDir: './dist',
        emptyOutDir: true,
        sourcemap: true,
        rollupOptions: {
            output: {
              entryFileNames: `assets/[name].js`,
              chunkFileNames: `assets/[name].js`,
              assetFileNames: `assets/[name].[ext]`,
              format: 'iife'
            },
            external: [
              './app.css'
            ],
          }
    }
})
