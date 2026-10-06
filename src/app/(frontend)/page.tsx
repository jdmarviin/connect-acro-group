import Link from "next/link";
import {
  Activity, BarChart3, Check, Clock3, LockKeyhole, Menu, MessageCircle,
  Play, Radio, ShieldCheck, Sparkles, Target, TrendingUp, UserRoundCheck,
  UsersRound, Video,
} from "lucide-react";
import { getDictionary, Locale } from "@/i18n/dictionaries";
import { cookies } from "next/headers";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LandingAccount from "@/components/LandingAccount";

function Brand() {
  return (
    <Link href="/" className="landing-brand" aria-label="Acro Group — paj dakèy">
      <span className="landing-brand-mark">A</span>
      <span className="landing-brand-name">ACRO <strong>GROUP</strong></span>
    </Link>
  );
}

function MarketChart() {
  const candles = [
    [44, 76, 57, 68], [70, 92, 75, 84], [88, 116, 94, 104],
    [96, 128, 118, 108], [102, 142, 112, 134], [125, 158, 147, 136],
    [128, 176, 142, 166], [153, 190, 181, 163], [170, 205, 192, 183],
    [176, 220, 187, 211], [200, 238, 229, 211], [216, 261, 252, 229],
  ];

  return (
    <svg viewBox="0 0 540 290" role="img" aria-label="Grafik mache k ap monte" className="market-chart">
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1479ff" stopOpacity=".28" />
          <stop offset="100%" stopColor="#1479ff" stopOpacity="0" />
        </linearGradient>
        <filter id="lineGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {[48, 104, 160, 216].map((y) => <line key={`h-${y}`} x1="0" y1={y} x2="540" y2={y} className="chart-grid-line" />)}
      {[70, 160, 250, 340, 430, 520].map((x) => <line key={`v-${x}`} x1={x} y1="10" x2={x} y2="276" className="chart-grid-line" />)}
      <path d="M0 240 C45 235 62 218 95 220 S148 198 182 203 S236 171 270 177 S326 143 361 151 S410 111 442 118 S492 65 540 43 L540 290 L0 290 Z" fill="url(#chartFill)" />
      <path d="M0 240 C45 235 62 218 95 220 S148 198 182 203 S236 171 270 177 S326 143 361 151 S410 111 442 118 S492 65 540 43" className="chart-main-line" filter="url(#lineGlow)" />
      {candles.map(([top, bottom, open, close], index) => {
        const x = 45 + index * 41;
        const rising = close > open;
        const rectY = Math.min(290 - open, 290 - close);
        const height = Math.max(Math.abs(close - open), 7);
        return <g key={x} className={rising ? "candle-up" : "candle-down"}><line x1={x} y1={290 - bottom} x2={x} y2={290 - top} /><rect x={x - 5} y={rectY} width="10" height={height} rx="2" /></g>;
      })}
    </svg>
  );
}

