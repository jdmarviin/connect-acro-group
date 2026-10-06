import Link from "next/link";
import { CheckCircle2, ArrowRight, Video } from "lucide-react";

const errors: Record<string, string> = {
  oauth_provider: 'O Zoom não concluiu a autorização. Tente novamente.',
  oauth_code_missing: 'O retorno do login veio sem o código de autorização. Inicie novamente.',
  oauth_session: 'Não foi possível concluir a sessão. Inicie e finalize o login no mesmo endereço, sem trocar entre localhost e ngrok.',
  oauth_identity: 'A conta Zoom não corresponde ao cadastro ou está indisponível.',
}

export default async function AuthPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <div className="w-full max-w-md glass-panel p-8 md:p-10 rounded-3xl flex flex-col items-center text-center relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-acro-blue/20 blur-[60px] rounded-full pointer-events-none" />
        
        <div className="w-16 h-16 bg-acro-blue/10 border border-acro-blue/20 rounded-2xl flex items-center justify-center mb-6 text-acro-blue-light">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">
          30 dias de acesso gratuito
        </h2>
        <p className="text-acro-silver-dark text-sm mb-8">
          Para ativar seu período de teste e acessar a sala de operações ao vivo, faça login com sua conta do Zoom.
        </p>

        {/* Zoom Login Button */}
        {error && <p role="alert" className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{errors[error] || 'Não foi possível entrar. Tente novamente.'}</p>}
        <a
          href="/api/auth/zoom"
          className="w-full group relative inline-flex items-center justify-center gap-3 px-6 py-4 bg-acro-blue text-white rounded-xl font-bold hover:bg-acro-blue-light transition-all shadow-lg shadow-acro-blue/20 active:scale-[0.98]"
        >
          <Video className="w-5 h-5" />
          Autenticar com Zoom
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </a>

        <p className="mt-8 text-xs text-acro-silver-dark/60">
          Ao continuar, você concorda com nossos Termos de Serviço.
        </p>
      </div>
    </div>
  );
}
