import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { currentPrice, formatMoney, type ProductPrice } from '@/lib/products'
import { supabaseServer } from '@/lib/supabase/server'

const statusLabel: Record<string, string> = { draft: 'Rascunho', published: 'À venda', archived: 'Arquivado' }

async function createOffer(data: FormData) {
  'use server'
  await requireAdmin()
  const client = await supabaseServer()
  const { data: course } = await client.from('courses').select('id,title,description').eq('id', String(data.get('courseId'))).maybeSingle()
  if (!course) throw new Error('Selecione um curso.')
  const { data: offer, error } = await client.from('products')
    .insert({ name: course.title, description: course.description, checkout_mode: 'internal' }).select('id').single()
  if (error || !offer) throw new Error('Não foi possível criar a oferta.')
  const { error: linkError } = await client.from('product_courses').insert({ product_id: offer.id, course_id: course.id })
  if (linkError) throw new Error('A oferta foi criada, mas o curso não foi vinculado. Vincule-o na página da oferta.')
  revalidatePath('/admin/catalogo')
  redirect(`/admin/catalogo/${offer.id}`)
}

export default async function CatalogAdmin() {
  await requireAdmin()
  const client = await supabaseServer()
  const [{ data: offers, error }, { data: courses }] = await Promise.all([
    client.from('products')
      .select('id,name,status,product_courses(course_id),product_prices(amount_cents,currency,installments_max,is_active,valid_from,valid_until)')
      .eq('checkout_mode', 'internal').order('created_at', { ascending: false }),
    client.from('courses').select('id,title').neq('status', 'archived').order('title'),
  ])
  if (error) throw new Error('Não foi possível carregar o catálogo.')
  return <div className="max-w-3xl mx-auto p-8 pb-32 space-y-8"><h1 className="text-3xl font-bold text-white">Catálogo de cursos</h1>
    <form action={createOffer} className="glass-panel rounded-xl p-6 space-y-4">
      <h2>Colocar curso à venda</h2>
      <p className="text-zinc-400">O curso precisa existir antes de ir para o catálogo. <Link href="/admin/cursos" className="text-acro-blue hover:underline">Criar novo curso</Link></p>
      <label className="block">Curso
        <select name="courseId" required defaultValue="" className="block p-2 bg-zinc-900 w-full">
          <option value="" disabled>Selecione…</option>
          {(courses || []).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </label>
      <button className="block bg-acro-blue text-white px-5 py-2 rounded-xl">Criar oferta</button>
    </form>
    {(offers || []).map(offer => {
      const price = currentPrice(offer.product_prices as ProductPrice[])
      return <Link key={offer.id} href={`/admin/catalogo/${offer.id}`} className="glass-panel rounded-xl p-6 flex justify-between gap-4 hover:border-acro-blue">
        <span className="text-white font-semibold">{offer.name}</span>
        <span className="text-zinc-400">{price ? formatMoney(price.amount_cents, price.currency) : 'Sem preço'} · {offer.product_courses.length} cursos · {statusLabel[offer.status] || offer.status}</span>
      </Link>
    })}
  </div>
}
