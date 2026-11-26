import { useEffect, useState } from "react";
import { getOrders } from "../api/orders";
import type { Order } from "../types/order";

export function useOrders() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getOrders()
      .then(setOrders)
      .catch(() => setError("Could not load the orders. Please reload the page."));
  }, []);

  return { orders, error };
}
