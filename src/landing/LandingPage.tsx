import { Link } from "../routing/Link";
import { loginPathFor, PATHS } from "../routing/routes";
import { ArckyuWordmark } from "../ui/ArckyuWordmark";
import { AppShotsSection } from "./AppShotsSection";
import { LandingDemo } from "./LandingDemo";
import { CtaLink } from "./landingParts";
import { FaqSection, FeaturesSection, HowItWorksSection, PricingSection, TemplatesSection } from "./LandingSections";
import "./landing.css";

const NAV = [["#por-dentro", "Por dentro"], ["#recursos", "Recursos"], ["#como-funciona", "Como funciona"], ["#modelos", "Modelos"], ["#precos", "Preço"], ["#perguntas", "Perguntas"]] as const;
const CHIPS = ["quadro branco", "fluxo animado", "modo play", "export em vídeo"];

/** Rodapé comum da landing e das páginas legais. */
export const SiteFooter = () => (
  <footer className="site-footer">
    <span>© {new Date().getFullYear()} Arckyu</span>
    <nav aria-label="Rodapé">
      <Link href={PATHS.terms}>Termos de uso</Link>
      <Link href={PATHS.privacy}>Privacidade</Link>
      <a href="https://github.com/excalidraw/excalidraw" target="_blank" rel="noreferrer">Feito com Excalidraw</a>
    </nav>
  </footer>
);

const SiteHeader = ({ signedIn }: { signedIn: boolean }) => (
  <header className="site-header">
    <Link href={PATHS.landing} className="site-header__brand" aria-label="Arckyu, início"><ArckyuWordmark /></Link>
    <nav className="site-header__nav" aria-label="Seções">
      {NAV.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
    </nav>
    {signedIn
      ? <CtaLink href={PATHS.app}>Abrir meus desenhos</CtaLink>
      : <div className="site-header__actions"><Link className="ak-btn ak-btn--quiet" href={PATHS.login}>Entrar</Link><CtaLink href={PATHS.login}>Começar grátis</CtaLink></div>}
  </header>
);

// Pílula no meio da frase, como as fotos embutidas no texto da referência: um mini fluxo com o "y" laranja.
const InlinePill = () => (
  <svg className="hero__pill" viewBox="0 0 84 34" width="84" height="34" aria-hidden>
    <rect width="84" height="34" rx="17" style={{ fill: "var(--surface-inverse)" }} />
    <path d="M18 17 H66" style={{ stroke: "var(--ink-inverse)" }} strokeWidth={2} opacity={0.45} />
    <circle cx="26" cy="17" r="4.5" style={{ fill: "var(--brand)" }} />
    <circle cx="42" cy="17" r="4.5" style={{ fill: "var(--ink-inverse)" }} />
    <circle cx="58" cy="17" r="4.5" style={{ fill: "var(--ink-inverse)" }} />
  </svg>
);

const Hero = ({ startHref }: { startHref: (path: string) => string }) => (
  <section className="hero" aria-labelledby="hero-title">
    <div className="hero__meta"><span className="ak-label">( Diagramas de arquitetura )</span><span className="ak-label">( Beta · {new Date().getFullYear()} )</span></div>
    <div className="hero__stage">
      <p className="hero__word" aria-hidden>Arckyu</p>
      <div className="hero__chips" aria-hidden>{CHIPS.map((chip) => <span key={chip} className="ak-label">{chip}</span>)}</div>
      <figure className="hero__demo"><LandingDemo /></figure>
    </div>
    <div className="hero__intro">
      <div className="hero__features">
        <span className="ak-label">recursos:</span>
        <div><span className="ak-tag">Fluxo animado</span><span className="ak-tag">Modo play</span><span className="ak-tag">Export</span></div>
      </div>
      <div>
        <h1 id="hero-title" className="hero__lead">
          Arckyu mostra o dado andando: desenhe a arquitetura <InlinePill />
          <span className="ak-muted"> como no quadro branco, ligue os componentes e aperte play para ver cada requisição <em>atravessar o sistema</em>.</span>
        </h1>
        <div className="hero__actions">
          <CtaLink href={startHref(PATHS.app)} large>Começar grátis</CtaLink>
          <a className="ak-btn ak-btn--lg" href="#como-funciona">Ver como funciona</a>
        </div>
        <p className="hero__note ak-muted">Entre com Google ou GitHub. Sem cartão de crédito.</p>
      </div>
    </div>
  </section>
);

/** Página pública: apresenta o produto e leva para o login (ou direto para o app, se já estiver logado). */
export const LandingPage = ({ signedIn }: { signedIn: boolean }) => {
  const startHref = (path: string) => (signedIn ? path : loginPathFor(path));
  return (
    <div className="landing">
      <SiteHeader signedIn={signedIn} />
      <main>
        <Hero startHref={startHref} />
        <AppShotsSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TemplatesSection startHref={startHref} />
        <PricingSection startHref={startHref} />
        <FaqSection />
        <section className="landing-cta" aria-labelledby="cta-title">
          <span className="ak-label" style={{ color: "inherit", opacity: 0.75 }}>( Comece agora )</span>
          <h2 id="cta-title">Seu próximo diagrama pode <em>explicar sozinho</em>.</h2>
          <CtaLink href={startHref(PATHS.app)} large>Começar grátis</CtaLink>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};
