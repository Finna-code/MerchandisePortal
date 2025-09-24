# TODO

## Completed
- Next.js 15 app with App Router, shared layout, themed header navigation, and navigation overlay in line with the design guide (`src/app/layout.tsx`, `src/components/layout/Header.tsx`, `src/components/navigation-overlay.tsx`).
- Authentication via NextAuth credentials with bcrypt hashing, role propagation, and a polished sign-in page (`src/auth.ts`, `src/app/signin/page.tsx`).
- Admin surfaces for products, orders, and users backed by guarded API routes (`src/app/admin/**`, `src/app/api/admin/**`).
- Cart subsystem with REST APIs, conflict handling, shared cart state, and toast messaging (`src/app/api/cart/**`, `src/components/cart/**`, `src/components/ui/toast.tsx`).
- Product image pipeline using Vercel Blob uploads plus client-side compression and deletion hooks (`src/app/api/upload/**`, `src/components/admin/ImageUpload.tsx`, `src/components/admin/DeleteImage.tsx`).
- Prisma schema and seed data covering departments, orders, payments, reminders, plus health check endpoint (`prisma/schema.prisma`, `prisma/seed.ts`, `src/app/api/health/route.ts`).
- Documentation bundle with requirements, SRS, and design guidelines (`docs/*.md`).

## Outstanding
- Implement real checkout so cart orders transition into confirmed orders with fulfillment details; current UI stops at a "Checkout (test only)" toast (`src/app/cart/cart-view.tsx:195`, `src/app/cart/cart-view.tsx:358`).
- Integrate Razorpay (or alternative) and persist payment lifecycle events using the `Payment` table, which no API currently touches (`prisma/schema.prisma:127`).
- Build customer order finalization flow (address/pickup capture, status transitions) and extend admin fulfillment beyond a status dropdown; ensure inventory adjusts on checkout, not only in carts.
- Provide user onboarding (self-registration or admin invites) and credential resets; all accounts are pre-seeded today (`src/auth.ts:9`, `prisma/seed.ts:18`).
- Surface reviews and ratings so users can create, moderate, and read feedback on product pages; the Review model is unused (`prisma/schema.prisma:94`, `src/app/products/[id]/page.tsx:8`).
- Expose department and group-order workflows leveraging `Dept` and `OrderType.group` (assign users, approve department carts); no UI/API covers them yet (`prisma/schema.prisma:35`, `prisma/schema.prisma:68`).
- Implement reminder/notification scheduling that populates and sends `Reminder` entries; the table is dormant (`prisma/schema.prisma:118`).
- Formalize group order support (shared carts, approvals, fulfillment) rather than only individual carts.
- Use `formatMoney` helpers across listings/detail pages to avoid raw Decimal coercion and ensure locale-safe INR display (`src/app/page.tsx:86`, `src/app/products/page.tsx:57`, `src/app/products/[id]/page.tsx:28`).
- Add automated tests covering auth guards, cart conflict resolution, admin APIs, and Prisma data access; the repository currently has no tests.
- Document environment variables (database URL, NextAuth secret, blob storage token) and operational setup in README to ease onboarding.
- Align documentation references (e.g., `docs/Wireframes`, `docs/Report.md`) with actual files or supply the missing assets so the deliverable tree is complete.