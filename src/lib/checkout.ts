import 'server-only'
import { headers } from 'next/headers'
import { authOrigin } from './supabase/auth-redirect'
import { query, transaction } from './supabase/database'
import { supabaseServer } from './supabase/server'
import { checkoutOutcome, disputeDecision, refundDecision } from './products'
import { stripe } from './stripe'
import type { Locale } from '@/i18n/dictionaries'
import type Stripe from 'stripe'

export type CheckoutFailure = 'owned' | 'unavailable' | 'busy' | 'provider'
export class CheckoutError extends Error {
  constructor(readonly reason: CheckoutFailure) { super(reason) }
}

async function appOrigin() {
  const h = await headers()
  const host = (h.get('x-forwarded-host') || h.get('host') || 'localhost:3000').split(',')[0].trim()
  const request = new Request(`${h.get('x-forwarded-proto') === 'https' ? 'https' : 'http'}://${host}/`, { headers: h })
  return authOrigin(request, process.env.NEXT_PUBLIC_APP_URL, process.env.NODE_ENV !== 'production')
}

export async function createCheckout(offerId: string, buyer: { email?: string | null }, locale: Locale) {
  const client = await supabaseServer()
  const { data: orderId, error } = await client.rpc('start_checkout', { product: offerId })
  if (error) {
    if (/Already owned/.test(error.message)) throw new CheckoutError('owned')
    if (/Too many/.test(error.message)) throw new CheckoutError('busy')
    throw new CheckoutError('unavailable')
  }
  const [order] = await query<{ id: string; total_cents: string; currency: string; name: string }>(
    'select o.id,o.total_cents,o.currency,i.product_name_snapshot name from connect.orders o join connect.order_items i on i.order_id=o.id where o.id=$1', [orderId])
  const origin = await appOrigin()
  try {
    const session = await stripe().checkout.sessions.create({
      mode: 'payment',
      locale: locale === 'pt' ? 'pt-BR' : 'fr',
      client_reference_id: order.id,
      customer_email: buyer.email || undefined,
      line_items: [{ quantity: 1, price_data: { currency: order.currency.toLowerCase(), unit_amount: Number(order.total_cents), product_data: { name: order.name } } }],
      metadata: { order_id: order.id },
      payment_intent_data: { metadata: { order_id: order.id } },
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
      success_url: `${origin}/dashboard/catalogo/pedido/${order.id}`,
      cancel_url: `${origin}/dashboard/catalogo`,
    }, { idempotencyKey: `checkout-session-${order.id}` })
    if (!session.url) throw new Error('Checkout Session without URL')
    await query('update connect.orders set provider_order_id=$1 where id=$2 and provider_order_id is null', [session.id, order.id])
    return session.url
  } catch (cause) {
    console.error('Stripe checkout failed', { order: order.id, cause: cause instanceof Error ? cause.message : String(cause) })
    await query("update connect.orders set status='failed' where id=$1 and status='pending'", [order.id])
    throw new CheckoutError('provider')
  }
}

// Idempotent: the order page and the webhook may both call this for the same session.
export async function syncCheckoutSession(sessionId: string) {
  const session = await stripe().checkout.sessions.retrieve(sessionId, { expand: ['payment_intent.latest_charge'] })
  const orderId = session.client_reference_id
  if (!orderId) return
  const intent = session.payment_intent && typeof session.payment_intent === 'object' ? session.payment_intent : null
  const charge = intent?.latest_charge && typeof intent.latest_charge === 'object' ? intent.latest_charge : null
  await transaction(async db => {
    const { rows: [order] } = await db.query<{ status: string; total_cents: string; currency: string; provider_order_id: string | null }>(
      "select status,total_cents,currency,provider_order_id from connect.orders where id=$1 and provider='stripe' for update", [orderId])
    if (!order || (order.provider_order_id && order.provider_order_id !== session.id)) return
    if (!order.provider_order_id) await db.query('update connect.orders set provider_order_id=$1 where id=$2', [session.id, orderId])
    const outcome = checkoutOutcome({
      status: session.status, payment_status: session.payment_status, amount_total: session.amount_total, currency: session.currency,
      intent: intent && { status: intent.status, failed: Boolean(intent.last_payment_error) },
    }, { total_cents: Number(order.total_cents), currency: order.currency })
    if (outcome === 'mismatch') { console.error('Stripe amount mismatch', { order: orderId, session: session.id }); return }
    if (outcome === 'paid' && intent) {
      const method = charge?.payment_method_details?.type
      await db.query(`insert into connect.payment_transactions(order_id,provider,provider_transaction_id,type,method,status,amount_cents,payload,processed_at)
        values($1,'stripe',$2,'charge',$3,'succeeded',$4,$5,now()) on conflict(provider,provider_transaction_id) do nothing`,
        [orderId, intent.id, method === 'pix' || method === 'card' ? method : null, session.amount_total, { checkout_session: session.id, payment_intent: intent.id, charge: charge?.id ?? null }])
    }
    if (outcome && order.status === 'pending') await db.query('update connect.orders set status=$2 where id=$1', [orderId, outcome])
  })
}

// Thrown when a refund or dispute arrives before the payment is recorded, so Stripe retries the webhook.
export class PaymentStillPending extends Error {}

const paymentMethod = (type: string | undefined) => type === 'pix' || type === 'card' ? type : null
const refundStatus = (status: string | null) => status === 'succeeded' ? 'succeeded' : status === 'failed' || status === 'canceled' ? 'failed' : 'pending'

async function recordReversal(charge: Stripe.Charge, entry: { id: string; type: 'refund' | 'chargeback'; status: 'pending' | 'succeeded' | 'failed'; amount: number }, decision: (orderStatus: string) => 'revoke' | 'wait' | 'record') {
  const orderId = charge.metadata.order_id
  if (!orderId) return
  await transaction(async db => {
    const { rows: [order] } = await db.query<{ status: string }>("select status from connect.orders where id=$1 and provider='stripe' for update", [orderId])
    if (!order) return
    const action = decision(order.status)
    if (action === 'wait') throw new PaymentStillPending()
    await db.query(`insert into connect.payment_transactions(order_id,provider,provider_transaction_id,type,method,status,amount_cents,payload,processed_at)
      values($1,'stripe',$2,$3,$4,$5,$6,$7,now()) on conflict(provider,provider_transaction_id) do update set status=excluded.status`,
      [orderId, entry.id, entry.type, paymentMethod(charge.payment_method_details?.type), entry.status, entry.amount, { charge: charge.id }])
    if (action === 'revoke') await db.query("update connect.orders set status='refunded' where id=$1", [orderId])
  })
}

export async function syncRefund(chargeId: string) {
  const charge = await stripe().charges.retrieve(chargeId)
  const refunds = await stripe().refunds.list({ charge: chargeId, limit: 100 })
  if (charge.refunded && !refunds.data.length) throw new Error('Refunded charge has no refund records')
  for (const refund of refunds.data) {
    await recordReversal(charge, { id: refund.id, type: 'refund', status: refundStatus(refund.status), amount: refund.amount }, status => refundDecision(charge, status))
  }
}

export async function syncDispute(disputeId: string) {
  const dispute = await stripe().disputes.retrieve(disputeId)
  const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge.id
  const charge = await stripe().charges.retrieve(chargeId)
  const status = dispute.status === 'lost' ? 'succeeded' : dispute.status === 'won' ? 'failed' : 'pending'
  await recordReversal(charge, { id: dispute.id, type: 'chargeback', status, amount: dispute.amount }, orderStatus => disputeDecision(dispute.status, orderStatus))
}
