import { useEffect, useState } from "react";
import type { Config } from "../../types/menu";
import type { Price } from "../../types/price";
import useFetchData from "../../hooks/useFetchData";

export function usePricePreview(config: Config, quantity: number) {
  // A string, so the timer only restarts when the selection really changes
  const body = JSON.stringify({ lines: [{ config, quantity }] });
  const [debounced, setDebounced] = useState("");

  // Debounce: wait until the user stops clicking
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(body), 300);
    return () => clearTimeout(timer);
  }, [body]);

  // Each selection is its own query, so an older answer cannot replace a newer one.
  // The older request is cancelled.
  const query = useFetchData<Price>({
    queryKey: "price",
    path: "price",
    method: "POST",
    filterData: debounced ? JSON.parse(debounced) : undefined,
    options: { enabled: debounced !== "" },
  });

  // A price is only used if it answers the current selection
  const loading = debounced !== body || query.isFetching;
  const failed = !loading && query.isError;

  return {
    price: loading || failed ? null : (query.data ?? null),
    loading,
    failed,
    retry: () => query.refetch(),
  };
}
