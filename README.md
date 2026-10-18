# Switea Nature Cafe — Full Restaurant Website, Digital QR Menu & Management Platform

A complete, production-grade restaurant operating system built specifically for **Switea Nature Cafe** (Jaipur, Rajasthan). Features a branded public landing page, interactive table-wise digital QR menu, live table cart ordering, real-time kitchen display system (KDS), restaurant administration dashboard, and platform super admin suite.

---

## 🌟 Technology Stack

- **Frontend**:
  - React 18 with TypeScript
  - Vite build toolchain
  - Tailwind CSS (Curated nature-inspired palette: Forest greens, sage, warm cream, terracotta)
  - React Router v6
  - TanStack Query
  - React Hook Form + Zod validation
  - Lucide React icon suite
  - `qrcode.react` high-contrast scanner library
  - Socket.IO client for real-time live order streaming

- **Backend**:
  - Node.js & Express.js with TypeScript
  - Prisma ORM with 24 relational models
  - PostgreSQL schema (`prisma/schema.postgresql.prisma`) & zero-config local SQLite (`switea.db`)
  - Socket.IO WebSocket server with restaurant and order room isolation
  - Secure bcrypt password hashing and signed JWT authentication
  - Multer upload storage with MIME type validation
  - Authoritative server-side price, tax, and discount calculation (prevents client price tampering)

---

## 🗂️ Application Structure & Routes

### Public Website
- `/` — Switea Nature Cafe official branded landing page
- `/menu` — Digital menu browsing
- `/menu/:restaurantSlug` — Restaurant-specific menu
- `/menu/:restaurantSlug/table/:tableToken` — **Table-specific QR menu** (identifies customer table and locks in table-wise order placement)
- `/cart` — Cart review, discount coupon validation (`NATURE10`), itemized GST breakdown
- `/checkout` — Dining mode selection, contact info, payment selection (Cash, Counter, UPI, Online)
- `/order/:orderToken` — **Real-time customer order tracking** with live status timeline (Pending → Accepted → Preparing → Ready → Served)
- `/about` — Dedicated brand story and cafe nature highlights
- `/gallery` — Cafe garden greenery, evening fairy lights, and culinary photography with lightbox
- `/contact` — Verified address, opening hours, WhatsApp link, and directions map
- `/privacy-policy` & `/terms-and-conditions` — Business terms and privacy notices

### Restaurant Administration
- `/admin/login` — Staff authentication portal
- `/admin/dashboard` — Live database-driven analytics (Today's Sales, Active Tables, Pending Orders, Recent Trays)
- `/admin/tables` & `/admin/qr-codes` — **Table-wise QR management**: Individual QR cards, SVG download, print table tent cards, bulk print sheet, and instant 1-click token revocation/regeneration
- `/admin/orders` — Live order management with realtime Socket.IO alerts and 1-click status advancement
- `/admin/kitchen` — **Kitchen Display System (KDS)** with preparation timers, cooking notes, and "Mark Ready" action
- `/admin/menu` — Full menu item management, image uploads, price, veg toggle, bestseller badge, and instant in-stock availability switch
- `/admin/categories` — Menu categories management
- `/admin/offers` — Discount coupon creation (percentage or fixed, min order cap, usage counters)
- `/admin/branding` — **Live Landing Page Editor**: Edit hero headline, description, about section, announcement banner, and social links with instant database persistence
- `/admin/gallery` — Photo gallery management
- `/admin/profile` & `/admin/settings` — Business profile, address, tax rate %, opening hours, ordering toggle, and open/closed switch
- `/admin/team` — Staff RBAC management (Owner, Manager, Kitchen, Staff)
- `/admin/reviews` — Customer review approvals
- `/admin/analytics` — Detailed reports, revenue trends, and top menu performers

### Platform Super Administration
- `/super-admin/login` — Platform management login
- `/super-admin/dashboard` — System overview, Platform GMV, total restaurants, active subscriptions, and server health
- `/super-admin/restaurants` — Multi-tenant restaurant directory, onboarding modal, and activation/suspension
- `/super-admin/users` — Directory of all users across tenants
- `/super-admin/plans` — SaaS subscription plans (Starter, Pro, Enterprise)
- `/super-admin/audit-logs` — Immutable platform security audit trail

---

## 🔐 Pre-seeded Credentials

| Role | Email | Password |
|---|---|---|
| **Platform Super Admin** | `superadmin@switea.com` | `Password123!` |
| **Restaurant Owner** | `owner@switea.com` | `Password123!` |
| **Cafe Manager** | `manager@switea.com` | `Password123!` |
| **Kitchen Staff** | `kitchen@switea.com` | `Password123!` |

- **Sample Promo Code**: `NATURE10` (10% off on orders above ₹199)
- **Table 01 Token**: `sw-tbl-g01-nature` → URL: `http://localhost:5173/menu/switea/table/sw-tbl-g01-nature`
- **Table 02 Token**: `sw-tbl-g02-nature` → URL: `http://localhost:5173/menu/switea/table/sw-tbl-g02-nature`

---

## 🚀 Quick Start & Development Instructions

### 1. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Database Setup & Seeding
```bash
cd backend
# Generate Prisma Client & Sync Database
npx prisma generate
npx prisma db push

# Seed Switea Cafe Data (authentic items, categories, tables, QR tokens)
npx tsx prisma/seed.ts
```

### 3. Run Development Servers
In two separate terminals:
```bash
# Terminal 1: Backend API (port 5000)
cd backend
npm run dev

# Terminal 2: Frontend (port 5173)
cd frontend
npm run dev
```

Visit:
- **Public Website & Digital Menu**: `http://localhost:5173`
- **Table 01 QR Experience**: `http://localhost:5173/menu/switea/table/sw-tbl-g01-nature`
- **Restaurant Admin Portal**: `http://localhost:5173/admin/login`
- **Super Admin Platform**: `http://localhost:5173/super-admin/login`

---

## 🧪 Automated Testing

Run the full integration test suite covering health checks, JWT authentication, public menu, table QR resolution, authoritative cart calculations, order placement, order status tracking, and dashboard analytics:

```bash
cd backend
npm test
```

---

## 🐘 Production PostgreSQL Deployment

To run with PostgreSQL in production:
1. Start PostgreSQL with Docker Compose:
   ```bash
   docker-compose up -d
   ```
2. In `backend/.env`, set:
   ```env
   DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/switea_db?schema=public"
   ```
3. Copy the production PostgreSQL schema:
   ```bash
   cp prisma/schema.postgresql.prisma prisma/schema.prisma
   npx prisma generate
   npx prisma db push
   npx tsx prisma/seed.ts
   ```

### Database Backup & Recovery

- **Backup**:
  ```bash
  pg_dump -h localhost -U postgres -d switea_db -F c -b -v -f switea_backup.dump
  ```
- **Restore**:
  ```bash
  pg_restore -h localhost -U postgres -d switea_db -v switea_backup.dump
  ```
