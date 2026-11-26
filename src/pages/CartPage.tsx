import { useState } from "react";
import { removeCartItem } from "../api/cart";
import CartItemRow from "../components/cart/CartItemRow";
import CartSummary from "../components/cart/CartSummary";
import { priceCart } from "../engine/pricing";
import { useCart } from "../hooks/useCart";
import { useMenu } from "../hooks/useMenu";
import type { CartItem } from "../types/cart";

type Props = {
  serverNow: number | null;
  couponCode: string;
  onCouponChange: (code: string) => void;
  onEdit: (item: CartItem) => void;
};

function CartPage({ serverNow, couponCode, onCouponChange, onEdit }: Props) {
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

  // Prices are not locked yet (D2): they follow the server time until checkout
  const active = items.filter((item) => Date.parse(item.expiresAt) > serverNow);
  const price = priceCart({ lines: active, couponCode }, menu, menu.promotions, serverNow);

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
            price={price.lines[active.indexOf(item)]}
            serverNow={serverNow}
            onEdit={() => onEdit(item)}
            onRemove={() => handleRemove(item.id)}
          />
        ))}
      </ul>

      {active.length > 0 && (
        <CartSummary
          price={price}
          menu={menu}
          couponCode={couponCode}
          onCouponChange={onCouponChange}
        />
      )}
    </>
  );
}

export default CartPage;
