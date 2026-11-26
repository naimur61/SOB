import { useState } from "react";
import { removeCartItem } from "../api/cart";
import CartItemRow from "../components/cart/CartItemRow";
import { useCart } from "../hooks/useCart";
import { useMenu } from "../hooks/useMenu";
import type { CartItem } from "../types/cart";

type Props = {
  serverNow: number | null;
  onEdit: (item: CartItem) => void;
};

function CartPage({ serverNow, onEdit }: Props) {
  const { menu, error: menuError } = useMenu();
  const { items, error: cartError, reload } = useCart();
  const [removeError, setRemoveError] = useState("");

  if (menuError || cartError) return <p role="alert">{menuError || cartError}</p>;
  if (!menu || !items || serverNow === null) return <p>Loading cart...</p>;
  if (items.length === 0) return <p>Your cart is empty.</p>;

  const handleRemove = async (id: string) => {
    setRemoveError("");
    try {
      await removeCartItem(id);
      reload();
    } catch {
      setRemoveError("Could not remove the item. Please try again.");
    }
  };

  return (
    <>
      {removeError && (
        <p className="notice" role="alert">
          {removeError}
        </p>
      )}
      <ul className="cart">
        {items.map((item) => (
          <CartItemRow
            key={item.id}
            item={item}
            menu={menu}
            serverNow={serverNow}
            onEdit={() => onEdit(item)}
            onRemove={() => handleRemove(item.id)}
          />
        ))}
      </ul>
    </>
  );
}

export default CartPage;
