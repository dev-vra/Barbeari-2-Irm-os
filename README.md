# Barbearia 2 Irmãos — Barbershop Management System

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=flat&logo=stripe&logoColor=white)](https://stripe.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

A full-stack barbershop management system built for **Barbearia 2 Irmãos** in Cuiabá, MT. Handles online booking, payments, inventory, staff commissions, and real-time reports — all in a dark-gold premium UI.

---

## Features

- **Online Booking** — Clients book appointments 24/7 with real-time slot availability
- **Payment Integration** — Stripe (PIX + credit/debit card) with webhook support
- **Admin Dashboard** — Revenue stats, occupancy rates, and daily schedule overview
- **Staff Management** — Per-professional schedules, service assignments, and commission tracking
- **Inventory Control** — Stock alerts, cost/margin tracking, and low-stock notifications
- **Quick Consumables (POS)** — Sell beverages (beer, coffee, soda) to waiting clients via tap-friendly POS interface
- **Product Sales** — Retail product management with automatic commission calculation
- **Reports** — PDF export for sales, appointments, inventory, commissions, and cash flow
- **Client Portal** — Clients manage their own bookings, view history, and update profiles
- **Mobile-First** — Fully responsive across all admin and client pages
- **Animations** — Framer Motion page transitions, scroll-reveal sections, and spring sidebar

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, TailwindCSS v4, Framer Motion |
| State / Data | TanStack Query v5, Zustand, React Hook Form + Zod |
| Backend | NestJS, TypeScript, Prisma ORM |
| Database | PostgreSQL (Neon DB for production) |
| Cache | Redis (BullMQ for background jobs) |
| Payments | Stripe (PIX, credit card, webhooks) |
| Auth | JWT (access + refresh tokens), bcryptjs |
| Deploy | Vercel (frontend), Railway (backend) |

---

## Architecture

```
barber/
├── frontend/               # React + Vite SPA
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing/    # Public landing page
│   │   │   ├── Auth/       # Login, Register, Forgot Password
│   │   │   ├── Admin/      # Dashboard, Schedule, Appointments, Products...
│   │   │   └── Client/     # Booking, My Appointments, Profile
│   │   ├── components/
│   │   │   ├── layout/     # AdminLayout, ClientLayout (animated sidebars)
│   │   │   ├── shared/     # ProtectedRoute, guards
│   │   │   └── ui/         # Modal, ConfirmDialog, Spinner, EmptyState...
│   │   ├── store/          # Zustand auth store
│   │   └── lib/            # api.ts (Axios), queryClient, utils, masks
│   └── vercel.json
│
└── backend/                # NestJS API
    ├── src/
    │   └── modules/
    │       ├── auth/        # JWT, refresh tokens, guards
    │       ├── appointments/ # Booking logic, slot calculation
    │       ├── professionals/ # Staff, schedules, services
    │       ├── products/    # Inventory, sales, commissions
    │       ├── payments/    # Stripe integration, webhooks
    │       ├── reports/     # PDF generation (pdfkit)
    │       └── users/       # Client management
    ├── prisma/
    │   ├── schema.prisma
    │   ├── migrations/
    │   └── seed.ts          # Rich demo data (3 weeks history + 2 weeks future)
    ├── Dockerfile
    └── railway.toml
```

---

## Quick Start

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL + Redis) or [Neon DB](https://neon.tech) + Redis Cloud

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/barber.git
cd barber

# Install dependencies
cd backend && npm install
cd ../frontend && npm install
```

### 2. Environment Variables

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your database URL, JWT secrets, and Stripe keys

# Frontend
cp frontend/.env.example frontend/.env
# Edit VITE_API_URL to point to your backend
```

### 3. Start with Docker

```bash
# Start PostgreSQL + Redis
docker compose up -d

# Run migrations + seed
cd backend
npx prisma migrate dev
npx ts-node prisma/seed.ts
```

### 4. Run Dev Servers

```bash
# Terminal 1 — Backend (port 3005)
cd backend && npm run start:dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

Visit `http://localhost:5173`

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@barbearia2irmaos.com` | `admin123` |
| Client | `cliente@exemplo.com` | `cliente123` |

The seed script populates **3 weeks of past appointments** (completed, cancelled, no-show) and **2 weeks of future bookings**, with product sales and commission records.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret (256-bit) |
| `JWT_REFRESH_SECRET` | Refresh token secret |
| `JWT_EXPIRES_IN` | Access token TTL (e.g. `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL (e.g. `7d`) |
| `REDIS_HOST` | Redis hostname |
| `REDIS_PORT` | Redis port (default `6379`) |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `FRONTEND_URL` | Frontend URL for CORS |
| `PORT` | API port (default `3005`) |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API URL (e.g. `https://api.example.com/api`) |

---

## Deploy

### Frontend → Vercel

1. Import the `frontend/` folder to Vercel
2. Set build command: `npm run build` | Output: `dist`
3. Add `VITE_API_URL` environment variable pointing to your Railway backend

### Backend → Railway

1. Connect your GitHub repo to Railway
2. Set root directory to `backend/`
3. Add all environment variables from `.env.example`
4. Railway auto-detects the `Dockerfile` and `railway.toml`

### Database → Neon DB

1. Create a free project at [neon.tech](https://neon.tech)
2. Copy the connection string → set as `DATABASE_URL`
3. Run `npx prisma migrate deploy` on first deploy (handled by `railway.toml`)

---

## API Documentation

Swagger UI available at `http://localhost:3005/api/docs` when running in development.

---

## License

MIT © 2025 Barbearia 2 Irmãos
