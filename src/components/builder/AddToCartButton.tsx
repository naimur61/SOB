import { useRef, useState } from "react";
import { useApiMutation } from "../../hooks/TanstackQueries/useApiMutation";
import type { CartItem } from "../../types/cart";
import type { CartLine } from "../../types/price";

type Props = {
  line: CartLine;
  disabled: boolean;
  onAdded: () => void;
  onFailed: () => void;
};

function AddToCartButton({ line, disabled, onAdded, onFailed }: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState({ body: "", message: "" });
  const lastRequest = useRef({ body: "", key: "" });
  const add = useApiMutation<CartItem>({ method: "POST", path: "cart" });

  const body = JSON.stringify(line);
  // An error belongs to the selection that caused it
  const message = error.body === body ? error.message : "";

  const handleClick = async () => {
    // Same selection, same key: a double click or a retry cannot add it twice
    if (lastRequest.current.body !== body) {
      lastRequest.current = { body, key: crypto.randomUUID() };
    }

    setPending(true);
    setError({ body: "", message: "" });
    try {
      await add.mutateAsync({
        body: line,
        headers: { "Idempotency-Key": lastRequest.current.key },
      });
      lastRequest.current = { body: "", key: "" };
      onAdded();
    } catch (err) {
      const reason = err instanceof Error ? err.message : "Something went wrong";
      setError({ body, message: reason });
      onFailed();
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="add-to-cart">
      {message && (
        <p className="notice" role="alert">
          Not added: {message}
        </p>
      )}
      <button type="button" className="primary" disabled={disabled || pending} onClick={handleClick}>
        {pending ? "Adding..." : message ? "Retry" : "Add to Cart"}
      </button>
    </div>
  );
}

export default AddToCartButton;
