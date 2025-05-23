/**
 * Script to build the Go puzzle service and copy it to the Electron app resources
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Paths
const rootDir = path.resolve(__dirname, '..');
const goPuzzleServiceDir = path.resolve(rootDir, '..', 'go', 'puzzleservice');
const resourcesDir = path.resolve(rootDir, 'resources');
const samplesDir = path.resolve(goPuzzleServiceDir, 'samples');
const resourcesSamplesDir = path.resolve(resourcesDir, 'puzzles');

// Ensure resources directory exists
if (!fs.existsSync(resourcesDir)) {
  fs.mkdirSync(resourcesDir, { recursive: true });
}

// Ensure puzzles directory exists
if (!fs.existsSync(resourcesSamplesDir)) {
  fs.mkdirSync(resourcesSamplesDir, { recursive: true });
}

// Build the Go puzzle service
console.log('Building Go puzzle service...');
try {
  execSync('go build', { 
    cwd: goPuzzleServiceDir,
    stdio: 'inherit'
  });
  console.log('Go puzzle service built successfully.');
} catch (error) {
  console.error('Failed to build Go puzzle service:', error.message);
  process.exit(1);
}

// Copy the executable to the resources directory
console.log('Copying puzzle service executable to resources directory...');
const executableName = process.platform === 'win32' ? 'puzzleservice.exe' : 'puzzleservice';
const sourcePath = path.join(goPuzzleServiceDir, executableName);
const destPath = path.join(resourcesDir, executableName);

try {
  fs.copyFileSync(sourcePath, destPath);
  console.log(`Copied ${sourcePath} to ${destPath}`);
} catch (error) {
  console.error('Failed to copy puzzle service executable:', error.message);
  process.exit(1);
}

// Copy sample puzzles to resources directory
console.log('Copying sample puzzles to resources directory...');
try {
  const sampleFiles = fs.readdirSync(samplesDir);
  
  for (const file of sampleFiles) {
    if (file.endsWith('.json')) {
      const sourcePath = path.join(samplesDir, file);
      const destPath = path.join(resourcesSamplesDir, file);
      fs.copyFileSync(sourcePath, destPath);
      console.log(`Copied ${sourcePath} to ${destPath}`);
    }
  }
  
  console.log('Sample puzzles copied successfully.');
} catch (error) {
  console.error('Failed to copy sample puzzles:', error.message);
  process.exit(1);
}

console.log('Puzzle service build and setup completed successfully.');
