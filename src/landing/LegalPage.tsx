import { Link } from "../routing/Link";
import { PATHS } from "../routing/routes";
import { ArckyuWordmark } from "../ui/ArckyuWordmark";
import { SiteFooter } from "./LandingPage";
import "./landing.css";

type LegalKind = "terms" | "privacy" | "notFound";

// Rascunho honesto: o texto jurídico final precisa de revisão antes do lançamento público.
const CONTENT: Record<LegalKind, { title: string; paragraphs: string[] }> = {
  terms: {
    title: "Termos de uso",
    paragraphs: [
      "Rascunho — texto em revisão antes do lançamento público.",
      "O Arckyu está em beta: funcionalidades podem mudar e pode haver instabilidade. Use por sua conta e mantenha cópias (exporte) do que for importante.",
      "Você é dono do que desenha. Não use o serviço para conteúdo ilegal ou que viole direitos de terceiros.",
    ],
  },
  privacy: {
    title: "Política de privacidade",
    paragraphs: [
      "Rascunho — texto em revisão antes do lançamento público.",
      "Guardamos o mínimo para a conta funcionar: nome, e-mail e foto vindos do Google ou GitHub, e os desenhos que você cria.",
      "Os desenhos ficam na sua conta e só você tem acesso. Não vendemos dados. Para apagar a conta e os desenhos, fale com a gente.",
    ],
  },
  notFound: { title: "Página não encontrada", paragraphs: ["O endereço não existe ou mudou de lugar."] },
};

/** Termos, privacidade e 404 no mesmo layout simples. */
export const LegalPage = ({ kind }: { kind: LegalKind }) => {
  const content = CONTENT[kind];
  return (
    <div className="landing">
      <header className="site-header">
        <Link href={PATHS.landing} className="site-header__brand" aria-label="Arckyu, início"><ArckyuWordmark /></Link>
        <Link className="ak-btn" style={{ marginLeft: "auto" }} href={PATHS.landing}>Voltar ao início</Link>
      </header>
      <main className="legal">
        <h1>{content.title}</h1>
        {content.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </main>
      <SiteFooter />
    </div>
  );
};
