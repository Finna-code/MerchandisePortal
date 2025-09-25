# TODO

## Completed
- Provide user onboarding (self-registration, admin invites, email verification, and password resets) across Prisma, API routes, and UI (`prisma/schema.prisma`, `src/app/api/auth/**`, `src/app/signup/page.tsx`, `src/app/admin/users/page.tsx`).
- Checkout and payment flow scaffolding with payment-gateway intents/webhooks, fulfillment capture, and admin timeline (`src/app/checkout/[orderId]/**`, `src/lib/checkout-service.ts`, `src/lib/payment-service.ts`, `src/app/admin/orders/[id]/**`).
- Next.js 15 app with App Router, shared layout, themed header navigation, and navigation overlay in line with the design guide (`src/app/layout.tsx`, `src/components/layout/Header.tsx`, `src/components/navigation-overlay.tsx`).
- Authentication via NextAuth credentials with bcrypt hashing, role propagation, and a polished sign-in page (`src/auth.ts`, `src/app/signin/page.tsx`).
- Admin surfaces for products, orders, and users backed by guarded API routes (`src/app/admin/**`, `src/app/api/admin/**`).
- Cart subsystem with REST APIs, conflict handling, shared cart state, and toast messaging (`src/app/api/cart/**`, `src/components/cart/**`, `src/components/ui/toast.tsx`).
- Customer dashboard summarizing orders, metrics, and detailed order API responses (`src/app/dashboard/page.tsx`, `src/components/user-dashboard.tsx`, `src/app/api/orders/[id]/route.ts`).
- Product image pipeline using Vercel Blob uploads plus client-side compression and deletion hooks (`src/app/api/upload/**`, `src/components/admin/ImageUpload.tsx`, `src/components/admin/DeleteImage.tsx`).
- Prisma schema covering departments, group orders, payments, reminders, and order events, plus baseline seeds and health check endpoint (`prisma/schema.prisma`, `prisma/seed.ts`, `src/app/api/health/route.ts`).
- Documentation bundle with requirements, SRS, and design guidelines (`docs/*.md`).
- Documentation references and assets align with the deliverable tree (`README.md`, `docs/Wireframes/**`, `docs/Report.md`, `.env.example`).
- Environment variables documented via `.env.example` and README guidance (`README.md`, `.env.example`).
- Surface reviews and ratings so users can create, moderate, and read feedback on product pages; the `Review` model is unused (`prisma/schema.prisma:138`, `src/app/products/[id]/page.tsx:8`).

## Outstanding
- Build department and group-order workflows (shared carts, approvals, user assignment) to leverage `Dept` and `OrderType.group`; no UI or API covers them yet (`prisma/schema.prisma:23`, `prisma/schema.prisma:47`).
- Implement reminder and notification scheduling that populates and sends `Reminder` entries; the table is dormant (`prisma/schema.prisma:163`).
- Use `formatMoney` helpers across landing, catalog, and product detail pages to replace raw decimal coercion and fix the garbled INR display (`src/app/page.tsx:86`, `src/app/products/page.tsx:57`, `src/app/products/[id]/page.tsx:28`).
- Expand Prisma seed data with departments, sample orders, payments, and reminders so dashboards and admin flows have fixtures (`prisma/seed.ts:8`, `prisma/seed.ts:38`).
- Add automated tests covering auth guards, cart conflict resolution, admin APIs, and Prisma data access; the repo currently has no tests or test runner (`package.json:5`).
