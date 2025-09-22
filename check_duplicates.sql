-- duplicate carts per user
SELECT "userId", status, COUNT(*) c
FROM "Order"
GROUP BY "userId", status
HAVING status = 'cart' AND COUNT(*) > 1;

-- duplicate items in a cart
SELECT "orderId", "productId", COUNT(*) c
FROM "OrderItem"
GROUP BY "orderId", "productId"
HAVING COUNT(*) > 1;
