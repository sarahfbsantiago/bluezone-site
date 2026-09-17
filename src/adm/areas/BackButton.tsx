/** "← voltar" no topo de toda tela interna do painel (editor, aba, área). */
export function BackButton({ onClick, label = 'voltar' }: { onClick: () => void; label?: string }) {
  return <button type="button" className="adm-back" onClick={onClick} aria-label={label}>← {label}</button>
}
