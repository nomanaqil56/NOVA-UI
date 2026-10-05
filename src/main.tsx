import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { RoleProvider } from './context/RoleContext'
import { NavigationProvider } from './context/NavigationContext'
import { BrowserRouter } from 'react-router-dom'
import { ToastProvider } from './context/ToastContext'
import { TelemetryProvider } from './context/TelemetryContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <RoleProvider>
        <NavigationProvider>
          <TelemetryProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </TelemetryProvider>
        </NavigationProvider>
      </RoleProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
