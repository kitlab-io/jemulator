/**
 * Database UI Component for Needle JS App
 * 
 * This module provides a UI component to interact with the SQLite database
 * through the DatabaseManager.
 */

import dbManager from './DatabaseManager';

export class DatabaseUI {
  constructor(container) {
    this.container = container;
    this.components = [];
    this.isConnected = false;
    this.selectedComponentId = null;
    
    // Create UI elements
    this.createUI();
    
    // Connect to the database
    this.connect();
    
    // Add event listeners
    this.addEventListeners();
  }
  
  /**
   * Create the UI elements
   */
  createUI() {
    // Create the container
    this.uiContainer = document.createElement('div');
    this.uiContainer.className = 'database-ui';
    this.container.appendChild(this.uiContainer);
    
    // Create the header
    const header = document.createElement('div');
    header.className = 'database-header';
    header.innerHTML = `
      <h2>Needle JS Database Integration</h2>
      <div class="connection-status">
        <span class="status-indicator disconnected"></span>
        <span class="status-text">Disconnected</span>
      </div>
    `;
    this.uiContainer.appendChild(header);
    
    // Create the components list
    const componentsList = document.createElement('div');
    componentsList.className = 'components-list';
    componentsList.innerHTML = `
      <h3>Components</h3>
      <div class="list-container">
        <ul id="components-list"></ul>
        <div class="empty-message">No components found</div>
      </div>
    `;
    this.uiContainer.appendChild(componentsList);
    
    // Create the component details
    const componentDetails = document.createElement('div');
    componentDetails.className = 'component-details';
    componentDetails.innerHTML = `
      <h3>Component Details</h3>
      <div class="details-container">
        <div class="empty-message">Select a component to view details</div>
        <div class="details-content" style="display: none;">
          <div class="detail-item">
            <label>Type:</label>
            <span id="component-type"></span>
          </div>
          <div class="detail-item">
            <label>Position:</label>
            <span id="component-position"></span>
          </div>
          <div class="detail-item">
            <label>Properties:</label>
            <pre id="component-properties"></pre>
          </div>
          <div class="detail-item controls">
            <button id="toggle-component">Toggle State</button>
            <button id="delete-component" class="danger">Delete Component</button>
          </div>
        </div>
      </div>
    `;
    this.uiContainer.appendChild(componentDetails);
    
    // Add styles
    this.addStyles();
  }
  
  /**
   * Add styles to the UI
   */
  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .database-ui {
        font-family: Arial, sans-serif;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        background-color: #f5f5f5;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .database-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 1px solid #ddd;
      }
      
      .connection-status {
        display: flex;
        align-items: center;
      }
      
      .status-indicator {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        margin-right: 8px;
      }
      
      .status-indicator.connected {
        background-color: #4caf50;
      }
      
      .status-indicator.disconnected {
        background-color: #f44336;
      }
      
      .components-list, .component-details {
        background-color: #fff;
        border-radius: 4px;
        padding: 15px;
        margin-bottom: 20px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      }
      
      .list-container ul {
        list-style: none;
        padding: 0;
        margin: 0;
        max-height: 300px;
        overflow-y: auto;
      }
      
      .list-container li {
        padding: 10px;
        border-bottom: 1px solid #eee;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
      }
      
      .list-container li:hover {
        background-color: #f5f5f5;
      }
      
      .list-container li.selected {
        background-color: #e3f2fd;
      }
      
      .empty-message {
        padding: 20px;
        text-align: center;
        color: #999;
        font-style: italic;
      }
      
      .detail-item {
        margin-bottom: 15px;
      }
      
      .detail-item label {
        font-weight: bold;
        display: block;
        margin-bottom: 5px;
      }
      
      .detail-item pre {
        background-color: #f9f9f9;
        padding: 10px;
        border-radius: 4px;
        overflow-x: auto;
        margin: 0;
      }
      
      .controls {
        display: flex;
        gap: 10px;
      }
      
      button {
        background-color: #2196f3;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
      }
      
      button:hover {
        background-color: #1976d2;
      }
      
      button.danger {
        background-color: #f44336;
      }
      
