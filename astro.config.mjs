import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  // App aparte y 100% privada (login en toda ruta): no hay páginas públicas que convenga prerenderizar.
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  security: {
    checkOrigin: true, // protege los formularios POST contra CSRF
    // Astro solo confía en el Host / X-Forwarded-* de estos dominios (necesario detrás de Nginx):
    allowedDomains: [
      { hostname: 'outreach.customania.com.co', protocol: 'https' },
      { hostname: 'localhost' },
      { hostname: '127.0.0.1' },
    ],
  },
  vite: { ssr: { external: ['sharp', 'pdfkit', 'nodemailer', 'imapflow', 'mailparser'] } },
});
