import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationsProvider } from './contexts/NotificationsContext'
import { MessagesProvider } from './contexts/MessagesContext'
import { ErrorBoundary } from './components/ErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <NotificationsProvider>
          <MessagesProvider>
            <App />
          </MessagesProvider>
        </NotificationsProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
