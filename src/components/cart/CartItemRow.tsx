import type { CartItem } from "../../types/cart";
import type { Menu } from "../../types/menu";
import { formatCountdown } from "../../utils/time";

type Props = {
  item: CartItem;
  menu: Menu;
  serverNow: number;
  onEdit: () => void;
  onRemove: () => void;
};

// "Toast x1, Scrambled x2"
function describe(item: CartItem, menu: Menu) {
  return menu.groups
    .flatMap((group) => group.options)
    .filter((option) => item.config[option.id] > 0)
    .map((option) => `${option.name} x${item.config[option.id]}`)
    .join(", ");
}

function CartItemRow({ item, menu, serverNow, onEdit, onRemove }: Props) {
  const timeLeft = Date.parse(item.expiresAt) - serverNow;
  const expired = timeLeft <= 0;

  return (
    <li>
      <p>
        <strong>
          {menu.product.name} (quantity {item.quantity})
        </strong>
      </p>
      <p>{describe(item, menu)}</p>
      <p className={expired ? "stock-short" : "muted"}>
        {expired
          ? "Reservation expired. Stock was released and this item is read-only."
          : `Reserved for ${formatCountdown(timeLeft)}`}
      </p>

      <div className="actions">
        <button type="button" disabled={expired} onClick={onEdit}>
          Edit
        </button>
        <button type="button" onClick={onRemove}>
          Remove
        </button>
      </div>
    </li>
  );
}

export default CartItemRow;
