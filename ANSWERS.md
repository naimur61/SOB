# Answers

All numbers below come from my own engine. To print them:

npm run answers

(runs src/test/answers.test.ts, which prints every answer and also asserts it)

### Q1. Starting from an empty cart, what is the maximum number of item C you can add? Which ingredient limits it?

2. Cheese is the limit: one C uses 2 cheese and there are only 4.
   The rest would allow more (egg 10/2 = 5, tofu 5, mushroom 6, beans 8, paratha 10).

### Q2. What is the cheapest valid configuration and its unit price?

Toast + Fried x2 + Tofu = 360.00 BDT (250 + 0 + 60 + 50).
Adding Ketchup is also 360.00 since it's free, so that's a tie.

### Q3. Cart = A x3, server time 10:30. Give subtotal, chosen discount, VAT and payable. Then the same at 11:30.

I assumed MORNING15 is entered (without it there is no discount at either time).

A = 250 + Toast 0 + Scrambled 2x35 + Sausage 60 + Ketchup 0 = 380.00
(only 2 egg units, so no combo; no extras, so no free extra)

At 10:30:
subtotal = 3 x 380 = 1,140.00
C1 needs 1,200, so not eligible
C2 = 15% of 1,140 = 171.00, capped to 150.00 -> C2 is used
after discount = 990.00
VAT = 5% of 990 = 49.50
payable = 1,039.50 -> 1,040

At 11:30:
subtotal = 1,140.00
coupon rejected (not before 11:00), C1 still not eligible -> no discount
VAT = 57.00
payable = 1,197

### Q4. After TC-10, what is the payable at 11:30?

1,600.
B (after TC-10) 643.50 + C x2 980.00 = 1,623.50, C1 -100 = 1,523.50, VAT 76.18, total 1,599.68 -> 1,600

### Q5. The payable of each seed order, and the total revenue of all six.

ORD-1001: 339
ORD-1002: 713
ORD-1003: 1,271
ORD-1004: 578
ORD-1005: 866
ORD-1006: 1,228
Total: 4,995 BDT

### Q6. The best-selling option across the seed orders, counted in units (line quantity x option quantity).

Fried, 10 units (ORD-1002: 2, ORD-1003: 2x2 = 4, ORD-1006: 2+2 = 4).
Next are Scrambled and Chicken Sausage with 8 each.

### Q7. Which payment method brought in the most revenue in the seed orders?

Card: 2,145 (339 + 578 + 1,228).
bKash 1,579, cash 1,271.

### Q8. How many seed orders actually received the MORNING15 discount? Explain every order that has the code but did not get the discount.

3 of the 4 orders that typed the code got it:

- ORD-1001 (09:15): subtotal 380.00, C1 not eligible, C2 = 57.00 -> applied
- ORD-1003 (10:05): subtotal 1,360.00, C2 = 204.00 capped to 150.00, C1 = 100.00 -> C2 is bigger, applied
- ORD-1005 (08:50): subtotal 970.00, C1 not eligible, C2 = 145.50 -> applied
- ORD-1006 (13:10): NOT applied. The coupon only works strictly before 11:00 Dhaka time and this order was at 13:10. Its subtotal is 1,169.50, so C1 doesn't apply either. It paid full price + VAT = 1,228.
