import { requireAdmin } from '@/lib/auth'
import { getData } from '@/lib/data'
import Link from 'next/link'
export default async function UsersPage() {
  await requireAdmin()
  const db=await getData()
  const {docs}=await db.find({collection:'users',pagination:false})
  return <div className="max-w-5xl mx-auto p-8 pb-32 space-y-6"><h1 className="text-3xl text-white font-bold">Usuários</h1>
    {docs.map(u=><article key={u.id} className="glass-panel p-4 rounded-xl"><p>{u.name} · {u.email}</p><p>{u.role} · {u.journeyStatus||'Cadastro'}</p>{u.role==='user'&&<Link className="underline" href={`/admin/users/${u.id}`}>Abrir histórico</Link>}</article>)}
  </div>
}
