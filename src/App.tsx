import { useState } from "react";
import ChatPanel from "./components/assistant/ChatPanel";
import Header from "./components/builder/Header";
import { useServerClock } from "./hooks/useServerClock";
import BuilderPage from "./pages/BuilderPage";
import CartPage from "./pages/CartPage";
import OrdersPage from "./pages/OrdersPage";
import type { CartItem } from "./types/cart";

const pages = [
  { id: "builder", label: "Builder" },
  { id: "cart", label: "Cart" },
  { id: "orders", label: "Orders" },
  { id: "assistant", label: "Sales assistant" },
] as const;

type Page = (typeof pages)[number]["id"];

function App() {
  const serverNow = useServerClock();
  const [page, setPage] = useState<Page>("builder");
  const [editing, setEditing] = useState<CartItem>();
  const [couponCode, setCouponCode] = useState("");

  const open = (next: Page, item?: CartItem) => {
    setEditing(item);
    setPage(next);
  };

  return (
    <main className="container">
      <Header serverNow={serverNow} />

      <nav className="nav">
        {pages.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-current={page === id ? "page" : undefined}
            onClick={() => open(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {page === "builder" && (
        <BuilderPage
          key={editing?.id ?? "new"}
          editing={editing}
          serverNow={serverNow}
          onDone={() => open("cart")}
        />
      )}
      {page === "cart" && (
        <CartPage
          serverNow={serverNow}
          couponCode={couponCode}
          onCouponChange={setCouponCode}
          onEdit={(item) => open("builder", item)}
        />
      )}
      {page === "orders" && <OrdersPage />}
      {page === "assistant" && <ChatPanel />}
    </main>
  );
}

export default App;
