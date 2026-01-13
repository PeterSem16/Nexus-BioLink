# INDEXUS CRM - Nasadenie na Ubuntu Server

Tento dokument popisuje kroky potrebné na nasadenie INDEXUS CRM na vlastný Ubuntu server s aktualizáciou cez GitHub.

## Požiadavky

- Ubuntu 20.04+ LTS
- Node.js 18+ (odporúčame 20 LTS)
- PostgreSQL 14+
- Nginx (pre reverse proxy a HTTPS)
- PM2 alebo systemd (pre správu procesov)
- Git

## Environment premenné

### Povinné premenné

| Premenná | Popis | Príklad |
|----------|-------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:password@localhost:5432/indexus` |
| `SESSION_SECRET` | Tajný kľúč pre session šifrovanie (min. 32 znakov) | `vas-velmi-silny-nahodny-kluc-32-znakov` |
| `NODE_ENV` | Prostredie (production/development) | `production` |
| `PORT` | Port na ktorom beží aplikácia | `5000` |

### Microsoft 365 integrácia

| Premenná | Popis | Príklad |
|----------|-------|---------|
| `MS365_TENANT_ID` | Azure AD Tenant ID | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `MS365_CLIENT_ID` | Azure AD Application (Client) ID | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `MS365_CLIENT_SECRET` | Azure AD Client Secret | `your-client-secret` |
| `MS365_REDIRECT_URI` | OAuth callback URL | `https://vasa-domena.sk/api/auth/microsoft/callback` |
| `MS365_POST_LOGOUT_URI` | URL po odhlásení | `https://vasa-domena.sk` |

### OpenAI (AI funkcie)

| Premenná | Popis | Príklad |
|----------|-------|---------|
| `OPENAI_API_KEY` | OpenAI API kľúč | `sk-...` |

### BulkGate (SMS)

| Premenná | Popis | Príklad |
|----------|-------|---------|
| `BULKGATE_APPLICATION_ID` | BulkGate Application ID | `12345` |
| `BULKGATE_APPLICATION_TOKEN` | BulkGate API token | `your-token` |
| `BULKGATE_WEBHOOK_URL` | URL pre príjem SMS | `https://vasa-domena.sk/api/auth/bulkgate/callback` |
| `BULKGATE_WEBHOOK_TOKEN` | Token pre overenie webhookov | `your-webhook-token` |
| `BULKGATE_SENDER_ID` | ID odosielateľa SMS | `INDEXUS` |

### SendGrid (Email)

| Premenná | Popis | Príklad |
|----------|-------|---------|
| `SENDGRID_API_KEY` | SendGrid API kľúč | `SG.xxxxx` |
| `EMAIL_FROM` | Odosielateľ emailov | `noreply@vasa-domena.sk` |

## Inštalácia

### 1. Príprava servera

```bash
# Aktualizácia systému
sudo apt update && sudo apt upgrade -y

# Inštalácia Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Inštalácia PM2
sudo npm install -g pm2

# Inštalácia PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Inštalácia Nginx
sudo apt install -y nginx
```

### 2. Vytvorenie databázy

```bash
sudo -u postgres psql

# V PostgreSQL
CREATE DATABASE indexus;
CREATE USER indexus_user WITH ENCRYPTED PASSWORD 'vase-heslo';
GRANT ALL PRIVILEGES ON DATABASE indexus TO indexus_user;
\q
```

### 3. Klonovanie projektu

```bash
cd /var/www
sudo git clone https://github.com/vas-repo/indexus.git
cd indexus
sudo chown -R $USER:$USER .
```

### 4. Konfigurácia environment

```bash
# Skopírujte sample.env a upravte hodnoty
cp sample.env .env
nano .env

# Nastavte oprávnenia (bezpečnosť)
chmod 600 .env
```

### 5. Inštalácia závislostí a build

```bash
npm install
npm run build
```

### 6. Migrácia databázy

```bash
npm run db:push
```

### 7. Spustenie s PM2

```bash
pm2 start npm --name "indexus" -- start
pm2 save
pm2 startup
```

## Nginx konfigurácia

Vytvorte `/etc/nginx/sites-available/indexus`:

```nginx
server {
    listen 80;
    server_name vasa-domena.sk www.vasa-domena.sk;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Aktivácia konfigurácie
sudo ln -s /etc/nginx/sites-available/indexus /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# HTTPS s Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d vasa-domena.sk -d www.vasa-domena.sk
```

## Azure AD konfigurácia

Pre Microsoft 365 integráciu pridajte v Azure Portal:

1. Prejdite do **Azure Portal** > **App Registrations** > vaša aplikácia
2. V sekcii **Authentication** > **Redirect URIs** pridajte:
   - `https://vasa-domena.sk/api/auth/microsoft/callback`
3. V **Front-channel logout URL** nastavte:
   - `https://vasa-domena.sk`

## Aktualizácia cez Git

### Manuálna aktualizácia

```bash
cd /var/www/indexus
git pull origin main
npm install
npm run build
npm run db:push
pm2 restart indexus
```

### Automatická aktualizácia (GitHub Webhook)

Môžete nastaviť webhook v GitHub repository pre automatické nasadenie pri push.

## Git workflow

```
┌─────────────────┐        ┌─────────────┐        ┌──────────────────┐
│  Replit (Dev)   │ ──────>│   GitHub    │ ──────>│  Ubuntu (Prod)   │
│                 │  push  │             │  pull  │                  │
│  Testovanie     │        │  Repository │        │  Produkcia       │
└─────────────────┘        └─────────────┘        └──────────────────┘
```

1. **Vývoj** prebieha na Replit (staging)
2. **Push** zmien do GitHub
3. **Pull** na Ubuntu serveri a reštart aplikácie

## Monitorovanie

```bash
# Stav aplikácie
pm2 status

# Logy
pm2 logs indexus

# Monitorovanie CPU/RAM
pm2 monit
```

## Riešenie problémov

### Aplikácia sa nespustí
```bash
pm2 logs indexus --lines 100
```

### Databázové problémy
```bash
# Test pripojenia
psql $DATABASE_URL -c "SELECT 1"
```

### Nginx chyby
```bash
sudo tail -f /var/log/nginx/error.log
```

## Bezpečnostné odporúčania

1. **Secrets** - Nikdy neukladajte secrets do Git
2. **Firewall** - Povoľte len porty 22, 80, 443
3. **Updates** - Pravidelne aktualizujte systém
4. **Backup** - Pravidelne zálohujte databázu
5. **SSL** - Vždy používajte HTTPS v produkcii
6. **BulkGate tokeny** - Pred nasadením do produkcie ROTUJTE všetky BulkGate tokeny (APPLICATION_TOKEN, WEBHOOK_TOKEN) v BulkGate administrácii
7. **MS365 Redirect URI** - Uistite sa, že máte správne nastavené `MS365_REDIRECT_URI` a `MS365_POST_LOGOUT_URI` - v kóde existujú fallback hodnoty pre Replit, ktoré sa použijú ak premenné nie sú nastavené

```bash
# Firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Záloha databázy
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```
