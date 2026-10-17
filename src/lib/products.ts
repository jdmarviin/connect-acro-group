export type ProductPrice = { amount_cents: number; currency: string; installments_max: number; is_active: boolean; valid_from: string; valid_until: string | null }

// Mirrors connect.start_checkout(): the latest active, positive price inside its validity window.
export function currentPrice<T extends ProductPrice>(prices: T[], now = Date.now()): T | undefined {
  return prices
    .filter(p => p.is_active && p.amount_cents > 0 && Date.parse(p.valid_from) <= now && (!p.valid_until || Date.parse(p.valid_until) > now))
    .sort((a, b) => Date.parse(b.valid_from) - Date.parse(a.valid_from))[0]
}

// Accepts "1.299,90", "199,9", "199.90" or "199"; rejects ambiguous mixes like "1,299.90".
export function parseCents(input: string): number | null {
  const value = input.replace(/R\$|\s/g, '')
  let decimal: string
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(value) || /^\d+,\d{1,2}$/.test(value)) decimal = value.replaceAll('.', '').replace(',', '.')
  else if (/^\d+(\.\d{1,2})?$/.test(value)) decimal = value
  else return null
  return Math.round(Number(decimal) * 100)
}

export type CheckoutSnapshot = {
  status: string | null
  payment_status: string
  amount_total: number | null
  currency: string | null
  intent: { status: string; failed: boolean } | null
}
export type CheckoutOutcome = 'paid' | 'cancelled' | 'failed' | 'mismatch' | null

// A paid session only settles the order when Stripe charged exactly the order total and currency.
export function checkoutOutcome(session: CheckoutSnapshot, order: { total_cents: number; currency: string }): CheckoutOutcome {
  if (session.payment_status === 'paid') {
    return session.amount_total === order.total_cents && session.currency?.toLowerCase() === order.currency.toLowerCase() ? 'paid' : 'mismatch'
  }
  if (session.status === 'expired') return 'cancelled'
  if (session.status === 'complete' && session.intent && (session.intent.status === 'canceled' || (session.intent.status === 'requires_payment_method' && session.intent.failed))) return 'failed'
  return null
}

// A partial refund keeps the course; only a fully refunded charge removes it, and only after the order is paid.
export function refundDecision(charge: { refunded: boolean }, orderStatus: string): 'revoke' | 'wait' | 'record' {
  if (!charge.refunded) return 'record'
  if (orderStatus === 'paid') return 'revoke'
  return orderStatus === 'pending' ? 'wait' : 'record'
}

// Inquiries (warning_*) stay open without removing access. A formal dispute removes it until reviewed manually.
export function disputeDecision(status: string, orderStatus: string): 'revoke' | 'wait' | 'record' {
  if (!['needs_response', 'under_review', 'lost'].includes(status)) return 'record'
  if (orderStatus === 'paid') return 'revoke'
  return orderStatus === 'pending' ? 'wait' : 'record'
}

export function formatMoney(cents: number, currency = 'BRL') {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(cents / 100)
}
