import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { request } from "./controller/fetchGetData";

type Props<T> = {
  queryKey: string | unknown[];
  path: string;
  method?: "GET" | "POST";
  filterData?: unknown; // sent as the body of a POST
  options?: Omit<UseQueryOptions<T>, "queryKey" | "queryFn">;
};

// Loads data from the server
function useFetchData<T>({ queryKey, path, method = "GET", filterData, options }: Props<T>) {
  return useQuery<T>({
    queryKey: [...[queryKey].flat(), { path, method, filterData }],
    // The signal cancels the request when nothing needs its answer any more
    queryFn: ({ signal }) => request<T>(path, { method, body: filterData, signal }),
    ...options,
  });
}

export default useFetchData;
