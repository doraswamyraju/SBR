# Sri Balaji Renewables (SBR)

This repository contains the complete codebase for the Sri Balaji Renewables (SBR) management system, including:
- **`sbr web`**: React web customer/agent portal and website.
- **`sbr-backend`**: Node.js / Express MERN API backend.
- **`sbr android`**: Android app for agents and customers.
- **`sbr ios`**: iOS app for agents and customers.

---

## Production Deployment (VPS)

The project is deployed on the VPS under:
`/var/www/sbr.sriddha.com/repo`

Follow these instructions to pull and deploy updates onto the live server.

### 1. SSH into the VPS
```bash
ssh root@147.93.107.21
```

### 2. Navigate and Pull Latest Code
```bash
cd /var/www/sbr.sriddha.com/repo
git pull origin main
```

### 3. Deploy Frontend (Web Module)
```bash
# Navigate to the web folder inside repo
cd "sbr web"

# Install dependencies and build
npm install
npm run build

# Clear active web files and deploy the new build
rm -rf /var/www/sbr.sriddha.com/web/*
cp -r "/var/www/sbr.sriddha.com/repo/sbr web/build/"* /var/www/sbr.sriddha.com/web/
```
*Note: The Nginx configuration maps sbr.sriddha.com directly to `/var/www/sbr.sriddha.com/web/`. Therefore, the compiled files must be copied from the repo build directory.*

### 4. Deploy Backend (API Module)
If backend controller logic or models are updated:
```bash
# Sync updated backend files (excluding node_modules and configurations) to active backend directory
rsync -av --exclude 'node_modules' --exclude '.env' /var/www/sbr.sriddha.com/repo/sbr-backend/ /var/www/sbr.sriddha.com/backend/

# Restart the PM2 process to apply changes
pm2 restart sbr-backend
```
*Note: PM2 runs the active server process from `/var/www/sbr.sriddha.com/backend/server.js`.*
