export type Locale = "pt" | "ht";

export const dictionaries = {
  pt: {
    landing: {
      loginZoom: "Entrar com Zoom",
      dashboardBtn: "Acessar Dashboard",
      badge: "Acompanhe ao vivo",
      title1: "Domine o mercado com",
      title2: "inteligência ao vivo.",
      subtitle:
        "Acompanhe as operações e reuniões ao vivo com nossos especialistas. Receba 30 dias de acesso gratuito e comprove os resultados.",
      trialBtn: "Começar meu trial de 30 dias",
      socialProof: "+500 traders",
      socialProofText: "acompanhando diariamente",
      step1Title: "1. Cadastre-se",
      step1Desc:
        "Crie sua conta em menos de 1 minuto e ganhe acesso imediato à sala de operações.",
      step2Title: "2. Assista ao vivo",
      step2Desc:
        "Participe das nossas reuniões integradas diretamente no seu painel. Sem instalar nada.",
      step3Title: "3. Evolua",
      step3Desc:
        "Acompanhe seu progresso e receba oportunidades exclusivas baseadas no seu engajamento.",
    },
    header: {
      admin: "Administrador",
      participant: "Participante",
    },
  },
  ht: {
    landing: {
      loginZoom: "Konekte ak Zoom",
      dashboardBtn: "Aksè sou Tablo",
      badge: "Swiv an dirèk",
      title1: "Domine mache a ak",
      title2: "entèlijans an dirèk.",
      subtitle:
        "Swiv operasyon ak reyinyon an dirèk avèk ekspè nou yo. Resevwa 30 jou aksè gratis epi pwouve rezilta yo.",
      trialBtn: "Kòmanse peryòd esè 30 jou mwen an",
      socialProof: "+50 Traders",
      socialProofText: "k ap swiv chak jou",
      step1Title: "1. Enskri",
      step1Desc:
        "Kreye kont ou nan mwens pase 1 minit epi jwenn aksè imedya nan sal operasyon an.",
      step2Title: "2. Gade an dirèk",
      step2Desc:
        "Patisipe nan reyinyon nou yo ki entegre dirèkteman nan panèl ou. San pa gen anyen pou enstale.",
      step3Title: "3. Evolye",
      step3Desc:
        "Swiv pwogrè ou epi resevwa opòtinite eksklizif ki baze sou angajman ou.",
    },
    header: {
      admin: "Administratè",
      participant: "Patisipan",
    },
  },
};

export const getDictionary = (locale: Locale) => {
  return dictionaries[locale] ?? dictionaries.pt;
};
