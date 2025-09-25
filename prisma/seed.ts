// prisma/seed.ts
import { PrismaClient, ReviewVisibility, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

import { sanitizeReviewBody } from "@/lib/reviews";

const prisma = new PrismaClient();

async function main() {
  await prisma.product.createMany({
    data: [
      {
        name: "Campus Hoodie",
        slug: "campus-hoodie",
        description: "Comfort fit hoodie",
        price: 999.0,
        currency: "INR",
        images: ["https://picsum.photos/seed/hoodie/800"],
        category: "Apparel",
        stock: 50,
        active: true,
      },
      {
        name: "Logo Mug",
        slug: "logo-mug",
        description: "Ceramic mug",
        price: 299.0,
        currency: "INR",
        images: ["https://picsum.photos/seed/mug/800"],
        category: "Accessories",
        stock: 120,
        active: true,
      },
    ],
    skipDuplicates: true,
  });

  const hash = await bcrypt.hash("Passw0rd!", 10);

  const [, user, alex, priya, jordan] = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@demo.test" },
      update: {},
      create: {
        name: "Admin",
        email: "admin@demo.test",
        passwordHash: hash,
        role: Role.admin,
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.upsert({
      where: { email: "user@demo.test" },
      update: {},
      create: {
        name: "User",
        email: "user@demo.test",
        passwordHash: hash,
        role: Role.user,
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.upsert({
      where: { email: "alex@demo.test" },
      update: {},
      create: {
        name: "Alex Patel",
        email: "alex@demo.test",
        passwordHash: hash,
        role: Role.user,
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.upsert({
      where: { email: "priya@demo.test" },
      update: {},
      create: {
        name: "Priya Singh",
        email: "priya@demo.test",
        passwordHash: hash,
        role: Role.user,
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.upsert({
      where: { email: "jordan@demo.test" },
      update: {},
      create: {
        name: "Jordan Lee",
        email: "jordan@demo.test",
        passwordHash: hash,
        role: Role.user,
        emailVerifiedAt: new Date(),
      },
    }),
  ]);

  const products = await prisma.product.findMany({ select: { id: true, slug: true } });
  const hoodie = products.find((product) => product.slug === "campus-hoodie");
  const mug = products.find((product) => product.slug === "logo-mug");

  if (hoodie && mug) {
    const seedReviews = [
      {
        productId: hoodie.id,
        userId: user.id,
        rating: 5,
        body: "Cozy fit and perfect for chilly lecture halls.",
      },
      {
        productId: hoodie.id,
        userId: alex.id,
        rating: 4,
        body: "Great quality, though the sleeves run slightly long.",
      },
      {
        productId: mug.id,
        userId: priya.id,
        rating: 5,
        body: "Keeps my coffee warm and the print still looks new after many washes.",
      },
      {
        productId: mug.id,
        userId: jordan.id,
        rating: 3,
        body: "Good mug, but I wish it were a bit larger.",
      },
    ];

    for (const entry of seedReviews) {
      await prisma.review.upsert({
        where: {
          productId_userId: {
            productId: entry.productId,
            userId: entry.userId,
          },
        },
        update: {
          rating: entry.rating,
          body: sanitizeReviewBody(entry.body),
          visibility: ReviewVisibility.public,
        },
        create: {
          productId: entry.productId,
          userId: entry.userId,
          rating: entry.rating,
          body: sanitizeReviewBody(entry.body),
          visibility: ReviewVisibility.public,
        },
      });
    }
  }

  const aggregates = await prisma.review.groupBy({
    by: ["productId"],
    where: { visibility: ReviewVisibility.public },
    _count: { _all: true },
    _sum: { rating: true },
  });

  await prisma.product.updateMany({ data: { ratingCount: 0, ratingSum: 0 } });
  for (const aggregate of aggregates) {
    await prisma.product.update({
      where: { id: aggregate.productId },
      data: {
        ratingCount: aggregate._count._all ?? 0,
        ratingSum: aggregate._sum.rating ?? 0,
      },
    });
  }

  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });











