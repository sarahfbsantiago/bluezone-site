import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SiteBoot } from './components/SiteBoot'
import { App } from './app/App'
import './styles/tokens.css'
import './styles/global.css'

createRoot(document.getElementById('root')!).render(<StrictMode><SiteBoot><App /></SiteBoot></StrictMode>)
