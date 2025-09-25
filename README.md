# Merchandise Portal

[**Deployment Link**](https://merchandise-portal-theta.vercel.app/)

Merchandise Portal is a full-stack ordering and fulfillment platform for institute-branded merchandise built with Next.js, Prisma, and PostgreSQL. It covers customer shopping flows, payment capture, and admin operations in one project.

## Tech Stack

- Next.js 15 App Router (React 19, TypeScript)
- Prisma ORM with PostgreSQL
- NextAuth credentials provider with JWT sessions
- Tailwind CSS and shadcn/ui components
- Razorpay payments integration with webhook handling
- Vercel Blob storage for product media
- Vitest and ESLint for automated checks

## Core Capabilities

- **Account management:** Self-service registration, email verification, password reset flows, and admin invitations with role-based access (user, dept_head, admin).
- **Product discovery and cart:** Landing page, catalogue, detailed product pages with rating summaries, and a persistent cart backed by Prisma orders.
- **Checkout and fulfillment:** Delivery or pickup capture, address validation, order state transitions, and user dashboards that surface order history.
- **Payments:** Razorpay order intent creation, webhook processing, order event logging, and a safe fallback test mode when Razorpay keys are absent.
- **Reviews and moderation:** Customers can create, update, and delete reviews; admins can hide or restore feedback while aggregates stay in sync.
- **Admin workspace:** Authenticated tools for managing inventory, orders, users, invitations, and review moderation, with audit-friendly event timelines.
- **Media pipeline:** Image uploads and deletions via Vercel Blob, including client-side guards for file type and size and clean-up endpoints.

## Repository Layout

```
capstone_project/
|-- docs/
|   |-- Capstone.pdf
|   |-- Design.md
|   |-- ERD.md
|   |-- RequirementAnalysis.md
|   |-- Report.md
|   `-- Wireframes/
|-- prisma/
|   |-- schema.prisma
|   `-- seed.ts
|-- public/
|-- src/
|   |-- app/
|   |-- components/
|   |-- lib/
|   `-- styles/
|-- tests/
|   `-- reviews.test.ts
|-- .env.example
|-- package.json
|-- README.md
|-- TODO.md
`-- LICENSE
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [npm](https://www.npmjs.com/)
- [PostgreSQL](https://www.postgresql.org/) 14+
- Optional: Resend account or SMTP provider for transactional emails
- Optional: Razorpay account for live payments
- Optional: Vercel Blob project for media storage

### Set up the project

1. **Clone and install**
   ```bash
   git clone <repository-url>
   cd capstone_project
   npm install
   ```
2. **Configure environment variables**
   Copy `.env.example` to `.env` (or `.env.local`) and fill in the values described below.
3. **Provision the database**
   ```bash
   npx prisma migrate dev
   ```
4. **Seed demo data (recommended)**
   ```bash
   npm run seed
   ```
   Seeding creates demo products plus accounts:
   - Admin: `admin@demo.test` / `Passw0rd!`
   - Customers: `user@demo.test`, `alex@demo.test`, `priya@demo.test`, `jordan@demo.test` (all use `Passw0rd!`)
5. **Start the development server**
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000 to explore the app.

### Useful scripts

- `npm run dev` - launch the development server
- `npm run build` or `npm run start` - build and run a production bundle
- `npm run seed` - populate demo data (safe to re-run)
- `npm run lint` - run ESLint
- `npm run test` - execute Vitest suites

## Environment configuration

Configure the following variables (see `.env.example`).

### Core

- `DATABASE_URL` - PostgreSQL connection string.
- `NEXTAUTH_SECRET` - random string used by NextAuth to sign tokens.
- `NEXTAUTH_URL` - canonical URL of the deployed app (for example `http://localhost:3000`).
- `APP_BASE_URL` - base URL used in links inside transactional emails. Falls back to `NEXTAUTH_URL`.

### Authentication behavior

- `ALLOW_UNVERIFIED_LOGIN` - set to `true` to allow sign-in before email verification (defaults to `false`).

### Media uploads

- `BLOB_READ_WRITE_TOKEN` - Vercel Blob token with read/write permissions for the product image bucket.

### Email delivery

Provide either Resend credentials or SMTP settings (both can co-exist; Resend is preferred when present).

- `RESEND_API_KEY` - API key for Resend.
- `RESEND_FROM` - verified sender identity (for example `Merch Portal <onboarding@resend.dev>`).
- `EMAIL_FROM` - default "from" address used when neither Resend nor SMTP overrides it.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_SECURE` - SMTP transport configuration.

### Payments (Razorpay)

- `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` - Razorpay API credentials used to create orders.
- `RAZORPAY_WEBHOOK_SECRET` - shared secret for validating webhook signatures (optional but strongly recommended).

If Razorpay credentials are omitted, the checkout flow remains in test mode and generates mock order identifiers so that UI flows can be exercised without hitting the live API.

## Documentation and roadmap

- Additional artefacts (requirements, design, ERD, report, and wireframes) live in the `docs/` directory.
- Implementation progress, completed work, and outstanding tasks are tracked in `TODO.md`.

Contributions are welcome. Open an issue or submit a pull request if you spot a bug or want to collaborate.
