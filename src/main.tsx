import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { createQueryClient } from "./hooks/TanstackQueries/queryClient";
import "./index.css";

async function start() {
  // MSW plays the role of our backend
  const { worker } = await import("./mocks/browser");
  await worker.start({ onUnhandledFrame: "bypass" });

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={createQueryClient()}>
        <App />
      </QueryClientProvider>
    </StrictMode>,
  );
}

start();
