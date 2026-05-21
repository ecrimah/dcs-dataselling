# DCS ELITE

Premium multi-vendor data marketplace at **dcselite.com** — built with Next.js 16, TypeScript, and Tailwind CSS 4.

## Features

- **Public marketplace** — browse, filter, compare bundles (MTN, Telecel, AT)
- **Vendor storefronts** — `/vendor/[slug]`
- **Secure checkout** — Paystack payments with Arkesel SMS notifications
- **Order tracking** — fulfilment progress UI
- **Vendor dashboard** — revenue, queue, analytics
- **Super admin** — GMV, vendor governance, operations overview
- **Supabase schema** — full migration in `supabase/migrations/`

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Copy `.env.example` to `.env.local` and configure:

- Supabase (auth + database)
- Paystack secret & public keys
- Arkesel API key & sender ID (SMS)

Supabase keys are required — the app loads all marketplace, vendor, and admin data from the database.

## Routes

| Route | Description |
|-------|-------------|
| `/` | Premium homepage |
| `/marketplace` | Data marketplace |
| `/checkout?bundle=...` | Checkout flow |
| `/vendor/[slug]` | Vendor storefront |
| `/vendor/dashboard` | Vendor SaaS dashboard |
| `/admin` | Super admin control |

## Database

Apply migration to your Supabase project:

```bash
supabase db push
```

Or paste `supabase/migrations/001_initial_schema.sql` in the SQL editor.

## Payments

- `POST /api/payments/initialize` — start Paystack payment
- `POST /api/webhooks/paystack` — verified webhook handler (triggers Arkesel SMS)

## Stack

Next.js 16 · React 19 · Tailwind 4 · Supabase · Zod · Recharts · Radix UI
