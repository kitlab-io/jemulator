/**
 * Copy WebSocket client to all web app directories
 * 
 * This script copies the shared WebSocket client module to all web app directories
 * so they can connect to the WebSocket server in the main process.
 */

const fs = require('fs');
const path = require('path');

// Define source and destination paths
const sourceFile = path.join(__dirname, '../src/shared/websocket-client.ts');
const destinations = [
  path.join(__dirname, '../../vite-react/src/shared/'),
  path.join(__dirname, '../../vite-threlte/src/shared/'),
  path.join(__dirname, '../../needle-engine-samples/src/shared/'),
  path.join(__dirname, '../../renjs-samples/src/shared/')
];

// Ensure the destination directories exist
destinations.forEach(destDir => {
  if (!fs.existsSync(destDir)) {
    console.log(`Creating directory: ${destDir}`);
    fs.mkdirSync(destDir, { recursive: true });
  }
});

// Copy the file to each destination
try {
  const sourceContent = fs.readFileSync(sourceFile, 'utf8');
  
  destinations.forEach(destDir => {
    const destFile = path.join(destDir, 'websocket-client.ts');
    fs.writeFileSync(destFile, sourceContent);
    console.log(`Copied WebSocket client to: ${destFile}`);
  });
  
  console.log('WebSocket client copied to all web app directories successfully!');
} catch (error) {
  console.error('Error copying WebSocket client:', error);
  process.exit(1);
}
