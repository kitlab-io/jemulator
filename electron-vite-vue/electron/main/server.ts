/**
 * HTTP Server for Electron Main Process
 * 
 * This module creates an HTTP server to serve the different HTML entry points
 * for the Electron application, avoiding file protocol security issues.
 */

import { createServer, Server } from 'http';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import path from 'path';
import mime from 'mime-types';

// Default port for the HTTP server
const DEFAULT_PORT = 3333;

export class AppServer {
  private server: Server | null = null;
  private port: number;
  private rootDir: string;
  private reactDir: string;
  private needleDir: string;

  constructor(rootDir: string, reactDir: string, needleDir: string, port: number = DEFAULT_PORT) {
    this.rootDir = rootDir;
    this.reactDir = reactDir;
    this.needleDir = needleDir;
    this.port = port;
  }

  /**
   * Start the HTTP server
   * @returns {Promise<number>} The port the server is running on
   */
  async start(): Promise<number> {
    if (this.server) {
      console.log('Server is already running');
      return this.port;
    }

    return new Promise((resolve, reject) => {
      this.server = createServer(async (req, res) => {
        const url = new URL(req.url || '/', `http://localhost:${this.port}`);
        const pathname = decodeURIComponent(url.pathname);
        
        console.log(`[AppServer] Request: ${pathname}`);
        
        try {
          // Determine which app is being requested
          let filePath: string;
          
          if (pathname.startsWith('/react/')) {
            // React app request
            const relativePath = pathname.substring('/react/'.length) || 'index.html';
            filePath = path.join(this.reactDir, relativePath);
          } else if (pathname.startsWith('/needle/')) {
            // Needle JS app request
            const relativePath = pathname.substring('/needle/'.length) || 'index.html';
            filePath = path.join(this.needleDir, relativePath);
          } else {
            // Vue app request (default)
            const relativePath = pathname === '/' ? 'index.html' : pathname;
            filePath = path.join(this.rootDir, relativePath);
          }
          
          // Check if file exists
          try {
            const stats = await stat(filePath);
            if (stats.isDirectory()) {
              filePath = path.join(filePath, 'index.html');
              await stat(filePath); // Check if index.html exists
            }
          } catch (err) {
            console.error(`[AppServer] File not found: ${filePath}`);
            res.writeHead(404);
            res.end('404 Not Found');
            return;
          }
          
          // Set content type based on file extension
          const contentType = mime.lookup(filePath) || 'application/octet-stream';
          res.setHeader('Content-Type', contentType);
          
          // Stream the file to the response
          const stream = createReadStream(filePath);
          stream.pipe(res);
          
          stream.on('error', (err) => {
            console.error(`[AppServer] Error streaming file: ${err.message}`);
            res.writeHead(500);
            res.end('Internal Server Error');
          });
        } catch (err) {
          console.error(`[AppServer] Server error: ${err.message}`);
          res.writeHead(500);
          res.end('Internal Server Error');
        }
      });
      
      this.server.on('error', (err) => {
        reject(err);
      });
      
      this.server.listen(this.port, () => {
        console.log(`[AppServer] Server running at http://localhost:${this.port}/`);
        resolve(this.port);
      });
    });
  }

  /**
   * Stop the HTTP server
   */
  stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }
      
      this.server.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        
        this.server = null;
        console.log('[AppServer] Server stopped');
        resolve();
      });
    });
  }

  /**
   * Get the URL for a specific app
   * @param {string} app - The app to get the URL for ('vue', 'react', or 'needle')
   * @returns {string} The URL for the app
   */
  getAppUrl(app: 'vue' | 'react' | 'needle'): string {
    if (app === 'react') {
      return `http://localhost:${this.port}/react/`;
    } else if (app === 'needle') {
      return `http://localhost:${this.port}/needle/`;
    }
    return `http://localhost:${this.port}/`;
  }
}
