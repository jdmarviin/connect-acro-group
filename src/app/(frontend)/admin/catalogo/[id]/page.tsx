import Link from 'next/link'
import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { currentPrice, formatMoney, parseCents, type ProductPrice } from '@/lib/products'
import { supabaseServer } from '@/lib/supabase/server'

type Profile = { email: string; full_name: string | null }
type Order = { id: string; status: string; total_cents: number; currency: string; created_at: string; profiles: Profile | Profile[] | null }
const input = 'block p-2 bg-zinc-900 w-full'
const button = 'bg-acro-blue text-white px-5 py-2 rounded-xl'
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const orderStatus: Record<string, string> = { pending: 'Aguardando pagamento', paid: 'Pago', cancelled: 'Cancelado', failed: 'Falhou', refunded: 'Reembolsado' }
const courseStatus: Record<string, string> = { draft: 'rascunho', published: 'publicado', archived: 'arquivado' }
const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' })

function https(value: string) {
  try { return new URL(value).protocol === 'https:' } catch { return false }
}
function refresh(id: string) {
  revalidatePath(`/admin/catalogo/${id}`); revalidatePath('/admin/catalogo'); revalidatePath('/dashboard/catalogo')
}

async function saveOffer(data: FormData) {
  'use server'
  await requireAdmin()
  const id = String(data.get('offerId'))
  const name = String(data.get('name') || '').trim()
  const thumbnail = String(data.get('thumbnail') || '').trim()
  const status = String(data.get('status'))
  const days = String(data.get('access_days') || '').trim()
  const accessDays = days ? Number(days) : null
  if (!name || name.length > 200 || !['draft', 'published', 'archived'].includes(status)) throw new Error('Informe nome e situação válidos.')
  if (thumbnail && !https(thumbnail)) throw new Error('A imagem precisa ser um link https://.')
  if (accessDays !== null && (!Number.isInteger(accessDays) || accessDays < 1 || accessDays > 3650)) throw new Error('Informe os dias de acesso entre 1 e 3650, ou deixe vazio para acesso vitalício.')
  const client = await supabaseServer()
  if (status === 'published') {
    const [{ count }, { data: prices }] = await Promise.all([
      client.from('product_courses').select('course_id', { count: 'exact', head: true }).eq('product_id', id),
      client.from('product_prices').select('amount_cents,currency,installments_max,is_active,valid_from,valid_until').eq('product_id', id),
    ])
    if (!count || !currentPrice((prices || []) as ProductPrice[])) throw new Error('Inclua pelo menos um curso e defina um preço antes de colocar à venda.')
  }
  const { error } = await client.from('products').update({
    name, description: String(data.get('description') || '').trim() || null, thumbnail_url: thumbnail || null, status, access_days: accessDays,
  }).eq('id', id).eq('checkout_mode', 'internal')
  if (error) throw new Error('Não foi possível salvar a oferta.')
  refresh(id)
}

async function saveCourses(data: FormData) {
  'use server'
  await requireAdmin()
  const id = String(data.get('offerId'))
  const courses = data.getAll('courses').map(String)
  if (!courses.every(c => uuid.test(c))) throw new Error('Seleção de cursos inválida.')
  const client = await supabaseServer()
  const { data: offer } = await client.from('products').select('status').eq('id', id).eq('checkout_mode', 'internal').maybeSingle()
  if (!offer) throw new Error('Oferta não encontrada.')
  if (!courses.length && offer.status === 'published') throw new Error('Uma oferta à venda precisa de pelo menos um curso.')
  const remove = client.from('product_courses').delete().eq('product_id', id)
  const { error: removeError } = courses.length ? await remove.not('course_id', 'in', `(${courses.join(',')})`) : await remove
  const { error } = courses.length
    ? await client.from('product_courses').upsert(courses.map(course_id => ({ product_id: id, course_id })), { onConflict: 'product_id,course_id', ignoreDuplicates: true })
    : { error: null }
  if (removeError || error) throw new Error('Não foi possível salvar os cursos da oferta.')
  refresh(id)
}

async function savePrice(data: FormData) {
  'use server'
  await requireAdmin()
  const id = String(data.get('offerId'))
  const cents = parseCents(String(data.get('amount') || ''))
  if (cents === null || cents < 50 || cents > 99_999_999) throw new Error('Informe um preço entre R$ 0,50 e R$ 999.999,99.')
  const client = await supabaseServer()
  const { data: offer } = await client.from('products').select('id').eq('id', id).eq('checkout_mode', 'internal').maybeSingle()
  if (!offer) throw new Error('Oferta não encontrada.')
  const { data: price, error } = await client.from('product_prices').insert({ product_id: id, amount_cents: cents }).select('id').single()
  if (error || !price) throw new Error('Não foi possível salvar o preço.')
  const { error: deactivateError } = await client.from('product_prices').update({ is_active: false }).eq('product_id', id).eq('is_active', true).neq('id', price.id)
  if (deactivateError) throw new Error('O novo preço foi salvo, mas os anteriores não foram desativados. Tente novamente.')
  refresh(id)
}

