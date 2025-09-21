// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();


async function main() {
  await prisma.product.createMany({
    data: [
      { name: "Campus Hoodie", slug: "campus-hoodie", description: "Comfort fit hoodie", price: 999.0, currency: "INR", images: ["https://picsum.photos/seed/hoodie/800"], category: "Apparel", stock: 50, active: true },
      { name: "Logo Mug", slug: "logo-mug", description: "Ceramic mug", price: 299.0, currency: "INR", images: ["https://picsum.photos/seed/mug/800"], category: "Accessories", stock: 120, active: true }
    ],
  skipDuplicates: true,
  });

  const hash = await bcrypt.hash("Passw0rd!", 10);

  await prisma.user.upsert({
    where: { email: "admin@demo.test" },
    update: {},
    create: { name: "Admin", email: "admin@demo.test", passwordHash: hash, role: "admin" },
  });
  await prisma.user.upsert({
  where: { email: "user@demo.test" },
  update: {},
  create: {
    name: "User",
    email: "user@demo.test",
    passwordHash: hash,
    role: "user",
   },
  });
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
