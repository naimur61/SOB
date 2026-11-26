import { useEffect, useState } from "react";
import { getStock } from "../api/stock";
import type { Stock } from "../engine/stock";

// Loads again whenever refreshKey changes or reload() is called
export function useStock(refreshKey = false) {
  const [stock, setStock] = useState<Stock | null>(null);
  const [error, setError] = useState("");

  const [version, setVersion] = useState(0);

  useEffect(() => {
    getStock()
      .then(setStock)
      .catch(() => setError("Could not load the stock. Please reload the page."));
  }, [version, refreshKey]);

  return { stock, error, reload: () => setVersion((v) => v + 1) };
}
