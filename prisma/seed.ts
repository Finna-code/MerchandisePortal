import {
  FulfillmentType,
  OrderStatus,
  OrderType,
  PrismaClient,
  ReviewVisibility,
  Role,
} from "@prisma/client";
import bcrypt from "bcryptjs";

import { sanitizeReviewBody } from "@/lib/reviews";

const prisma = new PrismaClient();

function toMinorUnits(amount: number | bigint | { toString(): string }) {
  const numeric =
    typeof amount === "number"
      ? amount
      : typeof amount === "bigint"
        ? Number(amount)
        : Number(amount.toString());
  return Math.round(numeric * 100);
}

async function ensureReminder({
  orderId,
  kind,
  scheduledAt,
  sentAt,
}: {
  orderId: number;
  kind: string;
  scheduledAt: Date;
  sentAt?: Date | null;
}) {
  const existing = await prisma.reminder.findFirst({
    where: { orderId, kind, scheduledAt },
  });

  if (!existing) {
    await prisma.reminder.create({
      data: {
        orderId,
        kind,
        scheduledAt,
        sentAt: sentAt ?? null,
      },
    });
    return;
  }

  if (sentAt && !existing.sentAt) {
    await prisma.reminder.update({
      where: { id: existing.id },
      data: { sentAt },
    });
  }
}

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

  const [designDept, operationsDept, culturalDept] = await Promise.all([
    prisma.dept.upsert({
      where: { name: "Design & Branding" },
      update: {},
      create: { name: "Design & Branding" },
    }),
    prisma.dept.upsert({
      where: { name: "Operations & Logistics" },
      update: {},
      create: { name: "Operations & Logistics" },
    }),
    prisma.dept.upsert({
      where: { name: "Cultural Affairs" },
      update: {},
      create: { name: "Cultural Affairs" },
    }),
  ]);

  const hash = await bcrypt.hash("Passw0rd!", 10);

  const [
    admin,
    user,
    alex,
    priya,
    jordan,
    monica,
    devraj,
    sahana,
  ] = await Promise.all([
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
    prisma.user.upsert({
      where: { email: "monica@demo.test" },
      update: {
        name: "Monica Rao",
        role: Role.dept_head,
        deptId: designDept.id,
      },
      create: {
        name: "Monica Rao",
        email: "monica@demo.test",
        passwordHash: hash,
        role: Role.dept_head,
        deptId: designDept.id,
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.upsert({
      where: { email: "devraj@demo.test" },
      update: {
        name: "Devraj Mehta",
        role: Role.dept_head,
        deptId: operationsDept.id,
      },
      create: {
        name: "Devraj Mehta",
        email: "devraj@demo.test",
        passwordHash: hash,
        role: Role.dept_head,
        deptId: operationsDept.id,
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.upsert({
      where: { email: "sahana@demo.test" },
      update: {
        name: "Sahana Iyer",
        role: Role.dept_head,
        deptId: culturalDept.id,
      },
      create: {
        name: "Sahana Iyer",
        email: "sahana@demo.test",
        passwordHash: hash,
        role: Role.dept_head,
        deptId: culturalDept.id,
        emailVerifiedAt: new Date(),
      },
    }),
  ]);

  const products = await prisma.product.findMany({
    select: { id: true, slug: true, price: true, currency: true },
  });
  const hoodie = products.find((product) => product.slug === "campus-hoodie");
  const mug = products.find((product) => product.slug === "logo-mug");

  if (hoodie && mug) {
    const hoodieUnit = toMinorUnits(hoodie.price);
    const mugUnit = toMinorUnits(mug.price);

    type OrderSeed = {
      invoiceNo: string;
      createdAt: Date;
      userId: number;
      deptId: number;
      type: OrderType;
      status: OrderStatus;
      currency: string;
      fulfillmentType: FulfillmentType;
      items: Array<{
        productId: number;
        qty: number;
        unitPrice: number;
        currency: string;
        variantId?: string | null;
      }>;
      taxRate: number;
      payment?: {
        status: string;
        razorpayOrderId: string;
        razorpayPayId?: string | null;
        amount?: number;
      };
      reminders?: Array<{
        kind: string;
        scheduledAt: Date;
        sentAt?: Date | null;
      }>;
      shippingLine1?: string | null;
      shippingLine2?: string | null;
      shippingCity?: string | null;
      shippingState?: string | null;
      shippingPincode?: string | null;
      shippingPhone?: string | null;
      pickupPoint?: string | null;
      pickupSlotStart?: Date | null;
      pickupSlotEnd?: Date | null;
      windowStart?: Date | null;
      windowEnd?: Date | null;
      paidAt?: Date | null;
      readyAt?: Date | null;
      deliveredAt?: Date | null;
    };

    const orderSeeds: OrderSeed[] = [
      {
        invoiceNo: "INV-1001",
        createdAt: new Date("2024-04-01T05:30:00.000Z"),
        userId: monica.id,
        deptId: designDept.id,
        type: OrderType.group,
        status: OrderStatus.paid,
        currency: hoodie.currency ?? "INR",
        fulfillmentType: FulfillmentType.delivery,
        shippingLine1: "Design Studio, Students' Centre",
        shippingCity: "Guwahati",
        shippingState: "Assam",
        shippingPincode: "781039",
        shippingPhone: "+91-9000000002",
        paidAt: new Date("2024-04-01T09:00:00.000Z"),
        readyAt: new Date("2024-04-02T06:45:00.000Z"),
        deliveredAt: new Date("2024-04-03T07:15:00.000Z"),
        items: [
          {
            productId: hoodie.id,
            qty: 3,
            unitPrice: hoodieUnit,
            currency: hoodie.currency ?? "INR",
          },
          {
            productId: mug.id,
            qty: 6,
            unitPrice: mugUnit,
            currency: mug.currency ?? "INR",
          },
        ],
        taxRate: 0.12,
        payment: {
          status: "captured",
          razorpayOrderId: "order_INV1001",
          razorpayPayId: "pay_INV1001",
        },
        reminders: [
          {
            kind: "deadline",
            scheduledAt: new Date("2024-04-02T04:30:00.000Z"),
            sentAt: new Date("2024-04-02T05:00:00.000Z"),
          },
        ],
      },
      {
        invoiceNo: "INV-1002",
        createdAt: new Date("2024-04-05T07:00:00.000Z"),
        userId: devraj.id,
        deptId: operationsDept.id,
        type: OrderType.group,
        status: OrderStatus.ready,
        currency: hoodie.currency ?? "INR",
        fulfillmentType: FulfillmentType.pickup,
        pickupPoint: "Main Gate Kiosk",
        pickupSlotStart: new Date("2024-04-08T05:30:00.000Z"),
        pickupSlotEnd: new Date("2024-04-08T07:00:00.000Z"),
        readyAt: new Date("2024-04-07T08:30:00.000Z"),
        items: [
          {
            productId: hoodie.id,
            qty: 4,
            unitPrice: hoodieUnit,
            currency: hoodie.currency ?? "INR",
          },
          {
            productId: mug.id,
            qty: 8,
            unitPrice: mugUnit,
            currency: mug.currency ?? "INR",
          },
        ],
        taxRate: 0.05,
        payment: {
          status: "captured",
          razorpayOrderId: "order_INV1002",
          razorpayPayId: "pay_INV1002",
        },
        reminders: [
          {
            kind: "pickup",
            scheduledAt: new Date("2024-04-08T03:30:00.000Z"),
          },
          {
            kind: "pickup",
            scheduledAt: new Date("2024-04-08T05:00:00.000Z"),
          },
        ],
      },
      {
        invoiceNo: "INV-1003",
        createdAt: new Date("2024-05-01T04:15:00.000Z"),
        userId: sahana.id,
        deptId: culturalDept.id,
        type: OrderType.individual,
        status: OrderStatus.pending,
        currency: mug.currency ?? "INR",
        fulfillmentType: FulfillmentType.delivery,
        shippingLine1: "Cultural Affairs Office, Block C",
        shippingCity: "Guwahati",
        shippingState: "Assam",
        shippingPincode: "781039",
        shippingPhone: "+91-9000000003",
        windowStart: new Date("2024-05-10T05:30:00.000Z"),
        windowEnd: new Date("2024-05-10T11:30:00.000Z"),
        items: [
          {
            productId: mug.id,
            qty: 12,
            unitPrice: mugUnit,
            currency: mug.currency ?? "INR",
          },
        ],
        taxRate: 0.05,
        reminders: [
          {
            kind: "deadline",
            scheduledAt: new Date("2024-05-08T07:00:00.000Z"),
          },
        ],
      },
    ];

    const seededOrders: Array<{
      order: Awaited<ReturnType<typeof prisma.order.upsert>>;
      seed: OrderSeed;
      subtotal: number;
      tax: number;
      total: number;
    }> = [];

    for (const seed of orderSeeds) {
      const subtotal = seed.items.reduce(
        (sum, item) => sum + item.qty * item.unitPrice,
        0,
      );
      const tax = Math.round(subtotal * seed.taxRate);
      const total = subtotal + tax;

      const order = await prisma.order.upsert({
        where: { invoiceNo: seed.invoiceNo },
        update: {
          deptId: seed.deptId,
          userId: seed.userId,
          status: seed.status,
          type: seed.type,
          subtotal,
          tax,
          total,
          currency: seed.currency,
          fulfillmentType: seed.fulfillmentType,
          shippingLine1: seed.shippingLine1 ?? null,
          shippingLine2: seed.shippingLine2 ?? null,
          shippingCity: seed.shippingCity ?? null,
          shippingState: seed.shippingState ?? null,
          shippingPincode: seed.shippingPincode ?? null,
          shippingPhone: seed.shippingPhone ?? null,
          pickupPoint: seed.pickupPoint ?? null,
          pickupSlotStart: seed.pickupSlotStart ?? null,
          pickupSlotEnd: seed.pickupSlotEnd ?? null,
          windowStart: seed.windowStart ?? null,
          windowEnd: seed.windowEnd ?? null,
          paidAt: seed.paidAt ?? null,
          readyAt: seed.readyAt ?? null,
          deliveredAt: seed.deliveredAt ?? null,
        },
        create: {
          invoiceNo: seed.invoiceNo,
          deptId: seed.deptId,
          userId: seed.userId,
          status: seed.status,
          type: seed.type,
          subtotal,
          tax,
          total,
          currency: seed.currency,
          fulfillmentType: seed.fulfillmentType,
          shippingLine1: seed.shippingLine1 ?? null,
          shippingLine2: seed.shippingLine2 ?? null,
          shippingCity: seed.shippingCity ?? null,
          shippingState: seed.shippingState ?? null,
          shippingPincode: seed.shippingPincode ?? null,
          shippingPhone: seed.shippingPhone ?? null,
          pickupPoint: seed.pickupPoint ?? null,
          pickupSlotStart: seed.pickupSlotStart ?? null,
          pickupSlotEnd: seed.pickupSlotEnd ?? null,
          windowStart: seed.windowStart ?? null,
          windowEnd: seed.windowEnd ?? null,
          createdAt: seed.createdAt,
          paidAt: seed.paidAt ?? null,
          readyAt: seed.readyAt ?? null,
          deliveredAt: seed.deliveredAt ?? null,
        },
      });

      seededOrders.push({ order, seed, subtotal, tax, total });
    }

    for (const { order, seed, total } of seededOrders) {
      for (const item of seed.items) {
        const variantValue = item.variantId ?? null;

        const existingItem = await prisma.orderItem.findFirst({
          where: {
            orderId: order.id,
            productId: item.productId,
            variantId: variantValue,
          },
        });

        if (existingItem) {
          await prisma.orderItem.update({
            where: { id: existingItem.id },
            data: {
              qty: item.qty,
              unitPrice: item.unitPrice,
              currency: item.currency,
              variantId: variantValue,
            },
          });
        } else {
          await prisma.orderItem.create({
            data: {
              orderId: order.id,
              productId: item.productId,
              qty: item.qty,
              unitPrice: item.unitPrice,
              currency: item.currency,
              variantId: variantValue,
            },
          });
        }
      }

      if (seed.payment) {
        await prisma.payment.upsert({
          where: { razorpayOrderId: seed.payment.razorpayOrderId },
          update: {
            orderId: order.id,
            amount: seed.payment.amount ?? total,
            currency: seed.currency,
            status: seed.payment.status,
            razorpayPayId: seed.payment.razorpayPayId ?? null,
          },
          create: {
            orderId: order.id,
            amount: seed.payment.amount ?? total,
            currency: seed.currency,
            status: seed.payment.status,
            razorpayOrderId: seed.payment.razorpayOrderId,
            razorpayPayId: seed.payment.razorpayPayId ?? null,
          },
        });
      }

      for (const reminder of seed.reminders ?? []) {
        await ensureReminder({
          orderId: order.id,
          kind: reminder.kind,
          scheduledAt: reminder.scheduledAt,
          sentAt: reminder.sentAt ?? null,
        });
      }
    }

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
        productId: hoodie.id,
        userId: priya.id,
        rating: 5,
        body: "The fabric is soft and the IITG crest looks sharp after multiple washes.",
      },
      {
        productId: hoodie.id,
        userId: jordan.id,
        rating: 4,
        body: "Wore it during a late-night lab session and stayed warm throughout.",
      },
      {
        productId: hoodie.id,
        userId: monica.id,
        rating: 5,
        body: "Team loved these for the outreach booth - professional and comfortable.",
      },
      {
        productId: hoodie.id,
        userId: devraj.id,
        rating: 4,
        body: "Nice mid-weight hoodie for event staff, would love more color options.",
      },
      {
        productId: hoodie.id,
        userId: sahana.id,
        rating: 5,
        body: "Perfect for cultural night rehearsals when the stage AC is blasting.",
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
      {
        productId: mug.id,
        userId: user.id,
        rating: 4,
        body: "Solid mug for the hostel kitchen - handle stays cool even with hot tea.",
      },
      {
        productId: mug.id,
        userId: alex.id,
        rating: 5,
        body: "Great giveaway item for campus tours, the print quality surprised me.",
      },
      {
        productId: mug.id,
        userId: monica.id,
        rating: 5,
        body: "We paired these with welcome kits and the branding really pops.",
      },
      {
        productId: mug.id,
        userId: devraj.id,
        rating: 4,
        body: "Sturdy enough for our logistics team; a lid option would make it perfect.",
      },
      {
        productId: mug.id,
        userId: sahana.id,
        rating: 5,
        body: "Ideal for late-night script reads - lightweight and easy to clean.",
      },
      {
        productId: mug.id,
        userId: admin.id,
        rating: 4,
        body: "Keeping one at the office desk; would appreciate a 16oz variant.",
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
