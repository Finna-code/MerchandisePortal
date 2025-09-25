# TODO

## Completed
- Delivered self-service onboarding with admin invitations, email verification, and reset flows across Prisma, API routes, and UI (`prisma/schema.prisma`, `src/app/api/auth/**`, `src/app/signup/page.tsx`, `src/app/reset/**`, `src/app/verify/**`, `src/app/accept-invite/**`).
- Hardened authentication via NextAuth credentials provider with bcrypt hashing, role propagation, and a polished sign-in page (`src/auth.ts`, `src/app/signin/page.tsx`).
- Built the customer shopping experience with landing, catalogue, product detail, and persistent cart state backed by order records and optimistic conflict handling (`src/app/page.tsx`, `src/app/products/**`, `src/app/cart/**`, `src/app/api/cart/**`).
- Implemented checkout, fulfillment capture, and payment orchestration with Razorpay intent creation, webhook ingestion, and order event timelines (`src/app/checkout/[orderId]/**`, `src/lib/payment-service.ts`, `src/app/api/payments/razorpay/webhook/route.ts`, `src/lib/orders.ts`).
- Shipped the admin workspace for products, orders, users, invitations, and review moderation guarded by role-aware API routes (`src/app/admin/**`, `src/app/api/admin/**`).
- Delivered product review creation, editing, moderation, and rating aggregates seeded with demo content (`src/components/reviews/**`, `src/app/api/products/[id]/reviews/route.ts`, `prisma/seed.ts`).
- Connected Vercel Blob-backed media pipeline with upload and delete endpoints plus client safeguards (`src/app/api/upload/**`, `src/components/admin/ImageUpload.tsx`, `src/components/admin/DeleteImage.tsx`).
- Added transactional email infrastructure with Resend integration and SMTP fallback used by onboarding flows (`src/lib/mailer.ts`, `src/app/api/auth/**`).
- Maintained the documentation bundle aligned with capstone deliverables (`docs/**`, `README.md`).
- Established Vitest-based unit tests for review utilities and rate limiting (`tests/reviews.test.ts`, `package.json`).
- Consolidate pricing display by using the `formatMoney` helper on landing, catalogue, and product detail pages to avoid inconsistent INR formatting (`src/app/page.tsx`, `src/app/products/page.tsx`, `src/app/products/[id]/page.tsx`).
- Expand Prisma seed data with departments, sample orders, payments, and reminders so dashboards and admin flows have richer fixtures (`prisma/seed.ts`).

## Outstanding
- Build department and group-order workflows (shared carts, approvals, user assignment) to exercise `Dept` relations and `OrderType.group`; no UI or API covers them yet (`prisma/schema.prisma`).
- Implement reminder and notification scheduling that populates and sends `Reminder` entries; the table remains unused (`prisma/schema.prisma`, `src/lib/orders.ts`).
- Revisit payment integration touchpoints to confirm end-to-end coverage and prepare for wider provider options.
- Broaden automated test coverage beyond review utilities to include auth guards, cart conflict resolution, admin APIs, and Prisma data access patterns (`tests/`, `package.json`).
