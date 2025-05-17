/**
 * Main entry point for the Needle JS app
 */
import { initDatabaseUI } from './components/DatabaseUI';

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Create a container for the database UI
  const container = document.createElement('div');
  container.id = 'database-container';
  document.body.appendChild(container);
  
  // Initialize the database UI
  initDatabaseUI(container);
  
  console.log('Needle JS app initialized with database integration');
});
