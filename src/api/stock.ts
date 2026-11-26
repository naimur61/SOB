import type { Stock } from "../engine/stock";

export async function getStock(): Promise<Stock> {
  const res = await fetch("/api/stock");
  if (!res.ok) throw new Error("Could not load the stock");
  return res.json();
}
