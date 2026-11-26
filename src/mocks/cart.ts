import { validate } from "../engine/rules";
import {
  findShortages,
  ingredientUsage,
  shortageMessage,
  subtractStock,
} from "../engine/stock";
import type { Menu } from "../types/menu";
import type { CartItem } from "../types/cart";
import type { CartLine } from "../types/price";
import { serverNow } from "./clock";
import menuJson from "./data/menu.json";
import { readDb, writeDb } from "./db";

const menu = menuJson as Menu;

export const RESERVATION_MS = 5 * 60 * 1000;

function isActive(item: CartItem) {
  return Date.parse(item.expiresAt) > serverNow();
}

// Starting stock minus everything held by reservations that have not expired
export function availableStock(items: CartItem[]) {
  return items.filter(isActive).reduce(
    (stock, item) => subtractStock(stock, ingredientUsage(item.config, item.quantity, menu.groups)),
    menu.stock,
  );
}

type ReserveResult = { item: CartItem } | { status: number; message: string };

// Reserves all ingredients of an item, or nothing at all.
// Everything is checked first and saved with one single write.
export function reserveItem(line: CartLine, idempotencyKey: string): ReserveResult {
  const db = readDb();

  const existing = db.items.find((item) => item.idempotencyKey === idempotencyKey);
  if (existing) return { item: existing };

  const { config, quantity } = line;

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > menu.product.maxQuantity) {
    return { status: 422, message: `Quantity must be 1-${menu.product.maxQuantity}` };
  }

  const violations = validate(config, menu.groups, menu.rules);
  if (violations.length > 0) {
    return { status: 422, message: violations.map((v) => v.message).join(". ") };
  }

  const need = ingredientUsage(config, quantity, menu.groups);
  const shortages = findShortages(need, availableStock(db.items));
  if (shortages.length > 0) {
    return { status: 409, message: shortageMessage(shortages) };
  }

  const item: CartItem = {
    id: crypto.randomUUID(),
    config,
    quantity,
    idempotencyKey,
    expiresAt: new Date(serverNow() + RESERVATION_MS).toISOString(),
  };
  writeDb({ ...db, items: [...db.items, item] });

  return { item };
}
