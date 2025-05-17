import React from 'react';
import DatabaseDemo from './components/DatabaseDemo';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>React App in Electron</h1>
        <p>This is a React app running in an Electron window with SQLite database integration.</p>
      </header>
      
      <main>
        <DatabaseDemo />
      </main>
      
      <footer className="app-footer">
        <p>Data is synchronized across all windows via WebSocket</p>
      </footer>
    </div>
  );
}

export default App;
