// Construcción y envío de correos, límites diarios con calentamiento y ejecución de lotes en segundo plano.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import nodemailer from 'nodemailer';
import { accounts, baseUrl, delayMax, delayMin, followupDays, senderName, type Account } from './config';
import { db, logEvent, now, suppress, today } from './db';
import { getCatalog } from './catalog';

type Row = Record<string, any>;

// ------------------------------------------------------------ texto
export function firstGreeting(c: Row): string {
  const n = (c.contact_name || '').trim();
  return n ? n.split(/\s+/)[0] : 'equipo de ' + (c.company || 'su organización');
}

export function render(text: string, c: Row, extra: Record<string, string> = {}): string {
  const vals: Record<string, string> = {
    empresa: c.company || 'su organización', nombre: c.contact_name || '', saludo: firstGreeting(c), ...extra,
  };
  return Object.entries(vals).reduce((t, [k, v]) => t.split(`{{${k}}}`).join(v), text);
}

export function footerText(c: Row): string {
  const baja = `Para no recibir más mensajes: ${baseUrl()}/baja/${c.token} o responda BAJA.`;
  return (
    '\n\n--\nCustomania · Calle 151 No 111A-25, Bogotá · contacto@customania.com.co\n' +
    'Le escribimos porque su correo de contacto aparece publicado como dato de contacto de su organización ' +
    'y creemos que nuestros servicios pueden serle útiles (tratamiento de datos conforme a la Ley 1581 de 2012; ' +
    'puede solicitar su actualización o supresión en cualquier momento).\n' + baja
  );
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function toHtml(text: string): string {
  const blocks = esc(text).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>').split('\n\n');
  const out = blocks.map((b) => {
    const lines = b.split('\n');
    if (lines.every((l) => !l.trim() || l.startsWith('- '))) {
      return '<ul>' + lines.filter((l) => l.trim()).map((l) => `<li>${l.slice(2)}</li>`).join('') + '</ul>';
    }
    return '<p>' + lines.join('<br>') + '</p>';
  });
  return `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#222">${out.join('')}</div>`;
}

// ------------------------------------------------------------ límites
/** Calentamiento: 15 correos el primer día de uso y +5 por día, hasta el tope de la cuenta. */
export function effectiveLimit(acct: Account): number {
  const first: any = db().prepare("SELECT MIN(substr(sent_at,1,10)) d FROM send_log WHERE account=? AND status='sent'").get(acct.key);
  let days = 0;
  if (first?.d) days = Math.floor((Date.parse(today()) - Date.parse(first.d)) / 86400000);
  return Math.min(acct.limit, 15 + 5 * days);
}
export function sentToday(key: string): number {
  const r: any = db().prepare("SELECT COUNT(*) n FROM send_log WHERE account=? AND status='sent' AND substr(sent_at,1,10)=?").get(key, today());
  return r.n;
}

export function eligible(step: number, segment?: string): Row[] {
  const d = db();
  let sql: string;
  const args: any[] = [];
  if (step === 1) {
    sql = "SELECT * FROM contacts WHERE status='new'";
  } else {
    const cutoff = new Date(Date.now() - followupDays() * 86400000).toLocaleString('sv-SE', { timeZone: 'America/Bogota' });
    sql = `SELECT * FROM contacts WHERE status='contacted' AND id IN
      (SELECT contact_id FROM send_log WHERE step=1 AND status='sent' GROUP BY contact_id HAVING MAX(sent_at)<=?)
      AND id NOT IN (SELECT contact_id FROM send_log WHERE step=2 AND status='sent')`;
    args.push(cutoff);
  }
  if (segment && segment !== 'todos') { sql += ' AND segment=?'; args.push(segment); }
  const rows = d.prepare(sql + ' ORDER BY id').all(...args) as Row[];
  const sup = d.prepare('SELECT 1 FROM suppression WHERE email=?');
  return rows.filter((r) => !sup.get(r.email));
}

// ------------------------------------------------------------ lote
export interface Job { running: boolean; log: string[]; done: number; total: number }
export const job: Job = ((globalThis as any).__panelJob ??= { running: false, log: [], done: 0, total: 0 });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const rand = (a: number, b: number) => a + Math.floor(Math.random() * (Math.max(b, a) - a + 1));

export function startJob(acct: Account, tpl: Row, dry: boolean, n: number) {
  if (job.running) throw new Error('Ya hay un envío en curso.');
  const contacts = eligible(tpl.step, tpl.segment).slice(0, n);
  Object.assign(job, {
    running: true, done: 0, total: contacts.length,
    log: [`Iniciando ${dry ? 'SIMULACIÓN' : 'envío real'}: ${contacts.length} correos con «${tpl.name}» desde ${acct.key}`],
  });
  void runJob(acct, contacts, tpl, dry); // en segundo plano
}

async function runJob(acct: Account, contacts: Row[], tpl: Row, dry: boolean) {
  const d = db();
  let transport: nodemailer.Transporter | null = null;
  try {
    let pdf: string | null = null;
    if (tpl.attach_catalog) {
      pdf = (await getCatalog(tpl.attach_catalog)).path;
      const mb = fs.statSync(pdf).size / 1048576;
      job.log.push(`Catálogo adjunto: ${path.basename(pdf)} (${mb.toFixed(1)} MB)`);
      if (mb > 8) throw new Error('El catálogo pesa más de 8 MB: baja CATALOG_MAX_PRODUCTS en .env.');
    }
    if (!dry) {
      transport = nodemailer.createTransport({
        host: acct.host, port: acct.port, secure: acct.port === 465, auth: { user: acct.user, pass: acct.password },
      });
      await transport.verify();
    }
    for (let i = 0; i < contacts.length; i++) {
      const ct = contacts[i];
      const prev: any = d.prepare("SELECT subject,message_id FROM send_log WHERE contact_id=? AND step=1 AND status='sent' ORDER BY id DESC LIMIT 1").get(ct.id);
      const extra = { asunto_original: prev?.subject || 'mi mensaje anterior' };
      const subject = render(tpl.subject, ct, extra);
      const full = render(tpl.body, ct, extra) + footerText(ct);
      const messageId = `<${crypto.randomBytes(12).toString('hex')}@${acct.fromEmail.split('@')[1]}>`;
      let status = dry ? 'dry_run' : 'sent';
      let err = '';
      if (!dry && transport) {
        const headers: Record<string, string> = {
          'List-Unsubscribe': `<mailto:${acct.fromEmail}?subject=BAJA>, <${baseUrl()}/baja/${ct.token}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        };
        try {
          await transport.sendMail({
            from: `${senderName()} <${acct.fromEmail}>`, to: ct.email, replyTo: acct.fromEmail, subject,
            text: full, html: toHtml(full), messageId, headers,
            ...(tpl.step === 2 && prev?.message_id ? { inReplyTo: prev.message_id, references: prev.message_id } : {}),
            ...(pdf ? { attachments: [{ filename: path.basename(pdf), path: pdf, contentType: 'application/pdf' }] } : {}),
          });
        } catch (e: any) {
          status = 'failed';
          err = String(e?.message || e);
          if (e?.responseCode >= 550 && e?.responseCode <= 554 || e?.code === 'EENVELOPE') {
            d.prepare("UPDATE contacts SET status='bounced' WHERE id=?").run(ct.id);
            suppress(d, ct.email, 'rechazado por el servidor');
          }
        }
      }
      d.prepare(`INSERT INTO send_log(contact_id,to_email,template_id,template_name,step,account,from_email,subject,body,status,error,message_id,sent_at,attachment)
                 VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
        ct.id, ct.email, tpl.id, tpl.name, tpl.step, acct.key, acct.fromEmail, subject, full, status, err, messageId, now(), pdf ? path.basename(pdf) : '');
      if (status === 'sent') {
        d.prepare("UPDATE contacts SET status='contacted' WHERE id=?").run(ct.id);
        logEvent(d, ct.id, ct.email, 'sent', `paso ${tpl.step} · ${tpl.name} · ${acct.key}`);
      }
      job.done++;
      job.log.push(`${status.toUpperCase()} → ${ct.email}${err ? ' (' + err.slice(0, 80) + ')' : ''}`);
      if (status === 'failed' && /quota|limit|too many/i.test(err)) { job.log.push('Se detuvo: la cuenta alcanzó su límite.'); break; }
      if (!dry && i < contacts.length - 1) await sleep(rand(delayMin(), delayMax()) * 1000);
    }
  } catch (e: any) {
    job.log.push('ERROR: ' + (e?.message || e));
  } finally {
    transport?.close();
    job.running = false;
    job.log.push('Terminado.');
  }
}

export { accounts };
