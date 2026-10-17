import test from 'node:test'
import assert from 'node:assert/strict'
import { checkoutOutcome, currentPrice, disputeDecision, formatMoney, parseCents, refundDecision } from '../src/lib/products'

test('prices typed in Brazilian or plain notation become exact cents', () => {
  for (const [input, cents] of [['199', 19900], ['199,9', 19990], ['199,90', 19990], ['199.90', 19990], ['R$ 1.299,90', 129990], ['1.299', 129900], ['0,5', 50], ['2.000.000', 200000000]] as const)
    assert.equal(parseCents(input), cents, input)
  for (const input of ['', 'abc', '1,299.90', '19,999', '-10', '1.29.9', '10,']) assert.equal(parseCents(input), null, input)
  assert.equal(formatMoney(129990).replace(/\s/g, ' '), 'R$ 1.299,90')
})

test('current price ignores inactive, free, future and expired prices', () => {
  const now = Date.parse('2026-10-16T12:00:00Z')
  const price = (amount_cents: number, valid_from: string, extra: { is_active?: boolean; valid_until?: string } = {}) =>
    ({ amount_cents, currency: 'BRL', installments_max: 1, is_active: extra.is_active ?? true, valid_from, valid_until: extra.valid_until ?? null })
  assert.equal(currentPrice([], now), undefined)
  assert.equal(currentPrice([
    price(100, '2026-10-01T00:00:00Z'),
    price(200, '2026-10-10T00:00:00Z'),
    price(300, '2026-10-15T00:00:00Z', { is_active: false }),
    price(0, '2026-10-15T00:00:00Z'),
    price(400, '2026-10-20T00:00:00Z'),
    price(500, '2026-10-12T00:00:00Z', { valid_until: '2026-10-16T11:00:00Z' }),
  ], now)?.amount_cents, 200)
})

test('Stripe sessions settle orders only for the exact charged amount', () => {
  const order = { total_cents: 19990, currency: 'BRL' }
  const session = (extra: Partial<Parameters<typeof checkoutOutcome>[0]>) => ({ status: 'complete', payment_status: 'unpaid', amount_total: 19990, currency: 'brl', intent: null, ...extra })
  assert.equal(checkoutOutcome(session({ payment_status: 'paid' }), order), 'paid')
  assert.equal(checkoutOutcome(session({ payment_status: 'paid', amount_total: 100 }), order), 'mismatch')
  assert.equal(checkoutOutcome(session({ payment_status: 'paid', currency: 'usd' }), order), 'mismatch')
  assert.equal(checkoutOutcome(session({ status: 'open' }), order), null)
  assert.equal(checkoutOutcome(session({ status: 'expired' }), order), 'cancelled')
  assert.equal(checkoutOutcome(session({ intent: { status: 'requires_action', failed: false } }), order), null)
  assert.equal(checkoutOutcome(session({ intent: { status: 'requires_payment_method', failed: true } }), order), 'failed')
  assert.equal(checkoutOutcome(session({ intent: { status: 'canceled', failed: false } }), order), 'failed')
})

test('refunds and disputes only remove access from a fully settled order', () => {
  assert.equal(refundDecision({ refunded: false }, 'paid'), 'record')
  assert.equal(refundDecision({ refunded: true }, 'paid'), 'revoke')
  assert.equal(refundDecision({ refunded: true }, 'pending'), 'wait')
  assert.equal(refundDecision({ refunded: true }, 'refunded'), 'record')
  for (const status of ['needs_response', 'under_review', 'lost']) assert.equal(disputeDecision(status, 'paid'), 'revoke', status)
  assert.equal(disputeDecision('warning_needs_response', 'paid'), 'record')
  assert.equal(disputeDecision('won', 'paid'), 'record')
  assert.equal(disputeDecision('needs_response', 'pending'), 'wait')
})
