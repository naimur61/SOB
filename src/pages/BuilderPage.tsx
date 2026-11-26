import { useState } from "react";
import AddToCartButton from "../components/builder/AddToCartButton";
import OptionGroup from "../components/builder/OptionGroup";
import PricePreview from "../components/builder/PricePreview";
import QuantityPicker from "../components/builder/QuantityPicker";
import SaveChangesButton from "../components/builder/SaveChangesButton";
import StockNote from "../components/builder/StockNote";
import ViolationList from "../components/builder/ViolationList";
import { validate } from "../engine/rules";
import { addStock, findShortages, ingredientUsage, optionStock } from "../engine/stock";
import { useCart } from "../hooks/useCart";
import { useMenu } from "../hooks/useMenu";
import { useStock } from "../hooks/useStock";
import type { CartItem } from "../types/cart";
import type { Config } from "../types/menu";
import { formatTaka } from "../utils/money";

type Props = {
  editing?: CartItem; // set when changing an item that is already in the cart
  serverNow?: number | null;
  onDone?: () => void; // called after an edit is saved
};

function BuilderPage({ editing, serverNow, onDone }: Props) {
  const expired = !!editing && !!serverNow && Date.parse(editing.expiresAt) <= serverNow;

  const { menu, error } = useMenu();
  const { items, reload: reloadCart } = useCart();
  // An expiring reservation releases stock, so the stock is loaded again
  const expiredCount =
    items?.filter((item) => serverNow && Date.parse(item.expiresAt) <= serverNow).length ?? 0;
  const { stock, error: stockError, reload: reloadStock } = useStock(expiredCount);
  const [config, setConfig] = useState<Config>(editing?.config ?? {});
  const [quantity, setQuantity] = useState(editing?.quantity ?? 1);
  const [added, setAdded] = useState(false);

  if (error || stockError) return <p role="alert">{error || stockError}</p>;
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
