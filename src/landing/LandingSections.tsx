import { ArrowUpRight, Check, Clapperboard, FolderTree, Image, Layers, MonitorPlay, PenTool, Zap, type LucideIcon } from "lucide-react";
import { Link } from "../routing/Link";
import { CtaLink, SectionHead } from "./landingParts";

type Feature = { Icon: LucideIcon; title: string; text: string; size: "wide" | "half" | "third"; inverse?: boolean };

// Bento: larguras diferentes que fecham linhas de 6 colunas (4+2, 2+2+2, 3+3); o play é o bloco invertido.
const FEATURES: readonly Feature[] = [
  { Icon: MonitorPlay, title: "Modo play", text: "Grave cenários clicando nos componentes em ordem e aperte play: a requisição atravessa o sistema passo a passo.", size: "wide", inverse: true },
  { Icon: Zap, title: "Fluxo animado", text: "Bolinhas percorrem cada seta no sentido do dado. Síncrono, assíncrono e respostas ficam claros à primeira vista.", size: "third" },
  { Icon: PenTool, title: "Quadro branco de verdade", text: "Traço à mão, notas e formas livres do Excalidraw. Arquitetura e rascunho no mesmo lugar.", size: "third" },
  { Icon: Image, title: "Ícones reais", text: "AWS, bancos, filas e frameworks com o logo oficial. Não achou? Crie o item e envie o seu ícone.", size: "third" },
  { Icon: Layers, title: "Fronteiras C4", text: "Agrupe containers em contextos e ambientes sem cortar as setas que cruzam a borda.", size: "third" },
  { Icon: Clapperboard, title: "Exporte a animação", text: "Vídeo MP4 em Full HD ou 4K para apresentações, ou SVG animado em loop para README e documentação.", size: "half" },
  { Icon: FolderTree, title: "Seus desenhos organizados", text: "Vários desenhos por conta, coleções, busca e miniaturas. Tudo salvo sozinho enquanto você desenha.", size: "half" },
];

const STEPS = [
  { title: "Desenhe e conecte", text: "Arraste componentes da paleta e ligue com setas. Seta entre dois componentes já nasce animada." },
  { title: "Grave o cenário", text: "Clique nos componentes na ordem da requisição. Saltos são completados pelo menor caminho." },
  { title: "Aperte play e compartilhe", text: "Mostre o fluxo ao vivo para o time ou exporte em vídeo e SVG para a documentação." },
];

const FAQ = [
  { q: "Preciso instalar alguma coisa?", a: "Não. O Arckyu roda no navegador; basta entrar com sua conta Google ou GitHub." },
  { q: "Onde ficam meus desenhos?", a: "Na sua conta, num banco de dados na nuvem (Supabase). Só você acessa os seus desenhos." },
  { q: "É baseado no Excalidraw?", a: "Sim. O quadro branco é o Excalidraw (código aberto, licença MIT); o Arckyu acrescenta a camada de arquitetura: ícones, fluxo animado, play e export." },
  { q: "Consigo exportar?", a: "Imagem PNG/SVG pelo menu do quadro, e a animação (fundo ou play de um cenário) em vídeo MP4 ou SVG animado." },
  { q: "Dá para editar em grupo ou compartilhar por link?", a: "Ainda não. Compartilhamento por link, comentários e edição ao vivo estão no roteiro das próximas versões." },
  { q: "Quanto custa?", a: "Nada durante o beta. Quando houver planos pagos, avisaremos com antecedência quem já usa." },
];

const FeatureCard = ({ feature }: { feature: Feature }) => (
  <article className={`bento-card bento-card--${feature.size}${feature.inverse ? " bento-card--inverse" : ""}`}>
    <span className="bento-card__icon"><feature.Icon className="ak-i" /></span>
    <div>
      <h3>{feature.title}</h3>
      <p>{feature.text}</p>
    </div>
  </article>
);

