import { QueryClientProvider } from "@tanstack/react-query";
import { render as baseRender, renderHook as baseRenderHook } from "@testing-library/react";
import { createElement, useState, type ReactElement, type ReactNode } from "react";
import { createQueryClient } from "../hooks/TanstackQueries/queryClient";

// Gives every test its own query client
function Wrapper({ children }: { children: ReactNode }) {
  const [client] = useState(createQueryClient);
  return createElement(QueryClientProvider, { client }, children);
}

export function render(ui: ReactElement) {
  return baseRender(ui, { wrapper: Wrapper });
}

export function renderHook<Result, Props>(
  hook: (props: Props) => Result,
  options?: { initialProps: Props },
) {
  return baseRenderHook(hook, { ...options, wrapper: Wrapper });
}
