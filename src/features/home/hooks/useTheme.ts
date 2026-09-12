import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'
/** Chave nova (v2): a antiga gravava o padrão no primeiro acesso e prendeu visitantes no claro. */
const STORAGE_KEY = 'bluezone-theme-v2'
/** Tema padrão do site: escuro. O claro fica como escolha do visitante. */
export const DEFAULT_THEME: Theme = 'dark'

function initial(): Theme {
  if (typeof window === 'undefined') return DEFAULT_THEME
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch { /* armazenamento indisponível */ }
  return DEFAULT_THEME
}

/** Tema claro/escuro aplicado em `data-theme` no <html>. Só é lembrado no navegador quando a pessoa clica no botão. */
export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(initial)
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme) }, [theme])
  const toggle = useCallback(() => setTheme((current) => {
    const next = current === 'dark' ? 'light' : 'dark'
    try { window.localStorage.setItem(STORAGE_KEY, next) } catch { /* ignora */ }
    return next
  }), [])
  return [theme, toggle]
}
