import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import viteCompression from 'vite-plugin-compression';
// import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vitejs.dev/config
// export default defineConfig({
//   plugins: [vue()]
// });

export default defineConfig(async ({ command }) => {

    const { needlePlugins, useGzip, loadConfig } = await import("@needle-tools/engine/plugins/vite/index.js");
    const needleConfig = await loadConfig();

    return {
        base: "./",
        plugins: [
            vue(),
            // basicSsl(),
            useGzip(needleConfig) ? viteCompression({ deleteOriginFile: true, verbose: false }) : null,
            needlePlugins(command, needleConfig),
        ],
        // server: {
        //     https: true,
        //     proxy: { // workaround: specifying a proxy skips HTTP2 which is currently problematic in Vite since it causes session memory timeouts.
        //         'https://localhost:3000': 'https://localhost:3000'
        //     },
        //     strictPort: true,
        //     port: 3000,
        // },
        // build: {
        //     outDir: "./dist",
        //     emptyOutDir: true,
        // }
    }
});