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

export function isActive(item: CartItem) {
  return Date.parse(item.expiresAt) > serverNow();
}

// Starting stock minus sold stock and reservations that have not expired
export function availableStock(items: CartItem[]) {
  return items
    .filter(isActive)
    .reduce(
      (stock, item) =>
        subtractStock(
          stock,
          ingredientUsage(item.config, item.quantity, menu.groups),
        ),
      subtractStock(menu.stock, readDb().sold),
    );
}

type CartResult = { item: CartItem } | { status: number; message: string };

// Quantity, rules and stock. "others" are the items that keep their stock.
function checkLine({ config, quantity }: CartLine, others: CartItem[]) {
  if (
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > menu.product.maxQuantity
  ) {
    return {
      status: 422,
      message: `Quantity must be 1-${menu.product.maxQuantity}`,
    };
  }

  const violations = validate(config, menu.groups, menu.rules);
  if (violations.length > 0) {
    return {
      status: 422,
      message: violations.map((v) => v.message).join(". "),
    };
  }

  const need = ingredientUsage(config, quantity, menu.groups);
  const shortages = findShortages(need, availableStock(others));
  if (shortages.length > 0) {
    return { status: 409, message: shortageMessage(shortages) };
  }

  return null;
}

// Reserves all ingredients of an item, or nothing at all.
// Everything is checked first and saved with one single write.
export function reserveItem(
  line: CartLine,
  idempotencyKey: string,
  { fail = false } = {},
): CartResult {
  const db = readDb();

  const existing = db.items.find(
    (item) => item.idempotencyKey === idempotencyKey,
  );
  if (existing) return { item: existing };

  const error = checkLine(line, db.items);
  if (error) return error;

  if (fail) {
    return {
      status: 503,
      message: "Reservation service failed, nothing was reserved",
    };
  }

  const item: CartItem = {
    id: crypto.randomUUID(),
    config: line.config,
    quantity: line.quantity,
    idempotencyKey,
    expiresAt: new Date(serverNow() + RESERVATION_MS).toISOString(),
  };
  writeDb({ ...db, items: [...db.items, item] });

  return { item };
}

// Swaps the old allocation for the new one in a single write.
// The expiry time stays the same.
export function editItem(id: string, line: CartLine): CartResult {
  const db = readDb();

  const old = db.items.find((item) => item.id === id);
  if (!old)
    return { status: 404, message: "This item is no longer in the cart" };
  if (!isActive(old))
    return { status: 410, message: "The reservation has expired" };

  // The item's own stock counts as available to itself
  const others = db.items.filter((item) => item.id !== id);
  const error = checkLine(line, others);
  if (error) return error;

  const item: CartItem = {
    ...old,
    config: line.config,
    quantity: line.quantity,
  };
  writeDb({ ...db, items: db.items.map((i) => (i.id === id ? item : i)) });

  return { item };
}

export function removeItem(id: string) {
  const db = readDb();
  writeDb({ ...db, items: db.items.filter((item) => item.id !== id) });
}
