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

  // Seed a couple of sample orders if there are none
  const ordersCount = await prisma.order.count();
  if (ordersCount === 0) {
    const user = await prisma.user.findUnique({ where: { email: "user@demo.test" } });
    const hoodie = await prisma.product.findUnique({ where: { slug: "campus-hoodie" } });
    const mug = await prisma.product.findUnique({ where: { slug: "logo-mug" } });
    if (user && hoodie && mug) {
      // Order 1: placed, two items
      await prisma.order.create({
        data: {
          userId: user.id,
          type: "individual",
          status: "placed",
          subtotal: (hoodie.price as unknown as number) + (mug.price as unknown as number) * 2,
          tax: 0,
          total: (hoodie.price as unknown as number) + (mug.price as unknown as number) * 2,
          items: {
            create: [
              { productId: hoodie.id, qty: 1, price: hoodie.price },
              { productId: mug.id, qty: 2, price: mug.price },
            ],
          },
        },
      });
      // Order 2: paid, one item
      await prisma.order.create({
        data: {
          userId: user.id,
          type: "individual",
          status: "paid",
          subtotal: (mug.price as unknown as number) * 3,
          tax: 0,
          total: (mug.price as unknown as number) * 3,
          items: {
            create: [
              { productId: mug.id, qty: 3, price: mug.price },
            ],
          },
        },
      });
    }
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
