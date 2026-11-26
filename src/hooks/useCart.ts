import type { CartItem } from "../types/cart";
import useFetchData from "./TanstackQueries/useFetchData";

export function useCart() {
  const { data, isError, refetch } = useFetchData<CartItem[]>({ queryKey: "cart", path: "cart" });

  return {
    items: data ?? null,
    error: isError ? "Could not load the cart. Please reload the page." : "",
    reload: () => refetch(),
  };
}
