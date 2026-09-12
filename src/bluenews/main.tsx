import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BlueNewsPage } from './BlueNewsPage'
import '../styles/tokens.css'
import '../styles/global.css'

createRoot(document.getElementById('root')!).render(<StrictMode><BlueNewsPage /></StrictMode>)
