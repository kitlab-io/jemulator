/**
 * Manages the UI for the Three.js app
 */
export class UIManager {
  /**
   * Create a new UI manager
   * @param {HTMLElement} container - The container element for the UI
   * @param {Function} onNamespaceChange - Callback for namespace changes
   * @param {Function} onDataChange - Callback for data changes
   */
  constructor(container, onNamespaceChange, onDataChange) {
    this.container = container;
    this.onNamespaceChange = onNamespaceChange;
    this.onDataChange = onDataChange;
    
    // Create UI elements
    this.createUI();
  }
  
  /**
   * Create the UI elements
   */
  createUI() {
    // Create the UI container
    this.container.innerHTML = `
      <div class="ui-panel">
        <div class="header">
          <h1>Three.js Data Visualizer</h1>
          <div class="connection-status">
            <span class="status-indicator"></span>
            <span class="status-text">Disconnected</span>
          </div>
        </div>
        
        <div class="controls-section">
          <div class="namespace-control">
            <label for="namespace-input">Data Namespace:</label>
            <div class="input-group">
              <input type="text" id="namespace-input" value="threejs-visualization" />
              <button id="load-btn" class="btn primary">Load</button>
            </div>
          </div>
          
          <div id="error-message" class="error-message" style="display: none;"></div>
          
          <div id="loading-indicator" class="loading-indicator" style="display: none;">
            <div class="spinner"></div>
            <span>Loading data...</span>
          </div>
        </div>
        
        <div class="data-section">
          <h2>Data Controls</h2>
          <div class="data-form">
            <div class="form-group">
              <label for="data-key-input">Key:</label>
              <input type="text" id="data-key-input" placeholder="Enter data key" />
            </div>
            
            <div class="form-group">
              <label for="data-type-select">Type:</label>
              <select id="data-type-select">
                <option value="number">Number</option>
                <option value="string">String</option>
                <option value="boolean">Boolean</option>
                <option value="object">Object/Array</option>
              </select>
            </div>
            
            <div class="form-group" id="number-input-group">
              <label for="number-input">Value:</label>
              <input type="number" id="number-input" value="0" step="1" />
            </div>
            
            <div class="form-group" id="string-input-group" style="display: none;">
              <label for="string-input">Value:</label>
              <input type="text" id="string-input" value="" />
            </div>
            
            <div class="form-group" id="boolean-input-group" style="display: none;">
              <label for="boolean-input">Value:</label>
              <select id="boolean-input">
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            </div>
            
            <div class="form-group" id="object-input-group" style="display: none;">
              <label for="object-input">Value (JSON):</label>
              <textarea id="object-input" rows="4">{}</textarea>
            </div>
            
            <div class="form-actions">
              <button id="save-btn" class="btn primary">Save Data</button>
              <button id="reset-btn" class="btn secondary">Reset</button>
            </div>
          </div>
        </div>
        
        <div class="data-display">
          <h2>Current Data</h2>
          <div id="data-items" class="data-items">
            <div class="empty-state">No data available</div>
          </div>
        </div>
        
        <div class="footer">
          <div class="client-info">
            <div>Client ID: <span id="client-id">Not connected</span></div>
            <div>Renderer Type: Three.js</div>
          </div>
        </div>
      </div>
    `;
    
    // Get UI elements
    this.namespaceInput = document.getElementById('namespace-input');
    this.loadBtn = document.getElementById('load-btn');
    this.errorMessage = document.getElementById('error-message');
    this.loadingIndicator = document.getElementById('loading-indicator');
    this.dataKeyInput = document.getElementById('data-key-input');
    this.dataTypeSelect = document.getElementById('data-type-select');
    this.numberInputGroup = document.getElementById('number-input-group');
    this.stringInputGroup = document.getElementById('string-input-group');
    this.booleanInputGroup = document.getElementById('boolean-input-group');
    this.objectInputGroup = document.getElementById('object-input-group');
    this.numberInput = document.getElementById('number-input');
    this.stringInput = document.getElementById('string-input');
    this.booleanInput = document.getElementById('boolean-input');
    this.objectInput = document.getElementById('object-input');
    this.saveBtn = document.getElementById('save-btn');
    this.resetBtn = document.getElementById('reset-btn');
    this.dataItems = document.getElementById('data-items');
    this.clientIdElement = document.getElementById('client-id');
    this.connectionStatus = document.querySelector('.connection-status');
    this.statusText = document.querySelector('.status-text');
    
    // Add event listeners
    this.loadBtn.addEventListener('click', () => {
      const namespace = this.namespaceInput.value.trim();
      if (namespace) {
        this.onNamespaceChange(namespace);
      }
    });
    
    this.dataTypeSelect.addEventListener('change', () => {
      this.updateValueInputVisibility();
    });
    
    this.saveBtn.addEventListener('click', () => {
      this.saveData();
    });
    
    this.resetBtn.addEventListener('click', () => {
      this.resetForm();
    });
    
    // Initialize value input visibility
    this.updateValueInputVisibility();
  }
  
