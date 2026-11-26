import { useEffect, useState } from "react";
import { getStock } from "../api/stock";
import type { Stock } from "../engine/stock";

export function useStock() {
  const [stock, setStock] = useState<Stock | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getStock()
      .then(setStock)
      .catch(() => setError("Could not load the stock. Please reload the page."));
  }, []);

  return { stock, error };
}
