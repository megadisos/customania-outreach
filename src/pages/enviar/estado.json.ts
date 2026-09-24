import type { APIRoute } from 'astro';
import { job } from '../../lib/panel/mailer';
export const prerender = false;
export const GET: APIRoute = () =>
  new Response(JSON.stringify({ running: job.running, done: job.done, total: job.total, log: job.log.slice(-30) }), {
    headers: { 'Content-Type': 'application/json' },
  });
