<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import dbClient, { DbChangeEvent } from '../shared/database-client'

// State
const users = ref<any[]>([])
const projects = ref<any[]>([])
const components = ref<any[]>([])
const selectedUserId = ref<number | null>(null)
const selectedProjectId = ref<number | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const newUser = ref({ name: '', email: '' })
const newProject = ref({ name: '', description: '' })
const newComponent = ref({ type: 'led', properties: '{"color":"red","isOn":false}', position_x: 100, position_y: 100 })
const componentTypes = ['led', 'motor', 'battery', 'resistor', 'capacitor', 'switch']

// Connect to the database when the component is mounted
onMounted(async () => {
  try {
    loading.value = true
    await dbClient.connect()
    
    // Register change listener
    dbClient.addChangeListener('vue-app', handleDatabaseChange)
    
    // Load initial data
    await loadUsers()
    loading.value = false
  } catch (err) {
    console.error('Failed to connect to database:', err)
    error.value = err instanceof Error ? err.message : String(err)
    loading.value = false
  }
})

// Disconnect from the database when the component is unmounted
onUnmounted(() => {
  dbClient.removeChangeListener('vue-app')
  dbClient.disconnect()
})

// Handle database change events
function handleDatabaseChange(event: DbChangeEvent) {
  console.log('Database changed:', event)
  
  // Reload data based on the operation
  if (event.operation.sql?.toLowerCase().includes('users')) {
    loadUsers()
  } else if (event.operation.sql?.toLowerCase().includes('projects')) {
    loadProjects(selectedUserId.value!)
  } else if (event.operation.sql?.toLowerCase().includes('components')) {
    loadComponents(selectedProjectId.value!)
  }
}

// Load users from the database
async function loadUsers() {
  try {
    users.value = await dbClient.all('SELECT * FROM users ORDER BY name')
    
    // If there's at least one user, select the first one
    if (users.value.length > 0 && !selectedUserId.value) {
      selectUser(users.value[0].id)
    }
  } catch (err) {
    console.error('Failed to load users:', err)
    error.value = err instanceof Error ? err.message : String(err)
  }
}

// Load projects for a user
async function loadProjects(userId: number) {
  try {
    projects.value = await dbClient.all(
      'SELECT * FROM projects WHERE user_id = ? ORDER BY name',
      [userId]
    )
    
    // If there's at least one project, select the first one
    if (projects.value.length > 0 && !selectedProjectId.value) {
      selectProject(projects.value[0].id)
    } else if (projects.value.length === 0) {
      components.value = []
      selectedProjectId.value = null
    }
  } catch (err) {
    console.error('Failed to load projects:', err)
    error.value = err instanceof Error ? err.message : String(err)
  }
}

// Load components for a project
async function loadComponents(projectId: number) {
  try {
    components.value = await dbClient.all(
      'SELECT * FROM components WHERE project_id = ? ORDER BY type',
      [projectId]
    )
  } catch (err) {
    console.error('Failed to load components:', err)
    error.value = err instanceof Error ? err.message : String(err)
  }
}

// Select a user
async function selectUser(userId: number) {
  selectedUserId.value = userId
  selectedProjectId.value = null
  components.value = []
  await loadProjects(userId)
}

// Select a project
async function selectProject(projectId: number) {
  selectedProjectId.value = projectId
  await loadComponents(projectId)
}

// Add a new user
async function addUser() {
  if (!newUser.value.name || !newUser.value.email) {
    error.value = 'Name and email are required'
    return
  }
  
  try {
    const result = await dbClient.query(
      'INSERT INTO users (name, email) VALUES (?, ?)',
      [newUser.value.name, newUser.value.email]
    )
    
    // Clear the form
    newUser.value = { name: '', email: '' }
    
    // Reload users
    await loadUsers()
  } catch (err) {
    console.error('Failed to add user:', err)
    error.value = err instanceof Error ? err.message : String(err)
  }
}

