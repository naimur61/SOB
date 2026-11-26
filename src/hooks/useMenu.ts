import type { Menu } from "../types/menu";
import useFetchData from "./TanstackQueries/useFetchData";

export function useMenu() {
  const { data, isError } = useFetchData<Menu>({ queryKey: "menu", path: "menu" });

  return {
    menu: data ?? null,
    error: isError ? "Could not load the menu. Please reload the page." : "",
  };
}
