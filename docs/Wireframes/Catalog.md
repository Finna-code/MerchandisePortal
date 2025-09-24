# Catalog Wireframe

`
+---------------------------------------------------------------+
¦ Header (sticky)                                               ¦
+---------------------------------------------------------------¦
¦ Filters Bar                                                   ¦
¦ [ Search | Department ? | Category ? | Price Range | Clear ]  ¦
+---------------------------------------------------------------¦
¦ Products Grid (responsive 3-up)                               ¦
¦ +----------+  +----------+  +----------+                       ¦
¦ ¦ Image    ¦  ¦ Image    ¦  ¦ Image    ¦                       ¦
¦ ¦ Name     ¦  ¦ Name     ¦  ¦ Name     ¦                       ¦
¦ ¦ Price ?  ¦  ¦ Price ?  ¦  ¦ Price ?  ¦                       ¦
¦ ¦ Rating ? ¦  ¦ Rating ? ¦  ¦ Rating ? ¦                       ¦
¦ ¦ CTA      ¦  ¦ CTA      ¦  ¦ CTA      ¦                       ¦
¦ +----------+  +----------+  +----------+                       ¦
¦ ...                                                           ¦
+---------------------------------------------------------------¦
¦ Cart Summary Drawer (desktop)                                 ¦
¦ [ Item list, totals, CTA Checkout ]                           ¦
+---------------------------------------------------------------¦
¦ Pagination                                                     ¦
¦ [ ? Prev | 1 | 2 | 3 | Next ? ]                               ¦
+---------------------------------------------------------------+
`

**States**
- Empty state displays illustration and message prompting to explore departments.
- Loading state swaps product cards with skeletons from src/components/ui/skeleton.tsx.

**Interactions**
- Clicking a product card navigates to products/[id].
- Filters update query params; department filter toggles group-order context.