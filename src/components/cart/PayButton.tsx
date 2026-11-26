import { useRef, useState } from "react";
import { payCart } from "../../api/checkout";
import type { Order } from "../../types/order";

type Props = {
  methods: string[];
  couponCode: string;
  itemIds: string[];
  onPaid: (order: Order) => void;
  onFailed: () => void;
};

function PayButton({ methods, couponCode, itemIds, onPaid, onFailed }: Props) {
  const [paymentMethod, setPaymentMethod] = useState(methods[0]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const lastRequest = useRef({ body: "", key: "" });

  const handleClick = async () => {
    // Same cart and payment, same key: the server will not create a second order
    const body = JSON.stringify([itemIds, paymentMethod, couponCode]);
    if (lastRequest.current.body !== body) {
      lastRequest.current = { body, key: crypto.randomUUID() };
    }

    setPending(true);
    setError("");
    try {
      onPaid(await payCart({ paymentMethod, couponCode }, lastRequest.current.key));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      onFailed();
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      {error && (
        <p className="notice" role="alert">
          Not paid: {error}
        </p>
      )}
      <div className="pay">
        <label>
          Payment method{" "}
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            {methods.map((method) => (
              <option key={method}>{method}</option>
            ))}
          </select>
        </label>
        <button type="button" className="primary" disabled={pending} onClick={handleClick}>
          {pending ? "Paying..." : "Pay"}
        </button>
      </div>
    </>
  );
}

export default PayButton;
