// Prints do app para a landing (rodar com `npm run screens`, com o `npm run dev` ligado e VITE_DEV_SKIP_AUTH=true).
// Usa o Edge/Chrome instalado (playwright-core, sem baixar navegador) e a Loja Nimbus: nenhum dado real aparece.
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright-core";
import sharp from "sharp";

const BASE = process.env.ARCKYU_URL ?? "http://localhost:5180";
const OUT = "public/landing";
const VIEWPORT = { width: 1440, height: 900 };
const OUTPUT_WIDTH = 1600;

const log = (event, extra = {}) => console.log(JSON.stringify({ event, ...extra }));

const launch = () => chromium.launch({ channel: process.env.ARCKYU_BROWSER ?? "msedge", headless: true });

const save = async (page, name) => {
  const png = await page.screenshot({ type: "png" });
  const file = `${OUT}/${name}.webp`;
  await sharp(png).resize({ width: OUTPUT_WIDTH }).webp({ quality: 82 }).toFile(file);
  log("screen_saved", { file });
};

// Print com logo quebrado não serve: falha alto (ex.: Iconify devolvendo 429 por excesso de requisições).
const waitForLogos = async (page) => {
  await page.evaluate(() => document.querySelectorAll(".palette img").forEach((img) => { img.loading = "eager"; }));
  const ok = await page.waitForFunction(() => [...document.querySelectorAll(".palette img")].every((img) => img.complete && img.naturalWidth > 0), null, { timeout: 20000 }).then(() => true, () => false);
  if (!ok) throw new Error("logos da paleta não carregaram (Iconify fora do ar ou limitando requisições); tente de novo em alguns minutos");
};

// Aproxima o diagrama (o enquadramento automático mostra tudo, legenda inclusive, e fica pequeno num print).
const zoomIn = async (page, steps) => {
  const canvas = await page.locator(".excalidraw__canvas.interactive").boundingBox();
  if (!canvas) throw new Error("canvas do Excalidraw não encontrado para dar zoom");
  await page.mouse.move(canvas.x + canvas.width * 0.5, canvas.y + canvas.height * 0.48);
  await page.keyboard.down("Control");
  for (let i = 0; i < steps; i++) { await page.mouse.wheel(0, -100); await page.waitForTimeout(120); }
  await page.keyboard.up("Control");
  await page.waitForTimeout(600);
};

const openNimbus = async (page) => {
  await page.goto(`${BASE}/app?modelo=loja-nimbus-c4`);
  await page.waitForFunction(() => document.querySelectorAll(".flow-packet").length > 20, null, { timeout: 30000 });
  // Logos do Iconify, re-medição de texto e enquadramento terminam depois das bolinhas aparecerem.
  await page.waitForTimeout(6000);
  await waitForLogos(page);
  await zoomIn(page, 1);
};

const capturePlay = async (page) => {
  await page.selectOption(".toolbar__scenario", "2");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.waitForTimeout(1700);
  await page.getByRole("button", { name: "Pausar", exact: true }).click();
  await save(page, "play");
  await page.getByTitle("Parar").click();
};

const captureLibrary = async (page) => {
  await page.locator(".toolbar__drawing").click();
  await page.selectOption(".library__new select", "serverless");
  await page.waitForFunction(() => document.querySelectorAll(".flow-packet").length > 0, null, { timeout: 30000 });
  await page.waitForTimeout(4000);
  await page.locator(".toolbar__drawing").click();
  await page.locator(".collection-nav__add").click();
  await page.keyboard.press("Control+A");
  await page.keyboard.type("Clientes");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(800);
  await save(page, "library");
};

const captureExport = async (page) => {
  await page.locator(".drawing-card", { hasText: "Loja Nimbus" }).locator(".drawing-card__thumb").click();
  await page.waitForTimeout(5000);
  await page.getByTitle(/Exportar a animação/).click();
  await page.getByLabel("Play de um cenário").check();
  await page.waitForTimeout(400);
  await save(page, "export");
};

await mkdir(OUT, { recursive: true });
const browser = await launch();
try {
  const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 2, colorScheme: "light", locale: "pt-BR" });
  await openNimbus(page);
  await save(page, "editor");
  await capturePlay(page);
  await captureLibrary(page);
  await captureExport(page);
} finally {
  await browser.close();
}
