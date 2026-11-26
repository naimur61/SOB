import { QueryClient } from "@tanstack/react-query";

// The mock server is the source of truth, so nothing is cached between pages
// and nothing is retried unless a query asks for it
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, refetchOnWindowFocus: false, networkMode: "always" },
      mutations: { networkMode: "always" },
    },
  });
}
