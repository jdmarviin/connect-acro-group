import { NextResponse } from 'next/server'
import { PaymentStillPending, syncCheckoutSession, syncDispute, syncRefund } from '@/lib/checkout'
import { stripe } from '@/lib/stripe'
import type Stripe from 'stripe'

const sessionEvents = new Set(['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'checkout.session.async_payment_failed', 'checkout.session.expired'])
const disputeEvents = new Set(['charge.dispute.created', 'charge.dispute.updated', 'charge.dispute.closed'])

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: 'Webhook não configurado.' }, { status: 503 })
  const signature = request.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  let event: Stripe.Event
  try { event = stripe().webhooks.constructEvent(await request.text(), signature, secret) }
  catch { return NextResponse.json({ error: 'Invalid signature' }, { status: 400 }) }
  try {
    if (sessionEvents.has(event.type)) await syncCheckoutSession((event.data.object as Stripe.Checkout.Session).id)
    else if (event.type === 'charge.refunded') await syncRefund((event.data.object as Stripe.Charge).id)
    else if (disputeEvents.has(event.type)) await syncDispute((event.data.object as Stripe.Dispute).id)
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook failed', { event: event.id, type: event.type, pending: error instanceof PaymentStillPending })
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}
