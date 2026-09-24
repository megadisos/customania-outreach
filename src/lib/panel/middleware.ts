// App aparte (outreach.customania.com.co): protege TODO el sitio con contraseña.
// Únicas rutas públicas: /login (para poder entrar) y /baja/* (enlace de baja de los correos).
import { defineMiddleware } from 'astro:middleware';
import { isAuthed } from './auth';

const PUBLIC_PATHS = [/^\/login\/?$/, /^\/baja\//];

export const panelMiddleware = defineMiddleware(async (ctx, next) => {
  const path = ctx.url.pathname;
  const isPublic = PUBLIC_PATHS.some((re) => re.test(path));
  if (!isPublic && !isAuthed(ctx.cookies)) {
    return ctx.redirect('/login?next=' + encodeURIComponent(path));
  }
  const res = await next();
  res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('X-Frame-Options', 'DENY');
  // same-origin (no no-referrer): con no-referrer el navegador envía "Origin: null" en los POST
  // y el checkOrigin de Astro rechaza los formularios. same-origin sigue sin filtrar nada a sitios externos.
  res.headers.set('Referrer-Policy', 'same-origin');
  return res;
});
