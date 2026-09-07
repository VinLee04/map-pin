import { queryOptions } from "@tanstack/react-query";
import { getCustomerById, listCustomerMeta, listCustomers, type CustomerFiltersInput } from "@/server/customer.functions";

export const customerListQueryOptions = (filters: CustomerFiltersInput = {}) =>
  queryOptions({
    queryKey: ["customers", filters] as const,
    queryFn: () => listCustomers({ data: filters }),
    staleTime: 30_000,
  });

export const customerQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["customer", id] as const,
    queryFn: () => getCustomerById({ data: { id } }),
    staleTime: 30_000,
  });

export const customerMetaQueryOptions = queryOptions({
  queryKey: ["customer-meta"] as const,
  queryFn: () => listCustomerMeta(),
  staleTime: 5 * 60_000,
});
