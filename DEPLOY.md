# Deploying BM Database to a public HTTPS domain

This turns the exact same app you run locally today into a real website,
without changing its architecture: still PowerShell + `System.Net.HttpListener`
(`server.ps1`), still one encrypted `bm-data.enc` file, still no build step.
The only things that change are *where* it runs and *how it's reached*.

Recommended setup: one small Linux VPS, `pwsh` installed directly (no
Docker), `server.ps1` kept alive by `systemd`, and [Caddy](https://caddyserver.com)
as a reverse proxy that gets you free, automatic HTTPS.

---

## 0. What you need

- A VPS (DigitalOcean, Hetzner, Linode, etc.) — the cheapest tier is enough.
  Ubuntu 22.04/24.04 recommended.
- A domain name you own (any registrar — Namecheap, Cloudflare, Google
  Domains successor, etc.).
- SSH access to the VPS.

---

## 1. Point your domain at the server

In your domain registrar's DNS settings, add an **A record**:

```
Type: A
Name: @ (or a subdomain like "app")
Value: <your VPS's public IP address>
```

This can take a few minutes to a few hours to propagate. Caddy (step 4) needs
this to already be working before it can issue an HTTPS certificate.

---

## 2. Provision the server

SSH into your VPS as root (or a sudo user), then:

```bash
# Install PowerShell (pwsh)
sudo apt update
sudo apt install -y wget apt-transport-https software-properties-common
source /etc/os-release
wget -q https://packages.microsoft.com/config/ubuntu/$VERSION_ID/packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
sudo apt update
sudo apt install -y powershell

# Install Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy

# Create a dedicated, unprivileged user to run the app
sudo useradd --system --home /opt/bm-database --shell /usr/sbin/nologin bmapp

# App code directory and persistent data directory (kept separate on purpose)
sudo mkdir -p /opt/bm-database /var/lib/bm-database
sudo chown -R bmapp:bmapp /opt/bm-database /var/lib/bm-database
```

---

## 3. Copy the app up

From your Mac, in this project directory:

```bash
rsync -av --exclude 'bm-data.enc*' --exclude '.git' \
  /Users/nuraikinayat/Desktop/project/ your-user@your-server-ip:/tmp/bm-database-upload/
```

(`bm-data.enc*` is excluded here on purpose — see step 3b, it goes to the
*persistent data* directory, not the app-code directory.)

On the server:

```bash
sudo cp -r /tmp/bm-database-upload/* /opt/bm-database/
sudo chown -R bmapp:bmapp /opt/bm-database
```

### 3b. Bring your existing data across

This preserves everything you already have — companies, founders,
certificates, calendar events, all of it.

```bash
# From your Mac:
scp /Users/nuraikinayat/Desktop/project/bm-data.enc your-user@your-server-ip:/tmp/

# On the server:
sudo mv /tmp/bm-data.enc /var/lib/bm-database/bm-data.enc
sudo chown bmapp:bmapp /var/lib/bm-database/bm-data.enc
```

---

## 4. Configure Caddy

```bash
sudo cp /opt/bm-database/Caddyfile /etc/caddy/Caddyfile
sudo nano /etc/caddy/Caddyfile
```

Edit it:
- Replace `yourdomain.com` with your real domain.
- Replace the placeholder IPs in the `@blocked` line with the IP address(es)
  that should be allowed to reach the app (find yours at
  https://ifconfig.me). Add more IPs (space-separated) if you need access
  from multiple locations.

```bash
sudo systemctl restart caddy
```

Caddy will automatically request and renew an HTTPS certificate for your
domain the first time it starts serving it — no extra steps needed.

---

## 5. Configure and start the app service

```bash
sudo cp /opt/bm-database/deploy/bm-database.service /etc/systemd/system/
sudo nano /etc/systemd/system/bm-database.service
```

Edit the `Environment=BM_ALLOWED_ORIGIN=...` line to match your real domain
(`https://yourdomain.com`), then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now bm-database
sudo systemctl status bm-database   # should show "active (running)"
```

---

## 6. Verify

- Visit `https://yourdomain.com` from an allowed IP — you should see the
  BM Database unlock screen, padlock/HTTPS shown in the browser.
- Enter your existing master password — your existing companies, founders,
  certificates, and calendar events should all be there.
- From a device/IP *not* on your allowlist, the same URL should return a
  403.
- Check logs if anything looks wrong: `sudo journalctl -u bm-database -f`
  and `sudo journalctl -u caddy -f`.

---

## Updating the app later

Data and code are separate, so updates are safe:

```bash
# From your Mac — re-sync code only, data directory is untouched
rsync -av --exclude 'bm-data.enc*' --exclude '.git' \
  /Users/nuraikinayat/Desktop/project/ your-user@your-server-ip:/tmp/bm-database-upload/
# On the server:
sudo cp -r /tmp/bm-database-upload/* /opt/bm-database/
sudo chown -R bmapp:bmapp /opt/bm-database
sudo systemctl restart bm-database
```

`bm-data.enc` in `/var/lib/bm-database` is never touched by this process.

---

## Notes / known limitations

- **No user accounts or roles.** This app protects data with one shared
  master password, same as it always has — everyone with the password has
  full access to everything. If you need per-person logins or permission
  levels, that's a separate, much larger feature to design from scratch —
  not something this deployment includes.
- **IP allowlisting** means access only works from IPs you've explicitly
  listed in the Caddyfile. If your IP changes (e.g. mobile network, moving
  locations), you'll need to update the Caddyfile and `sudo systemctl reload
  caddy`. If this becomes inconvenient, consider a VPN with a static exit IP
  instead of adding broader IP ranges.
- **Google Calendar sync**, if you configure it later, needs its OAuth
  Client ID's "Authorized JavaScript origins" updated to
  `https://yourdomain.com` in Google Cloud Console (edit `js/google-config.js`
  with the real Client ID at that point — currently empty/unconfigured).
- **`migrate.html`** still has `http://localhost:8080` hardcoded — it's a
  legacy one-time helper for importing data from the old `file://`-opened
  version of the app and isn't linked from the main app, so it doesn't block
  this deployment.
- **Backups**: `bm-data.enc` in `/var/lib/bm-database` is the only copy on
  the server. Consider periodically copying it somewhere else
  (`scp your-user@your-server-ip:/var/lib/bm-database/bm-data.enc ./backup-$(date +%F).enc`),
  the same way local backups were kept during development.
