import type { CartItem } from "../types/cart";

// The "database" of the mock server. It lives in localStorage so that it
// survives a refresh and every tab sees the same data.
type Db = {
  items: CartItem[];
};

const STORAGE_KEY = "sob-db";

export function readDb(): Db {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : { items: [] };
}

export function writeDb(db: Db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}
