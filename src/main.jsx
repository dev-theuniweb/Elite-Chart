import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Disable StrictMode to prevent double-mounting in development
// which causes duplicate DOM elements with PixiJS
createRoot(document.getElementById('root')).render(
  <App />
)
