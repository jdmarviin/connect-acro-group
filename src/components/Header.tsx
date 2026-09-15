import { cookies } from 'next/headers'
import { currentUser } from '@/lib/auth'
import Image from 'next/image'
import LanguageSwitcher from './LanguageSwitcher'
import { getDictionary, Locale } from '@/i18n/dictionaries'

export default async function Header() {
  const cookieStore = await cookies()
  
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value as Locale;
  const locale = localeCookie === "ht" ? "ht" : "pt";
  const t = getDictionary(locale).header;

  const user = await currentUser();

  if (!user) {
    return null;
  }


  const userName = user.name || 'Usuário'

  const userAvatar = user.avatar_url || ''

  return (
    <header className="w-full glass-panel border-b border-white/5 py-4 px-6 flex justify-between items-center sticky top-0 z-40 bg-acro-dark/80 backdrop-blur-md">
      <div className="text-xl font-bold tracking-tighter text-white flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-acro-blue-light to-acro-blue flex items-center justify-center font-bold text-sm">
          A
        </div>
        <span className="opacity-90 hidden sm:inline">CONNECT <span className="text-sm font-normal text-acro-silver-dark">by ACRO GROUP</span></span>
      </div>

      <div className="flex items-center gap-6">
        <LanguageSwitcher currentLocale={locale} />
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold text-white">{userName}</div>
            <div className="text-xs text-acro-silver-dark">{user.role === 'admin' ? t.admin : t.participant}</div>
          </div>
          
          {userAvatar ? (
            <Image 
              src={userAvatar} 
              alt={`Avatar de ${userName}`} 
              width={40} 
              height={40} 
              className="w-10 h-10 rounded-full border-2 border-acro-blue/30 object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-acro-blue/20 text-acro-blue-light flex items-center justify-center font-bold border border-acro-blue/30">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
