import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { customers, groups, personalityTags, streets } from "@/db/schema";

export type LocationType = "house" | "boarding" | "office";
export type HouseSide = "left" | "right";
export type ColorOption = { name: string; hex: string };

export type Street = InferSelectModel<typeof streets>;
export type CustomerGroup = InferSelectModel<typeof groups>;
export type Personality = InferSelectModel<typeof personalityTags>;
export type CustomerRow = InferSelectModel<typeof customers>;
export type CustomerInsert = InferInsertModel<typeof customers>;

export type CustomerAddress = {
  lat: number;
  lng: number;
  formattedAddress: string | null;
  placeId: string | null;
  updatedAt: string | null;
};

export type Customer = CustomerRow & {
  address: CustomerAddress | null;
  street: Street | null;
  group: CustomerGroup | null;
  personality: Personality | null;
};

export type CustomerFilters = {
  search?: string;
  streetId?: string;
  groupId?: string;
  personalityId?: string;
  locationType?: LocationType;
};