// Add a new project
async function addProject() {
  if (!newProject.value.name || !selectedUserId.value) {
    error.value = 'Name and user are required'
    return
  }
  
  try {
    const result = await dbClient.query(
      'INSERT INTO projects (name, description, user_id) VALUES (?, ?, ?)',
      [newProject.value.name, newProject.value.description, selectedUserId.value]
    )
    
    // Clear the form
    newProject.value = { name: '', description: '' }
    
    // Reload projects
    await loadProjects(selectedUserId.value)
  } catch (err) {
    console.error('Failed to add project:', err)
    error.value = err instanceof Error ? err.message : String(err)
  }
}

// Add a new component
async function addComponent() {
  if (!selectedProjectId.value) {
    error.value = 'Project is required'
    return
  }
  
  try {
    // Validate JSON properties
    let properties
    try {
      properties = JSON.parse(newComponent.value.properties)
    } catch (err) {
      error.value = 'Invalid JSON properties'
      return
    }
    
    const result = await dbClient.query(
      'INSERT INTO components (project_id, type, properties, position_x, position_y) VALUES (?, ?, ?, ?, ?)',
      [
        selectedProjectId.value,
        newComponent.value.type,
        newComponent.value.properties,
        newComponent.value.position_x,
        newComponent.value.position_y
      ]
    )
    
    // Reset form
    newComponent.value = { 
      type: 'led', 
      properties: '{"color":"red","isOn":false}', 
      position_x: 100, 
      position_y: 100 
    }
    
    // Reload components
    await loadComponents(selectedProjectId.value)
  } catch (err) {
    console.error('Failed to add component:', err)
    error.value = err instanceof Error ? err.message : String(err)
  }
}

// Update a component property
async function updateComponentProperty(component: any, isOn: boolean) {
  try {
    // Parse the properties
    const properties = JSON.parse(component.properties)
    
    // Update the isOn property
    properties.isOn = isOn
    
    // Update the component in the database
    await dbClient.query(
      'UPDATE components SET properties = ? WHERE id = ?',
      [JSON.stringify(properties), component.id]
    )
    
    // Reload components
    await loadComponents(selectedProjectId.value!)
  } catch (err) {
    console.error('Failed to update component:', err)
    error.value = err instanceof Error ? err.message : String(err)
  }
}

// Delete a component
async function deleteComponent(componentId: number) {
  try {
    await dbClient.query('DELETE FROM components WHERE id = ?', [componentId])
    
    // Reload components
    await loadComponents(selectedProjectId.value!)
  } catch (err) {
    console.error('Failed to delete component:', err)
    error.value = err instanceof Error ? err.message : String(err)
  }
}
</script>

