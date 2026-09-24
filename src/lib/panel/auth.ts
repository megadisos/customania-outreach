// Autenticación por contraseña única (PANEL_PASSWORD) con cookie firmada (HMAC) y límite de intentos.
import crypto from 'node:crypto';
import type { AstroCookies } from 'astro';
import { env } from './config';

export const COOKIE = 'cm_panel';
const TTL_MS = 12 * 60 * 60 * 1000; // 12 horas

const password = () => env('PANEL_PASSWORD');
const secret = () => env('SESSION_SECRET') || crypto.createHash('sha256').update('cm-panel:' + password()).digest('hex');
const sign = (v: string) => crypto.createHmac('sha256', secret()).update(v).digest('hex');

export const panelConfigured = () => password().length >= 8;

function safeEqual(a: string, b: string) {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function checkPassword(input: string): boolean {
  return panelConfigured() && safeEqual(input, password());
}

export function startSession(cookies: AstroCookies) {
  const exp = String(Date.now() + TTL_MS);
  cookies.set(COOKIE, `${exp}.${sign(exp)}`, {
    path: '/', httpOnly: true, sameSite: 'strict', secure: import.meta.env.PROD, maxAge: TTL_MS / 1000,
  });
}

export function endSession(cookies: AstroCookies) {
  cookies.delete(COOKIE, { path: '/' });
}

export function isAuthed(cookies: AstroCookies): boolean {
  if (!panelConfigured()) return false;
  const v = cookies.get(COOKIE)?.value;
  if (!v) return false;
  const [exp, sig] = v.split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const good = sign(exp);
  return sig.length === good.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good));
}

// --- límite de intentos de login: 5 fallos por IP cada 15 minutos
const attempts: Map<string, { n: number; first: number }> = ((globalThis as any).__loginAttempts ??= new Map());
const WINDOW = 15 * 60 * 1000;
export function tooManyAttempts(ip: string): boolean {
  const a = attempts.get(ip);
  if (!a) return false;
  if (Date.now() - a.first > WINDOW) { attempts.delete(ip); return false; }
  return a.n >= 5;
}
export function registerFailure(ip: string) {
  const a = attempts.get(ip);
  if (!a || Date.now() - a.first > WINDOW) attempts.set(ip, { n: 1, first: Date.now() });
  else a.n++;
}
export function clearFailures(ip: string) { attempts.delete(ip); }

// --- mensajes flash (cookie de vida corta)
export function flash(cookies: AstroCookies, msg: string) {
  cookies.set('cm_flash', encodeURIComponent(msg), { path: '/', maxAge: 60, httpOnly: true, sameSite: 'strict' });
}
export function popFlash(cookies: AstroCookies): string {
  const v = cookies.get('cm_flash')?.value;
  if (!v) return '';
  cookies.delete('cm_flash', { path: '/' });
  try { return decodeURIComponent(v); } catch { return ''; }
}

/** Solo permite redirigir dentro del propio sitio (evita open-redirect via ?next=). */
export function safePath(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('://') || next.includes('\\')) return '/';
  return next;
}
