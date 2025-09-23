// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const toMinorUnits = (value: unknown) => Math.round(Number(value) * 100);

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

  await prisma.user.upsert({
    where: { email: "admin@demo.test" },
    update: {},
    create: { name: "Admin", email: "admin@demo.test", passwordHash: hash, role: "admin" },
  });

  await prisma.user.upsert({
    where: { email: "user@demo.test" },
    update: {},
    create: { name: "User", email: "user@demo.test", passwordHash: hash, role: "user" },
  });

  const ordersCount = await prisma.order.count();
  if (ordersCount === 0) {
    const user = await prisma.user.findUnique({ where: { email: "user@demo.test" } });
    const hoodie = await prisma.product.findUnique({ where: { slug: "campus-hoodie" } });
    const mug = await prisma.product.findUnique({ where: { slug: "logo-mug" } });

    if (user && hoodie && mug) {
      const hoodiePrice = toMinorUnits(hoodie.price);
      const mugPrice = toMinorUnits(mug.price);
      const hoodieCurrency = hoodie.currency ?? "INR";
      const mugCurrency = mug.currency ?? "INR";

      const orderOneSubtotal = hoodiePrice * 1 + mugPrice * 2;
      await prisma.order.create({
        data: {
          userId: user.id,
          type: "individual",
          status: "pending",
          subtotal: orderOneSubtotal,
          tax: 0,
          total: orderOneSubtotal,
          currency: hoodieCurrency,
          items: {
            create: [
              {
                productId: hoodie.id,
                qty: 1,
                unitPrice: hoodiePrice,
                currency: hoodieCurrency,
              },
              {
                productId: mug.id,
                qty: 2,
                unitPrice: mugPrice,
                currency: mugCurrency,
              },
            ],
          },
        },
      });

      const orderTwoSubtotal = mugPrice * 3;
      await prisma.order.create({
        data: {
          userId: user.id,
          type: "individual",
          status: "paid",
          subtotal: orderTwoSubtotal,
          tax: 0,
          total: orderTwoSubtotal,
          currency: mugCurrency,
          items: {
            create: [
              {
                productId: mug.id,
                qty: 3,
                unitPrice: mugPrice,
                currency: mugCurrency,
              },
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
