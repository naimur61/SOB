import type { Order } from "../types/order";

// The content of the downloaded orders.json
export function ordersFile(orders: Order[]) {
  return JSON.stringify(
    { schemaVersion: 1, currency: "BDT", moneyUnit: "poisha", orders },
    null,
    2,
  );
}
