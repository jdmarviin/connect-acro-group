import RefreshStatus from '@/components/RefreshStatus'
import Link from 'next/link'
import { getData } from '@/lib/data'
import type { AppProduct } from '@/lib/data/types'
import { currentUser } from '@/lib/auth'
import { hasMeetingAccess } from '@/lib/access'
import { redirect } from 'next/navigation'

export default async function ProdutosPage() {
  const user = await currentUser()
  if (!user) redirect('/auth')

  const db = await getData()
  const active = hasMeetingAccess(user)

  // Fetch products
  let products: AppProduct[] = []
  try {
    const productsResult = await db.find({ collection: 'products', pagination: false })
    products = productsResult.docs
  } catch (err) {
    console.error('Error fetching products:', err)
  }

  return (
    <div className="max-w-5xl mx-auto px-6 pt-12 pb-32 space-y-8">
      <RefreshStatus />
      
      <header>
        <h1 className="text-3xl font-bold text-white">Produtos e Assinaturas</h1>
      </header>

      {!active && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl">
          <p className="font-bold">Seu período de acesso gratuito às reuniões ao vivo expirou.</p>
          <p>Para continuar participando, por favor, assine um dos nossos produtos abaixo.</p>
        </div>
      )}

      {products.length === 0 ? (
        <p>Nenhum produto disponível no momento.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <div key={product.id} className="glass-panel overflow-hidden rounded-2xl flex flex-col border border-white/5 bg-acro-dark/50">
              {product.thumbnailUrl && (
                <img src={product.thumbnailUrl} alt={product.name} className="w-full h-48 object-cover" />
              )}
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="font-semibold text-white text-xl">{product.name}</h3>
                {product.description && <p className="text-sm mt-3 text-acro-silver flex-grow leading-relaxed">{product.description}</p>}
                <a href={product.checkoutUrl} target="_blank" rel="noopener noreferrer" className="mt-6 text-center bg-gradient-to-r from-acro-blue-light to-acro-blue hover:from-acro-blue hover:to-acro-blue-light text-white px-5 py-3 rounded-xl font-medium block transition-all shadow-lg shadow-acro-blue/20">
                  Assinar agora
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {!active && (
        <div className="mt-8 text-center">
          <Link href="/dashboard" className="text-acro-silver underline hover:text-white">
            Ver meu histórico de reuniões
          </Link>
        </div>
      )}
    </div>
  )
}
