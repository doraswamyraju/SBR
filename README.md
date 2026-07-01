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
# Navigate to the web folder
cd "sbr web"

# Install any new dependencies
npm install

# Build the React production bundle
npm run build
```
*Note: The Nginx configuration is mapped to read directly from `/var/www/sbr.sriddha.com/repo/sbr web/build`. Rebuilding is sufficient to push updates live.*

### 4. Deploy Backend (API Module)
If backend controller logic or models are updated:
```bash
# Navigate to the backend folder
cd /var/www/sbr.sriddha.com/repo/sbr-backend

# Install dependencies if package.json changed
npm install

# Restart the Node server process (usually run with PM2)
pm2 restart all
# Or if it has a specific process name:
pm2 restart server
```
