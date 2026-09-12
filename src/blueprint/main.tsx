import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BlueprintPage } from './BlueprintPage'
import '../styles/tokens.css'
import '../styles/global.css'

createRoot(document.getElementById('root')!).render(<StrictMode><BlueprintPage /></StrictMode>)
