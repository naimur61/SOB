import type { Order } from "../types/order";
import useFetchData from "./TanstackQueries/useFetchData";

export function useOrders() {
  const { data, isError } = useFetchData<Order[]>({ queryKey: "orders", path: "orders" });

  return {
    orders: data ?? null,
    error: isError ? "Could not load the orders. Please reload the page." : "",
  };
}
