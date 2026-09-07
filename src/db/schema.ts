import { relations } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// Better Auth tables should remain in the same schema/module in your project.
// Keep your existing Better Auth definitions if these already exist elsewhere.
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const houseSideEnum = pgEnum("house_side", ["left", "right"]);
export const locationTypeEnum = pgEnum("location_type", ["house", "boarding", "office"]);

export const streets = pgTable(
  "streets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    areaName: varchar("area_name", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("streets_user_idx").on(table.userId),
    unique("streets_user_name_unique").on(table.userId, table.name),
  ],
);

export const groups = pgTable(
  "groups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    streetId: uuid("street_id").references(() => streets.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("groups_user_idx").on(table.userId),
    index("groups_street_idx").on(table.streetId),
    unique("groups_user_street_name_unique").on(table.userId, table.streetId, table.name),
  ],
);

export const personalityTags = pgTable(
  "personality_tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 100 }).notNull(),
    isSystem: boolean("is_system").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("personality_tags_user_idx").on(table.userId),
    unique("personality_tags_user_label_unique").on(table.userId, table.label),
  ],
);

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    streetId: uuid("street_id").references(() => streets.id, { onDelete: "set null" }),
    groupId: uuid("group_id").references(() => groups.id, { onDelete: "set null" }),
    locationType: locationTypeEnum("location_type").notNull().default("house"),
    boardingName: varchar("boarding_name", { length: 255 }),
    roomNumber: varchar("room_number", { length: 50 }),
    officeName: varchar("office_name", { length: 255 }),
    floor: varchar("floor", { length: 20 }),
    roofColor: varchar("roof_color", { length: 30 }),
    gateColor: varchar("gate_color", { length: 30 }),
    houseSide: houseSideEnum("house_side"),
    personalityId: uuid("personality_id").references(() => personalityTags.id, { onDelete: "set null" }),
    description: text("description"),
    preferredTimeStart: varchar("preferred_time_start", { length: 5 }),
    preferredTimeEnd: varchar("preferred_time_end", { length: 5 }),
    timeNote: varchar("time_note", { length: 255 }),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    formattedAddress: text("formatted_address"),
    placeId: varchar("place_id", { length: 255 }),
    addressUpdatedAt: timestamp("address_updated_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("customers_user_idx").on(table.userId),
    index("customers_name_idx").on(table.name),
    index("customers_phone_idx").on(table.phone),
    index("customers_street_idx").on(table.streetId),
    index("customers_group_idx").on(table.groupId),
    index("customers_personality_idx").on(table.personalityId),
  ],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  streets: many(streets),
  groups: many(groups),
  personalityTags: many(personalityTags),
  customers: many(customers),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const streetsRelations = relations(streets, ({ one, many }) => ({
  user: one(user, { fields: [streets.userId], references: [user.id] }),
  groups: many(groups),
  customers: many(customers),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  user: one(user, { fields: [groups.userId], references: [user.id] }),
  street: one(streets, { fields: [groups.streetId], references: [streets.id] }),
  customers: many(customers),
}));

export const personalityTagsRelations = relations(personalityTags, ({ one, many }) => ({
  user: one(user, { fields: [personalityTags.userId], references: [user.id] }),
  customers: many(customers),
}));

export const customersRelations = relations(customers, ({ one }) => ({
  user: one(user, { fields: [customers.userId], references: [user.id] }),
  street: one(streets, { fields: [customers.streetId], references: [streets.id] }),
  group: one(groups, { fields: [customers.groupId], references: [groups.id] }),
  personality: one(personalityTags, { fields: [customers.personalityId], references: [personalityTags.id] }),
}));

export const schema = {
  user,
  session,
  account,
  verification,
  streets,
  groups,
  personalityTags,
  customers,
};
