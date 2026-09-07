import { mutationOptions } from "@tanstack/react-query";
import type { CustomerInput } from "#/server/customer.functions.ts";
import { createCustomer, createGroup, createPersonality, createStreet, deleteCustomer, updateCustomer, updateCustomerAddress } from "#/server/customer.functions.ts";

export const createCustomerMutation = mutationOptions({
  mutationKey: ["customers", "create"],
  mutationFn: (newCustomer: CustomerInput) => createCustomer({ data: newCustomer }),
});

export const updateCustomerMutation = mutationOptions({
  mutationKey: ["customers", "update"],
  mutationFn: updateCustomer,
});

export const deleteCustomerMutation = mutationOptions({
  mutationKey: ["customers", "delete"],
  mutationFn: deleteCustomer,
});

export const updateCustomerAddressMutation = mutationOptions({
  mutationKey: ["customers", "address"],
  mutationFn: updateCustomerAddress,
});

export const createStreetMutation = mutationOptions({
  mutationKey: ["streets", "create"],
  mutationFn: createStreet,
});

export const createGroupMutation = mutationOptions({
  mutationKey: ["groups", "create"],
  mutationFn: createGroup,
});

export const createPersonalityMutation = mutationOptions({
  mutationKey: ["personalities", "create"],
  mutationFn: createPersonality,
});
