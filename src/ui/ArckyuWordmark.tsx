import { useId } from "react";
import { Y_ADVANCE, Y_BOX, Y_COLORS, Y_PATH, Y_TIP_CLIP } from "../brand/yGlyph";

const EM = 1000;
// O "y" é o glifo da própria Space Grotesk desenhado em SVG (só para pintar a ponta); estas medidas o encaixam
// no texto: altura do glifo, quanto desce abaixo da linha de base e as laterais do avanço.
const HEIGHT_EM = Y_BOX.height / EM;
const BELOW_BASELINE_EM = (Y_BOX.y + Y_BOX.height) / EM;
const LEFT_BEARING_EM = Y_BOX.x / EM;
const RIGHT_BEARING_EM = (Y_ADVANCE - Y_BOX.x - Y_BOX.width) / EM;
const TRACKING_EM = -0.02;

/** Nome "Arckyu" em Space Grotesk; o "y" é laranja com a ponta da cauda creme. Herda tamanho e cor do texto. */
export const ArckyuWordmark = () => {
  const clipId = useId();
  return (
    <span className="arckyu-wordmark" aria-label="Arckyu" role="img">
      <span aria-hidden="true">Arck</span>
      <svg viewBox={`${Y_BOX.x} ${Y_BOX.y} ${Y_BOX.width} ${Y_BOX.height}`} aria-hidden="true"
        style={{
          height: `${HEIGHT_EM}em`, verticalAlign: `-${BELOW_BASELINE_EM}em`,
          marginLeft: `${LEFT_BEARING_EM}em`, marginRight: `${RIGHT_BEARING_EM + TRACKING_EM}em`,
        }}>
        <defs>
          <clipPath id={`${clipId}-glyph`}><path d={Y_PATH} /></clipPath>
          <clipPath id={clipId}><rect x={Y_TIP_CLIP.x} y={Y_TIP_CLIP.y} width={Y_TIP_CLIP.width} height={Y_TIP_CLIP.height} /></clipPath>
        </defs>
        <path d={Y_PATH} fill={Y_COLORS.body} />
        {/* Borda recortada pelo glifo: a ponta pintada não sai da silhueta original. */}
        <g clipPath={`url(#${clipId}-glyph)`}>
          <path d={Y_PATH} fill={Y_COLORS.tip} stroke={Y_COLORS.tipEdge} strokeWidth={22} strokeLinejoin="round" clipPath={`url(#${clipId})`} />
        </g>
      </svg>
      <span aria-hidden="true">u</span>
    </span>
  );
};
