import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
  packagerConfig: {
    asar: true,
    executableName: 'jemulator',
    appCopyright: `Copyright © ${new Date().getFullYear()}`,
    icon: resolve(__dirname, 'assets/icon'),
    extraResource: [
      // Add any extra resources here
    ],
    // Include all renderer builds
    ignore: [
      /^\/(?!dist)/,
      /\/build-config\//,
      /\.git/,
      /\.vscode/,
      /node_modules\/(?!better-sqlite3|ws|uuid|svelte|vue|three)/
    ]
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'jemulator'
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'linux']
    },
    {
      name: '@electron-forge/maker-deb',
      config: {}
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {}
    }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {}
    },
    {
      name: '@electron-forge/plugin-fuses',
      config: {
        version: 1,
        fuses: {
          // Disable node integration in renderer processes for security
          nativeNodeModulesInRenderer: false,
          // Enable context isolation for security
          contextIsolation: true,
          // Disable remote module
          enableRemoteModule: false
        }
      }
    }
  ],
  // Use our custom build process instead of the default Vite plugin
  buildIdentifier: 'custom',
  hooks: {
    // Use our custom build script before packaging
    generateAssets: async () => {
      console.log('Running custom build process...');
      execSync('npm run build', { stdio: 'inherit' });
    }
  }
};
