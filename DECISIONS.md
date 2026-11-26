# Decisions

## Checkpoints

### C1. Before writing priceCart: explain why storing 679.50 as a JavaScript float is risky for TC-06, and show by hand how the VAT of 75.48 in TC-06 is rounded.



### C2. Before wiring Gemini: list every question your bot supports and the exact function (name, inputs, output) that answers it.



## Decision points

### D1. Two browser tabs share one server. Tab A is editing an item when tab B takes the last eggs. What does tab A see when it saves, and does the user lose anything they typed?



### D2. Promotions change while an item sits in the cart (the coupon stops at 11:00). Decide when a price is locked: at Add to cart, at checkout, or never. Your choice must stay consistent with TC-06/TC-07.



### D3. A reservation expires while the user is in the middle of editing that item. Decide what happens to their unsaved changes and what the screen tells them.



### D4. Who creates the order id and timestamp, the browser or the server, and how do you stop a double-click on Pay from creating two orders?



### D5. Someone asks "Who is our best customer?" but orders store no customer. Decide what the bot replies and how you stop it from inventing a name.



### D6. Design the JSON shape of a stored order yourself. Which fields, which money unit, and how do you record a coupon that was entered but not applied? Document the shape in DECISIONS.md.


