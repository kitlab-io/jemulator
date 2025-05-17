<script setup lang="ts">
import { ref } from 'vue'
import HelloWorld from './components/HelloWorld.vue'
import DatabaseDemo from './components/DatabaseDemo.vue'

// Function to open the React app window
const openReactWindow = () => {
  // Send IPC message to main process to open React window
  window.ipcRenderer.invoke('open-app-window', {
    appType: 'react',
    appPath: '',
    context: {}
  })
}

// Function to open the Needle JS app window
const openNeedleWindow = () => {
  // Send IPC message to main process to open Needle JS window
  window.ipcRenderer.invoke('open-app-window', {
    appType: 'needle',
    appPath: '',
    context: {}
  })
}

// Function to open specific Needle app variant with context
const openNeedleVariant = (variant: string, context: any = {}) => {
  // Send IPC message to main process with app variant and context
  window.ipcRenderer.invoke('open-app-window', {
    appType: 'needle',
    appPath: variant,
    context
  })
}

// Function to open the Threlte app window
const openThrelteWindow = () => {
  // Send IPC message to main process to open Threlte window
  window.ipcRenderer.invoke('open-threlte-window')
}

// Function to open specific Threlte app variant with context
const openThrelteVariant = (variant: string, context: any = {}) => {
  // Send IPC message to main process with app variant and context
  window.ipcRenderer.invoke('open-app-window', {
    appType: 'threlte',
    appPath: variant,
    context
  })
}

// Function to open the RenJS demo window
const openRenjsWindow = () => {
  // Send IPC message to main process to open RenJS window
  window.ipcRenderer.invoke('open-renjs-window')
}

// Function to open specific RenJS app variant with context
const openRenjsVariant = (variant: string, context: any = {}) => {
  // Send IPC message to main process with app variant and context
  window.ipcRenderer.invoke('open-app-window', {
    appType: 'renjs',
    appPath: variant,
    context
  })
}

// Status messages
const reactWindowStatus = ref('')
const needleWindowStatus = ref('')
const threlteWindowStatus = ref('')
const renjsWindowStatus = ref('')

// Listen for status updates from main process
window.ipcRenderer.on('react-window-status', (_event, status) => {
  reactWindowStatus.value = status
})

window.ipcRenderer.on('needle-window-status', (_event, status) => {
  needleWindowStatus.value = status
})

window.ipcRenderer.on('threlte-window-status', (_event, status) => {
  threlteWindowStatus.value = status
})

window.ipcRenderer.on('renjs-window-status', (_event, status) => {
  renjsWindowStatus.value = status
})

// Sample context data for vehicle controller
const vehicleControllerContext = {
  physics: {
    gravity: -9.81,
    friction: 0.5,
    restitution: 0.2
  },
  vehicle: {
    mass: 1200,
    wheelBase: 2.5,
    trackWidth: 1.8,
    maxSpeed: 150,
    acceleration: 5.0
  }
}
</script>

