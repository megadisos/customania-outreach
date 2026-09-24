// Catálogo PDF a partir de la tienda (WooCommerce Store API): fotos y precios actuales, liviano y con enlaces.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import { DATA_DIR, env } from './config';

export const CATALOG_DIR = path.join(DATA_DIR, 'catalogs');
const IMG_CACHE = path.join(CATALOG_DIR, 'img_cache');
export const STORE = () => env('TIENDA_URL', 'https://tienda.customania.com.co').replace(/\/$/, '');
export const MAX_PRODUCTS = () => Number(env('CATALOG_MAX_PRODUCTS', '40'));

const BRAND = {
  name: 'CUSTOMANIA', tagline: 'Tu idea, nuestro arte', phone: '+57 319 385 9952',
  wa: 'https://wa.me/573193859952?text=Hola%20Customania%2C%20quiero%20cotizar',
  email: 'contacto@customania.com.co', web: 'https://customania.com.co', addr: 'Calle 151 No 111A-25, Bogotá',
};
// Condiciones comerciales (edítalas si cambian)
const CONDITIONS = [
  '50% de anticipo para iniciar y 50% contra entrega.',
  'Elaboramos una muestra física para su aprobación antes de producir.',
  'Garantía de 1 mes para cambios por defectos de fabricación.',
  'Los precios del catálogo son de referencia por unidad; el valor final depende de la cantidad y la personalización.',
];

export const PROFILES: Record<string, { label: string; include: string[] }> = {
  general: { label: 'Catálogo general', include: [] },
  trofeos: { label: 'Trofeos y medallas', include: ['trofeo', 'medalla', 'copa', 'premiaci'] },
  uniformes: { label: 'Uniformes y ropa personalizada', include: ['ropa deportiva', 'camiseta', 'buzo', 'hoodie', 'gorra', 'uniforme', 'polo'] },
  regalos: { label: 'Regalos y material promocional', include: ['regalo', 'mug', 'botella', 'llavero', 'esfero', 'accesorio', 'termo', 'libreta', 'sticker'] },
};
// Mercancía de fans / licencias: no va en un catálogo corporativo.
const EXCLUDE = ['anime', 'marvel', 'dc comics', 'naruto', 'spider', 'batman', 'superman', 'pokemon', 'disney', 'star wars',
  'harry potter', 'festival', 'melómano', 'melomano', 'banda', 'rock', 'selección', 'seleccion', 'mundial', 'oasis', 'caifanes',
  'mägo', 'mago de oz', 'arcángel', 'arcangel', 'dragon ball', 'one piece'];

export interface Prod { name: string; price: string; url: string; image: string; cat: string }

async function getJson(url: string): Promise<any> {
  const r = await fetch(url, { headers: { 'User-Agent': 'CustomaniaPanel/1.0' }, signal: AbortSignal.timeout(25000) });
  if (!r.ok) throw new Error(`${url} → HTTP ${r.status}`);
  return r.json();
}

export async function fetchProducts(): Promise<any[]> {
  const items: any[] = [];
  for (let page = 1; page <= 12; page++) {
    const data = await getJson(`${STORE()}/wp-json/wc/store/v1/products?per_page=100&page=${page}`);
    items.push(...data);
    if (data.length < 100) break;
  }
  return items;
}

