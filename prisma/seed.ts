// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.product.createMany({
    data: [
      { name: "Campus Hoodie", slug: "campus-hoodie", description: "Comfort fit hoodie", price: 999.0, currency: "INR", images: ["https://picsum.photos/seed/hoodie/800"], category: "Apparel", stock: 50, active: true },
      { name: "Logo Mug", slug: "logo-mug", description: "Ceramic mug", price: 299.0, currency: "INR", images: ["https://picsum.photos/seed/mug/800"], category: "Accessories", stock: 120, active: true }
    ],
  skipDuplicates: true,
  });
  console.log("Seed complete");
}
main().finally(() => prisma.$disconnect());
