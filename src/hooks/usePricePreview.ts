import { useEffect, useState } from "react";
import { getPrice } from "../api/price";
import type { Config } from "../types/menu";
import type { Price } from "../types/price";

type Result = {
  body: string;
  attempt: number;
  price: Price | null; // null means the request failed
};

export function usePricePreview(config: Config, quantity: number) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  // A string, so the effect only runs again when the selection really changes
  const body = JSON.stringify({ lines: [{ config, quantity }] });

  useEffect(() => {
    const controller = new AbortController();

    // Debounce: wait until the user stops clicking
    const timer = setTimeout(() => {
      getPrice(JSON.parse(body), controller.signal)
        .then((price) => setResult({ body, attempt, price }))
        .catch(() => {
          if (!controller.signal.aborted) setResult({ body, attempt, price: null });
        });
    }, 300);

    // A newer selection cancels the older request
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [body, attempt]);

  // A result is only used if it answers the current selection
  const current = result?.body === body && result.attempt === attempt ? result : null;

  return {
    price: current?.price ?? null,
    loading: current === null,
    failed: current !== null && current.price === null,
    retry: () => setAttempt((n) => n + 1),
  };
}
