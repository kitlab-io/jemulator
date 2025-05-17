import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { app } from 'electron';
import fs from 'fs/promises';

class DatabaseService {
  constructor() {
    this.db = null;
    this.initialized = false;
    this.dbPath = path.join(app.getPath('userData'), 'data.sqlite');
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Ensure the directory exists
      const dbDir = path.dirname(this.dbPath);
      await fs.mkdir(dbDir, { recursive: true });

      // Open the database
      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      });

      // Enable foreign keys
      await this.db.exec('PRAGMA foreign_keys = ON');

      // Initialize tables if they don't exist
      await this.initializeTables();

      this.initialized = true;
      console.log(`Database initialized at ${this.dbPath}`);
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  async initializeTables() {
    // Create a table to store application state
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS app_state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create a table to track renderer processes
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS renderer_processes (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create a table for shared data between renderers
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS shared_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        namespace TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        created_by TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(namespace, key),
        FOREIGN KEY(created_by) REFERENCES renderer_processes(id) ON DELETE SET NULL
      )
    `);
  }

  // General query methods
  async query(sql, params = []) {
    if (!this.initialized) await this.initialize();
    return this.db.all(sql, params);
  }

  async get(sql, params = []) {
    if (!this.initialized) await this.initialize();
    return this.db.get(sql, params);
  }

  async run(sql, params = []) {
    if (!this.initialized) await this.initialize();
    return this.db.run(sql, params);
  }

  // Application state methods
  async getState(key) {
    const result = await this.get(
      'SELECT value FROM app_state WHERE key = ?',
      [key]
    );
    return result ? JSON.parse(result.value) : null;
  }

  async setState(key, value) {
    const jsonValue = JSON.stringify(value);
    await this.run(
      'INSERT INTO app_state (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ' +
      'ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP',
      [key, jsonValue, jsonValue]
    );
    return { key, value };
  }

  // Renderer process tracking
  async registerRenderer(id, type, title) {
    await this.run(
      'INSERT INTO renderer_processes (id, type, title) VALUES (?, ?, ?) ' +
      'ON CONFLICT(id) DO UPDATE SET last_active = CURRENT_TIMESTAMP',
      [id, type, title]
    );
    return { id, type, title };
  }

  async updateRendererActivity(id) {
    await this.run(
      'UPDATE renderer_processes SET last_active = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
  }

  async getRenderers() {
    return this.query('SELECT * FROM renderer_processes');
  }

  // Shared data methods
  async getSharedData(namespace, key) {
    const result = await this.get(
      'SELECT value FROM shared_data WHERE namespace = ? AND key = ?',
      [namespace, key]
    );
    return result ? JSON.parse(result.value) : null;
  }

  async getAllSharedData(namespace) {
    const results = await this.query(
      'SELECT key, value FROM shared_data WHERE namespace = ?',
      [namespace]
    );
    return results.reduce((acc, row) => {
      acc[row.key] = JSON.parse(row.value);
      return acc;
    }, {});
  }

  async setSharedData(namespace, key, value, createdBy = null) {
    const jsonValue = JSON.stringify(value);
    await this.run(
      'INSERT INTO shared_data (namespace, key, value, created_by, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP) ' +
      'ON CONFLICT(namespace, key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP',
      [namespace, key, jsonValue, createdBy, jsonValue]
    );
    return { namespace, key, value };
  }

  async deleteSharedData(namespace, key) {
    await this.run(
      'DELETE FROM shared_data WHERE namespace = ? AND key = ?',
      [namespace, key]
    );
    return { namespace, key };
  }

  // Close the database connection
  async close() {
    if (this.db) {
      await this.db.close();
      this.initialized = false;
      this.db = null;
    }
  }
}

// Create a singleton instance
const databaseService = new DatabaseService();

export default databaseService;
