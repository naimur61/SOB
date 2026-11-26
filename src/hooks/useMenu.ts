import { useEffect, useState } from "react";
import { getMenu } from "../api/menu";
import type { Menu } from "../types/menu";

export function useMenu() {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getMenu()
      .then(setMenu)
      .catch(() => setError("Could not load the menu. Please reload the page."));
  }, []);

  return { menu, error };
}
