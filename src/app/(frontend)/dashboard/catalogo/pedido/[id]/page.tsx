import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CircleCheck, Clock, TriangleAlert } from 'lucide-react'
import { participantContext } from '@/lib/participant'
import { participantText } from '@/i18n/participant'
import { supabaseServer } from '@/lib/supabase/server'
import { syncCheckoutSession } from '@/lib/checkout'
import { formatMoney } from '@/lib/products'
import AutoRefresh from './AutoRefresh'

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { locale } = await participantContext()
  const t = participantText(locale)
  const { id } = await params
  if (!uuid.test(id)) notFound()
  const client = await supabaseServer()
  const load = () => client.from('orders').select('id,status,total_cents,currency,provider_order_id,order_items(product_name_snapshot)').eq('id', id).maybeSingle()
  let { data: order } = await load()
  if (!order) notFound()
  if (order.status === 'pending' && order.provider_order_id) {
    try { await syncCheckoutSession(order.provider_order_id); ({ data: order } = await load()) }
    catch (error) { console.error('Stripe session sync failed', { order: id, cause: error instanceof Error ? error.message : String(error) }) }
    if (!order) notFound()
  }
  const name = order.order_items.map(i => i.product_name_snapshot).join(', ')
  const view = order.status === 'paid' ? { icon: CircleCheck, title: t.orderPaid, hint: t.orderPaidHint }
    : order.status === 'pending' ? { icon: Clock, title: t.orderPending, hint: t.orderPendingHint }
    : order.status === 'refunded' ? { icon: TriangleAlert, title: t.orderRefunded, hint: '' }
    : { icon: TriangleAlert, title: t.orderFailed, hint: t.orderFailedHint }
  const Icon = view.icon
  return <div className="participant-page"><header className="participant-page-heading"><div><p className="workspace-eyebrow">ACRO GROUP</p><h1>{t.orderTitle}</h1><p>{name} · {formatMoney(Number(order.total_cents), order.currency)}</p></div></header>
    <div className="workspace-notice" role="status"><Icon aria-hidden="true" /><div><strong>{view.title}</strong>{view.hint && <p>{view.hint}</p>}</div>
      {order.status === 'paid' ? <Link className="workspace-button" href="/dashboard/cursos">{t.goCourses}</Link> : <Link className="workspace-button secondary" href="/dashboard/catalogo">{t.backCatalog}</Link>}
    </div>
    {order.status === 'pending' && <AutoRefresh />}
  </div>
}
