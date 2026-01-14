# INDEXUS CRM - Deployment Guide

## Environment Variables

### Required Secrets

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `SESSION_SECRET` | Session encryption key (random string 32+ chars) | Yes |
| `OPENAI_API_KEY` | OpenAI API key for sentiment analysis | Yes |

### Microsoft 365 Integration (Per-User)

| Variable | Description | Required |
|----------|-------------|----------|
| `MS365_CLIENT_ID` | Azure AD Application (client) ID | Yes |
| `MS365_CLIENT_SECRET` | Azure AD Application secret | Yes |
| `MS365_TENANT_ID` | Azure AD Tenant ID | Yes |

### Jira Integration

| Variable | Description | Required |
|----------|-------------|----------|
| `JIRA_HOST` | Jira instance URL (e.g., `https://yourcompany.atlassian.net`) | Yes |
| `JIRA_EMAIL` | Atlassian account email | Yes |
| `JIRA_API_TOKEN` | Jira API token (generate at https://id.atlassian.com/manage-profile/security/api-tokens) | Yes |

### SMS Integration (BulkGate)

| Variable | Description | Required |
|----------|-------------|----------|
| `BULKGATE_APPLICATION_ID` | BulkGate application ID | Optional |
| `BULKGATE_APPLICATION_TOKEN` | BulkGate application token | Optional |
| `BULKGATE_WEBHOOK_URL` | Webhook URL for incoming SMS | Optional |

---

## Replit Deployment

### 1. Setup Database
- Click "Database" in the Tools panel
- Create a PostgreSQL database
- `DATABASE_URL` is automatically set

### 2. Configure Secrets
Go to **Secrets** tab and add:
```
SESSION_SECRET=<random-32-char-string>
OPENAI_API_KEY=<your-openai-key>
MS365_CLIENT_ID=<azure-app-id>
MS365_CLIENT_SECRET=<azure-app-secret>
MS365_TENANT_ID=<azure-tenant-id>
JIRA_HOST=https://yourcompany.atlassian.net
JIRA_EMAIL=your-atlassian-email@example.com
JIRA_API_TOKEN=<jira-api-token>
```

### 3. Run Database Migrations
```bash
npm run db:push
```

### 4. Publish
- Click **Publish** button
- Select deployment type (Static/Autoscale/Reserved VM)
- App will be available at `https://your-repl-name.replit.app`

---

## Ubuntu Server Deployment

### Prerequisites
- Ubuntu 20.04+ LTS
- Node.js 20+
- PostgreSQL 14+
- Nginx (recommended)
- PM2 for process management

### 1. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

### 2. Setup PostgreSQL

```bash
# Create database and user
sudo -u postgres psql

CREATE USER indexus WITH PASSWORD 'your-secure-password';
CREATE DATABASE indexus_crm OWNER indexus;
GRANT ALL PRIVILEGES ON DATABASE indexus_crm TO indexus;
\q
```

### 3. Clone and Setup Application

```bash
# Clone repository
cd /var/www
git clone https://github.com/your-repo/indexus-crm.git
cd indexus-crm

# Install dependencies
npm install

# Build application
npm run build
```

### 4. Configure Environment Variables

Create `/var/www/indexus-crm/.env`:

```bash
NODE_ENV=production
PORT=5000

# Database
DATABASE_URL=postgresql://indexus:your-secure-password@localhost:5432/indexus_crm

# Session
SESSION_SECRET=your-random-32-char-secret-here

# OpenAI
OPENAI_API_KEY=sk-...

# Microsoft 365
MS365_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MS365_CLIENT_SECRET=your-client-secret
MS365_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Jira
JIRA_HOST=https://yourcompany.atlassian.net
JIRA_EMAIL=your-atlassian-email@example.com
JIRA_API_TOKEN=your-jira-api-token

# BulkGate SMS (optional)
BULKGATE_APPLICATION_ID=xxxxx
BULKGATE_APPLICATION_TOKEN=xxxxx
BULKGATE_WEBHOOK_URL=https://your-domain.com/api/auth/bulkgate/callback
```

### 5. Run Database Migrations

```bash
npm run db:push
```

### 6. Setup PM2 Process Manager

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'indexus-crm',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_file: '.env'
  }]
};
```

Start application:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 7. Configure Nginx

Create `/etc/nginx/sites-available/indexus-crm`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support for notifications
    location /ws/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
```

Enable site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/indexus-crm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 8. Setup SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 9. Setup Firewall

```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

---

## Azure AD App Registration (MS365)

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Configure:
   - Name: `INDEXUS CRM`
   - Supported account types: **Accounts in this organizational directory only**
   - Redirect URI: `https://your-domain.com/api/auth/ms365/callback`
5. After creation, note:
   - **Application (client) ID** → `MS365_CLIENT_ID`
   - **Directory (tenant) ID** → `MS365_TENANT_ID`
6. Go to **Certificates & secrets** > **New client secret**
   - Copy the secret value → `MS365_CLIENT_SECRET`
7. Go to **API permissions** > **Add permission** > **Microsoft Graph**:
   - `Mail.Read`
   - `Mail.Send`
   - `Mail.ReadWrite`
   - `User.Read`
   - `offline_access`
8. Click **Grant admin consent**

---

## Jira API Token Generation

1. Go to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click **Create API token**
3. Name it (e.g., `INDEXUS CRM`)
4. Copy the token → `JIRA_API_TOKEN`
5. Use your Atlassian login email → `JIRA_EMAIL`
6. Your Jira URL → `JIRA_HOST` (e.g., `https://yourcompany.atlassian.net`)

---

## Monitoring & Maintenance

### PM2 Commands

```bash
# View logs
pm2 logs indexus-crm

# Restart application
pm2 restart indexus-crm

# Monitor
pm2 monit

# Update application
cd /var/www/indexus-crm
git pull
npm install
npm run build
pm2 restart indexus-crm
```

### Database Backup

```bash
# Create backup
pg_dump -U indexus indexus_crm > backup_$(date +%Y%m%d).sql

# Restore backup
psql -U indexus indexus_crm < backup_20240115.sql
```

---

## Troubleshooting

### Jira 401 Unauthorized
- Verify `JIRA_EMAIL` matches your Atlassian account email exactly
- Regenerate `JIRA_API_TOKEN` at https://id.atlassian.com/manage-profile/security/api-tokens

### Jira 403 Forbidden
- Check user has proper permissions in Jira project
- Verify Jira Cloud (not Server) is being used

### MS365 Authentication Fails
- Verify redirect URI matches exactly in Azure AD app
- Ensure all required API permissions are granted with admin consent

### WebSocket Connection Issues
- Ensure Nginx is configured for WebSocket upgrade
- Check firewall allows WebSocket connections
