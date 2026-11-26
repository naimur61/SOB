import { useForm } from "react-hook-form";
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

type FormValues = { code: string };

function CartSummary({ price, menu, couponCode, onCouponChange }: Props) {
  // An empty code is allowed: it removes the coupon
  const { register, handleSubmit } = useForm<FormValues>({ defaultValues: { code: couponCode } });

  return (
    <section>
      <form className="coupon" onSubmit={handleSubmit(({ code }) => onCouponChange(code.trim()))}>
        <input aria-label="Coupon code" placeholder="Coupon code" {...register("code")} />
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
