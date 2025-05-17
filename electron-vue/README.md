# JEmulator Multi-Renderer System

A modular Electron application that can launch multiple renderer processes, each running different web frameworks (Vue, Svelte, Three.js) while managing persistent state with SQLite via a WebSocket service.

## Features

- **Multiple Renderer Types**: Launch different types of renderer processes (Vue, Svelte, Three.js)
- **Shared State**: Persistent data storage using SQLite
- **Real-time Communication**: WebSocket server for communication between renderers
- **Modular Architecture**: Services-based design for easy maintenance and extension

## Architecture

### Main Process

- **Main Controller**: Coordinates all services and handles IPC communication
- **Database Service**: Manages SQLite database for persistent storage
- **WebSocket Server**: Handles real-time communication between renderers
- **Renderer Manager**: Creates and manages multiple renderer processes

### Renderer Processes

- **Vue App**: Data management interface built with Vue.js
- **Svelte App**: Data explorer built with Svelte
- **Three.js App**: 3D visualization of data using Three.js

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start the application in development mode
npm run dev
```

### Development Build System

The project uses a modular build system that coordinates multiple Vite instances for each renderer type. The development workflow is split into two steps for better stability and debugging:

```bash
# Step 1: Start Vite development servers for all renderers
npm run dev

# Step 2: In a separate terminal, launch Electron with the dev servers
npm run electron

# Build only the Vue renderer
npm run build:vue

# Build only the Svelte renderer
npm run build:svelte

# Build only the Three.js renderer
npm run build:threejs

# Build only the main process
npm run build:main

# Build everything for production
npm run build
```

### How the Build System Works

1. **Development Mode** (`npm run dev`):
   - Starts separate Vite dev servers for each renderer (Vue, Svelte, Three.js)
   - Each server runs on a different port (5173, 5174, 5175)
   - Waits for all servers to be ready before launching Electron
   - Passes dev server URLs to Electron via environment variables
   - Enables hot module replacement (HMR) for all renderers

2. **Production Build** (`npm run build`):
   - Builds all renderers in parallel
   - Outputs to separate directories in `dist/`
   - Optimizes assets for production
   - Prepares package.json for distribution

3. **Packaging** (`npm run package`):
   - Runs the production build
   - Uses Electron Forge to package the application
   - Creates platform-specific distributables

## Usage

1. Launch the main application
2. Use the control panel to launch different renderer types
3. Share data between renderers using the database service
4. Visualize data in real-time across all renderers

## Development

### Adding a New Renderer Type

1. Create a new directory in `src/` for your renderer (e.g., `react-app`)
2. Add the necessary HTML, JS, and CSS files
3. Update the `renderer-manager.js` file to include your new renderer type
4. Add a launch button in the main `App-updated.vue` file

### Database Schema

The application uses a simple key-value store with namespaces:

- `renderers`: Information about registered renderers
- `shared_data`: Shared data between renderers (organized by namespace)

## License

MIT