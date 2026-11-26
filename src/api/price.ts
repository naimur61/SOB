import type { Cart, Price } from "../types/price";

export async function getPrice(cart: Cart, signal: AbortSignal): Promise<Price> {
  const res = await fetch("/api/price", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cart),
    signal,
  });
  if (!res.ok) throw new Error("Could not get the price");
  return res.json();
}
