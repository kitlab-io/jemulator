import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'

import { router } from './routes'

import './assets/styles/fontface.css'
import './assets/styles/tailwind.css'

// Add debugging for Electron environment
console.log('React app initializing...')
console.log('Environment:', process.env.NODE_ENV)

// Log any global objects provided by Electron
// Use type assertion to check for Electron-specific globals
const electronWindow = window as any;
if (electronWindow.ipcRenderer) {
  console.log('IPC Renderer is available')
} else {
  console.log('IPC Renderer is NOT available')
}

// Find the root element
const rootElement = document.getElementById('root')

if (!rootElement) {
  console.error("Root element not found. Check if it's in your index.html or if the id is correct.")
  // Create root element if it doesn't exist (fallback)
  const newRoot = document.createElement('div')
  newRoot.id = 'root'
  document.body.appendChild(newRoot)
  console.log('Created new root element:', newRoot)
  
  // Use the newly created root
  ReactDOM.createRoot(newRoot).render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  )
} else {
  console.log('Root element found:', rootElement)
  
  // When you use Strict Mode, React renders each component twice to help you find unexpected side effects.
  // @ref: https://react.dev/blog/2022/03/08/react-18-upgrade-guide#react
  ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
}
