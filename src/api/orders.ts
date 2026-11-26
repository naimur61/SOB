import type { Order } from "../types/order";

export async function getOrders(): Promise<Order[]> {
  const res = await fetch("/api/orders");
  if (!res.ok) throw new Error("Could not load the orders");
  return res.json();
}
