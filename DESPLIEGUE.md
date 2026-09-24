# Customania Outreach — app aparte en outreach.customania.com.co

Este proyecto es independiente de tu sitio principal (customania.com.co): tiene su propio código, su propio
proceso Node y su propio server block de Nginx. No modifica nada de tu Astro actual; ambos pueden compartir el
mismo VPS sin chocar, cada uno en su carpeta y su puerto. Requisitos: Node 22.13+ (usa `node:sqlite`, no hay
que compilar nada nativo).

## 1. DNS

Crea un registro **A** para `outreach` apuntando a la IP del VPS (el mismo servidor donde ya está customania.com.co):

    outreach.customania.com.co   A   <IP de tu VPS>

## 2. Sube el proyecto al servidor

    sudo mkdir -p /var/www/customania-outreach
    sudo chown $USER:$USER /var/www/customania-outreach
    # copia todo el contenido de esta carpeta ahí (git clone, scp, rsync — lo que uses para tu sitio principal)
    cd /var/www/customania-outreach
    npm ci
    npm run build

## 3. Configura el .env

    cp .env.example .env

Completa como mínimo `PANEL_PASSWORD` (≥ 8 caracteres, sin ella la app no abre), `SESSION_SECRET`
(genera uno con `openssl rand -hex 32`) y las cuentas de Gmail y del dominio. `PORT` ya viene en 4322 para
no chocar con el 4321 (u otro) que use tu sitio principal; cámbialo si ese puerto ya está en uso.

## 4. Servicio systemd

    sudo cp deploy/customania-outreach.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable --now customania-outreach
    sudo systemctl status customania-outreach     # debe decir "active (running)"

## 5. Nginx (server block nuevo, no toca el de customania.com.co)

    sudo cp deploy/nginx-outreach.conf /etc/nginx/sites-available/outreach.customania.com.co
    sudo ln -s /etc/nginx/sites-available/outreach.customania.com.co /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo certbot --nginx -d outreach.customania.com.co
    sudo systemctl reload nginx

## 6. Verifica

Abre `https://outreach.customania.com.co`: debe pedir la contraseña. Sin ella no se ve nada, ni el resumen
ni ninguna otra pantalla — la única ruta pública es `/baja/<token>`, el enlace de baja de los correos.

## Actualizaciones

    cd /var/www/customania-outreach
    git pull   # o como subas los cambios
    npm ci
    npm run build
    sudo systemctl restart customania-outreach

Respalda la carpeta `data/` (base de datos y catálogos PDF): ahí está todo el historial de envíos y contactos.

## Si vienes de una versión anterior (Flask/Python, o la que iba dentro de tu sitio Astro)

Copia tu `outreach.db` a `data/outreach.db` antes del primer arranque: la app migra el esquema sola y
conserva contactos, plantillas e historial.

## Cómo funciona la contraseña

- `/login` compara la contraseña con `PANEL_PASSWORD` (comparación de tiempo constante, no revela nada por temporización).
- Si acierta, crea una cookie firmada con HMAC, `HttpOnly`, `Secure`, `SameSite=Strict`, válida 12 horas.
- El middleware (`src/middleware.ts`) exige esa cookie en **cualquier** ruta del sitio; sin ella redirige a `/login`.
  Solo `/login` y `/baja/*` quedan públicas.
- 5 intentos fallidos por IP bloquean esa IP 15 minutos; los formularios POST verifican el origen (protección CSRF).
- Todas las respuestas llevan `noindex`, `no-store` y `X-Frame-Options: DENY`; `robots.txt` deniega todo el sitio.
- Debe servirse siempre por HTTPS (la cookie es `Secure`; por eso el server block incluye la redirección 80→443).
