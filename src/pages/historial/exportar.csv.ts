import type { APIRoute } from 'astro';
import { db } from '../../lib/panel/db';
export const prerender = false;

const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
export const GET: APIRoute = () => {
  const rows = db().prepare(`SELECT l.sent_at, l.to_email, c.company, c.segment, l.step, l.template_name, l.account, l.from_email,
    l.subject, l.attachment, l.status, l.error, c.status AS contact_status
    FROM send_log l LEFT JOIN contacts c ON c.id=l.contact_id ORDER BY l.id`).all() as any[];
  const head = rows[0] ? Object.keys(rows[0]) : ['sin datos'];
  const csv = '﻿' + [head.join(','), ...rows.map((r) => head.map((h) => cell(r[h])).join(','))].join('\n');
  return new Response(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename=historial_envios.csv' } });
};
