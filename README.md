# Sri Balaji Renewables (SBR)

This repository contains the complete codebase for the Sri Balaji Renewables (SBR) management system, including:
- **`sbr web`**: React web customer/agent portal and website.
- **`sbr-backend`**: Node.js / Express MERN API backend.
- **`sbr android`**: Android app for agents and customers.
- **`sbr ios`**: iOS app for agents and customers.

---

## Production Domains & Architecture

| Module | Production URL | Server Directory / Port | Purpose |
| :--- | :--- | :--- | :--- |
| **SBR SMS Web Portal** | `https://sribalajirenewables.com` <br> `https://www.sribalajirenewables.com` | `/var/www/sbr.sriddha.com/web` | Public website and web management portal |
| **SBR Backend API** | `https://sribalajirenewables.com/api` | `/var/www/sbr.sriddha.com/backend` <br> (Node.js on Port `5006`) | Core REST API backend (PM2 process: `sbr-backend`) |
| **SBR Static Uploads** | `https://sribalajirenewables.com/uploads` | `/var/www/sbr.sriddha.com/backend/uploads` | Customer & service request media attachments |
| **Inventory / POS** | `https://pos.sribalajirenewables.com` | `/var/www/rajugariventures/sbr-pos` <br> (PHP 8.1 FPM) | Inventory & POS web application |

---

## Production Deployment (VPS)

- **VPS Host:** `147.93.107.21`
- **Repository Path:** `/var/www/sbr.sriddha.com/repo`

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
*Note: Nginx routes `sribalajirenewables.com` to `/var/www/sbr.sriddha.com/web/`.*

### 4. Deploy Backend (API Module)
If backend controller logic or models are updated:
```bash
# Sync updated backend files (excluding node_modules and configurations) to active backend directory
rsync -av --exclude 'node_modules' --exclude '.env' /var/www/sbr.sriddha.com/repo/sbr-backend/ /var/www/sbr.sriddha.com/backend/

# Restart the PM2 process to apply changes
pm2 restart sbr-backend
```
*Note: PM2 runs the active server process from `/var/www/sbr.sriddha.com/backend/server.js` on port `5006`.*

---

## Documentation & Architecture Guides

| Guide / Specification | Description |
| :--- | :--- |
| **[`STORE_INCHARGE_SPECIFICATION.md`](./STORE_INCHARGE_SPECIFICATION.md)** | Comprehensive Role-Based Access Control (RBAC), daily operations checklist, security boundaries, and API roadmap for the **Store In-Charge** role. |
| **[`SBR_Store_Incharge_Role_Features_Matrix.xlsx`](./SBR_Store_Incharge_Role_Features_Matrix.xlsx)** | Multi-tab formatted Excel sheet comparing Super Admin vs. Store In-Charge across 8 key operational domains. |
| **[`referral_plan_implementation_strategy.md`](./referral_plan_implementation_strategy.md)** | Architecture, schema, and UI flows for Customer Referral & Rewards system across Backend, Web, Android, and iOS. |
| **[`android_ios_replica.md`](./android_ios_replica.md)** | Feature parity mapping and release verification between Android (Jetpack Compose) and iOS (SwiftUI). |

---

## Recent Milestones & Work Completed

1. **Store In-Charge RBAC & Operational Framework**:
   - Built a complete matrix separating Super Admin business controls from Store In-Charge operational workflows.
   - Guarded critical operations (permanent ticket deletion, price altering, financial waivers, API secrets) under Super Admin only.
   - Created Excel generator (`generate_excel_matrix.py`) producing structured spreadsheets with styling, risk badges, and auto-adjusted columns.
   - Formatted CSV exports (`Role_&_Feature_Matrix.csv`, `Store_Incharge_Workflows.csv`, `Security_&_Boundaries.csv`).
2. **Referral Program Strategy**:
   - Designed full end-to-end referral model with unique codes, 1-click WhatsApp sharing, and admin approval pipeline.
3. **Android & iOS App Alignment**:
   - Verified 1:1 parity between Kotlin Compose and SwiftUI client implementations.
   - Updated build configs for compileSdk 36 and Google Play Store compliance.

---

## Next Steps to Continue From Here

When resuming development:
1. **Backend Role Support**:
   - Update `User.js` model in `sbr-backend/models/User.js` with `'store_incharge'` role.
   - Implement role authorization middleware for store operations (inventory indents, cash handover acknowledgments, van dispatches).
2. **Web Portal UI Updates**:
   - Update `sbr web` navigation/sidebar to conditionally render Store In-Charge tabs while hiding Admin settings and price management.
3. **Mobile & POS Integration**:
   - Wire van stock indents and physical cash handovers with real-time push notifications for Field Agents and Store In-Charges.

---

## Nginx Site Configurations

- **SMS Portal & API:** `/etc/nginx/sites-available/sribalajirenewables.com`
- **POS / Inventory:** `/etc/nginx/sites-available/pos.sribalajirenewables.com`
- **SSL Certificates:** Managed by Let's Encrypt Certbot (`certbot --nginx`)
