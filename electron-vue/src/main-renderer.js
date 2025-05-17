/**
 * Main renderer entry point for the control panel
 * This file is responsible for initializing the Vue app with the main App.vue component
 */
import { createApp } from 'vue';
import App from './App.vue';
import './index.css';

// Create Vue app
const app = createApp(App);

// Mount the app
app.mount('#app');

// Log that the main renderer has started
console.log('Main renderer started');

// Handle messages from the main process
window.addEventListener('message', (event) => {
  console.log('Message received in main renderer:', event.data);
});

// Expose the app to the window for debugging
window.__APP__ = app;