export const FeaturesSection = () => (
  <section id="recursos" className="landing-section" aria-labelledby="recursos-title">
    <SectionHead label="Recursos" index="002" id="recursos-title" title={<>Tudo o que um diagrama precisa para ser <em>entendido de primeira</em></>} />
    <div className="bento">{FEATURES.map((feature) => <FeatureCard key={feature.title} feature={feature} />)}</div>
  </section>
);

export const HowItWorksSection = () => (
  <section id="como-funciona" className="landing-section landing-section--alt" aria-labelledby="como-title">
    <SectionHead label="Como funciona" index="003" id="como-title" title={<>Três passos do rascunho ao <em>fluxo em movimento</em></>} />
    <ol className="steps">
      {STEPS.map((step, index) => (
        <li key={step.title} className="step">
          <span className="step__number">{String(index + 1).padStart(2, "0")}</span>
          <h3>{step.title}</h3>
          <p>{step.text}</p>
        </li>
      ))}
    </ol>
  </section>
);

export const TemplatesSection = ({ startHref }: { startHref: (path: string) => string }) => (
  <section id="modelos" className="landing-section" aria-labelledby="modelos-title">
    <SectionHead label="Modelos" index="004" id="modelos-title" title={<>Comece de um <em>modelo pronto</em></>} />
    <div className="template-grid">
      <article className="template-card">
        <div className="template-card__top">
          <h3>Loja Nimbus · e-commerce</h3>
          <Link className="ak-round ak-round--ink" href={startHref("/app?modelo=loja-nimbus-c4")} aria-label="Abrir o modelo Loja Nimbus"><ArrowUpRight className="ak-i" /></Link>
        </div>
        <p>C4 de containers 100% AWS: checkout idempotente, pagamento com webhook, eventos no EventBridge e entrega pela fila SQS.</p>
        <div><span className="ak-tag">16 componentes</span> <span className="ak-tag">8 cenários</span></div>
      </article>
      <article className="template-card">
        <div className="template-card__top">
          <h3>Serverless na AWS</h3>
          <Link className="ak-round ak-round--ink" href={startHref("/app?modelo=serverless")} aria-label="Abrir o modelo Serverless na AWS"><ArrowUpRight className="ak-i" /></Link>
        </div>
        <p>Route 53, CloudFront, API Gateway, Lambda, Aurora e SQS dentro de uma VPC, com o cenário "GET /pedidos" pronto para o play.</p>
        <div><span className="ak-tag">8 componentes</span> <span className="ak-tag">1 cenário</span></div>
      </article>
      <article className="template-card template-card--soon">
        <h3>Mais modelos em breve</h3>
        <p>Microsserviços em Kubernetes, pipeline de dados e arquitetura multi-região.</p>
      </article>
    </div>
  </section>
);

export const PricingSection = ({ startHref }: { startHref: (path: string) => string }) => (
  <section id="precos" className="landing-section landing-section--alt" aria-labelledby="preco-title">
    <SectionHead label="Preço" index="005" id="preco-title" title={<>Grátis enquanto estiver <em>em beta</em></>} />
    <article className="price-card">
      <span><span className="ak-tag ak-tag--soft">Beta</span></span>
      <h3>R$ 0</h3>
      <p>Tudo o que existe hoje, sem limite de desenhos durante o beta.</p>
      <ul>
        {["Desenhos e coleções ilimitados", "Ícones reais e itens próprios", "Fluxo animado e modo play", "Export em vídeo e SVG animado"].map((item) => (
          <li key={item}><Check className="ak-i" /> {item}</li>
        ))}
      </ul>
      <CtaLink href={startHref("/app")}>Começar grátis</CtaLink>
    </article>
  </section>
);

export const FaqSection = () => (
  <section id="perguntas" className="landing-section" aria-labelledby="faq-title">
    <SectionHead label="Perguntas" index="006" id="faq-title" title={<>Perguntas <em>frequentes</em></>} />
    <div className="faq">
      {FAQ.map((item) => (
        <details key={item.q} className="faq__item">
          <summary>{item.q}</summary>
          <p>{item.a}</p>
        </details>
      ))}
    </div>
  </section>
);
