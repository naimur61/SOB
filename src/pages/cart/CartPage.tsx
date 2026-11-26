import { useState } from "react";
import CartItemRow from "./CartItemRow";
import CartSummary from "./CartSummary";
import PayButton from "./PayButton";
import { priceCart } from "../../engine/pricing";
import { useApiMutation } from "../../hooks/useApiMutation";
import useFetchData from "../../hooks/useFetchData";
import type { CartItem } from "../../types/cart";
import type { Menu } from "../../types/menu";
import type { Order } from "../../types/order";
import { formatTaka } from "../../utils/money";

type Props = {
  serverNow: number | null;
  couponCode: string;
  onCouponChange: (code: string) => void;
  onEdit: (item: CartItem) => void;
};

function CartPage({ serverNow, couponCode, onCouponChange, onEdit }: Props) {
  const { data: menu, isError: menuFailed } = useFetchData<Menu>({
    queryKey: "menu",
    path: "menu",
  });
  const {
    data: items,
    isError: cartFailed,
    refetch: reload,
  } = useFetchData<CartItem[]>({ queryKey: "cart", path: "cart" });
  const [removeError, setRemoveError] = useState("");
  const [paid, setPaid] = useState<Order>();
  const remove = useApiMutation<null>({ method: "DELETE" });

  if (menuFailed) return <p role="alert">Could not load the menu. Please reload the page.</p>;
  if (cartFailed) return <p role="alert">Could not load the cart. Please reload the page.</p>;
  if (!menu || !items) return <p>Loading cart...</p>;
  if (serverNow === null) return <p className="muted">Syncing server time...</p>;
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
      await remove.mutateAsync({ path: `cart/${id}` });
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
