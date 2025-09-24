# Capstone Final Report

## Project Overview
The merchandise portal digitizes merchandise requests for campus departments while offering a storefront for general users. The product was built with Next.js 15 (App Router), Prisma ORM, and a PostgreSQL backend. Payments are processed through a pluggable external gateway, with webhook-driven fulfillment updates.

## Objectives
- Streamline the end-to-end ordering experience for students and staff.
- Provide administrators with guard-railed tools to manage catalog, orders, and users.
- Support department/group order budgeting flows slated for the next milestone.

## Architecture Summary
- **Frontend:** Server-first React components via Next.js App Router with incremental static regeneration for public pages. Shared layout components provide consistent navigation, theming, and skeleton loading states.
- **Backend:** Next.js route handlers paired with Prisma for database access. Admin APIs are permission-gated through NextAuth session roles.
- **Database:** PostgreSQL schema modeling users, departments, products, carts, orders, payments, reminders, and reviews.
- **Payments:** Checkout integration designed for a third-party gateway with webhooks recorded in Payment and OrderTimeline tables to guarantee fulfillment traceability.
- **Storage:** Product images leverage Vercel Blob uploads with client-side compression before upload.

## Implemented Features
- Role-based authentication and authorization with session propagation to server components.
- Product catalog management including uploads, deletion, and admin review flows.
- Cart subsystem handling concurrency conflicts and persistent carts per user.
- Admin dashboards for orders, products, and user management.
- Health-check endpoint and Prisma seeding for rapid environment setup.

## Deliverables
- docs/SRS.md: Functional and non-functional specifications.
- docs/RequirementAnalysis.md: Stakeholder needs, personas, and scope decisions.
- docs/ERD.md + docs/ERD.png: Entity relationship model and diagram.
- docs/Design.md: UI/UX guidelines and interaction patterns.
- docs/Wireframes/: Low-fidelity wireframes for key flows.
- docs/Capstone.pdf: Presentation-ready slide deck.

## Deployment & Operations
- Hosted on Vercel with environment variables managed through the dashboard.
- Database hosted on Railway Postgres (configurable via DATABASE_URL).
- Image uploads backed by Vercel Blob; ensure BLOB_READ_WRITE_TOKEN is configured.
- Scheduled job (future) to process reminders via cron-compatible service such as Vercel Cron or GitHub Actions.

## Next Steps
- Implement user onboarding and password reset flows (see TODO.md).
- Build department cart approvals and reminder scheduler.
- Finish review/rating CRUD and surface department analytics.
- Expand automated tests covering auth guards, Prisma services, and API contracts.

## Acknowledgements
This project was delivered as the IITG capstone by the Merchandise Platform team. Special thanks to mentors for direction on payments integration and deployment hardening.