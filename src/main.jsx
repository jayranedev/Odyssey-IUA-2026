import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { BackendStatusProvider } from './context/BackendStatusContext.jsx'
import ErrorFallback from './components/ErrorFallback.jsx'
import { Sentry } from './services/sentry.js'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={({ resetError }) => <ErrorFallback resetError={resetError} />}>
      <BrowserRouter>
        <BackendStatusProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BackendStatusProvider>
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
)