      button.danger:hover {
        background-color: #d32f2f;
      }
    `;
    document.head.appendChild(style);
  }
  
  /**
   * Connect to the database
   */
  async connect() {
    try {
      await dbManager.connect();
      this.isConnected = true;
      this.updateConnectionStatus();
      
      // Load components
      await this.loadComponents();
    } catch (err) {
      console.error('Failed to connect to database:', err);
      this.isConnected = false;
      this.updateConnectionStatus();
    }
  }
  
  /**
   * Update the connection status indicator
   */
  updateConnectionStatus() {
    const indicator = this.uiContainer.querySelector('.status-indicator');
    const text = this.uiContainer.querySelector('.status-text');
    
    if (this.isConnected) {
      indicator.classList.remove('disconnected');
      indicator.classList.add('connected');
      text.textContent = 'Connected';
    } else {
      indicator.classList.remove('connected');
      indicator.classList.add('disconnected');
      text.textContent = 'Disconnected';
    }
  }
  
  /**
   * Load components from the database
   */
  async loadComponents() {
    if (!this.isConnected) {
      return;
    }
    
    try {
      // Get all components
      this.components = await dbManager.all('SELECT * FROM components ORDER BY type');
      
      // Update the UI
      this.renderComponentsList();
    } catch (err) {
      console.error('Failed to load components:', err);
    }
  }
  
  /**
   * Render the components list
   */
  renderComponentsList() {
    const list = this.uiContainer.querySelector('#components-list');
    const emptyMessage = this.uiContainer.querySelector('.components-list .empty-message');
    
    // Clear the list
    list.innerHTML = '';
    
    if (this.components.length === 0) {
      list.style.display = 'none';
      emptyMessage.style.display = 'block';
      return;
    }
    
    // Show the list and hide the empty message
    list.style.display = 'block';
    emptyMessage.style.display = 'none';
    
    // Render each component
    this.components.forEach(component => {
      const li = document.createElement('li');
      li.dataset.id = component.id;
      li.className = this.selectedComponentId === component.id ? 'selected' : '';
      
      // Parse the properties
      const properties = JSON.parse(component.properties);
      
      li.innerHTML = `
        <div class="component-name">${component.type}</div>
        <div class="component-preview">
          ${properties.isOn !== undefined ? (properties.isOn ? 'ON' : 'OFF') : ''}
          ${properties.isRunning !== undefined ? (properties.isRunning ? 'RUNNING' : 'STOPPED') : ''}
        </div>
      `;
      
      li.addEventListener('click', () => this.selectComponent(component.id));
      
      list.appendChild(li);
    });
  }
  
  /**
   * Select a component
   */
  selectComponent(id) {
    this.selectedComponentId = id;
    
    // Update the selected item in the list
    const items = this.uiContainer.querySelectorAll('#components-list li');
    items.forEach(item => {
      if (item.dataset.id === id.toString()) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
    
    // Find the component
    const component = this.components.find(c => c.id === id);
    
    if (!component) {
      return;
    }
    
    // Update the component details
    this.renderComponentDetails(component);
  }
  
  /**
   * Render the component details
   */
  renderComponentDetails(component) {
    const detailsContent = this.uiContainer.querySelector('.details-content');
    const emptyMessage = this.uiContainer.querySelector('.component-details .empty-message');
    
    // Show the details and hide the empty message
    detailsContent.style.display = 'block';
    emptyMessage.style.display = 'none';
    
    // Parse the properties
    const properties = JSON.parse(component.properties);
    
    // Update the details
    this.uiContainer.querySelector('#component-type').textContent = component.type;
    this.uiContainer.querySelector('#component-position').textContent = `(${component.position_x}, ${component.position_y})`;
    this.uiContainer.querySelector('#component-properties').textContent = JSON.stringify(properties, null, 2);
    
    // Update the toggle button
    const toggleButton = this.uiContainer.querySelector('#toggle-component');
    
    if (properties.isOn !== undefined || properties.isRunning !== undefined) {
      toggleButton.style.display = 'block';
      const isActive = properties.isOn || properties.isRunning;
      toggleButton.textContent = isActive ? 'Turn Off' : 'Turn On';
    } else {
      toggleButton.style.display = 'none';
    }
  }
  
  /**
   * Toggle a component's state
   */
  async toggleComponent(id) {
    const component = this.components.find(c => c.id === id);
    
    if (!component) {
      return;
    }
    
    try {
      // Parse the properties
      const properties = JSON.parse(component.properties);
      
      // Toggle the state
      if (properties.isOn !== undefined) {
        properties.isOn = !properties.isOn;
      } else if (properties.isRunning !== undefined) {
        properties.isRunning = !properties.isRunning;
      } else {
        return;
      }
      
      // Update the component in the database
      await dbManager.query(
        'UPDATE components SET properties = ? WHERE id = ?',
        [JSON.stringify(properties), id]
      );
      
      // Reload components
      await this.loadComponents();
      
      // Re-select the component
      this.selectComponent(id);
    } catch (err) {
      console.error('Failed to toggle component:', err);
    }
  }
  
  /**
   * Delete a component
   */
  async deleteComponent(id) {
    if (!confirm('Are you sure you want to delete this component?')) {
      return;
    }
    
    try {
      await dbManager.query('DELETE FROM components WHERE id = ?', [id]);
      
      // Clear the selection if the deleted component was selected
      if (this.selectedComponentId === id) {
        this.selectedComponentId = null;
        
        // Hide the details
        const detailsContent = this.uiContainer.querySelector('.details-content');
        const emptyMessage = this.uiContainer.querySelector('.component-details .empty-message');
        
        detailsContent.style.display = 'none';
        emptyMessage.style.display = 'block';
      }
      
      // Reload components
      await this.loadComponents();
    } catch (err) {
      console.error('Failed to delete component:', err);
    }
  }
  
  /**
   * Add event listeners
   */
  addEventListeners() {
    // Toggle component
    this.uiContainer.querySelector('#toggle-component').addEventListener('click', () => {
      if (this.selectedComponentId) {
        this.toggleComponent(this.selectedComponentId);
      }
    });
    
    // Delete component
    this.uiContainer.querySelector('#delete-component').addEventListener('click', () => {
      if (this.selectedComponentId) {
        this.deleteComponent(this.selectedComponentId);
      }
    });
    
    // Listen for database changes
    dbManager.addEventListener('change', () => {
      this.loadComponents();
    });
    
    // Listen for connection changes
    dbManager.addEventListener('connect', () => {
      this.isConnected = true;
      this.updateConnectionStatus();
      this.loadComponents();
    });
    
    dbManager.addEventListener('disconnect', () => {
      this.isConnected = false;
      this.updateConnectionStatus();
    });
  }
}

// Export a function to initialize the UI
export function initDatabaseUI(container) {
  return new DatabaseUI(container);
}
