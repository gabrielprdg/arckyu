// Prévia do "y" da marca em fundo claro e escuro (uso local, para conferir cores): node scripts/preview-y.mjs <pasta>
import sharp from "sharp";
import { Y_BOX, yGlyphMarkup } from "../src/brand/yGlyph.ts";

const outDir = process.argv[2] ?? ".";
const pad = 40;
const viewBox = [Y_BOX.x - pad, Y_BOX.y - pad, Y_BOX.width + 2 * pad, Y_BOX.height + 2 * pad].join(" ");
for (const [name, background] of [["light", "#fbfbfd"], ["dark", "#191920"]]) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="280" height="388">` +
    `<rect x="${Y_BOX.x - pad}" y="${Y_BOX.y - pad}" width="100%" height="100%" fill="${background}"/>${yGlyphMarkup("tip")}</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(`${outDir}/y-real-${name}.png`);
}
console.log(JSON.stringify({ event: "preview_built", outDir }));
