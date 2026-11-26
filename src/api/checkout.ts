import type { Order } from "../types/order";

type Payment = {
  paymentMethod: string;
  couponCode: string;
};

export async function payCart(payment: Payment, idempotencyKey: string): Promise<Order> {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(payment),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}
