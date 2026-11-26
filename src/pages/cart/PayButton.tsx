import { useRef } from "react";
import { useForm } from "react-hook-form";
import { useApiMutation } from "../../hooks/useApiMutation";
import type { Order } from "../../types/order";

type Props = {
  methods: string[];
  couponCode: string;
  itemIds: string[];
  onPaid: (order: Order) => void;
  onFailed: () => void;
};

type FormValues = { paymentMethod: string };

function PayButton({ methods, couponCode, itemIds, onPaid, onFailed }: Props) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { paymentMethod: methods[0] } });
  const lastRequest = useRef({ body: "", key: "" });
  const pay = useApiMutation<Order>({ method: "POST", path: "checkout" });

  const onSubmit = async ({ paymentMethod }: FormValues) => {
    // Same cart and payment, same key: the server will not create a second order
    const body = JSON.stringify([itemIds, paymentMethod, couponCode]);
    if (lastRequest.current.body !== body) {
      lastRequest.current = { body, key: crypto.randomUUID() };
    }

    try {
      const order = await pay.mutateAsync({
        body: { paymentMethod, couponCode },
        headers: { "Idempotency-Key": lastRequest.current.key },
      });
      onPaid(order);
    } catch (err) {
      // A "root" error belongs to the whole form, not one field. It clears on the next submit.
      setError("root", { message: err instanceof Error ? err.message : "Something went wrong" });
      onFailed();
    }
  };

  return (
    // The arrow keeps the lint from thinking the ref is read during render
    <form onSubmit={(e) => handleSubmit(onSubmit)(e)}>
      {errors.root && (
        <p className="notice" role="alert">
          Not paid: {errors.root.message}
        </p>
      )}
      <div className="pay">
        <label>
          Payment method{" "}
          <select {...register("paymentMethod")}>
            {methods.map((method) => (
              <option key={method}>{method}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="primary" disabled={isSubmitting}>
          {isSubmitting ? "Paying..." : "Pay"}
        </button>
      </div>
    </form>
  );
}

export default PayButton;
