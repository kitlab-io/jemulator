import { defineConfig } from 'vite';

// https://vitejs.dev/config
// export default defineConfig({});

import path from 'path';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, 'src/main.js'), // Your main process entry
                deviceWorker: path.resolve(__dirname, 'src/device-worker.js'), // Include the file
            },
            output: {
                entryFileNames: '[name].js', // Keep original file names
            },
        },
    },
    publicDir: 'src', // Copy all files from src to build directory
});
