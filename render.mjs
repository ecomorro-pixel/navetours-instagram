// Render de un lote de Instagram: plantillas HTML → JPEG 1080×1350 (la API de Instagram solo acepta JPEG).
// Uso: node render.mjs lotes/<lote>.json [carpeta_salida]   (salida por defecto: img/<id>/)
// Las fotos se buscan en fotos/ por nombre de archivo (el nombre nombra el lugar).
import { chromium } from 'playwright';
import { readFile, writeFile, mkdir, access, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = path.dirname(fileURLToPath(import.meta.url));
const [, , rutaLote, salidaArg] = process.argv;
if (!rutaLote) { console.error('Uso: node render.mjs lotes/<lote>.json [salida]'); process.exit(1); }

const lote = JSON.parse(await readFile(path.resolve(raiz, rutaLote), 'utf8'));
const salida = path.resolve(raiz, salidaArg ?? `img/${lote.id}`);
await mkdir(salida, { recursive: true });

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
const archivos = [];
for (const [i, lam] of lote.laminas.entries()) {
  const plantilla = await readFile(path.join(raiz, 'plantillas', `${lam.plantilla}.html`), 'utf8');
  const campos = { foco: '50% 50%', ...lam.campos };
  if (!/^[0-9]{1,3}% [0-9]{1,3}%$/.test(campos.foco)) throw new Error(`Lámina ${i + 1}: foco no válido (${campos.foco}); usar "X% Y%"`);
  if (campos.photo) {
    const foto = path.join(raiz, 'fotos', campos.photo);
    await access(foto); // falla si la foto no existe
    campos.photo = pathToFileURL(foto).href;
  }
  const faltan = [...plantilla.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).filter((k) => campos[k] == null);
  if (faltan.length) throw new Error(`Lámina ${i + 1} (${lam.plantilla}): faltan campos ${faltan.join(', ')}`);
  const html = plantilla.replace(/\{\{(\w+)\}\}/g, (_, k) => (k === 'photo' ? campos[k] : esc(campos[k])));
  // Se escribe junto a las plantillas para que las rutas relativas (../assets) resuelvan.
  const tmp = path.join(raiz, 'plantillas', `.tmp-${lote.id}-${i + 1}.html`);
  await writeFile(tmp, html);
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const out = path.join(salida, `${String(i + 1).padStart(2, '0')}-${lam.plantilla}.jpg`);
  await page.screenshot({ path: out, type: 'jpeg', quality: 92, clip: { x: 0, y: 0, width: 1080, height: 1350 } });
  await unlink(tmp);
  archivos.push(path.basename(out));
}
await browser.close();
const manifiesto = { id: lote.id, tipo: lote.tipo, publicar: lote.publicar, caption: lote.caption, archivos };
await writeFile(path.join(salida, 'manifest.json'), JSON.stringify(manifiesto, null, 2));
console.log(JSON.stringify(manifiesto, null, 2));
