import { withBase } from '../../../lib/paths'

type BrandLogoProps = { markOnly?: boolean; className?: string; variant?: 'bluezone' | 'bluenews' | 'blueprint' }

/**
 * Logo oficial. `markOnly` usa o PNG como máscara (mesma geometria) para o fallback sem WebGL.
 * `variant="bluenews"` mantém o símbolo oficial e troca a palavra por "BlueNews" (Blue em negrito, News leve, como no logotipo).
 */
export function BrandLogo({ markOnly = false, className = '', variant = 'bluezone' }: BrandLogoProps) {
  if (markOnly) return <span className={`brand-mark ${className}`} aria-hidden="true" />
  if (variant === 'bluenews' || variant === 'blueprint') {
    const word = variant === 'bluenews' ? 'News' : 'print'
    return (
      <span className={`brand-logo brand-news ${className}`}>
        <img src={withBase('/logo-symbol.png')} alt="" decoding="async" />
        <span className="brand-news-word" aria-label={`Blue${word}`}><b>Blue</b>{word}</span>
      </span>
    )
  }
  return <span className={`brand-logo ${className}`}><img src={withBase('/logo-bluezone.png')} alt="Bluezone" decoding="async" /></span>
}
