import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PrivacyPage } from './PrivacyPage'
import { SiteBoot } from '../components/SiteBoot'
import '../styles/tokens.css'
import '../styles/global.css'
import '../styles/bluenews.css'

createRoot(document.getElementById('root')!).render(<StrictMode><SiteBoot><PrivacyPage /></SiteBoot></StrictMode>)
