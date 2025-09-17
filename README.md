This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

```
Capstone Project/
├── docs/                  # All documentation deliverables
│   ├── SRS.md             # Software Requirements Spec
│   ├── ERD.png            # Entity-Relationship Diagram
│   ├── Wireframes/        # UI mockups (images or Figma exports)
│   └── Report.md          # Final report or user manual
│
├── prisma/                # Database schema and migrations
│   └── schema.prisma
│
├── src/                   # Next.js application code
│   ├── app/               # Pages and routes (App Router)
│   ├── components/        # Reusable UI components
│   ├── lib/               # Utility modules (db.ts, auth.ts, etc.)
│   └── styles/            # Global CSS (if any)
│
├── public/                # Static files (images, icons, logos)
│
├── .env.example           # Example environment variables
├── package.json
├── README.md              # Project overview + setup
└── LICENSE
```


## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

