<template>
  <div class="vue-app">
    <header>
      <h1>Vue Renderer</h1>
      <div class="connection-status" :class="{ connected: isConnected }">
        {{ isConnected ? 'Connected' : 'Disconnected' }}
      </div>
    </header>

    <main>
      <section class="data-section">
        <h2>Shared Data Viewer</h2>
        
        <div class="namespace-controls">
          <input 
            v-model="namespace" 
            placeholder="Enter namespace"
            @keyup.enter="loadData"
          />
          <button @click="loadData" class="btn primary">Load Data</button>
        </div>

        <div v-if="!namespace" class="empty-state">
          Enter a namespace to load data
        </div>
        
        <div v-else-if="loading" class="loading">
          Loading data...
        </div>
        
        <div v-else-if="Object.keys(data).length === 0" class="empty-state">
          No data found in namespace "{{ namespace }}"
        </div>
        
        <div v-else class="data-container">
          <div 
            v-for="(value, key) in data" 
            :key="key"
            class="data-item"
          >
            <div class="data-key">{{ key }}</div>
            <div class="data-value">
              <pre>{{ formatValue(value) }}</pre>
            </div>
          </div>
        </div>
      </section>

      <section class="editor-section">
        <h2>Data Editor</h2>
        
        <div class="editor-form">
          <div class="form-group">
            <label for="dataKey">Key</label>
            <input 
              id="dataKey"
              v-model="newKey" 
              placeholder="Enter key"
            />
          </div>
          
          <div class="form-group">
            <label for="dataValue">Value</label>
            <textarea 
              id="dataValue"
              v-model="newValue" 
              placeholder="Enter value (string, number, or JSON)"
              rows="5"
            ></textarea>
          </div>
          
          <div class="form-actions">
            <button 
              @click="saveData" 
              class="btn primary"
              :disabled="!canSave"
            >
              Save Data
            </button>
            <button 
              @click="clearForm" 
              class="btn secondary"
            >
              Clear
            </button>
          </div>
        </div>
      </section>
    </main>

    <footer>
      <div class="client-info">
        <div>Client ID: {{ clientId || 'Not connected' }}</div>
        <div>Renderer Type: Vue</div>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'VueApp',
  data() {
    return {
      isConnected: false,
      clientId: null,
      wsConnection: null,
      namespace: '',
      data: {},
      loading: false,
      newKey: '',
      newValue: '',
      editingKey: null
    };
  },
  computed: {
    canSave() {
      return this.namespace && this.newKey && this.newValue;
    }
  },
  mounted() {
    this.connectWebSocket();
    
    // Listen for database changes
    window.electronAPI.onDbChanged((data) => {
      if (data.namespace === this.namespace) {
        this.loadData();
      }
    });
  },
  beforeUnmount() {
    if (this.wsConnection) {
      this.wsConnection.close();
    }
  },
  methods: {
    connectWebSocket() {
      try {
        this.wsConnection = window.wsAPI.connect();
        
        this.wsConnection.onOpen(() => {
          console.log('WebSocket connected');
          this.isConnected = true;
        });
        
        this.wsConnection.onMessage((data) => {
          console.log('WebSocket message received:', data);
          
          if (data.type === 'connection') {
            this.clientId = data.clientId;
            
            // Register as a Vue renderer
            this.wsConnection.send({
              type: 'register',
              title: 'Vue Data Viewer',
              type: 'vue'
            });
          } else if (data.type === 'db-changed') {
            if (data.namespace === this.namespace) {
              this.loadData();
            }
          }
        });
        
        this.wsConnection.onClose(() => {
          console.log('WebSocket disconnected');
          this.isConnected = false;
          this.clientId = null;
          
          // Try to reconnect after a delay
          setTimeout(() => {
            this.connectWebSocket();
          }, 3000);
        });
        
        this.wsConnection.onError((error) => {
          console.error('WebSocket error:', error);
          this.isConnected = false;
        });
      } catch (error) {
        console.error('Failed to connect to WebSocket server:', error);
        this.isConnected = false;
      }
    },
    
    async loadData() {
      if (!this.namespace) return;
      
      this.loading = true;
      
      try {
        const result = await window.electronAPI.dbGetAll(this.namespace);
        
        if (result.success) {
          this.data = result.values || {};
        } else {
          console.error('Failed to load data:', result.error);
          this.data = {};
        }
      } catch (error) {
        console.error('Error loading data:', error);
        this.data = {};
      } finally {
        this.loading = false;
      }
    },
    
    async saveData() {
      if (!this.canSave) return;
      
      try {
        // Parse value if it looks like JSON
        let parsedValue = this.newValue;
        try {
          if (this.newValue.trim().startsWith('{') || 
              this.newValue.trim().startsWith('[')) {
            parsedValue = JSON.parse(this.newValue);
          } else if (this.newValue === 'true' || this.newValue === 'false') {
            parsedValue = this.newValue === 'true';
          } else if (!isNaN(Number(this.newValue))) {
            parsedValue = Number(this.newValue);
          }
        } catch (e) {
          // If parsing fails, use the original string value
          console.warn('Could not parse value as JSON, using as string');
        }
        
        const result = await window.electronAPI.dbSet(
          this.namespace, 
          this.newKey, 
          parsedValue
        );
        
        if (result.success) {
          // Update local data
          this.data = {
            ...this.data,
            [this.newKey]: parsedValue
          };
          
          // Clear form
          this.clearForm();
        } else {
          console.error('Failed to save data:', result.error);
          window.electronAPI.showErrorDialog('Save Error', result.error);
        }
      } catch (error) {
        console.error('Error saving data:', error);
        window.electronAPI.showErrorDialog('Save Error', error.message);
      }
    },
    
    clearForm() {
      this.newKey = '';
      this.newValue = '';
      this.editingKey = null;
    },
    
    formatValue(value) {
      if (typeof value === 'object') {
        return JSON.stringify(value, null, 2);
      }
      return String(value);
    }
  }
};
</script>

<style>
/* Component styles will be in style.css */
</style>
