import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { isSupabaseConfigured } from './lib/supabase'
import './index.css'
import './App.css'

function ConfigError() {
  return (
    <div className="loading-screen">
      <h2>Configuration error</h2>
      <p>
        VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are not set. Add them to <code>.env</code> for
        local development, or to the Vercel project&apos;s Environment Variables, then rebuild.
      </p>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isSupabaseConfigured ? <App /> : <ConfigError />}
  </React.StrictMode>,
)
