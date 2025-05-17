// Electron Forge configuration
const path = require('path');
const fs = require('fs');

module.exports = {
  packagerConfig: {
    asar: true,
    executableName: 'jemulator',
    appCopyright: `Copyright ${new Date().getFullYear()}`,
    icon: path.resolve(__dirname, 'assets/icon'),
    extraResource: [
      // Add any extra resources here
    ],
    out: 'out',
    dir: path.resolve(__dirname, 'dist'),
    ignore: [
      /\/build-config\//,
      /\.git/,
      /\.vscode/,
      /node_modules/
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
      name: '@electron-forge/plugin-vite',
      config: {
        // Use our custom build process instead of the default Vite build
        build: [],
        // Define renderer configurations
        renderer: [],
        // The main process entry point
        mainConfig: './vite.main.config.mjs'
      }
    }
  ],
  hooks: {
    // Run our build process before packaging
    packageAfterPrune: async (config, buildPath, electronVersion, platform, arch) => {
      // Copy our dist directory contents to the build path
      console.log(`Packaging for ${platform} ${arch}`);
      console.log(`Copying dist directory contents to ${buildPath}`);
      
      // Create the necessary directories
      const directories = ['main', 'main-renderer', 'vue', 'svelte', 'threejs'];
      for (const dir of directories) {
        const sourcePath = path.resolve(__dirname, 'dist', dir);
        const targetPath = path.resolve(buildPath, dir);
        
        if (fs.existsSync(sourcePath)) {
          // Create the target directory if it doesn't exist
          if (!fs.existsSync(targetPath)) {
            fs.mkdirSync(targetPath, { recursive: true });
          }
          
          // Copy the directory contents
          console.log(`Copying ${sourcePath} to ${targetPath}`);
          const files = fs.readdirSync(sourcePath);
          for (const file of files) {
            const sourceFile = path.resolve(sourcePath, file);
            const targetFile = path.resolve(targetPath, file);
            
            if (fs.statSync(sourceFile).isDirectory()) {
              // Copy directory recursively
              fs.cpSync(sourceFile, targetFile, { recursive: true });
            } else {
              // Copy file
              fs.copyFileSync(sourceFile, targetFile);
            }
          }
        } else {
          console.warn(`Source directory ${sourcePath} does not exist, skipping`);
        }
      }
      
      return true;
    }
  }
};
