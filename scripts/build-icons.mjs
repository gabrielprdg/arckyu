// Gera os arquivos da marca Arckyu a partir de src/brand/yGlyph.ts (rodar com `npm run icons`).
// O texto "Arck" e "u" vira contorno (opentype.js), então o SVG não depende da fonte instalada.
import { readFile, writeFile } from "node:fs/promises";
import opentype from "opentype.js";
import sharp from "sharp";
import { Y_ADVANCE, Y_BOX, yGlyphMarkup } from "../src/brand/yGlyph.ts";

const FONT_FILE = "node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-700-normal.woff";
const UNITS = 1000;
const TRACKING = -20; // -0,02em, igual ao header
const PAD = 60;

const loadFont = async () => {
  const buffer = await readFile(FONT_FILE);
  return opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
};

const textPaths = (font, text, startX, baseline) => {
  let x = startX;
  const parts = [...text].map((char) => {
    const d = font.getPath(char, x, baseline, UNITS).toPathData(1);
    x += font.getAdvanceWidth(char, UNITS) + TRACKING;
    return d;
  });
  return { d: parts.join(" "), endX: x };
};

const wordmarkSvg = (font, textColor) => {
  const baseline = PAD + 700;
  const arck = textPaths(font, "Arck", PAD, baseline);
  // O "y" é o glifo da fonte em unidades da fonte (linha de base em 0): basta posicionar na origem do caractere.
  const yOrigin = arck.endX;
  const u = textPaths(font, "u", yOrigin + Y_ADVANCE + TRACKING, baseline);
  const width = Math.ceil(u.endX + PAD);
  const height = Math.ceil(baseline + Y_BOX.y + Y_BOX.height + PAD);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Arckyu"><title>Arckyu</title>` +
    `<path d="${arck.d} ${u.d}" fill="${textColor}"/>` +
    `<g transform="translate(${yOrigin.toFixed(1)} ${baseline})">${yGlyphMarkup("arckyu-tip")}</g></svg>`;
};

// Favicon: só o "y" sobre azulejo escuro (o laranja e a ponta creme aparecem nos dois temas do navegador).
const faviconSvg = () => {
  const scale = 92 / Y_BOX.height;
  const x = (120 - Y_BOX.width * scale) / 2 - Y_BOX.x * scale;
  const y = 14 - Y_BOX.y * scale;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="26" fill="#1e1e24"/>` +
    `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${scale.toFixed(4)})">${yGlyphMarkup("arckyu-tip")}</g></svg>`;
};

const writeLog = (file, extra = {}) => console.log(JSON.stringify({ event: "brand_file_built", file, ...extra }));

const font = await loadFont();
const files = {
  "public/arckyu-wordmark.svg": wordmarkSvg(font, "#1e1e24"),
  "public/arckyu-wordmark-dark.svg": wordmarkSvg(font, "#f8f9fa"),
  "public/favicon.svg": faviconSvg(),
};
for (const [file, svg] of Object.entries(files)) {
  await writeFile(file, svg);
  writeLog(file);
}

const PNGS = [
  { source: "public/favicon.svg", out: "public/favicon-16.png", width: 16 },
  { source: "public/favicon.svg", out: "public/favicon-32.png", width: 32 },
  { source: "public/favicon.svg", out: "public/arckyu-512.png", width: 512 },
  // iOS arredonda sozinho e não aceita transparência: azulejo quadrado sem cantos.
  { source: "public/favicon.svg", out: "public/apple-touch-icon.png", width: 180, flatten: "#1e1e24" },
  { source: "public/arckyu-wordmark.svg", out: "public/arckyu-wordmark.png", width: 1200 },
];
for (const png of PNGS) {
  const svg = await readFile(png.source, "utf8");
  const viewBoxWidth = Number(/viewBox="[\d.-]+ [\d.-]+ ([\d.]+)/.exec(svg)?.[1] ?? png.width);
  // Rasteriza no dobro do tamanho final (nitidez) sem estourar o limite de pixels em logos grandes.
  const density = Math.max(72, Math.round((72 * png.width * 2) / viewBoxWidth));
  let image = sharp(Buffer.from(svg), { density }).resize({ width: png.width });
  if (png.flatten) image = image.flatten({ background: png.flatten });
  await image.png().toFile(png.out);
  writeLog(png.out, { width: png.width });
}
