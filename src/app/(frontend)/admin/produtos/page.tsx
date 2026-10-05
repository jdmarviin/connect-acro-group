import { requireAdmin } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
async function saveProduct(data:FormData) {
  'use server'
  await requireAdmin()
  const name=String(data.get('name')||'').trim()
  const checkout=String(data.get('checkout')||'')
  const thumbnail=String(data.get('thumbnail')||'')
  if(!name||![checkout,thumbnail].every(value=>{try{return new URL(value).protocol==='https:'}catch{return false}})) throw new Error('Informe nome e links HTTPS válidos.')
  const client=await supabaseServer()
  const product={name,description:String(data.get('description')||''),thumbnail_url:thumbnail,external_checkout_url:checkout,status:String(data.get('status'))}
  const id=String(data.get('id')||'')
  const {error}=id?await client.from('products').update(product).eq('id',id):await client.from('products').insert(product)
  if(error) throw new Error('Não foi possível salvar o produto.')
  revalidatePath('/admin/produtos'); revalidatePath('/dashboard/produtos')
}
export default async function ProductsAdmin() {
  await requireAdmin()
  const client=await supabaseServer()
  const {data:products,error}=await client.from('products').select('*').order('created_at',{ascending:false})
  if(error) throw new Error('Não foi possível carregar produtos.')
  return <div className="max-w-3xl mx-auto p-8 pb-32 space-y-8"><h1 className="text-3xl font-bold text-white">Produtos</h1>
    {[null,...(products||[])].map(p=><form key={p?.id||'new'} action={saveProduct} className="glass-panel rounded-xl p-6 space-y-4">
      <h2>{p?'Editar produto':'Novo produto'}</h2><input type="hidden" name="id" value={p?.id||''}/>
      <label className="block">Nome<input name="name" required defaultValue={p?.name} className="block p-2 bg-zinc-900 w-full"/></label>
      <label className="block">Descrição<textarea name="description" defaultValue={p?.description||''} className="block p-2 bg-zinc-900 w-full"/></label>
      <label className="block">Imagem (HTTPS)<input name="thumbnail" type="url" required defaultValue={p?.thumbnail_url||''} className="block p-2 bg-zinc-900 w-full"/></label>
      <label className="block">Checkout (HTTPS)<input name="checkout" type="url" required defaultValue={p?.external_checkout_url||''} className="block p-2 bg-zinc-900 w-full"/></label>
      <select name="status" defaultValue={p?.status||'draft'} className="bg-zinc-900 p-2"><option value="draft">Rascunho</option><option value="published">Publicado</option><option value="archived">Arquivado</option></select>
      <button className="block bg-acro-blue text-white px-5 py-2 rounded-xl">Salvar</button>
    </form>)}
  </div>
}
