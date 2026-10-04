# Cafe Lina - Enterprise Coffee Shop Management & ERP System

Welcome to **Cafe Lina**, a full-featured enterprise coffee shop management, online ordering, and ERP system built for single-origin specialty coffee shops, sourdough bakeries, and breakfast bistros.

---

## 🌟 Key Features

### ☕ Public Customer Experience (Dark Luxury Aesthetic)
- **Interactive Menu**: Multi-category menu covering Specialty Coffee, Sourdough Bakery, Ethiopian Breakfast, and Artisanal Desserts with real-time filtering and search.
- **Table Reservation Engine**: Instant booking system with date, time, party size, and seating preferences (Terrace, Private Booth, Indoors, Bar).
- **Online Ordering & Cart**: Custom options selector, localized delivery calculations for Addis Ababa, instant coupon application (`LINA10`), and Stripe / Telebirr / CBE payment gateways.
- **Order Tracking & Digital Invoice**: Real-time order progress timeline and printable tax invoice generator.
- **Customer Portal**: Member rewards points tracker (Tier levels: Silver, Gold, Platinum), order history logs, wishlist, and profile management.
- **Information Hub**: Story page, photo gallery with filter tabs, blog journal with brewing guides, career application portal, contact form with location details, and compliance pages.

### 🏢 Enterprise ERP & Management System
- **Executive Dashboard**: KPI metrics, hourly sales charts, revenue breakdowns, top-selling items, and quick action shortcuts.
- **Inventory & Stock Operations**: Real-time batch stock tracking, automatic reorder alerts, stock-in/stock-out logs, and recipe yield management.
- **Point of Sale (POS)**: Fast checkout interface for cashiers with barcode scanner simulation, order kitchen firing, and thermal receipt printing.
- **Kitchen Display System (KDS)**: Live kitchen ticket dashboard with status progression (Pending → In Prep → Ready → Delivered).
- **Extended Producer Responsibility (EPR) & Waste**: Packaging lifecycle tracking, plastic usage metrics, and organic waste management.
- **HR & Payroll**: Employee database, shift clock-in/out attendance tracker, and automated monthly payroll processor.
- **Supplier & Purchase Orders**: Supplier database, automated purchase order creation, and delivery tracking.
- **Recipe Costing & COGS**: Granular ingredient costing, margin calculations, and menu price profitability analysis.
- **Analytics & Accounting**: Income statement, expense tracking, profit & loss analysis, and printable PDF/CSV report exports.

---

## 🛠️ Technology Stack

- **Framework**: React 18+ with Vite & TypeScript
- **Styling**: Tailwind CSS with custom dark luxury palette (`#0f0f0f` obsidian canvas, `#181818` card surfaces, `#6B1D1D` rich burgundy accents, and `#D4AF37` metallic gold highlights)
- **Icons**: Lucide React
- **Animations**: Motion (Framer Motion)
- **Data Persistence**: Firebase Firestore & Client Local State Fallback

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in your keys:

```env
# Firebase Credentials
NEXT_PUBLIC_FIREBASE_API_KEY="your_api_key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_auth_domain"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_project_id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_storage_bucket"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_messaging_id"
NEXT_PUBLIC_FIREBASE_APP_ID="your_app_id"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="your_measurement_id"

# Cloudinary Storage Credentials
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

---

## 🚀 Installation & Local Development

1. **Clone Repository & Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Local Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

3. **Verify Build & Lint**:
   ```bash
   npm run build
   npm run lint
   ```

---

## 🔒 Security & Firestore Security Rules

Deploy the included security rules to ensure role-based access control across `users`, `orders`, `inventory`, and `settings` collections:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /orders/{orderId} {
      allow read, create: if true;
      allow update, delete: if request.auth != null && request.auth.token.role in ['Admin', 'Manager', 'Cashier'];
    }
    match /inventory/{itemId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.role in ['Admin', 'Manager'];
    }
    match /{document=**} {
      allow read, write: if request.auth != null && request.auth.token.role == 'Admin';
    }
  }
}
```

---

© 2026 Cafe Lina. All rights reserved. Built with pride in Addis Ababa, Ethiopia.
