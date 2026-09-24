// Configuración del panel: todo viene de variables de entorno (.env).
import path from 'node:path';

export const env = (k: string, d = ''): string =>
  process.env[k] ?? ((import.meta as any).env?.[k] as string | undefined) ?? d;

export const DATA_DIR = env('DATA_DIR') || path.resolve(process.cwd(), 'data');
export const TZ = 'America/Bogota';

export interface Account {
  key: 'gmail' | 'dominio';
  label: string;
  host: string;
  port: number;
  imap: string;
  user: string;
  password: string;
  fromEmail: string;
  limit: number;
  configured: boolean;
}

export function accounts(): Record<string, Account> {
  const mk = (key: 'gmail' | 'dominio', p: string, label: string, host: string, imap: string): Account => {
    const user = env(p + 'USER');
    const h = env(p + 'SMTP_HOST', host);
    return {
      key, label, host: h, port: Number(env(p + 'SMTP_PORT', '465')), imap: env(p + 'IMAP_HOST', imap),
      user, password: env(p + 'PASSWORD'), fromEmail: env(p + 'FROM', user),
      limit: Number(env(p + 'DAILY_LIMIT', '40')), configured: Boolean(user && env(p + 'PASSWORD') && h),
    };
  };
  return {
    gmail: mk('gmail', 'GMAIL_', 'Gmail / Google Workspace', 'smtp.gmail.com', 'imap.gmail.com'),
    dominio: mk('dominio', 'DOMAIN_', 'Correo customania.com.co', '', ''),
  };
}

export const senderName = () => env('SENDER_NAME', 'Jorge | Customania');
export const delayMin = () => Number(env('DELAY_MIN', '40'));
export const delayMax = () => Number(env('DELAY_MAX', '110'));
export const followupDays = () => Number(env('FOLLOWUP_DAYS', '6'));
// App aparte en su propio subdominio: aquí vive /baja/<token>, el enlace de baja de los correos.
export const baseUrl = () => env('PUBLIC_BASE_URL', 'https://outreach.customania.com.co').replace(/\/$/, '');

export const SEGMENTS: Record<string, string> = {
  colegios: 'Colegios, ligas, clubes y universidades',
  uniformes: 'Empresas: uniformes/dotación',
  regalos: 'Empresas: regalos corporativos',
  eventos: 'Organizadores de eventos',
  aliados: 'Aliados: dotación y promocionales (maquila)',
};
export const STATUSES = ['new', 'contacted', 'replied', 'bounced', 'unsubscribed', 'do_not_contact'];
