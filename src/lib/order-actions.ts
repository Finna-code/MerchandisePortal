import { OrderStatus } from "@prisma/client";

import { prisma } from "./db";
import {
  OrderStateError,
  getOrderForUser,
  getOrderWithRelations,
  incrementOrderVersion,
  recordOrderEvent,
  serializeOrder,
} from "./orders";

export async function cancelPendingOrder(orderId: number, userId: number) {
  return prisma.$transaction(async (tx) => {
    const order = await getOrderForUser(orderId, userId, tx);
    if (order.status === OrderStatus.canceled) {
      return serializeOrder(order);
    }

    if (order.status !== OrderStatus.pending) {
      throw new OrderStateError("Only pending orders can be canceled");
    }

    await incrementOrderVersion(tx, order.id, order.version, {
      status: OrderStatus.canceled,
    });

    if (order.payment && order.payment.status !== "paid") {
      await tx.payment.update({
        where: { orderId: order.id },
        data: { status: "canceled" },
      });
    }

    await recordOrderEvent(order.id, "order_canceled", { byUserId: userId }, tx);

    const fresh = await getOrderForUser(orderId, userId, tx);
    return serializeOrder(fresh);
  });
}

export async function markOrderReady(orderId: number, actorUserId: number) {
  return prisma.$transaction(async (tx) => {
    const order = await getOrderWithRelations(orderId, tx);
    if (order.status === OrderStatus.ready) {
      return serializeOrder(order);
    }

    if (order.status !== OrderStatus.paid) {
      throw new OrderStateError("Order must be paid before marking ready");
    }

    await incrementOrderVersion(tx, order.id, order.version, {
      status: OrderStatus.ready,
      readyAt: new Date(),
    });

    await recordOrderEvent(order.id, "order_ready", { byUserId: actorUserId }, tx);

    const fresh = await getOrderWithRelations(orderId, tx);
    return serializeOrder(fresh);
  });
}

export async function markOrderDelivered(orderId: number, actorUserId: number) {
  return prisma.$transaction(async (tx) => {
    const order = await getOrderWithRelations(orderId, tx);
    if (order.status === OrderStatus.delivered) {
      return serializeOrder(order);
    }

    if (order.status !== OrderStatus.ready) {
      throw new OrderStateError("Order must be ready before marking delivered");
    }

    await incrementOrderVersion(tx, order.id, order.version, {
      status: OrderStatus.delivered,
      deliveredAt: new Date(),
    });

    await recordOrderEvent(order.id, "order_delivered", { byUserId: actorUserId }, tx);

    const fresh = await getOrderWithRelations(orderId, tx);
    return serializeOrder(fresh);
  });
}

export async function cancelPendingOrderAsAdmin(orderId: number, actorUserId: number) {
  return prisma.$transaction(async (tx) => {
    const order = await getOrderWithRelations(orderId, tx);
    if (order.status === OrderStatus.canceled) {
      return serializeOrder(order);
    }

    if (order.status !== OrderStatus.pending) {
      throw new OrderStateError("Only pending orders can be canceled");
    }

    await incrementOrderVersion(tx, order.id, order.version, {
      status: OrderStatus.canceled,
    });

    if (order.payment && order.payment.status !== "paid") {
      await tx.payment.update({
        where: { orderId: order.id },
        data: { status: "canceled" },
      });
    }

    await recordOrderEvent(order.id, "order_canceled_admin", { byUserId: actorUserId }, tx);

    const fresh = await getOrderWithRelations(orderId, tx);
    return serializeOrder(fresh);
  });
}




