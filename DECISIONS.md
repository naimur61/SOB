# Decisions

## Checkpoints

### C1. Before writing priceCart: explain why storing 679.50 as a JavaScript float is risky for TC-06, and show by hand how the VAT of 75.48 in TC-06 is rounded.

JS floats can't hold most decimals exactly. I tried 1659.5 \* 0.15 and got 248.92499999999998, which rounds half-up to 248.92 instead of 248.93. TC-06 needs exact values, so one poisha off is a fail. That's why I keep all money as integer poisha and do percentages with integers only.

TC-06 by hand (in poisha):
subtotal = 67950 + 2 _ 49000 = 165950
C2 = 15% = 24892.5, cap is 15000, so 15000 (beats C1 = 10000)
after discount = 150950
VAT = 150950 _ 5 / 100 = 7547.5 -> half-up -> 7548 = 75.48
payable = 150950 + 7548 = 158498 = 1584.98 -> 1585

### C2. Before wiring Gemini: list every question your bot supports and the exact function (name, inputs, output) that answers it.

Tools are in src/assistant/tools.ts. Each one calls a pure function from engine/stats.ts. Only ordersOnDate takes an input.

- how many orders -> countOrders() -> { orders }
- total revenue -> totalRevenue() -> { revenue }
- best-selling option -> bestSellingOption() -> { options, units }
- revenue by payment method -> revenueByPaymentMethod() -> { card, bkash, cash }
- average order value -> averageOrderValue() -> { average, orders }
- how many orders got the coupon -> couponUsage() -> { entered, applied, notApplied }
- orders on a date -> ordersOnDate(date: "YYYY-MM-DD") -> { date, count, revenue, orderIds }

Revenue = payable. Money is formatted before it goes to the model, so it never adds anything up.

## Decision points

### D1. Two browser tabs share one server. Tab A is editing an item when tab B takes the last eggs. What does tab A see when it saves, and does the user lose anything they typed?

Both tabs read the same server data from localStorage. When tab A saves, the server checks stock again (the item's own eggs count as free for it). If it's still short, it returns 409 and tab A shows something like "Not saved: Short: 1 egg. Your changes are kept." Nothing typed is lost, the form stays as it was. The user can drop an egg and save again.

### D2. Promotions change while an item sits in the cart (the coupon stops at 11:00). Decide when a price is locked: at Add to cart, at checkout, or never. Your choice must stay consistent with TC-06/TC-07.

At checkout. Before that the cart just shows the price for the current server time. When Pay is clicked the server prices it again with its own clock and saves that into the order. So if you add at 10:58 and pay at 11:01, the coupon doesn't apply. That's the same thing TC-06 and TC-07 test.

### D3. A reservation expires while the user is in the middle of editing that item. Decide what happens to their unsaved changes and what the screen tells them.

I keep their changes. The page says the reservation expired and the stock was released, and that they can add it as a new item. Save changes becomes Add to Cart, which reserves again with a fresh 5 minutes (if stock is still there). The old item in the cart becomes read-only, it can only be removed.

### D4. Who creates the order id and timestamp, the browser or the server, and how do you stop a double-click on Pay from creating two orders?

The server. The browser clock is wrong here anyway (90s behind), and two tabs could make the same id. Id is ORD- plus the next number, time is server time in Dhaka.

For double clicks, Pay sends an Idempotency-Key header. Same cart + same payment method + same coupon = same key. The server saves key -> order id, so a second request with that key just gets the first order back. The button is also disabled while paying.

### D5. Someone asks "Who is our best customer?" but orders store no customer. Decide what the bot replies and how you stop it from inventing a name.

It says it can't answer that because orders don't have customer info, and lists what it can answer. That text is hardcoded, it doesn't come from the model.

Telling the model "don't guess" in the prompt isn't enough, so if it doesn't call a tool I throw its reply away and show the fixed message. None of the tools return anything about customers, so there's no name to make up. I also check the numbers in the final answer against the tool results, and if they don't match I show the tool result instead.

### D6. Design the JSON shape of a stored order yourself. Which fields, which money unit, and how do you record a coupon that was entered but not applied? Document the shape in DECISIONS.md.

Money is integer poisha everywhere. Payable is rounded to whole taka so it always ends in 00. Seed orders are priced with my engine at their createdAt and saved the same way as new ones.

{
"id": "ORD-1006",
"createdAt": "2026-11-22T13:10:00+06:00",
"paymentMethod": "card",
"coupon": { "code": "MORNING15", "status": "expired" },
"lines": [
{
"qty": 1,
"options": { "croissant": 1, "fried": 2, "tofu": 1, "cheese": 2 },
"unitSubtotal": 49000,
"extrasDiscount": 0,
"comboDiscount": 0,
"unitPrice": 49000,
"total": 49000
}
],
"totals": { "subtotal": 116950, "discount": null, "vat": 5848, "payable": 122800 }
}

(only the second line of ORD-1006 is shown here to keep it short)

coupon is null if nobody typed a code. If a code was typed I keep it and status says what happened: applied, expired (11:00 or later), not-best (C1 was bigger or equal) or unknown (wrong code). totals.discount is the discount that was really used, or null. That way "entered" and "applied" never get mixed up.
