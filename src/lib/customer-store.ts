"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { createGroupMutation, createPersonalityMutation, createStreetMutation, createCustomerMutation, deleteCustomerMutation, updateCustomerMutation, updateCustomerAddressMutation } from "@/lib/customer.mutations";
import { customerListQueryOptions, customerMetaQueryOptions } from "@/lib/customer.queries";
import type { CustomerFiltersInput } from "#/server/customer.functions.ts";

export const useCustomerStore = (filters: CustomerFiltersInput = {}) => {
  const queryClient = useQueryClient();
  const customers = useQuery(customerListQueryOptions(filters));
  const meta = useQuery(customerMetaQueryOptions);

  const createCustomer = useMutation({
    ...createCustomerMutation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error) => {
      console.error("Error creating customer:", error);
    }
  });
  const updateCustomer = useMutation({
    ...updateCustomerMutation,
    onSuccess: async (customer) => {
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      if (customer) queryClient.setQueryData(["customer", customer.id], customer);
    },
  });
  const deleteCustomer = useMutation({
    ...deleteCustomerMutation,
    onSuccess: async ({ id }) => {
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.removeQueries({ queryKey: ["customer", id] });
    },
  });
  const updateCustomerAddress = useMutation({
    ...updateCustomerAddressMutation,
    onSuccess: async (customer) => {
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      if (customer) queryClient.setQueryData(["customer", customer.id], customer);
    },
  });
  const createStreet = useMutation({ ...createStreetMutation, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customer-meta"] }) });
  const createGroup = useMutation({ ...createGroupMutation, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customer-meta"] }) });
  const createPersonality = useMutation({ ...createPersonalityMutation, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customer-meta"] }) });

  return {
    customers: customers.data ?? [],
    meta: meta.data,
    isLoading: customers.isPending || meta.isPending,
    error: customers.error ?? meta.error,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    updateCustomerAddress,
    createStreet,
    createGroup,
    createPersonality,
  };
};
