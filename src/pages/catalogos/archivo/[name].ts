import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import { CATALOG_DIR } from '../../../lib/panel/catalog';
export const prerender = false;

export const GET: APIRoute = ({ params }) => {
  const name = params.name || '';
  if (!/^[\w.-]+\.pdf$/.test(name)) return new Response('No encontrado', { status: 404 });
  const file = path.join(CATALOG_DIR, name);
  if (!fs.existsSync(file)) return new Response('No encontrado', { status: 404 });
  return new Response(fs.readFileSync(file), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${name}"` } });
};
