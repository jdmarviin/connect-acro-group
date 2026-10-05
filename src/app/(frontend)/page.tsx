import Link from "next/link";
import { ArrowRight, Video, Target, TrendingUp } from "lucide-react";
import { getDictionary, Locale } from "@/i18n/dictionaries";
import { cookies } from "next/headers";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LandingAccount from '@/components/LandingAccount';

export default async function Home() {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value as Locale;
  const locale = localeCookie === "ht" ? "ht" : "pt";
  const t = getDictionary(locale).landing;

  return (
    <div className="flex flex-col items-center min-h-screen pt-20 pb-12 px-6">
      
      <header className="w-full max-w-5xl flex justify-between items-center mb-24">
        <div className="text-xl font-bold tracking-tighter text-white flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-acro-blue-light to-acro-blue flex items-center justify-center font-bold">
            A
          </div>
          <span className="opacity-90 hidden sm:inline">ACROGROUP <span className="text-sm font-normal text-acro-silver-dark">Trading Room</span></span>
        </div>
        
        <div className="flex items-center gap-6">
          <LanguageSwitcher currentLocale={locale} />
          
          <LandingAccount loginLabel={t.loginZoom} dashboardLabel={t.dashboardBtn} />
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex flex-col items-center text-center max-w-4xl w-full z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-acro-blue/30 bg-acro-blue/10 text-acro-blue-light text-xs font-semibold uppercase tracking-wider mb-8">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          {t.badge}
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6">
          {t.title1} <br className="hidden md:block" />
          <span className="bg-clip-text bg-gradient-to-r from-acro-silver to-acro-silver-dark">
            {t.title2}
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-acro-silver-dark max-w-2xl mb-12">
          {t.subtitle}
        </p>

        <Link 
          href="/dashboard"
          prefetch={false}
          className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-acro-blue text-white rounded-xl font-semibold text-lg overflow-hidden transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_40px_-10px_rgba(27,84,214,0.5)] hover:shadow-[0_0_60px_-15px_rgba(27,84,214,0.7)]"
        >
          <span className="relative z-10">{t.trialBtn}</span>
          <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          <div className="absolute inset-0 bg-gradient-to-r from-acro-blue-light to-acro-blue opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>

        {/* Social Proof */}
        <div className="mt-12 flex items-center gap-4 text-sm text-acro-silver-dark">
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-acro-dark bg-acro-blue-dark flex items-center justify-center text-[10px] text-white">
                {String.fromCharCode(64 + i)}
              </div>
            ))}
          </div>
          <p>
            <strong className="text-white">{t.socialProof}</strong> {t.socialProofText}
          </p>
        </div>
      </main>

      {/* Features/How it works */}
      <section className="mt-32 w-full max-w-5xl grid md:grid-cols-3 gap-6">
        <div className="glass-panel p-8 rounded-2xl flex flex-col items-start text-left">
          <div className="w-12 h-12 rounded-xl bg-acro-blue/20 flex items-center justify-center text-acro-blue-light mb-6">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">{t.step1Title}</h3>
          <p className="text-acro-silver-dark text-sm leading-relaxed">
            {t.step1Desc}
          </p>
        </div>

        <div className="glass-panel p-8 rounded-2xl flex flex-col items-start text-left">
          <div className="w-12 h-12 rounded-xl bg-acro-blue/20 flex items-center justify-center text-acro-blue-light mb-6">
            <Video className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">{t.step2Title}</h3>
          <p className="text-acro-silver-dark text-sm leading-relaxed">
            {t.step2Desc}
          </p>
        </div>

        <div className="glass-panel p-8 rounded-2xl flex flex-col items-start text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-acro-blue/10 blur-3xl rounded-full" />
          <div className="w-12 h-12 rounded-xl bg-acro-blue/20 flex items-center justify-center text-acro-blue-light mb-6">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">{t.step3Title}</h3>
          <p className="text-acro-silver-dark text-sm leading-relaxed">
            {t.step3Desc}
          </p>
        </div>
      </section>
      
      {/* Background ambient light */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-acro-blue/20 blur-[120px] rounded-full pointer-events-none -z-10 opacity-50" />
    </div>
  );
}
