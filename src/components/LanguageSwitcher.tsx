"use client";

import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { Locale } from "@/i18n/dictionaries";

export default function LanguageSwitcher({ currentLocale }: { currentLocale: Locale }) {
  const router = useRouter();

  const switchLanguage = (newLocale: Locale) => {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2 border border-white/10 bg-white/5 rounded-xl p-1 relative">
      <Globe className="w-4 h-4 text-acro-silver ml-2 absolute left-0 pointer-events-none" />
      <select 
        value={currentLocale} 
        onChange={(e) => switchLanguage(e.target.value as Locale)}
        className="appearance-none bg-transparent text-sm text-white font-medium pl-8 pr-4 py-1.5 focus:outline-none cursor-pointer"
      >
        <option value="pt" className="bg-acro-dark text-white">PT</option>
        <option value="ht" className="bg-acro-dark text-white">HT</option>
      </select>
    </div>
  );
}
