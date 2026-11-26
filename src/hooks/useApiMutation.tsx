import { useMutation } from "@tanstack/react-query";
import { request } from "../lib/request";

type MutationConfig = {
  method: "POST" | "PUT" | "DELETE";
  path?: string;
};

type Variables = {
  path?: string; // for paths only known at click time
  body?: unknown;
  headers?: Record<string, string>;
};

// Changes data on the server
export function useApiMutation<T>({ method, path = "" }: MutationConfig) {
  return useMutation<T, Error, Variables>({
    mutationFn: (variables) =>
      request<T>(variables.path ?? path, {
        method,
        body: variables.body,
        headers: variables.headers,
      }),
  });
}
