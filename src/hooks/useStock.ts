import { keepPreviousData } from "@tanstack/react-query";
import type { Stock } from "../engine/stock";
import useFetchData from "./TanstackQueries/useFetchData";

// Loads again whenever refreshKey changes or reload() is called
export function useStock(refreshKey = 0) {
  const { data, isError, refetch } = useFetchData<Stock>({
    queryKey: ["stock", refreshKey],
    path: "stock",
    options: { placeholderData: keepPreviousData },
  });

  return {
    stock: data ?? null,
    error: isError ? "Could not load the stock. Please reload the page." : "",
    reload: () => refetch(),
  };
}
