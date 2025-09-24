# Checkout Flow Wireframe

## Cart
`
+---------------------------------------------------------------+
¦ Header                                                        ¦
+---------------------------------------------------------------¦
¦ Cart Items                                                    ¦
¦ +----------+  Item name, size, qty stepper, price, remove     ¦
¦ +----------+  Repeat per item                                 ¦
+---------------------------------------------------------------¦
¦ Summary                                                       ¦
¦ Subtotal | Tax | Department contribution | Total              ¦
¦ CTA: Continue to Details                                      ¦
+---------------------------------------------------------------+
`

## Details & Payment
`
+---------------------------------------------------------------+
¦ Progress indicator: Cart ?-? Details -? Confirm               ¦
+---------------------------------------------------------------¦
¦ Two-column layout                                             ¦
¦ Left: Shipping/contact form (name, email, department, phone)  ¦
¦ Right: Order summary + payment button                        ¦
¦ CTA: Pay now (launch chosen gateway)                                        ¦
+---------------------------------------------------------------+
`

## Confirmation
`
+---------------------------------------------------------------+
¦ Status banner: ? Payment captured                             ¦
¦ Order timeline (events list)                                  ¦
¦ Order meta: ID, placement date, payment ref                   ¦
¦ CTA: View Orders                                              ¦
+---------------------------------------------------------------+
`

**Webhook Handling**
- Confirmation page should poll or listen for webhook updates before showing final state.

**Reminder Hooks**
- Surface "Set reminder" action tied to future Reminder scheduler.