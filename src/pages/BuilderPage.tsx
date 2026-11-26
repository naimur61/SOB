import { useState } from "react";
import OptionGroup from "../components/builder/OptionGroup";
import ViolationList from "../components/builder/ViolationList";
import { validate } from "../engine/rules";
import { useMenu } from "../hooks/useMenu";
import type { Config } from "../types/menu";
import { formatTaka } from "../utils/money";

function BuilderPage() {
  const { menu, error } = useMenu();
  const [config, setConfig] = useState<Config>({});

  if (error) return <p role="alert">{error}</p>;
  if (!menu) return <p>Loading menu...</p>;

  const violations = validate(config, menu.groups, menu.rules);

  const changeQty = (optionId: string, qty: number) => {
    setConfig((current) => ({ ...current, [optionId]: qty }));
  };

  return (
    <>
      <p>
        {menu.product.name}, base price {formatTaka(menu.product.basePrice)}
      </p>

      {menu.groups.map((group) => (
        <OptionGroup key={group.id} group={group} config={config} onChange={changeQty} />
      ))}

      <ViolationList violations={violations} />
    </>
  );
}

export default BuilderPage;
