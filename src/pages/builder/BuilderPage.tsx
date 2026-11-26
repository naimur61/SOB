import { keepPreviousData } from "@tanstack/react-query";
import { useState } from "react";
import AddToCartButton from "./AddToCartButton";
import OptionGroup from "./OptionGroup";
import PricePreview from "./PricePreview";
import QuantityPicker from "./QuantityPicker";
import SaveChangesButton from "./SaveChangesButton";
import StockNote from "./StockNote";
import ViolationList from "./ViolationList";
import { validate } from "../../engine/rules";
import {
  addStock,
  findShortages,
  ingredientUsage,
  optionStock,
  type Stock,
} from "../../engine/stock";
import useFetchData from "../../hooks/useFetchData";
import type { CartItem } from "../../types/cart";
import type { Config, Menu } from "../../types/menu";
import { formatTaka } from "../../utils/money";

type Props = {
  editing?: CartItem; // set when changing an item that is already in the cart
  serverNow?: number | null;
  onDone?: () => void; // called after an edit is saved
};

function BuilderPage({ editing, serverNow, onDone }: Props) {
  const expired = !!editing && !!serverNow && Date.parse(editing.expiresAt) <= serverNow;

  const { data: menu, isError: menuFailed } = useFetchData<Menu>({
    queryKey: "menu",
    path: "menu",
  });
  const { data: items, refetch: reloadCart } = useFetchData<CartItem[]>({
    queryKey: "cart",
    path: "cart",
  });
  // An expiring reservation releases stock, so the stock is loaded again
  const expiredCount =
    items?.filter((item) => serverNow && Date.parse(item.expiresAt) <= serverNow).length ?? 0;
  const {
    data: stock,
    isError: stockFailed,
    refetch: reloadStock,
  } = useFetchData<Stock>({
    queryKey: ["stock", expiredCount],
    path: "stock",
    // Keeps showing the old stock while the new one loads
    options: { placeholderData: keepPreviousData },
  });
  const [config, setConfig] = useState<Config>(editing?.config ?? {});
  const [quantity, setQuantity] = useState(editing?.quantity ?? 1);
  const [added, setAdded] = useState(false);

  if (menuFailed) return <p role="alert">Could not load the menu. Please reload the page.</p>;
  if (stockFailed) return <p role="alert">Could not load the stock. Please reload the page.</p>;
  if (!menu || !stock) return <p>Loading menu...</p>;

  const violations = validate(config, menu.groups, menu.rules);
  const need = ingredientUsage(config, quantity, menu.groups);

  // While editing, the stock the item already holds is available to it
  const held =
    editing && !expired ? ingredientUsage(editing.config, editing.quantity, menu.groups) : {};
  const available = addStock(stock, held);
  const shortages = findShortages(need, available);
  const blocked = violations.length > 0 || shortages.length > 0;

  const changeQty = (optionId: string, qty: number) => {
    setAdded(false);
    setConfig((current) => {
      const next = { ...current, [optionId]: qty };
      if (qty === 0) delete next[optionId]; // not picked, so not saved
      return next;
    });
  };

  // Start a fresh item, so the same one is not added again by mistake
  const handleAdded = () => {
    if (editing) {
      onDone?.();
      return;
    }
    setConfig({});
    setQuantity(1);
    setAdded(true);
    reloadStock();
    reloadCart();
  };

  return (
    <>
      {editing && !expired && <h2>Editing a cart item</h2>}
      {editing && !serverNow && <p className="muted">Syncing server time...</p>}
      {expired && (
        <p className="notice" role="alert">
          This reservation has expired and its stock was released. Your changes are kept here. You
          can add them to the cart as a new item.
        </p>
      )}

      <p>
        {menu.product.name}, base price {formatTaka(menu.product.basePrice)}
      </p>

      {menu.groups.map((group) => (
        <OptionGroup
          key={group.id}
          group={group}
          config={config}
          onChange={changeQty}
          stockFor={(option) => optionStock(option, need, quantity, available)}
        />
      ))}

      <QuantityPicker quantity={quantity} max={menu.product.maxQuantity} onChange={setQuantity} />
      <ViolationList violations={violations} />
      <StockNote shortages={shortages} />
      <PricePreview config={config} quantity={quantity} />
      {added && <p role="status">Added to cart. Stock is held for 5 minutes.</p>}
      {editing && !expired ? (
        <SaveChangesButton
          itemId={editing.id}
          line={{ config, quantity }}
          disabled={blocked}
          onSaved={() => onDone?.()}
          onFailed={reloadStock}
        />
      ) : (
        <AddToCartButton
          line={{ config, quantity }}
          disabled={blocked}
          onAdded={handleAdded}
          onFailed={reloadStock}
        />
      )}
    </>
  );
}

export default BuilderPage;