export default async function OfferAdmin({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  if (!uuid.test(id)) notFound()
  const client = await supabaseServer()
  const [{ data: offer }, { data: courses, error }, { data: items }] = await Promise.all([
    client.from('products').select('id,name,description,thumbnail_url,status,access_days,product_courses(course_id),product_prices(amount_cents,currency,installments_max,is_active,valid_from,valid_until)')
      .eq('id', id).eq('checkout_mode', 'internal').maybeSingle(),
    client.from('courses').select('id,title,status').order('title'),
    client.from('order_items').select('id,orders(id,status,total_cents,currency,created_at,profiles(email,full_name))').eq('product_id', id).order('created_at', { ascending: false }).limit(50),
  ])
  if (!offer) notFound()
  if (error) throw new Error('Não foi possível carregar os cursos.')
  const included = new Set(offer.product_courses.map(pc => pc.course_id))
  const price = currentPrice(offer.product_prices as ProductPrice[])
  const orders = (items || []).map(i => (Array.isArray(i.orders) ? i.orders[0] : i.orders) as unknown as Order | null).filter(o => o !== null)

  return <div className="max-w-3xl mx-auto p-8 pb-32 space-y-8">
    <Link href="/admin/catalogo" className="text-zinc-400 hover:text-white">← Catálogo de cursos</Link>
    <form action={saveOffer} className="glass-panel rounded-xl p-6 space-y-4">
      <h1 className="text-3xl font-bold text-white">{offer.name}</h1><input type="hidden" name="offerId" value={offer.id}/>
      {(!included.size || !price) && <p className="text-amber-400">Para colocar à venda, inclua pelo menos um curso e defina um preço.</p>}
      <label className="block">Nome no catálogo<input name="name" required maxLength={200} defaultValue={offer.name} className={input}/></label>
      <label className="block">Descrição<textarea name="description" defaultValue={offer.description || ''} className={input}/></label>
      <label className="block">Imagem (HTTPS, opcional)<input name="thumbnail" type="url" defaultValue={offer.thumbnail_url || ''} className={input}/></label>
      <label className="block">Dias de acesso após a compra (vazio = vitalício)<input name="access_days" type="number" min={1} max={3650} defaultValue={offer.access_days ?? ''} className={input}/></label>
      <select name="status" defaultValue={offer.status} className="bg-zinc-900 p-2"><option value="draft">Rascunho</option><option value="published">À venda</option><option value="archived">Arquivado</option></select>
      <button className={`block ${button}`}>Salvar oferta</button>
    </form>

    <form action={saveCourses} className="glass-panel rounded-xl p-6 space-y-4"><input type="hidden" name="offerId" value={offer.id}/>
      <h2 className="text-xl text-white">Cursos incluídos</h2>
      {(courses || []).filter(c => c.status !== 'archived' || included.has(c.id)).map(c => <label key={c.id} className="flex gap-3 items-center">
        <input type="checkbox" name="courses" value={c.id} defaultChecked={included.has(c.id)}/>{c.title} <small className="text-zinc-400">{courseStatus[c.status] || c.status}</small>
      </label>)}
      <button className={`block ${button}`}>Salvar cursos</button>
    </form>

    <form action={savePrice} className="glass-panel rounded-xl p-6 space-y-4"><input type="hidden" name="offerId" value={offer.id}/>
      <h2 className="text-xl text-white">Preço</h2>
      <p className="text-zinc-400">{price ? `Atual: ${formatMoney(price.amount_cents, price.currency)}.` : 'Nenhum preço definido.'} Pagamento à vista por Pix ou cartão. Um novo preço vale para as próximas compras; pedidos já criados mantêm o valor original.</p>
      <div className="flex gap-3 items-end">
        <label className="block flex-1">Valor (R$)<input name="amount" required inputMode="decimal" placeholder="199,90" className={input}/></label>
        <button className={button}>Salvar preço</button>
      </div>
    </form>

    <section className="glass-panel rounded-xl p-6 space-y-4"><h2 className="text-xl text-white">Últimos pedidos</h2>
      {orders.map(o => {
        const buyer = Array.isArray(o.profiles) ? o.profiles[0] : o.profiles
        return <div key={o.id} className="flex justify-between gap-4 border-t border-zinc-800 pt-3">
          <span>{buyer?.full_name || buyer?.email} <small className="text-zinc-400">{buyer?.email} · {dateTime.format(new Date(o.created_at))}</small></span>
          <span className="text-zinc-400">{formatMoney(o.total_cents, o.currency)} · {orderStatus[o.status] || o.status}</span>
        </div>
      })}
      {!orders.length && <p className="text-zinc-400">Nenhum pedido ainda.</p>}
    </section>
  </div>
}
