export default function Loading() {
  return <div role="status" aria-live="polite" className="max-w-5xl mx-auto p-8 space-y-6 animate-pulse">
    <p className="text-acro-silver-dark">Carregando painel…</p>
    <div className="h-8 w-56 rounded-lg bg-white/10" />
    <div className="grid sm:grid-cols-3 gap-4">{[0, 1, 2].map(i => <div key={i} className="h-28 rounded-2xl bg-white/5" />)}</div>
  </div>
}
