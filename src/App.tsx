import { useState } from "react";
import Header from "./components/builder/Header";
import { useServerClock } from "./hooks/useServerClock";
import BuilderPage from "./pages/BuilderPage";
import CartPage from "./pages/CartPage";
import type { CartItem } from "./types/cart";

type Page = "builder" | "cart";

function App() {
  const serverNow = useServerClock();
  const [page, setPage] = useState<Page>("builder");
  const [editing, setEditing] = useState<CartItem>();

  const open = (next: Page, item?: CartItem) => {
    setEditing(item);
    setPage(next);
  };

  return (
    <main className="container">
      <Header serverNow={serverNow} />

      <nav className="nav">
        <button
          type="button"
          aria-current={page === "builder" ? "page" : undefined}
          onClick={() => open("builder")}
        >
          Builder
        </button>
        <button
          type="button"
          aria-current={page === "cart" ? "page" : undefined}
          onClick={() => open("cart")}
        >
          Cart
        </button>
      </nav>

      {page === "builder" ? (
        <BuilderPage
          key={editing?.id ?? "new"}
          editing={editing}
          serverNow={serverNow}
          onDone={() => open("cart")}
        />
      ) : (
        <CartPage serverNow={serverNow} onEdit={(item) => open("builder", item)} />
      )}
    </main>
  );
}

export default App;
