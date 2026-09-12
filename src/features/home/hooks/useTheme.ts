import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'
const STORAGE_KEY = 'bluezone-theme'
/** Tema padrão do site: escuro. O claro fica como escolha do visitante. */
export const DEFAULT_THEME: Theme = 'light'

function initial(): Theme {
  if (typeof window === 'undefined') return DEFAULT_THEME
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch { /* armazenamento indisponível */ }
  return DEFAULT_THEME
}

/** Tema claro/escuro, lembrado no navegador e aplicado em `data-theme` no <html>. */
export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(initial)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { window.localStorage.setItem(STORAGE_KEY, theme) } catch { /* ignora */ }
  }, [theme])
  const toggle = useCallback(() => setTheme((current) => (current === 'dark' ? 'light' : 'dark')), [])
  return [theme, toggle]
}
