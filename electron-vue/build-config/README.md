# Multi-Renderer Build System

This directory contains the build configuration for the JEmulator multi-renderer system. The build system is designed to handle multiple Vite build processes for different renderer types (Vue, Svelte, Three.js) and coordinate them with the Electron main process.

## Architecture

The build system uses ES modules (ESM) throughout to ensure compatibility with modern JavaScript packages, particularly those that are ESM-only like `@sveltejs/vite-plugin-svelte`.

### Configuration Files

- **vite.base.config.mjs**: Base Vite configuration that's extended by each renderer
- **vite.vue.config.mjs**: Vue-specific configuration
- **vite.svelte.config.mjs**: Svelte-specific configuration
- **vite.threejs.config.mjs**: Three.js-specific configuration
- **vite.main.config.mjs**: Main process configuration

### Build Scripts

- **dev-server.mjs**: Starts development servers for all renderers and launches Electron
- **build.mjs**: Builds all renderers and the main process for production

## Development Mode

In development mode, the build system:

1. Starts separate Vite dev servers for each renderer type
2. Each server runs on a different port:
   - Vue: 5173
   - Svelte: 5174
   - Three.js: 5175
3. Waits for all servers to be ready before launching Electron
4. Passes dev server URLs to Electron via environment variables
5. Enables hot module replacement (HMR) for all renderers

## Production Build

For production builds, the system:

1. Builds all renderers in parallel
2. Outputs to separate directories in `dist/`
3. Optimizes assets for production
4. Prepares package.json for distribution

## Troubleshooting

### ESM Compatibility Issues

If you encounter ESM compatibility issues:

1. Make sure all imports use the `.mjs` extension
2. Use dynamic imports with `await import()` for ESM-only packages
3. Check that `"type": "module"` is set in package.json

### Port Conflicts

If you encounter port conflicts:

1. Check if other processes are using ports 5173-5175
2. Modify the `getPortForRenderer` function in `vite.base.config.mjs` to use different ports

## Adding New Renderer Types

To add a new renderer type:

1. Create a new configuration file (e.g., `vite.react.config.mjs`)
2. Add the appropriate plugins and configuration
3. Update the `RENDERER_TYPES` enum in `renderer-manager.js`
4. Add build scripts to package.json
5. Update the dev-server.mjs and build.mjs files to include the new renderer
