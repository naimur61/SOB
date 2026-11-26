import { useState } from "react";
import { removeCartItem } from "../api/cart";
import CartItemRow from "../components/cart/CartItemRow";
import CartSummary from "../components/cart/CartSummary";
import PayButton from "../components/cart/PayButton";
import { priceCart } from "../engine/pricing";
import { useCart } from "../hooks/useCart";
import { useMenu } from "../hooks/useMenu";
import type { CartItem } from "../types/cart";
import type { Order } from "../types/order";
import { formatTaka } from "../utils/money";

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
  const [paid, setPaid] = useState<Order>();

  if (menuError || cartError) return <p role="alert">{menuError || cartError}</p>;
  if (!menu || !items || serverNow === null) return <p>Loading cart...</p>;
  if (items.length === 0) {
    return (
      <>
        {paid && (
          <p role="status">
            Order {paid.id} paid: {formatTaka(paid.totals.payable)} ({paid.paymentMethod}).
          </p>
        )}
        <p>Your cart is empty.</p>
      </>
    );
  }

  const handlePaid = (order: Order) => {
    setPaid(order);
    onCouponChange("");
    reload();
  };

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
        <>
          <CartSummary
            price={price}
            menu={menu}
            couponCode={couponCode}
            onCouponChange={onCouponChange}
          />
          <PayButton
            methods={menu.paymentMethods}
            couponCode={couponCode}
            itemIds={active.map((item) => item.id)}
            onPaid={handlePaid}
            onFailed={reload}
          />
        </>
      )}
    </>
  );
}

export default CartPage;