  /**
   * Update the visibility of value input fields based on selected type
   */
  updateValueInputVisibility() {
    const selectedType = this.dataTypeSelect.value;
    
    this.numberInputGroup.style.display = selectedType === 'number' ? 'block' : 'none';
    this.stringInputGroup.style.display = selectedType === 'string' ? 'block' : 'none';
    this.booleanInputGroup.style.display = selectedType === 'boolean' ? 'block' : 'none';
    this.objectInputGroup.style.display = selectedType === 'object' ? 'block' : 'none';
  }
  
  /**
   * Save data to the database
   */
  saveData() {
    const key = this.dataKeyInput.value.trim();
    if (!key) {
      this.showError('Key is required');
      return;
    }
    
    let value;
    const type = this.dataTypeSelect.value;
    
    try {
      switch (type) {
        case 'number':
          value = parseFloat(this.numberInput.value);
          break;
        case 'string':
          value = this.stringInput.value;
          break;
        case 'boolean':
          value = this.booleanInput.value === 'true';
          break;
        case 'object':
          value = JSON.parse(this.objectInput.value);
          break;
      }
      
      this.onDataChange(key, value);
      this.resetForm();
    } catch (error) {
      this.showError(`Invalid value: ${error.message}`);
    }
  }
  
  /**
   * Reset the form
   */
  resetForm() {
    this.dataKeyInput.value = '';
    this.numberInput.value = '0';
    this.stringInput.value = '';
    this.booleanInput.value = 'true';
    this.objectInput.value = '{}';
    this.hideError();
  }
  
  /**
   * Update the connection status
   * @param {boolean} connected - Whether the connection is established
   * @param {string} clientId - The client ID
   */
  updateConnectionStatus(connected, clientId = null) {
    if (connected) {
      this.connectionStatus.classList.add('connected');
      this.statusText.textContent = 'Connected';
      if (clientId) {
        this.clientIdElement.textContent = clientId;
      }
    } else {
      this.connectionStatus.classList.remove('connected');
      this.statusText.textContent = 'Disconnected';
      this.clientIdElement.textContent = 'Not connected';
    }
  }
  
  /**
   * Show an error message
   * @param {string} message - The error message
   */
  showError(message) {
    this.errorMessage.textContent = message;
    this.errorMessage.style.display = 'block';
    
    // Hide after 5 seconds
    setTimeout(() => {
      this.hideError();
    }, 5000);
  }
  
  /**
   * Hide the error message
   */
  hideError() {
    this.errorMessage.style.display = 'none';
  }
  
  /**
   * Set the loading state
   * @param {boolean} isLoading - Whether data is being loaded
   */
  setLoading(isLoading) {
    this.loadingIndicator.style.display = isLoading ? 'flex' : 'none';
  }
  
  /**
   * Update the data display
   * @param {Object} data - The data to display
   */
  updateDataDisplay(data) {
    // Clear existing data items
    this.dataItems.innerHTML = '';
    
    if (Object.keys(data).length === 0) {
      this.dataItems.innerHTML = '<div class="empty-state">No data available</div>';
      return;
    }
    
    // Create data items
    for (const [key, value] of Object.entries(data)) {
      const type = typeof value;
      let displayValue = '';
      
      if (type === 'object') {
        displayValue = JSON.stringify(value, null, 2);
      } else {
        displayValue = String(value);
      }
      
      const dataItem = document.createElement('div');
      dataItem.className = 'data-item';
      dataItem.innerHTML = `
        <div class="data-item-header">
          <div class="data-key">${key}</div>
          <div class="data-type">${type}</div>
          <button class="btn small delete-btn" data-key="${key}">Delete</button>
        </div>
        <div class="data-value">
          <pre>${displayValue}</pre>
        </div>
      `;
      
      // Add delete button event listener
      const deleteBtn = dataItem.querySelector('.delete-btn');
      deleteBtn.addEventListener('click', () => {
        this.onDataChange(key, undefined); // undefined to delete
      });
      
      this.dataItems.appendChild(dataItem);
    }
  }
}
