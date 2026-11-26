import { useState } from "react";
import { useApiMutation } from "../../hooks/TanstackQueries/useApiMutation";
import type { CartItem } from "../../types/cart";
import type { CartLine } from "../../types/price";

type Props = {
  itemId: string;
  line: CartLine;
  disabled: boolean;
  onSaved: () => void;
  onFailed: () => void;
};

function SaveChangesButton({ itemId, line, disabled, onSaved, onFailed }: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const save = useApiMutation<CartItem>({ method: "PUT", path: `cart/${itemId}` });

  const handleClick = async () => {
    setPending(true);
    setError("");
    try {
      await save.mutateAsync({ body: line });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      onFailed();
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="add-to-cart">
      {error && (
        <p className="notice" role="alert">
          Not saved: {error}. Your changes are kept.
        </p>
      )}
      <button type="button" className="primary" disabled={disabled || pending} onClick={handleClick}>
        {pending ? "Saving..." : "Save changes"}
      </button>
    </div>
  );
}

export default SaveChangesButton;
