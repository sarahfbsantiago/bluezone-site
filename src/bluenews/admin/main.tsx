import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AdminPage } from './AdminPage'
import '../../styles/tokens.css'
import '../../styles/global.css'

createRoot(document.getElementById('root')!).render(<StrictMode><AdminPage /></StrictMode>)
