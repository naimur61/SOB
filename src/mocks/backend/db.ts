import { buildOrder } from "../../engine/order";
import type { Stock } from "../../engine/stock";
import type { CartItem } from "../../types/cart";
import type { Menu } from "../../types/menu";
import type { Order } from "../../types/order";
import menuJson from "../data/menu.json";
import seed from "../data/orders.seed.json";

// The "database" of the mock server. It lives in localStorage so that it
// survives a refresh and every tab sees the same data.
type Db = {
  items: CartItem[];
  orders: Order[];
  sold: Stock; // ingredients used up by checkouts
  orderKeys: Record<string, string>; // idempotency key -> order id
};

const STORAGE_KEY = "sob-db";

// Seed orders have no prices, so each one is priced at its own createdAt
function seedOrders() {
  return seed.orders.map(({ lines, couponCode, ...info }) => {
    const cartLines = lines.map((line) => ({
      config: line.options as Record<string, number>,
      quantity: line.qty,
    }));
    return buildOrder(info, { lines: cartLines, couponCode }, menuJson as Menu);
  });
}

export function readDb(): Db {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  if (saved.orders) return saved;

  // First start: load the seed orders into the store
  const db: Db = { items: [], sold: {}, orderKeys: {}, ...saved, orders: seedOrders() };
  writeDb(db);
  return db;
}

export function writeDb(db: Db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}
