<template>
  <div class="app-container">
    <header class="app-header">
      <h1>Multi-Renderer Control Panel</h1>
      <div class="actions">
        <button @click="launchVueApp" class="btn vue-btn">Launch Vue App</button>
        <button @click="launchSvelteApp" class="btn svelte-btn">Launch Svelte App</button>
        <button @click="launchThreeJsApp" class="btn threejs-btn">Launch Three.js App</button>
      </div>
    </header>

    <main class="main-content">
      <section class="renderers-section">
        <h2>Active Renderers</h2>
        <div v-if="renderers.length === 0" class="no-renderers">
          No active renderers. Launch a new renderer using the buttons above.
        </div>
        <ul v-else class="renderer-list">
          <li v-for="renderer in renderers" :key="renderer.id" class="renderer-item">
            <div class="renderer-info">
              <span class="renderer-title">{{ renderer.title }}</span>
              <span class="renderer-type" :class="renderer.type">{{ renderer.type }}</span>
              <span class="renderer-id">ID: {{ renderer.id }}</span>
              <span class="renderer-created">Created: {{ formatDate(renderer.createdAt) }}</span>
            </div>
            <button @click="closeRenderer(renderer.id)" class="close-btn">Close</button>
          </li>
        </ul>
      </section>

      <section class="shared-data-section">
        <h2>Shared Database</h2>
        <div class="data-controls">
          <div class="namespace-selector">
            <label for="namespace">Namespace:</label>
            <input 
              id="namespace" 
              v-model="currentNamespace" 
              placeholder="Enter namespace"
              @keyup.enter="loadNamespaceData"
            />
            <button @click="loadNamespaceData" class="btn">Load Data</button>
          </div>
          
          <div class="data-editor">
            <div class="key-value-editor">
              <input 
                v-model="newDataKey" 
                placeholder="Key" 
                class="key-input"
              />
              <input 
                v-model="newDataValue" 
                placeholder="Value" 
                class="value-input"
              />
              <button @click="saveData" class="btn save-btn" :disabled="!canSaveData">Save</button>
            </div>
          </div>
        </div>

        <div class="data-display">
          <div v-if="!currentNamespace" class="no-data">
            Enter a namespace to view and edit shared data.
          </div>
          <div v-else-if="Object.keys(namespaceData).length === 0" class="no-data">
            No data found in namespace "{{ currentNamespace }}".
          </div>
          <table v-else class="data-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Value</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(value, key) in namespaceData" :key="key">
                <td>{{ key }}</td>
                <td>{{ typeof value === 'object' ? JSON.stringify(value) : value }}</td>
                <td>
                  <button @click="editData(key, value)" class="btn edit-btn">Edit</button>
                  <button @click="deleteData(key)" class="btn delete-btn">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>

    <footer class="app-footer">
      <div class="connection-status" :class="{ connected: isConnected }">
        WebSocket: {{ isConnected ? 'Connected' : 'Disconnected' }}
      </div>
      <div class="client-id" v-if="clientId">
        Client ID: {{ clientId }}
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      renderers: [],
      isConnected: false,
      clientId: null,
      wsConnection: null,
      currentNamespace: '',
      namespaceData: {},
      newDataKey: '',
      newDataValue: '',
      editingKey: null
    };
  },
  computed: {
    canSaveData() {
      return this.currentNamespace && this.newDataKey && this.newDataValue;
    }
  },
  mounted() {
    this.connectWebSocket();
    this.loadRenderers();
    
    // Set up event listener for database changes
    window.electronAPI.onDbChanged((data) => {
      if (data.namespace === this.currentNamespace) {
        this.loadNamespaceData();
      }
    });
  },
  beforeUnmount() {
    if (this.wsConnection) {
      this.wsConnection.close();
    }
  },
  methods: {
    async connectWebSocket() {
      try {
        this.wsConnection = window.wsAPI.connect();
        
        this.wsConnection.onOpen(() => {
          console.log('WebSocket connected');
          this.isConnected = true;
          
          // Register as a renderer
          this.wsConnection.send({
            type: 'register',
            title: 'Control Panel',
            type: 'vue'
          });
        });
        
        this.wsConnection.onMessage((data) => {
          console.log('WebSocket message received:', data);
          
          if (data.type === 'connection') {
            this.clientId = data.clientId;
          } else if (data.type === 'register' && data.status === 'success') {
            console.log('Registered with WebSocket server:', data);
          } else if (data.type === 'db-changed') {
            if (data.namespace === this.currentNamespace) {
              this.loadNamespaceData();
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
    
    async loadRenderers() {
      try {
        this.renderers = await window.electronAPI.getRenderers();
      } catch (error) {
        console.error('Failed to load renderers:', error);
      }
    },
    
    async launchVueApp() {
      try {
        const result = await window.electronAPI.createRenderer('vue', {
          title: 'Vue Data Explorer',
          width: 800,
          height: 600
        });
        
        if (result.success) {
          await this.loadRenderers();
        } else {
          console.error('Failed to launch Vue app:', result.error);
        }
      } catch (error) {
        console.error('Error launching Vue app:', error);
      }
    },
    
    async launchSvelteApp() {
      try {
        const result = await window.electronAPI.createRenderer('svelte', {
          title: 'Svelte Data Explorer',
          width: 800,
          height: 600
        });
        
        if (result.success) {
          await this.loadRenderers();
        } else {
          console.error('Failed to launch Svelte app:', result.error);
        }
      } catch (error) {
        console.error('Error launching Svelte app:', error);
      }
    },
    
    async launchThreeJsApp() {
      try {
        const result = await window.electronAPI.createRenderer('threejs', {
          title: 'Three.js Visualizer',
          width: 1024,
          height: 768
        });
        
        if (result.success) {
          await this.loadRenderers();
        } else {
          console.error('Failed to launch Three.js app:', result.error);
        }
      } catch (error) {
        console.error('Error launching Three.js app:', error);
      }
    },
    
    async closeRenderer(id) {
      try {
        const result = await window.electronAPI.closeRenderer(id);
        
        if (result.success) {
          this.renderers = this.renderers.filter(r => r.id !== id);
        }
      } catch (error) {
        console.error(`Failed to close renderer ${id}:`, error);
      }
    },
    
    async loadNamespaceData() {
      if (!this.currentNamespace) return;
      
      try {
        const result = await window.electronAPI.dbGetAll(this.currentNamespace);
        
        if (result.success) {
          this.namespaceData = result.values || {};
        } else {
          console.error('Failed to load namespace data:', result.error);
          this.namespaceData = {};
        }
      } catch (error) {
        console.error('Error loading namespace data:', error);
        this.namespaceData = {};
      }
    },
    
    async saveData() {
      if (!this.canSaveData) return;
      
      try {
        // Parse value if it looks like JSON
        let parsedValue = this.newDataValue;
        try {
          if (this.newDataValue.trim().startsWith('{') || 
              this.newDataValue.trim().startsWith('[')) {
            parsedValue = JSON.parse(this.newDataValue);
          } else if (this.newDataValue === 'true' || this.newDataValue === 'false') {
            parsedValue = this.newDataValue === 'true';
          } else if (!isNaN(Number(this.newDataValue))) {
            parsedValue = Number(this.newDataValue);
          }
        } catch (e) {
          // If parsing fails, use the original string value
          console.warn('Could not parse value as JSON, using as string');
        }
        
        const result = await window.electronAPI.dbSet(
          this.currentNamespace, 
          this.newDataKey, 
          parsedValue
        );
        
        if (result.success) {
          // Update local data
          this.namespaceData = {
            ...this.namespaceData,
            [this.newDataKey]: parsedValue
          };
          
          // Clear input fields
          this.newDataKey = '';
          this.newDataValue = '';
          this.editingKey = null;
        } else {
          console.error('Failed to save data:', result.error);
        }
      } catch (error) {
        console.error('Error saving data:', error);
      }
    },
    
    editData(key, value) {
      this.editingKey = key;
      this.newDataKey = key;
      this.newDataValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    },
    
    async deleteData(key) {
      try {
        const result = await window.electronAPI.dbDelete(this.currentNamespace, key);
        
        if (result.success) {
          // Update local data
          const updatedData = { ...this.namespaceData };
          delete updatedData[key];
          this.namespaceData = updatedData;
          
          // Clear input fields if we were editing this key
          if (this.editingKey === key) {
            this.newDataKey = '';
            this.newDataValue = '';
            this.editingKey = null;
          }
        } else {
          console.error('Failed to delete data:', result.error);
        }
      } catch (error) {
        console.error('Error deleting data:', error);
      }
    },
    
    formatDate(dateString) {
      if (!dateString) return 'Unknown';
      
      try {
        const date = new Date(dateString);
        return date.toLocaleString();
      } catch (error) {
        return dateString;
      }
    }
  }
};
</script>

<style>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family: Arial, sans-serif;
  color: #333;
}

.app-header {
  background-color: #2c3e50;
  color: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.main-content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.renderers-section, .shared-data-section {
  background-color: #f5f5f5;
  border-radius: 4px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h2 {
  margin-top: 0;
  color: #2c3e50;
  font-size: 1.2rem;
  border-bottom: 1px solid #ddd;
  padding-bottom: 0.5rem;
}

.no-renderers, .no-data {
  color: #666;
  font-style: italic;
  padding: 1rem 0;
}

.renderer-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.renderer-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px solid #eee;
}

.renderer-item:last-child {
  border-bottom: none;
}

.renderer-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.renderer-title {
  font-weight: bold;
}

.renderer-type {
  font-size: 0.8rem;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  display: inline-block;
  width: fit-content;
}

.renderer-type.vue {
  background-color: #42b883;
  color: white;
}

.renderer-type.svelte {
  background-color: #ff3e00;
  color: white;
}

.renderer-type.threejs {
  background-color: #049ef4;
  color: white;
}

.renderer-id, .renderer-created {
  font-size: 0.8rem;
  color: #666;
}

.data-controls {
  margin-bottom: 1rem;
}

.namespace-selector {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 1rem;
}

.namespace-selector input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.key-value-editor {
  display: flex;
  gap: 0.5rem;
}

.key-input {
  width: 30%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.value-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th, .data-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.data-table th {
  background-color: #f0f0f0;
  font-weight: bold;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.vue-btn {
  background-color: #42b883;
  color: white;
}

.svelte-btn {
  background-color: #ff3e00;
  color: white;
}

.threejs-btn {
  background-color: #049ef4;
  color: white;
}

.save-btn {
  background-color: #4caf50;
  color: white;
}

.edit-btn {
  background-color: #2196f3;
  color: white;
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
}

.delete-btn {
  background-color: #f44336;
  color: white;
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
}

.close-btn {
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
}

.app-footer {
  background-color: #f5f5f5;
  padding: 0.5rem 1rem;
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  border-top: 1px solid #ddd;
}

.connection-status {
  display: flex;
  align-items: center;
  color: #f44336;
}

.connection-status.connected {
  color: #4caf50;
}

.connection-status::before {
  content: '';
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 0.5rem;
  background-color: currentColor;
}

.client-id {
  color: #666;
}
</style>
