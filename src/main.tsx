import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { RoleProvider } from './context/RoleContext'
import { NavigationProvider } from './context/NavigationContext'
import { BrowserRouter } from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <RoleProvider>
        <NavigationProvider>
          <App />
        </NavigationProvider>
      </RoleProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
