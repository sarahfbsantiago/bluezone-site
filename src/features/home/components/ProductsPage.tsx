import { pages } from '../config/pagesConfig'
import { withBase } from '../../../lib/paths'
import { BrandLogo } from './BrandLogo'

type ProductItem = { title: string; text: string; badge?: string; cta?: string; href?: string; brand?: 'blueprint' }

/** Produtos: o curso Blueprint (disponível, com link para a página própria) e os produtos em construção. */
export function ProductsPage() {
  const { products, team, contact } = pages
  const items = products.items as readonly ProductItem[]
  return (
    <section id={products.id} className="page page-long page-products" aria-labelledby="products-title" data-scroll-section>
      <div className="page-block page-block-long">
        <span className="page-label">{products.label}</span>
        <h2 id="products-title" className="solution-title">{products.title}</h2>
        <p className="products-intro">{products.intro}</p>
        <ul className="solution-items products-grid" aria-label="Produtos">
          {items.map((item) => (
            <li key={item.title} className={[item.href ? 'product-available' : '', item.brand ? `product-${item.brand}` : ''].filter(Boolean).join(' ') || undefined}>
              <span className="product-badge">{item.badge ?? 'em breve'}</span>
              {item.brand === 'blueprint' ? <strong className="product-brand"><BrandLogo variant="blueprint" /><span className="sr-only">{item.title}</span></strong> : <strong>{item.title}</strong>}
              <span>{item.text}</span>
              {item.href && item.cta && <a className="product-link" href={withBase(item.href)}>{item.cta}<span aria-hidden="true"> →</span></a>}
            </li>
          ))}
        </ul>
        <a className="products-note" href={`#${contact.id}`}>{products.note}</a>
      </div>
      <a className="page-continue" href={`#${team.id}`}>continuar<span className="page-continue-line" /></a>
    </section>
  )
}
