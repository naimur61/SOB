import type { CartItem } from "../types/cart";
import type { CartLine } from "../types/price";

export async function addToCart(line: CartLine, idempotencyKey: string): Promise<CartItem> {
  const res = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(line),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}
