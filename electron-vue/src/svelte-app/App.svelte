<script>
  import { onMount, onDestroy } from 'svelte/internal';
  
  // State variables
  let isConnected = false;
  let clientId = null;
  let wsConnection = null;
  let namespace = 'svelte-data';
  let dataEntries = [];
  let loading = false;
  let error = null;
  
  // Form state for creating/editing data
  let editMode = false;
  let editId = null;
  let formKey = '';
  let formValue = '';
  
  // WebSocket connection
  function connectWebSocket() {
    try {
      wsConnection = window.wsAPI.connect();
      
      wsConnection.onOpen(() => {
        console.log('WebSocket connected');
        isConnected = true;
      });
      
      wsConnection.onMessage((data) => {
        console.log('WebSocket message received:', data);
        
        if (data.type === 'connection') {
          clientId = data.clientId;
          
          // Register as a Svelte renderer
          wsConnection.send({
            type: 'register',
            title: 'Svelte Data Explorer',
            type: 'svelte'
          });
        } else if (data.type === 'db-changed') {
          if (data.namespace === namespace) {
            loadData();
          }
        }
      });
      
      wsConnection.onClose(() => {
        console.log('WebSocket disconnected');
        isConnected = false;
        clientId = null;
        
        // Try to reconnect after a delay
        setTimeout(() => {
          connectWebSocket();
        }, 3000);
      });
      
      wsConnection.onError((err) => {
        console.error('WebSocket error:', err);
        isConnected = false;
        error = 'Connection error';
      });
    } catch (err) {
      console.error('Failed to connect to WebSocket server:', err);
      isConnected = false;
      error = 'Connection failed';
    }
  }
  
  // Load data from the database
  async function loadData() {
    loading = true;
    error = null;
    
    try {
      const result = await window.electronAPI.dbGetAll(namespace);
      
      if (result.success) {
        // Convert object to array of entries for easier rendering in Svelte
        dataEntries = Object.entries(result.values || {}).map(([key, value]) => ({
          key,
          value,
          type: typeof value,
          displayValue: formatValue(value)
        }));
      } else {
        console.error('Failed to load data:', result.error);
        error = result.error;
        dataEntries = [];
      }
    } catch (err) {
      console.error('Error loading data:', err);
      error = err.message;
      dataEntries = [];
    } finally {
      loading = false;
    }
  }
  
  // Format value for display
  function formatValue(value) {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  }
  
  // Parse form value based on content
  function parseValue(input) {
    try {
      if (input.trim().startsWith('{') || input.trim().startsWith('[')) {
        return JSON.parse(input);
      } else if (input === 'true' || input === 'false') {
        return input === 'true';
      } else if (!isNaN(Number(input))) {
        return Number(input);
      }
    } catch (err) {
      console.warn('Could not parse value as JSON, using as string');
    }
    return input;
  }
  
  // Save data to database
  async function saveData() {
    if (!formKey) return;
    
    try {
      const parsedValue = parseValue(formValue);
      
      const result = await window.electronAPI.dbSet(
        namespace,
        formKey,
        parsedValue
      );
      
      if (result.success) {
        // Reset form
        formKey = '';
        formValue = '';
        editMode = false;
        editId = null;
        
        // Reload data
        await loadData();
      } else {
        console.error('Failed to save data:', result.error);
        error = result.error;
      }
    } catch (err) {
      console.error('Error saving data:', err);
      error = err.message;
    }
  }
  
  // Delete data from database
  async function deleteData(key) {
    try {
      const result = await window.electronAPI.dbDelete(namespace, key);
      
      if (result.success) {
        // Reload data
        await loadData();
      } else {
        console.error('Failed to delete data:', result.error);
        error = result.error;
      }
    } catch (err) {
      console.error('Error deleting data:', err);
      error = err.message;
    }
  }
  
  // Edit existing data
  function editData(entry) {
    editMode = true;
    editId = entry.key;
    formKey = entry.key;
    formValue = entry.displayValue;
  }
  
  // Reset form
  function resetForm() {
    editMode = false;
    editId = null;
    formKey = '';
    formValue = '';
    error = null;
  }
  
  // Initialize on component mount
  onMount(() => {
    connectWebSocket();
    loadData();
    
    // Set up listener for database changes
    const unsubscribe = window.electronAPI.onDbChanged((data) => {
      if (data.namespace === namespace) {
        loadData();
      }
    });
    
    return () => {
      unsubscribe();
    };
  });
  
  // Clean up on component destroy
  onDestroy(() => {
    if (wsConnection) {
      wsConnection.close();
    }
  });
</script>

<main class="svelte-app">
  <header>
    <h1>Svelte Data Explorer</h1>
    <div class="connection-status" class:connected={isConnected}>
      {isConnected ? 'Connected' : 'Disconnected'}
    </div>
  </header>
  
  <div class="content">
    <section class="data-section">
      <div class="section-header">
        <h2>Data Explorer</h2>
        <div class="namespace-control">
          <input 
            type="text" 
            bind:value={namespace} 
            placeholder="Namespace"
          />
          <button on:click={loadData} class="btn primary">Load</button>
        </div>
      </div>
      
      {#if error}
        <div class="error-message">
          <p>{error}</p>
          <button on:click={() => error = null} class="btn small">Dismiss</button>
        </div>
      {/if}
      
      {#if loading}
        <div class="loading">Loading data...</div>
      {:else if dataEntries.length === 0}
        <div class="empty-state">
          <p>No data found in namespace "{namespace}"</p>
        </div>
      {:else}
        <div class="data-list">
          {#each dataEntries as entry (entry.key)}
            <div class="data-card">
              <div class="data-header">
                <h3>{entry.key}</h3>
                <div class="data-type">{entry.type}</div>
              </div>
              <div class="data-content">
                <pre>{entry.displayValue}</pre>
              </div>
              <div class="data-actions">
                <button on:click={() => editData(entry)} class="btn small secondary">Edit</button>
                <button on:click={() => deleteData(entry.key)} class="btn small danger">Delete</button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </section>
    
    <section class="form-section">
      <h2>{editMode ? 'Edit Data' : 'Create New Data'}</h2>
      
      <div class="form">
        <div class="form-group">
          <label for="key">Key</label>
          <input 
            id="key" 
            type="text" 
            bind:value={formKey} 
            disabled={editMode}
            placeholder="Enter key"
          />
        </div>
        
        <div class="form-group">
          <label for="value">Value</label>
          <textarea 
            id="value" 
            bind:value={formValue} 
            placeholder="Enter value (string, number, or JSON)"
            rows="6"
          ></textarea>
        </div>
        
        <div class="form-actions">
          <button 
            on:click={saveData} 
            class="btn primary" 
            disabled={!formKey || !formValue}
          >
            {editMode ? 'Update' : 'Save'}
          </button>
          
          <button on:click={resetForm} class="btn secondary">
            {editMode ? 'Cancel' : 'Clear'}
          </button>
        </div>
      </div>
    </section>
  </div>
  
  <footer>
    <div class="client-info">
      <div>Client ID: {clientId || 'Not connected'}</div>
      <div>Renderer Type: Svelte</div>
    </div>
  </footer>
</main>

<style>
  /* Styles will be in the separate CSS file */
</style>
