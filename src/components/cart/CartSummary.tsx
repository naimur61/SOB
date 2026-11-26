import { useState } from "react";
import type { Menu } from "../../types/menu";
import type { CouponStatus, Price } from "../../types/price";
import { formatTaka } from "../../utils/money";

type Props = {
  price: Price;
  menu: Menu;
  couponCode: string;
  onCouponChange: (code: string) => void;
};

const couponMessages: Record<CouponStatus, string> = {
  none: "",
  applied: "Coupon applied.",
  unknown: "Coupon not applied: unknown code.",
  expired: "Coupon not applied: it is too late in the day for this code.",
  "not-best": "Coupon not applied: the other discount is equal or bigger.",
};

function CartSummary({ price, menu, couponCode, onCouponChange }: Props) {
  const [input, setInput] = useState(couponCode);

  return (
    <section>
      <form
        className="coupon"
        onSubmit={(e) => {
          e.preventDefault();
          onCouponChange(input.trim());
        }}
      >
        <input
          aria-label="Coupon code"
          placeholder="Coupon code"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit">Apply</button>
      </form>
      {price.couponStatus !== "none" && <p role="status">{couponMessages[price.couponStatus]}</p>}

      <dl className="price">
        <dt>Subtotal</dt>
        <dd>{formatTaka(price.subtotal)}</dd>
        {price.discount && (
          <>
            <dt>Discount ({price.discount.id})</dt>
            <dd>−{formatTaka(price.discount.amount)}</dd>
          </>
        )}
        <dt>VAT {menu.vatPercent}%</dt>
        <dd>{formatTaka(price.vat)}</dd>
        <dt>
          <strong>Payable</strong>
        </dt>
        <dd>
          <strong>{formatTaka(price.payable)}</strong>
        </dd>
      </dl>
    </section>
  );
}

export default CartSummary;
