import type { Config, Group, Option } from "../../types/menu";
import { formatTaka } from "../../utils/money";

type Props = {
  group: Group;
  config: Config;
  onChange: (optionId: string, qty: number) => void;
  stockFor: (option: Option) => { canAdd: number | null; reason: string };
};

// "min 2, max 6, step 2" built from whatever limits the group has
function limitText(group: Group) {
  const parts = [`min ${group.min}`];
  if (group.max !== undefined) parts.push(`max ${group.max}`);
  if (group.step !== undefined) parts.push(`step ${group.step}`);
  if (group.maxDistinct !== undefined) parts.push(`${group.maxDistinct} different`);
  if (group.maxPerOption !== undefined) parts.push(`${group.maxPerOption} of each`);
  return parts.join(", ");
}

function OptionGroup({ group, config, onChange, stockFor }: Props) {
  return (
    <section className="group">
      <h2>{group.name}</h2>
      <p className="muted">{limitText(group)}</p>

      <ul>
        {group.options.map((option) => {
          const qty = config[option.id] ?? 0;
          const { canAdd, reason } = stockFor(option);

          return (
            <li key={option.id}>
              <span className="option-name">{option.name}</span>
              <span className="muted">+{formatTaka(option.price)}</span>
              {canAdd !== null && (
                <span className={reason ? "stock-short" : "muted"}>
                  {reason || `can add ${canAdd}`}
                </span>
              )}

              <button
                type="button"
                aria-label={`Remove ${option.name}`}
                disabled={qty === 0}
                onClick={() => onChange(option.id, qty - 1)}
              >
                −
              </button>
              <span className="qty">{qty}</span>
              <button
                type="button"
                aria-label={`Add ${option.name}`}
                disabled={canAdd === 0}
                onClick={() => onChange(option.id, qty + 1)}
              >
                +
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default OptionGroup;
