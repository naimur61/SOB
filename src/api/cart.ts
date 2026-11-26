import type { CartItem } from "../types/cart";
import type { CartLine } from "../types/price";

// Returns the item, or throws the server's message
async function readItem(res: Response): Promise<CartItem> {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}

export async function getCart(): Promise<CartItem[]> {
  const res = await fetch("/api/cart");
  if (!res.ok) throw new Error("Could not load the cart");
  return res.json();
}

export async function addToCart(line: CartLine, idempotencyKey: string) {
  const res = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(line),
  });
  return readItem(res);
}

export async function updateCartItem(id: string, line: CartLine) {
  const res = await fetch(`/api/cart/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(line),
  });
  return readItem(res);
}

export async function removeCartItem(id: string) {
  const res = await fetch(`/api/cart/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Could not remove the item");
}
