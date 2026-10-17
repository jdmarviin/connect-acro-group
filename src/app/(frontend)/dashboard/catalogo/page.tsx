import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ShoppingBag, TriangleAlert } from 'lucide-react'
import { participantContext } from '@/lib/participant'
import { participantText } from '@/i18n/participant'
import { supabaseServer } from '@/lib/supabase/server'
import { hasCourseAccess } from '@/lib/courses'
import { currentPrice, formatMoney, type ProductPrice } from '@/lib/products'
import { CheckoutError, createCheckout, type CheckoutFailure } from '@/lib/checkout'

type Included = { course_id: string; courses: { title: string } | { title: string }[] | null }

async function buy(data: FormData) {
  'use server'
  const { user, locale } = await participantContext()
  let url: string
  try { url = await createCheckout(String(data.get('offerId')), user, locale) }
  catch (error) {
    if (error instanceof CheckoutError) redirect(`/dashboard/catalogo?erro=${error.reason}`)
    throw error
  }
  redirect(url)
}

export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { locale } = await participantContext()
  const t = participantText(locale)
  const { erro } = await searchParams
  const errors: Record<CheckoutFailure, string> = { owned: t.checkoutOwned, unavailable: t.checkoutUnavailable, busy: t.checkoutBusy, provider: t.checkoutProvider }
  const client = await supabaseServer()
  const [{ data: offers, error }, { data: enrollments }] = await Promise.all([
    client.from('products').select('id,name,description,thumbnail_url,access_days,product_courses(course_id,courses(title)),product_prices(amount_cents,currency,installments_max,is_active,valid_from,valid_until)')
      .eq('checkout_mode', 'internal').eq('status', 'published').order('created_at', { ascending: false }),
    client.from('course_enrollments').select('course_id,status,expires_at'),
  ])
  if (error) throw new Error('Unable to load catalog')
  const access = new Map((enrollments || []).filter(e => hasCourseAccess(e)).map(e => [e.course_id, e.expires_at]))
  const available = (offers || []).flatMap(offer => {
    const price = currentPrice(offer.product_prices as ProductPrice[])
    const included = offer.product_courses as Included[]
    return price && included.length ? [{ ...offer, price, included }] : []
  })
  return <div className="participant-page"><header className="participant-page-heading"><div><p className="workspace-eyebrow">ACRO GROUP</p><h1>{t.catalog}</h1><p>{t.catalogIntro}</p></div></header>
    {erro && erro in errors && <div className="workspace-notice" role="alert"><TriangleAlert aria-hidden="true" /><div><strong>{errors[erro as CheckoutFailure]}</strong></div></div>}
    {available.length ? <div className="workspace-products">{available.map(offer => {
      const owned = offer.included.every(c => access.has(c.course_id))
      const lifetime = owned && offer.included.every(c => access.get(c.course_id) === null)
      return <article className="workspace-card workspace-product" key={offer.id}>
        {offer.thumbnail_url && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={offer.thumbnail_url} alt="" />
        )}
        <div>
          <span className="workspace-badge">{offer.access_days ? `${offer.access_days} ${t.accessDays}` : t.lifetimeAccess}</span>
          <h2>{offer.name}</h2>{offer.description && <p>{offer.description}</p>}
          <p>{t.includes}: {offer.included.map(c => (Array.isArray(c.courses) ? c.courses[0] : c.courses)?.title).filter(Boolean).join(', ')}</p>
          <strong>{formatMoney(offer.price.amount_cents, offer.price.currency)}</strong>
          {lifetime ? <Link className="workspace-button secondary" href="/dashboard/cursos">{t.owned}</Link>
            : <form action={buy}><input type="hidden" name="offerId" value={offer.id}/><button className="workspace-button">{owned ? t.renew : t.buy}</button></form>}
        </div>
      </article>
    })}</div> : <div className="workspace-card workspace-empty"><ShoppingBag aria-hidden="true" /><p>{t.noOffers}</p></div>}
  </div>
}
