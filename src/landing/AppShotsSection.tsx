import { SectionHead } from "./landingParts";

type Shot = { src: string; alt: string; caption: string };

// Prints reais do app com o modelo fictício Loja Nimbus (gerados por `npm run screens`).
const MAIN: Shot = { src: "/landing/editor.webp", alt: "Editor do Arckyu com a arquitetura C4 da Loja Nimbus: componentes AWS ligados por setas animadas", caption: "Editor: paleta de componentes, canvas e propriedades" };
const DETAILS: readonly Shot[] = [
  { src: "/landing/play.webp", alt: "Modo play com o caminho do webhook de pagamento aceso em verde", caption: "Modo play: o caminho da requisição acende passo a passo" },
  { src: "/landing/library.webp", alt: "Tela Meus desenhos com miniaturas e coleções", caption: "Meus desenhos: coleções, busca e miniaturas" },
  { src: "/landing/export.webp", alt: "Janela de exportar animação em vídeo ou SVG", caption: "Exportar: vídeo MP4 ou SVG animado" },
];

// Moldura de janela de navegador em volta do print, com o endereço do app.
const ShotFrame = ({ shot, large = false }: { shot: Shot; large?: boolean }) => (
  <figure className={`app-shot${large ? " app-shot--large" : ""}`}>
    <div className="app-shot__window">
      <div className="app-shot__bar" aria-hidden><span /><span /><span /><em>arckyu.app/app</em></div>
      <img src={shot.src} alt={shot.alt} width={1600} height={1000} loading={large ? "eager" : "lazy"} decoding="async" />
    </div>
    <figcaption className="ak-label">{shot.caption}</figcaption>
  </figure>
);

/** "Por dentro": prints do app de verdade, um grande e três telas de apoio. */
export const AppShotsSection = () => (
  <section id="por-dentro" className="landing-section" aria-labelledby="por-dentro-title">
    <SectionHead label="Por dentro" index="001" id="por-dentro-title" title={<>O app de verdade, <em>sem maquiagem</em></>} />
    <ShotFrame shot={MAIN} large />
    <div className="app-shots__grid">{DETAILS.map((shot) => <ShotFrame key={shot.src} shot={shot} />)}</div>
  </section>
);
