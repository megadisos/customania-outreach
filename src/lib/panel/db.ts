// SQLite embebido (node:sqlite, Node >= 22.13). Guarda contactos, plantillas, envíos, bajas y eventos.
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DATA_DIR, TZ } from './config';
import { ALL_TEMPLATES } from './templates';
import { SEED_CONTACTS } from './seeds';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS contacts(
  id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, company TEXT, contact_name TEXT,
  segment TEXT DEFAULT 'colegios', source_url TEXT, notes TEXT,
  status TEXT DEFAULT 'new', token TEXT, created_at TEXT);
CREATE TABLE IF NOT EXISTS templates(
  id INTEGER PRIMARY KEY, name TEXT, segment TEXT, step INTEGER DEFAULT 1,
  subject TEXT, body TEXT, attach_catalog TEXT DEFAULT '');
CREATE TABLE IF NOT EXISTS send_log(
  id INTEGER PRIMARY KEY, contact_id INTEGER, to_email TEXT, template_id INTEGER,
  template_name TEXT, step INTEGER, account TEXT, from_email TEXT, subject TEXT,
  body TEXT, status TEXT, error TEXT, message_id TEXT, sent_at TEXT, attachment TEXT DEFAULT '');
CREATE TABLE IF NOT EXISTS suppression(email TEXT PRIMARY KEY, reason TEXT, at TEXT);
CREATE TABLE IF NOT EXISTS events(
  id INTEGER PRIMARY KEY, contact_id INTEGER, email TEXT, type TEXT, detail TEXT, at TEXT);
`;

/** "YYYY-MM-DD HH:mm:ss" en hora de Bogotá (para que "hoy" y los límites diarios sean correctos). */
export const now = () => new Date().toLocaleString('sv-SE', { timeZone: TZ });
export const today = () => now().slice(0, 10);
export const newToken = () => crypto.randomBytes(16).toString('hex');
export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const g = globalThis as any;

export function db(): DatabaseSync {
  if (g.__panelDb) return g.__panelDb;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const d = new DatabaseSync(path.join(DATA_DIR, 'outreach.db'));
  d.exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
  d.exec(SCHEMA);
  // Migración: permite reutilizar un outreach.db creado con la versión anterior (Flask/Python).
  for (const [table, col] of [['templates', 'attach_catalog'], ['send_log', 'attachment']]) {
    const cols = (d.prepare(`PRAGMA table_info(${table})`).all() as any[]).map((c) => c.name);
    if (!cols.includes(col)) d.exec(`ALTER TABLE ${table} ADD COLUMN ${col} TEXT DEFAULT ''`);
  }
  g.__panelDb = d;
  seed(d);
  return d;
}

function seed(d: DatabaseSync) {
  // Plantillas: agrega las que falten por nombre (nunca pisa las que ya editaste).
  const have = new Set(d.prepare('SELECT name FROM templates').all().map((r: any) => r.name));
  const ins = d.prepare('INSERT INTO templates(name,segment,step,subject,body,attach_catalog) VALUES(?,?,?,?,?,?)');
  for (const t of ALL_TEMPLATES) if (!have.has(t.name)) ins.run(t.name, t.segment, t.step, t.subject, t.body, t.attach);
  // Contactos semilla: duplicados y bajas se respetan.
  for (const c of SEED_CONTACTS) addContact(d, c);
}

export function addContact(d: DatabaseSync, r: Record<string, string | undefined>): 'ok' | 'duplicado' | 'invalido' {
  const email = (r.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return 'invalido';
  if (d.prepare('SELECT 1 FROM contacts WHERE email=?').get(email)) return 'duplicado';
  const suppressed = d.prepare('SELECT 1 FROM suppression WHERE email=?').get(email);
  d.prepare(`INSERT INTO contacts(email,company,contact_name,segment,source_url,notes,status,token,created_at)
             VALUES(?,?,?,?,?,?,?,?,?)`).run(
    email, (r.company || '').trim(), (r.contact_name || '').trim(), (r.segment || 'colegios').trim(),
    (r.source_url || '').trim(), (r.notes || '').trim(), suppressed ? 'unsubscribed' : 'new', newToken(), now());
  return 'ok';
}

export function suppress(d: DatabaseSync, email: string, reason: string) {
  d.prepare('INSERT OR REPLACE INTO suppression(email,reason,at) VALUES(?,?,?)').run(email, reason, now());
}
export function logEvent(d: DatabaseSync, contactId: number | null, email: string, type: string, detail = '') {
  d.prepare('INSERT INTO events(contact_id,email,type,detail,at) VALUES(?,?,?,?,?)').run(contactId, email, type, detail, now());
}

/** CSV mínimo con comillas (para importar contactos). */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], cur = '', q = false;
  text = text.replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cur); cur = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cur); cur = '';
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
    } else cur += ch;
  }
  if (cur || row.length) { row.push(cur); if (row.some((x) => x.trim())) rows.push(row); }
  const head = (rows.shift() || []).map((h) => h.trim().toLowerCase());
  return rows.map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? '').trim()])));
}
