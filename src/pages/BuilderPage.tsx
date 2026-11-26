import { useState } from "react";
import AddToCartButton from "../components/builder/AddToCartButton";
import OptionGroup from "../components/builder/OptionGroup";
import PricePreview from "../components/builder/PricePreview";
import QuantityPicker from "../components/builder/QuantityPicker";
import StockNote from "../components/builder/StockNote";
import ViolationList from "../components/builder/ViolationList";
import { validate } from "../engine/rules";
import { findShortages, ingredientUsage, optionStock } from "../engine/stock";
import { useMenu } from "../hooks/useMenu";
import { useStock } from "../hooks/useStock";
import type { Config } from "../types/menu";
import { formatTaka } from "../utils/money";

function BuilderPage() {
  const { menu, error } = useMenu();
  const { stock, error: stockError, reload: reloadStock } = useStock();
  const [config, setConfig] = useState<Config>({});
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (error || stockError) return <p role="alert">{error || stockError}</p>;
  if (!menu || !stock) return <p>Loading menu...</p>;

  const violations = validate(config, menu.groups, menu.rules);
  const need = ingredientUsage(config, quantity, menu.groups);
  const shortages = findShortages(need, stock);

  const changeQty = (optionId: string, qty: number) => {
    setAdded(false);
    setConfig((current) => ({ ...current, [optionId]: qty }));
  };

  // Start a fresh item, so the same one is not added again by mistake
  const handleAdded = () => {
    setConfig({});
    setQuantity(1);
    setAdded(true);
    reloadStock();
  };

  return (
    <>
      <p>
        {menu.product.name}, base price {formatTaka(menu.product.basePrice)}
      </p>

      {menu.groups.map((group) => (
        <OptionGroup
          key={group.id}
          group={group}
          config={config}
          onChange={changeQty}
          stockFor={(option) => optionStock(option, need, quantity, stock)}
        />
      ))}

      <QuantityPicker quantity={quantity} max={menu.product.maxQuantity} onChange={setQuantity} />
      <ViolationList violations={violations} />
      <StockNote shortages={shortages} />
      <PricePreview config={config} quantity={quantity} />
      {added && <p role="status">Added to cart. Stock is held for 5 minutes.</p>}
      <AddToCartButton
        line={{ config, quantity }}
        disabled={violations.length > 0 || shortages.length > 0}
        onAdded={handleAdded}
        onFailed={reloadStock}
      />
    </>
  );
}

export default BuilderPage;
