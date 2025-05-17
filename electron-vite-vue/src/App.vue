<script setup lang="ts">
import { ref } from 'vue'
import HelloWorld from './components/HelloWorld.vue'
import DatabaseDemo from './components/DatabaseDemo.vue'

// Function to open the React app window
const openReactWindow = () => {
  // Send IPC message to main process to open React window
  window.ipcRenderer.send('open-react-window')
}

// Function to open the Needle JS app window
const openNeedleWindow = () => {
  // Send IPC message to main process to open Needle JS window
  window.ipcRenderer.send('open-needle-window')
}

// Status messages
const reactWindowStatus = ref('')
const needleWindowStatus = ref('')

// Listen for status updates from main process
window.ipcRenderer.on('react-window-status', (_event, status) => {
  reactWindowStatus.value = status
})

window.ipcRenderer.on('needle-window-status', (_event, status) => {
  needleWindowStatus.value = status
})
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

.logo.electron:hover {
  filter: drop-shadow(0 0 2em #9FEAF9);
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}

/* Window Section Styles */
.react-window-section,
.needle-window-section {
  margin: 30px auto;
  max-width: 600px;
  padding: 20px;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  background-color: #f9f9f9;
  text-align: center;
}

.open-react-button,
.open-needle-button {
  border: none;
  border-radius: 4px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
  margin: 15px 0;
}

.open-react-button {
  background-color: #61dafb; /* React blue */
  color: #282c34; /* React dark */
}

.open-react-button:hover {
  background-color: #4fa8c7;
  transform: translateY(-2px);
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
