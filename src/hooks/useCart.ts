import { useEffect, useState } from "react";
import { getCart } from "../api/cart";
import type { CartItem } from "../types/cart";

export function useCart() {
  const [items, setItems] = useState<CartItem[] | null>(null);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    getCart()
      .then(setItems)
      .catch(() => setError("Could not load the cart. Please reload the page."));
  }, [version]);

  return { items, error, reload: () => setVersion((v) => v + 1) };
}
