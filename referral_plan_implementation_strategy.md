# Referral Plan Implementation Strategy - Sri Balaji Renewables (SBR)

## Overview
A comprehensive strategy for implementing a **Customer Referral & Rewards Program** across the SBR platform (Backend API, Web Application, Android App, and iOS App).

---

## Key Features

1. **Unique Referral Codes & Share Links**:
   - Each registered customer automatically receives a unique referral code (e.g., `SBR-JOHN102`).
   - 1-click **Share on WhatsApp** (`https://wa.me/?text=...`) and **Copy Code/Link** capability.

2. **Direct Referral Submissions**:
   - Existing customers can submit their friend's details (Name, Phone, Product Interest) directly from their dashboard so SBR agents can contact them.

3. **Referral Tracking & Rewards**:
   - **Statuses**: `Pending` ➔ `Contacted` ➔ `Purchased / Converted` ➔ `Reward Credited`.
   - Admin approves conversions upon successful product installation/payment and credits referral rewards to the referring customer.

---

## Technical Architecture

### 1. Backend (`sbr-backend`)
- **Schema (`User.js`)**: Add `referralCode` (unique String), `referredBy` (ObjectId/String), `totalReferralEarnings` (Number).
- **Model (`Referral.js`)**: Fields: `referrerId`, `referralCode`, `refereeName`, `refereePhone`, `productInterest`, `status`, `purchaseAmount`, `rewardAmount`, `notes`, `timestamps`.
- **Endpoints (`referralRoutes.js`, `referralController.js`)**:
  - `GET /api/referrals/my-referrals`: Get customer referral code, statistics, and referrals list.
  - `POST /api/referrals/submit`: Submit a friend's contact details.
  - `GET /api/referrals/admin/all`: Admin view for tracking referral pipeline.
  - `PUT /api/referrals/admin/:id/status`: Admin updates status to `Purchased` or `Reward Credited`.

### 2. Web Frontend (`sbr web`)
- **Customer Dashboard (`ReferAndEarnTab.jsx`)**: Unique Referral Code card, 1-click WhatsApp Share, Referral Stats (Invited, Converted, Total Rewards ₹), "Refer a Friend" submission modal, live status table.
- **Admin Dashboard (`AdminReferralsTab.jsx`)**: Referral lead management pipeline and 1-click conversion & reward issuer.

### 3. Android App (`sbr android`)
- **Kotlin & Jetpack Compose (`OurCustomersScreen.kt` & `ReferAndEarnScreen.kt`)**: Hilt ViewModel (`ReferralViewModel`), Retrofit endpoints, Android Share Intent for WhatsApp & system apps, Compose stats grid and lead submission dialog.

### 4. iOS App (`sbr ios`)
- **Swift & SwiftUI (`ReferAndEarnView.swift`)**: `ReferralViewModel` with async/await, `UIActivityViewController` Share Sheet, stats grid, and SwiftUI referral status list.

---

## Future Action Items when Ready to Implement
1. Decide on fixed (e.g., ₹500/purchase) vs. percentage-based (e.g., 5%) default reward structure.
2. Execute backend schema & endpoint migration.
3. Deploy Web, Android, and iOS referral screens.