const money = (p: any): string => {
  const pr = p.prices || {};
  const minor = Number(pr.currency_minor_unit || 0);
  const rng = pr.price_range;
  const [raw, prefix] = rng?.min_amount ? [rng.min_amount, 'Desde '] : [pr.price, ''];
  const v = Number(raw || 0) / 10 ** minor;
  return v > 0 ? prefix + '$' + Math.round(v).toLocaleString('es-CO') : '';
};
const clean = (s: string) => (s || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#8211;/g, '-').replace(/&#8217;/g, "'").replace(/\s+/g, ' ').trim();

export function select(products: any[], profile: string): Prod[] {
  const inc = PROFILES[profile].include;
  let out: Prod[] = [];
  for (const p of products) {
    const cats = (p.categories || []).map((c: any) => c.name).join(' ');
    const hay = `${cats} ${p.name || ''}`.toLowerCase();
    if (EXCLUDE.some((x) => hay.includes(x))) continue;
    if (inc.length && !inc.some((x) => hay.includes(x))) continue;
    if (!p.images?.length || !money(p)) continue;
    out.push({ name: clean(p.name), price: money(p), url: p.permalink || '', image: p.images[0].src, cat: p.categories?.[0]?.name || 'Otros' });
  }
  const cmp = (a: Prod, b: Prod) => a.cat.localeCompare(b.cat) || a.name.localeCompare(b.name);
  out.sort(cmp);
  const max = MAX_PRODUCTS();
  if (out.length > max) { // reparte el cupo entre categorías
    const by = new Map<string, Prod[]>();
    for (const x of out) by.set(x.cat, [...(by.get(x.cat) || []), x]);
    const picked: Prod[] = [];
    while (picked.length < max && [...by.values()].some((v) => v.length)) {
      for (const v of by.values()) if (v.length && picked.length < max) picked.push(v.shift()!);
    }
    out = picked.sort(cmp);
  }
  return out;
}

export async function loadImage(url: string): Promise<Buffer | null> {
  fs.mkdirSync(IMG_CACHE, { recursive: true });
  const file = path.join(IMG_CACHE, crypto.createHash('md5').update(url).digest('hex') + '.jpg');
  if (fs.existsSync(file)) return fs.readFileSync(file);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'CustomaniaPanel/1.0' }, signal: AbortSignal.timeout(25000) });
    if (!r.ok) return null;
    const buf = await sharp(Buffer.from(await r.arrayBuffer()))
      .resize(420, 420, { fit: 'inside' }).flatten({ background: '#ffffff' }).jpeg({ quality: 72 }).toBuffer();
    fs.writeFileSync(file, buf);
    return buf;
  } catch { return null; }
}

const DARK = '#1d2330', ACC = '#e8590c', GREY = '#667085', LIGHT = '#f2f4f7';
const W = 595.28, H = 841.89, M = 36;
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function footer(doc: PDFKit.PDFDocument, n: number) {
  doc.fillColor(GREY).font('Helvetica').fontSize(8);
  doc.text(`Customania · ${BRAND.phone} · ${BRAND.email}`, M, H - 28, { lineBreak: false });
  doc.text(String(n), W - M - 40, H - 28, { width: 40, align: 'right', lineBreak: false });
}