<template>
  <div class="database-demo">
    <h2>SQLite Database Demo</h2>
    
    <div v-if="loading" class="loading">
      Loading...
    </div>
    
    <div v-if="error" class="error">
      Error: {{ error }}
      <button @click="error = null">Dismiss</button>
    </div>
    
    <div class="database-layout">
      <!-- Users Section -->
      <div class="section users-section">
        <h3>Users</h3>
        <ul class="list">
          <li 
            v-for="user in users" 
            :key="user.id" 
            :class="{ selected: selectedUserId === user.id }"
            @click="selectUser(user.id)"
          >
            <div class="item-name">{{ user.name }}</div>
            <div class="item-detail">{{ user.email }}</div>
          </li>
        </ul>
        
        <div class="form">
          <h4>Add User</h4>
          <div class="form-field">
            <label>Name:</label>
            <input v-model="newUser.name" type="text" placeholder="Name" />
          </div>
          <div class="form-field">
            <label>Email:</label>
            <input v-model="newUser.email" type="email" placeholder="Email" />
          </div>
          <button @click="addUser">Add User</button>
        </div>
      </div>
      
      <!-- Projects Section -->
      <div class="section projects-section">
        <h3>Projects</h3>
        <ul class="list" v-if="selectedUserId">
          <li 
            v-for="project in projects" 
            :key="project.id" 
            :class="{ selected: selectedProjectId === project.id }"
            @click="selectProject(project.id)"
          >
            <div class="item-name">{{ project.name }}</div>
            <div class="item-detail">{{ project.description }}</div>
          </li>
          <li v-if="projects.length === 0" class="empty">No projects found</li>
        </ul>
        <div v-else class="empty">Select a user to view projects</div>
        
        <div class="form" v-if="selectedUserId">
          <h4>Add Project</h4>
          <div class="form-field">
            <label>Name:</label>
            <input v-model="newProject.name" type="text" placeholder="Name" />
          </div>
          <div class="form-field">
            <label>Description:</label>
            <textarea v-model="newProject.description" placeholder="Description"></textarea>
          </div>
          <button @click="addProject">Add Project</button>
        </div>
      </div>
      
      <!-- Components Section -->
      <div class="section components-section">
        <h3>Components</h3>
        <ul class="list" v-if="selectedProjectId">
          <li v-for="component in components" :key="component.id" class="component-item">
            <div class="component-header">
              <div class="item-name">{{ component.type }}</div>
              <button class="delete-btn" @click="deleteComponent(component.id)">Delete</button>
            </div>
            <div class="component-properties">
              <pre>{{ JSON.stringify(JSON.parse(component.properties), null, 2) }}</pre>
              <div v-if="JSON.parse(component.properties).isOn !== undefined" class="toggle">
                <label>
                  <input 
                    type="checkbox" 
                    :checked="JSON.parse(component.properties).isOn" 
                    @change="(e) => updateComponentProperty(component, (e.target as HTMLInputElement).checked)"
                  />
                  Toggle State
                </label>
              </div>
            </div>
            <div class="component-position">
              Position: ({{ component.position_x }}, {{ component.position_y }})
            </div>
          </li>
          <li v-if="components.length === 0" class="empty">No components found</li>
        </ul>
        <div v-else class="empty">Select a project to view components</div>
        
        <div class="form" v-if="selectedProjectId">
          <h4>Add Component</h4>
          <div class="form-field">
            <label>Type:</label>
            <select v-model="newComponent.type">
              <option v-for="type in componentTypes" :key="type" :value="type">
                {{ type }}
              </option>
            </select>
          </div>
          <div class="form-field">
            <label>Properties (JSON):</label>
            <textarea v-model="newComponent.properties" placeholder="JSON Properties"></textarea>
          </div>
          <div class="form-field">
            <label>Position X:</label>
            <input v-model.number="newComponent.position_x" type="number" />
          </div>
          <div class="form-field">
            <label>Position Y:</label>
            <input v-model.number="newComponent.position_y" type="number" />
          </div>
          <button @click="addComponent">Add Component</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.database-demo {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.loading {
  padding: 20px;
  text-align: center;
  font-style: italic;
}

.error {
  background-color: #ffebee;
  color: #c62828;
  padding: 10px;
  margin-bottom: 20px;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.database-layout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.section {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h3 {
  margin-top: 0;
  border-bottom: 1px solid #ddd;
  padding-bottom: 10px;
}

.list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 300px;
  overflow-y: auto;
}

.list li {
  padding: 10px;
  border-bottom: 1px solid #ddd;
  cursor: pointer;
}

.list li:hover {
  background-color: #e0e0e0;
}

.list li.selected {
  background-color: #e3f2fd;
}

.item-name {
  font-weight: bold;
}

.item-detail {
  font-size: 0.9em;
  color: #666;
  margin-top: 5px;
}

.empty {
  padding: 20px;
  text-align: center;
  font-style: italic;
  color: #999;
}

.form {
  margin-top: 20px;
  border-top: 1px solid #ddd;
  padding-top: 15px;
}

.form h4 {
  margin-top: 0;
}

.form-field {
  margin-bottom: 10px;
}

.form-field label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-field input,
.form-field textarea,
.form-field select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-field textarea {
  height: 80px;
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

.error button {
  background-color: #c62828;
}

.error button:hover {
  background-color: #b71c1c;
}

.component-item {
  background-color: #fff;
  border-radius: 4px;
  margin-bottom: 10px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.component-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.component-properties {
  background-color: #f9f9f9;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
  font-family: monospace;
  font-size: 0.9em;
}

.component-properties pre {
  margin: 0;
  white-space: pre-wrap;
}

.component-position {
  font-size: 0.9em;
  color: #666;
}

.toggle {
  margin-top: 10px;
}

.delete-btn {
  background-color: #f44336;
  font-size: 0.8em;
  padding: 4px 8px;
}

.delete-btn:hover {
  background-color: #d32f2f;
}
</style>
