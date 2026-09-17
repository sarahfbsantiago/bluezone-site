import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AdmPage } from './AdmPage'
import '../styles/tokens.css'
import '../styles/global.css'

createRoot(document.getElementById('root')!).render(<StrictMode><AdmPage /></StrictMode>)
