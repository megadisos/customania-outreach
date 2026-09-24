// Revisa la bandeja por IMAP: respuestas, rebotes y pedidos de baja cambian el estado del contacto.
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import type { Account } from './config';
import { db, logEvent, suppress } from './db';

const UNSUB = /\b(baja|unsubscribe|darme de baja|no deseo|no me escriban|remover|eliminar)\b/i;

export async function checkInbox(acct: Account) {
  const stats = { scanned: 0, replied: 0, bounced: 0, unsub: 0 };
  if (!acct.configured || !acct.imap) return null;
  const d = db();
  const contacts = new Map<string, any>((d.prepare('SELECT * FROM contacts').all() as any[]).map((c) => [c.email, c]));
  const client = new ImapFlow({ host: acct.imap, port: 993, secure: true, auth: { user: acct.user, pass: acct.password }, logger: false });
  await client.connect();
  const lock = await client.getMailboxLock('INBOX');
  try {
    const since = new Date(Date.now() - 21 * 86400000);
    const uids = ((await client.search({ since }, { uid: true })) || []).slice(-300);
    if (!uids.length) return stats;
    for await (const msg of client.fetch(uids, { source: true }, { uid: true })) {
      const mail = await simpleParser(msg.source as Buffer);
      stats.scanned++;
      const from = (mail.from?.value?.[0]?.address || '').toLowerCase();
      const text = mail.text || '';
      const subj = mail.subject || '';
      if (/mailer-daemon|postmaster/.test(from)) {
        for (const e of new Set(text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g) || [])) {
          const ct = contacts.get(e.toLowerCase());
          if (ct && !['bounced', 'unsubscribed'].includes(ct.status)) {
            d.prepare("UPDATE contacts SET status='bounced' WHERE id=?").run(ct.id);
            suppress(d, ct.email, 'rebote'); logEvent(d, ct.id, ct.email, 'bounced', subj.slice(0, 120));
            ct.status = 'bounced'; stats.bounced++;
          }
        }
      } else if (contacts.has(from)) {
        const ct = contacts.get(from);
        const top = text.split('\n').filter((l) => !l.startsWith('>')).join('\n').slice(0, 600);
        if (UNSUB.test(subj + ' ' + top)) {
          if (ct.status !== 'unsubscribed') {
            d.prepare("UPDATE contacts SET status='unsubscribed' WHERE id=?").run(ct.id);
            suppress(d, ct.email, 'pidió baja por correo'); logEvent(d, ct.id, ct.email, 'unsubscribed', subj.slice(0, 120));
            ct.status = 'unsubscribed'; stats.unsub++;
          }
        } else if (ct.status === 'contacted') {
          d.prepare("UPDATE contacts SET status='replied' WHERE id=?").run(ct.id);
          logEvent(d, ct.id, ct.email, 'replied', subj.slice(0, 120));
          ct.status = 'replied'; stats.replied++;
        }
      }
    }
  } finally {
    lock.release();
    await client.logout();
  }
  return stats;
}