function renderPdf(products: Prod[], images: Map<string, Buffer | null>, title: string, out: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, info: { Title: `Customania - ${title}`, Author: 'Customania' } });
    const stream = fs.createWriteStream(out);
    stream.on('finish', () => resolve());
    stream.on('error', reject);
    doc.pipe(stream);

    // portada
    doc.rect(0, 0, W, H).fill(DARK);
    doc.rect(M, 190, 70, 6).fill(ACC);
    doc.fillColor('#fff').font('Helvetica-Bold').fontSize(44).text(BRAND.name, M, 215, { lineBreak: false });
    doc.font('Helvetica').fontSize(18).text(BRAND.tagline, M, 272, { lineBreak: false });
    doc.font('Helvetica-Bold').fontSize(24).text(title, M, 350, { width: W - 2 * M });
    const d = new Date();
    doc.fillColor('#c9ced8').font('Helvetica').fontSize(12).text(`Catálogo · ${MESES[d.getMonth()]} de ${d.getFullYear()}`, M, doc.y + 10);
    doc.fontSize(11).text('DTF textil · DTF UV · Sublimación · Impresión 3D · Diseño gráfico', M, H - 100, { lineBreak: false });
    doc.text(`${BRAND.phone} · ${BRAND.email} · ${BRAND.web.replace('https://', '')}`, M, H - 80, { lineBreak: false });
    doc.link(M, H - 84, W - 2 * M, 24, BRAND.web);

    // productos: 2 columnas x 3 filas
    const cols = 2, rows = 3, gap = 14, per = cols * rows;
    const cw = (W - 2 * M - gap) / cols;
    const top = 22 + 20;
    const ch = (H - top - 40 - gap * (rows - 1)) / rows;
    let page = 2;
    for (let s = 0; s < products.length; s += per) {
      doc.addPage({ size: 'A4', margin: 0 });
      doc.rect(0, 0, W, 22).fill(ACC);
      doc.fillColor('#fff').font('Helvetica-Bold').fontSize(10).text(`${BRAND.name}  ·  ${title}`, M, 7, { lineBreak: false });
      products.slice(s, s + per).forEach((p, i) => {
        const r = Math.floor(i / cols), c = i % cols;
        const x = M + c * (cw + gap), y = top + r * (ch + gap);
        doc.roundedRect(x, y, cw, ch, 8).fill(LIGHT);
        const img = images.get(p.image);
        if (img) doc.image(img, x + 8, y + 8, { fit: [cw - 16, ch - 66], align: 'center', valign: 'center' });
        else doc.rect(x + 8, y + 8, cw - 16, ch - 66).fill('#d0d5dd');
        doc.fillColor(DARK).font('Helvetica-Bold').fontSize(9.5)
          .text(p.name, x + 8, y + ch - 50, { width: cw - 16, height: 24, ellipsis: true });
        doc.fillColor(ACC).fontSize(12).text(p.price, x + 8, y + ch - 20, { lineBreak: false });
        doc.fillColor(GREY).font('Helvetica').fontSize(8).text('Ver en la tienda', x + cw - 88, y + ch - 17, { width: 80, align: 'right', lineBreak: false });
        if (p.url) doc.link(x, y, cw, ch, p.url);
      });
      footer(doc, page++);
    }

    // cierre
    doc.addPage({ size: 'A4', margin: 0 });
    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(22).text('¿Cómo pedir su cotización?', M, 60);
    doc.font('Helvetica').fontSize(12);
    let y = 100;
    for (const t of ['1. Cuéntenos qué necesita, la cantidad y la fecha aproximada.', '2. Le enviamos la propuesta con diseño y precio según cantidad.', '3. Aprobada la muestra, producimos y entregamos.']) {
      doc.text(t, M, y, { lineBreak: false }); y += 22;
    }
    y += 14;
    doc.font('Helvetica-Bold').fontSize(14).text('Condiciones comerciales', M, y); y += 24;
    doc.font('Helvetica').fontSize(11);
    for (const t of CONDITIONS) {
      doc.text('• ' + t, M, y, { width: W - 2 * M });
      y = doc.y + 4;
    }
    y += 20;
    doc.roundedRect(M, y, W - 2 * M, 80, 8).fill(ACC);
    doc.fillColor('#fff').font('Helvetica-Bold').fontSize(16).text('Escríbanos por WhatsApp: ' + BRAND.phone, M + 16, y + 14, { lineBreak: false });
    doc.font('Helvetica').fontSize(12).text(`${BRAND.email} · ${BRAND.addr}`, M + 16, y + 40, { lineBreak: false });
    doc.text(BRAND.web.replace('https://', '') + '/store', M + 16, y + 58, { lineBreak: false });
    doc.link(M, y, W - 2 * M, 80, BRAND.wa);
    footer(doc, page);
    doc.end();
  });
}

const ymd = () => new Date().toLocaleString('sv-SE', { timeZone: 'America/Bogota' }).slice(0, 10).replace(/-/g, '');

/** Devuelve la ruta del PDF del día para ese perfil (lo regenera si force o si no existe). */
export async function getCatalog(profile: string, force = false, hooks: { products?: any[]; image?: (u: string) => Promise<Buffer | null> } = {}) {
  if (!PROFILES[profile]) throw new Error('Perfil de catálogo desconocido: ' + profile);
  fs.mkdirSync(CATALOG_DIR, { recursive: true });
  const file = path.join(CATALOG_DIR, `Catalogo_Customania_${profile}_${ymd()}.pdf`);
  if (fs.existsSync(file) && !force) return { path: file, count: null as number | null };
  const prods = select(hooks.products ?? (await fetchProducts()), profile);
  if (!prods.length) throw new Error('La tienda no devolvió productos para este perfil (revisa categorías o palabras del perfil).');
  const urls = [...new Set(prods.map((p) => p.image))];
  const loader = hooks.image ?? loadImage;
  const imgs = new Map<string, Buffer | null>();
  await Promise.all(urls.map(async (u) => imgs.set(u, await loader(u))));
  await renderPdf(prods, imgs, PROFILES[profile].label, file);
  return { path: file, count: prods.length };
}
