import 'server-only'
import Stripe from 'stripe'

let client: Stripe | undefined
export function stripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('Configure STRIPE_SECRET_KEY.')
  return client ??= new Stripe(key)
}
