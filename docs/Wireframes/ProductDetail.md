# Product Detail Wireframe

`
+---------------------------------------------------------------+
¦ Header                                                        ¦
+---------------------------------------------------------------¦
¦ Breadcrumb: Home / Hoodies / Dept Hoodie                      ¦
+---------------------------------------------------------------¦
¦ +---------------+  +---------------------------------------+  ¦
¦ ¦ Image Gallery ¦  ¦ Product Overview                      ¦  ¦
¦ ¦ [Main + thumb]¦  ¦ Title                                 ¦  ¦
¦ ¦               ¦  ¦ Short description                     ¦  ¦
¦ ¦               ¦  ¦ Price ?                               ¦  ¦
¦ ¦               ¦  ¦ Size selector | Quantity stepper      ¦  ¦
¦ ¦               ¦  ¦ CTA: Add to Cart                      ¦  ¦
¦ +---------------+  ¦ CTA: Add to Department Cart (if able) ¦  ¦
¦                     ¦ Badge: Stock, Lead time              ¦  ¦
¦                     +---------------------------------------+  ¦
+---------------------------------------------------------------¦
¦ Tabs: Details | Reviews | Policies                            ¦
¦ +-----------------------------------------------------------+ ¦
¦ ¦ Details content pulled from rich text                     ¦ ¦
¦ +-----------------------------------------------------------+ ¦
+---------------------------------------------------------------¦
¦ Reviews Section                                               ¦
¦ [ Average rating, leave review CTA ]                          ¦
¦ [ Review cards with author, rating, body ]                    ¦
+---------------------------------------------------------------¦
¦ Related Products Carousel                                     ¦
+---------------------------------------------------------------+
`

**Conditional Blocks**
- Add to Department Cart displays only for department heads.
- If inventory is low, show badge near the price.

**Integration Notes**
- Reviews tab maps to future Reviews API (TODO list).
- Department approvals tie into upcoming workflow documentation.