<template>
  <div>
    <a href="https://www.electronjs.org/" target="_blank">
      <img src="./assets/electron.svg" class="logo electron" alt="Electron logo" />
    </a>
    <a href="https://vitejs.dev/" target="_blank">
      <img src="./assets/vite.svg" class="logo" alt="Vite logo" />
    </a>
    <a href="https://vuejs.org/" target="_blank">
      <img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />
    </a>
  </div>
  <HelloWorld msg="Electron + Vite + Vue" />
  
  <!-- React Window Button Section -->
  <div class="react-window-section">
    <h2>Open React App Window</h2>
    <button @click="openReactWindow" class="open-react-button">
      Launch React App Window
    </button>
    <p v-if="reactWindowStatus" class="status-message">{{ reactWindowStatus }}</p>
  </div>
  
  <!-- Needle JS Window Button Section -->
  <div class="needle-window-section">
    <h2>Open Needle JS App Window</h2>
    <button @click="openNeedleWindow" class="open-needle-button">
      Launch Needle JS App Window
    </button>
    <p v-if="needleWindowStatus" class="status-message">{{ needleWindowStatus }}</p>
  </div>
  
  <!-- Threlte Window Button Section -->
  <div class="threlte-window-section">
    <h2>Open Threlte App Window</h2>
    <button @click="openThrelteWindow" class="open-threlte-button">
      Launch Threlte App Window
    </button>
    <div class="variant-buttons">
      <button @click="openThrelteVariant('basic')" class="variant-button">
        Launch Basic Demo
      </button>
      <button @click="openThrelteVariant('studio')" class="variant-button">
        Launch Studio Demo
      </button>
    </div>
    <p v-if="threlteWindowStatus" class="status-message">{{ threlteWindowStatus }}</p>
  </div>
  
  <!-- Needle Window Button Section -->
  <div class="needle-window-section">
    <h2>Open Needle JS App Window</h2>
    <!-- <button @click="openNeedleWindow" class="open-needle-button">
      Launch Needle JS App Window
    </button> -->
    <div class="variant-buttons">
      <button @click="openNeedleVariant('carphysics', vehicleControllerContext)" class="variant-button">
        Launch Car Physics Demo
      </button>
      <button @click="openNeedleVariant('sidescroller')" class="variant-button">
        Launch Side Scroller Demo
      </button>
      <button @click="openNeedleVariant('navmesh')" class="variant-button">
        Launch Navmesh Demo
      </button>
    </div>
    <p v-if="needleWindowStatus" class="status-message">{{ needleWindowStatus }}</p>
  </div>
  
  <!-- RenJS Window Button Section -->
  <div class="renjs-window-section">
    <h2>Open RenJS Demo Window</h2>
    <!-- <button @click="openRenjsWindow" class="open-renjs-button">
      Launch RenJS Demo Window
    </button> -->
    <div class="variant-buttons">
      <button @click="openRenjsVariant('demo')" class="variant-button">
        Launch Visual Novel Demo
      </button>
      <!-- <button @click="openRenjsVariant('adventure-game')" class="variant-button">
        Launch Adventure Game Demo
      </button> -->
    </div>
    <p v-if="renjsWindowStatus" class="status-message">{{ renjsWindowStatus }}</p>
  </div>
  
  <div class="flex-center">
    Place static files into the <code>/public</code> folder
    <img style="width: 2.4em; margin-left: .4em;" src="/logo.svg" alt="Logo">
  </div>

  <!-- Database Demo Section -->
  <div class="database-section">
    <DatabaseDemo />
  </div>
</template>

<style>
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}

.logo.electron:hover {
  filter: drop-shadow(0 0 2em #9feaf9);
}

.react-window-section,
.needle-window-section,
.threlte-window-section,
.renjs-window-section {
  margin: 20px 0;
  padding: 15px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.open-react-button,
.open-needle-button,
.open-threlte-button,
.open-renjs-button {
  padding: 10px 15px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  margin: 10px 0;
}

.open-react-button:hover,
.open-needle-button:hover,
.open-threlte-button:hover,
.open-renjs-button:hover {
  background-color: #45a049;
}

.variant-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 10px 0;
}

.variant-button {
  padding: 8px 12px;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.variant-button:hover {
  background-color: #0b7dda;
  transform: translateY(-2px);
}

.variant-button:active {
  transform: translateY(0);
}

.open-needle-button {
  background-color: #ff6b6b; /* Needle red */
  color: #ffffff;
}

.open-needle-button:hover {
  background-color: #e05555;
  transform: translateY(-2px);
}

.open-react-button:active,
.open-needle-button:active {
  transform: translateY(0);
}

.status-message {
  margin-top: 15px;
  padding: 10px;
  background-color: #e8f5e9;
  border-radius: 4px;
  font-style: italic;
}
</style>
