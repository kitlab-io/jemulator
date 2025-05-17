/**
 * Simple HTTP server to serve the development dashboard
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

// Log with colors
const colors = {
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`
};

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  // Serve the dashboard HTML file
  const filePath = path.join(__dirname, 'public', 'index.html');
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end(`Error loading the dashboard: ${err.message}`);
      return;
    }
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(content);
  });
});

// Start the server on port 8000
const PORT = 8000;
server.listen(PORT, () => {
  console.log(colors.green(`Development Dashboard running at http://localhost:${PORT}`));
  console.log(colors.cyan('Open this URL in your browser to view all renderers'));
  console.log(colors.yellow('Make sure the Vite dev servers are running with `npm run dev`'));
});

// Handle server errors
server.on('error', (err) => {
  console.error(colors.red(`Server error: ${err.message}`));
  process.exit(1);
});
