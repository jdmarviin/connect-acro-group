import { Store } from 'lucide-react'
import { getData } from '@/lib/data'
import { participantContext } from '@/lib/participant'
import { participantText } from '@/i18n/participant'

export default async function ProductsPage() {
  const { locale } = await participantContext()
  const t = participantText(locale)
  const db = await getData()
  const { docs: products } = await db.find({ collection: 'products', pagination: false })
  return <div className="participant-page"><header className="participant-page-heading"><div><p className="workspace-eyebrow">ACRO GROUP</p><h1>{t.productsTitle}</h1><p>{t.productsIntro}</p></div></header>
    {products.length ? <div className="workspace-products">{products.map(product => <article className="workspace-card workspace-product" key={product.id}>
      {product.thumbnailUrl && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={product.thumbnailUrl} alt="" />
      )}
      <div><h2>{product.name}</h2>{product.description && <p>{product.description}</p>}{/^https?:\/\//.test(product.checkoutUrl) && <a className="workspace-button" href={product.checkoutUrl} target="_blank" rel="noopener noreferrer">{t.productOpen}</a>}</div>
    </article>)}</div> : <div className="workspace-card workspace-empty"><Store aria-hidden="true" /><p>{t.noProducts}</p></div>}
  </div>
}
