import { buildOrder } from "../../engine/order";
import { addStock, ingredientUsage } from "../../engine/stock";
import type { Menu } from "../../types/menu";
import type { Order } from "../../types/order";
import { isActive } from "./cart";
import { serverNow } from "./clock";
import menuJson from "../data/menu.json";
import { readDb, writeDb } from "./db";

const menu = menuJson as Menu;

export type Payment = {
  paymentMethod: string;
  couponCode: string;
};

type CheckoutResult = { order: Order } | { status: number; message: string };

// 2026-11-20T09:15:00.000+06:00 (Dhaka has no daylight saving time)
function dhakaIso(ms: number) {
  return new Date(ms + 6 * 60 * 60 * 1000).toISOString().replace("Z", "+06:00");
}

function nextOrderId(orders: Order[]) {
  const numbers = orders.map((order) => Number(order.id.replace(/\D/g, "")));
  return `ORD-${Math.max(1000, ...numbers) + 1}`;
}

// Turns all active items into one order. Everything is saved with one write.
export function checkout(payment: Payment, idempotencyKey: string): CheckoutResult {
  const db = readDb();

  const paidId = db.orderKeys[idempotencyKey];
  const paid = db.orders.find((order) => order.id === paidId);
  if (paid) return { order: paid };

  if (!menu.paymentMethods.includes(payment.paymentMethod)) {
    return { status: 422, message: "Unknown payment method" };
  }

  const active = db.items.filter(isActive);
  if (active.length === 0) {
    return { status: 409, message: "There are no active items to pay for" };
  }

  const info = {
    id: nextOrderId(db.orders),
    createdAt: dhakaIso(serverNow()),
    paymentMethod: payment.paymentMethod,
  };
  const order = buildOrder(info, { lines: active, couponCode: payment.couponCode }, menu);

  // Reserved stock becomes sold stock
  const sold = active.reduce(
    (total, item) => addStock(total, ingredientUsage(item.config, item.quantity, menu.groups)),
    db.sold,
  );

  writeDb({
    items: [],
    orders: [...db.orders, order],
    sold,
    orderKeys: { ...db.orderKeys, [idempotencyKey]: order.id },
  });

  return { order };
}
