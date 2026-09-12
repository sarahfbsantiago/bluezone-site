import { Fragment } from 'react'

/** Renderiza texto simples com trechos entre ** em negrito. */
export function RichText({ text }: { text: string }) {
  const parts = text.split('**')
  return <>{parts.map((part, index) => (index % 2 === 1 ? <strong key={index}>{part}</strong> : <Fragment key={index}>{part}</Fragment>))}</>
}