export default async function Home() {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value as Locale;
  const locale: Locale = localeCookie === "pt" ? "pt" : "ht";
  const t = getDictionary(locale).landing;

  const features = [
    { icon: Video, title: t.featureLiveTitle, description: t.featureLiveDesc, accent: "blue" },
    { icon: Activity, title: t.featureDataTitle, description: t.featureDataDesc, accent: "cyan" },
    { icon: Target, title: t.featureLeadTitle, description: t.featureLeadDesc, accent: "violet" },
    { icon: ShieldCheck, title: t.featureSafeTitle, description: t.featureSafeDesc, accent: "green" },
  ];
  const steps = [
    { number: "01", icon: UserRoundCheck, title: t.step1Title, description: t.step1Desc },
    { number: "02", icon: Radio, title: t.step2Title, description: t.step2Desc },
    { number: "03", icon: TrendingUp, title: t.step3Title, description: t.step3Desc },
  ];
  const faqs = [[t.faq1Question, t.faq1Answer], [t.faq2Question, t.faq2Answer], [t.faq3Question, t.faq3Answer], [t.faq4Question, t.faq4Answer]];

  return (
    <div className="landing-page">
      <div className="landing-ambient landing-ambient-one" /><div className="landing-ambient landing-ambient-two" />
      <header className="landing-header-wrap">
        <div className="landing-header">
          <Brand />
          <nav className="landing-nav" aria-label={t.mainNavLabel}>
            <a href="#platform">{t.navPlatform}</a><a href="#features">{t.navFeatures}</a><a href="#how-it-works">{t.navHow}</a><a href="#faq">{t.navFaq}</a>
          </nav>
          <div className="landing-header-actions">
            <LanguageSwitcher currentLocale={locale} />
            <LandingAccount loginLabel={t.loginZoom} dashboardLabel={t.dashboardBtn} />
            <details className="landing-mobile-menu">
              <summary aria-label={t.openMenuLabel}><Menu aria-hidden="true" /></summary>
              <nav aria-label={t.mobileNavLabel}><a href="#platform">{t.navPlatform}</a><a href="#features">{t.navFeatures}</a><a href="#how-it-works">{t.navHow}</a><a href="#faq">{t.navFaq}</a></nav>
            </details>
          </div>
        </div>
      </header>

      <div>
        <section className="landing-hero" aria-labelledby="hero-title">
          <div className="landing-hero-copy">
            <div className="landing-live-badge"><span className="live-dot" />{t.badge}</div>
            <p className="landing-eyebrow">{t.eyebrow}</p>
            <h1 id="hero-title">{t.title1} <span>{t.title2}</span></h1>
            <p className="landing-hero-subtitle">{t.subtitle}</p>
            <div className="landing-hero-actions">
              <Link href="/auth" className="landing-primary-button"><Sparkles aria-hidden="true" />{t.trialBtn}</Link>
              <a href="#how-it-works" className="landing-secondary-button"><Play aria-hidden="true" fill="currentColor" />{t.watchHow}</a>
            </div>
            <div className="landing-proof">
              <div className="landing-avatars" aria-hidden="true">{["AM", "JR", "KL", "MS"].map((name) => <span key={name}>{name}</span>)}</div>
              <p><strong>{t.socialProof}</strong><span>{t.socialProofText}</span></p>
            </div>
          </div>

          <div className="market-visual" id="platform">
            <div className="market-glow" />
            <div className="market-topbar"><div><span className="market-symbol">ACRO / LIVE</span><small>{t.visualSession}</small></div><span className="market-live"><i /> LIVE</span></div>
            <div className="market-metric-row"><div><small>{t.visualEngagement}</small><strong>87%</strong></div><div><small>{t.visualWatchTime}</small><strong>08h 42m</strong></div><span className="market-change">+12.4%</span></div>
            <MarketChart />
            <div className="market-footer-row"><span><i className="blue-dot" /> {t.visualRealtime}</span><span>{t.visualUpdated}</span></div>
            <div className="market-floating-card"><span><UsersRound aria-hidden="true" /></span><div><small>{t.visualActive}</small><strong>36</strong></div><em>+8</em></div>
          </div>
        </section>

        <section className="landing-stats" aria-label={t.statsLabel}>
          <div><strong>30</strong><span>{t.statDays}</span></div><div><strong>100%</strong><span>{t.statOnline}</span></div><div><strong>24/7</strong><span>{t.statHistory}</span></div><div><strong>1</strong><span>{t.statPanel}</span></div>
        </section>

        <section className="landing-section landing-feature-section" id="features">
          <div className="landing-section-heading"><div><p className="landing-eyebrow">{t.featuresEyebrow}</p><h2>{t.featuresTitle}</h2></div><p>{t.featuresIntro}</p></div>
          <div className="landing-feature-grid">
            {features.map(({ icon: Icon, title, description, accent }, index) => <article className={`landing-feature-card accent-${accent}`} key={title}><div className="landing-feature-icon"><Icon aria-hidden="true" /></div><h3>{title}</h3><p>{description}</p><span className="feature-index">0{index + 1}</span></article>)}
          </div>
        </section>

        <section className="landing-insight-section">
          <div className="landing-insight-copy"><p className="landing-eyebrow">{t.insightEyebrow}</p><h2>{t.insightTitle}</h2><p>{t.insightDesc}</p><ul>{[t.insightPoint1, t.insightPoint2, t.insightPoint3].map((point) => <li key={point}><span><Check aria-hidden="true" /></span>{point}</li>)}</ul></div>
          <div className="landing-dashboard-card" aria-label={t.dashboardPreviewLabel}>
            <div className="dashboard-card-header"><div><span>{t.dashboardTitle}</span><small>{t.dashboardPeriod}</small></div><button type="button" aria-label={t.dashboardFilterLabel}>30 {t.daysShort}</button></div>
            <div className="dashboard-kpis"><div><Clock3 aria-hidden="true" /><span><small>{t.dashboardTime}</small><strong>42h 18m</strong></span></div><div><UsersRound aria-hidden="true" /><span><small>{t.dashboardParticipants}</small><strong>128</strong></span></div><div><BarChart3 aria-hidden="true" /><span><small>{t.dashboardRate}</small><strong>76%</strong></span></div></div>
            <div className="dashboard-bars" aria-hidden="true">{[38, 54, 46, 68, 58, 78, 72, 91, 82, 100].map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}</div>
            <div className="dashboard-legend"><span>{t.dashboardMon}</span><span>{t.dashboardWed}</span><span>{t.dashboardFri}</span><span>{t.dashboardSun}</span></div>
            <div className="dashboard-lead"><span className="lead-avatar">JM</span><div><strong>Jean Marc</strong><small>{t.dashboardLeadStatus}</small></div><span className="lead-score">92/100</span></div>
          </div>
        </section>

        <section className="landing-section landing-steps-section" id="how-it-works">
          <div className="landing-centered-heading"><p className="landing-eyebrow">{t.howEyebrow}</p><h2>{t.howTitle}</h2><p>{t.howIntro}</p></div>
          <div className="landing-steps-grid">{steps.map(({ number, icon: Icon, title, description }, index) => <article className="landing-step" key={number}><span className="step-number">{number}</span><div className="step-icon"><Icon aria-hidden="true" /></div><h3>{title}</h3><p>{description}</p>{index < steps.length - 1 && <span className="step-connector" aria-hidden="true" />}</article>)}</div>
        </section>

        <section className="landing-security-strip"><div className="security-icon"><LockKeyhole aria-hidden="true" /></div><div><h2>{t.securityTitle}</h2><p>{t.securityDesc}</p></div><div className="security-tags"><span><ShieldCheck /> {t.securityTag1}</span><span><Video /> {t.securityTag2}</span></div></section>

        <section className="landing-section landing-faq-section" id="faq">
          <div className="landing-faq-heading"><p className="landing-eyebrow">{t.faqEyebrow}</p><h2>{t.faqTitle}</h2><p>{t.faqIntro}</p><a href="mailto:contato@acrogroup.com"><MessageCircle aria-hidden="true" /> {t.faqContact}</a></div>
          <div className="landing-faq-list">{faqs.map(([question, answer], index) => <details key={question} open={index === 0}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div>
        </section>

        <section className="landing-cta-section">
          <div className="cta-chart" aria-hidden="true"><MarketChart /></div><div className="landing-live-badge"><span className="live-dot" />{t.ctaBadge}</div><h2>{t.ctaTitle}</h2><p>{t.ctaDesc}</p><Link href="/auth" className="landing-primary-button"><Sparkles aria-hidden="true" />{t.ctaButton}</Link><small>{t.ctaNote}</small>
        </section>
      </div>

      <footer className="landing-footer">
        <div className="landing-footer-top">
          <div className="footer-brand-column"><Brand /><p>{t.footerDesc}</p><div className="footer-socials" aria-label={t.socialLabel}><a href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram"><span aria-hidden="true">IG</span></a><a href="https://www.youtube.com/" target="_blank" rel="noreferrer" aria-label="YouTube"><span aria-hidden="true">YT</span></a><a href="https://www.facebook.com/" target="_blank" rel="noreferrer" aria-label="Facebook"><span aria-hidden="true">FB</span></a><a href="https://www.linkedin.com/" target="_blank" rel="noreferrer" aria-label="LinkedIn"><span aria-hidden="true">IN</span></a></div></div>
          <div className="footer-links"><h3>{t.footerProduct}</h3><a href="#platform">{t.navPlatform}</a><a href="#features">{t.navFeatures}</a><a href="#how-it-works">{t.navHow}</a></div>
          <div className="footer-links"><h3>{t.footerAccess}</h3><Link href="/auth">{t.footerLogin}</Link><Link href="/dashboard">{t.dashboardBtn}</Link><a href="#faq">{t.navFaq}</a></div>
          <div className="footer-links"><h3>{t.footerContact}</h3><a href="mailto:contato@acrogroup.com">contato@acrogroup.com</a><span>{t.footerRemote}</span></div>
        </div>
        <div className="landing-footer-bottom"><p>© {new Date().getFullYear()} Acro Group. {t.footerRights}</p><p>{t.footerDisclaimer}</p></div>
      </footer>
    </div>
  );
}
