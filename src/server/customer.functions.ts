import { createServerFn } from "@tanstack/react-start";
import { and, eq, ilike, or, asc, desc } from "drizzle-orm";
import { z } from "zod";
import { SYSTEM_PERSONALITIES } from "@/lib/data";
import { db } from "@/db";
import { customers, groups, personalityTags, streets } from "@/db/schema";
import { ensureSession } from "@/lib/auth.functions";

const nullableString = z.string().trim().max(1000).nullable().optional();
const locationTypeSchema = z.enum(["house", "boarding", "office"]);
const houseSideSchema = z.enum(["left", "right"]).nullable().optional();

export const customerInputSchema = z.object({
  name: z.string().trim().min(1).max(255),
  phone: z.string().trim().min(1).max(20),
  streetId: z.string().uuid().nullable().optional(),
  groupId: z.string().uuid().nullable().optional(),
  locationType: locationTypeSchema,
  boardingName: z.string().trim().max(255).nullable().optional(),
  roomNumber: z.string().trim().max(50).nullable().optional(),
  officeName: z.string().trim().max(255).nullable().optional(),
  floor: z.string().trim().max(20).nullable().optional(),
  roofColor: z.string().trim().max(30).nullable().optional(),
  gateColor: z.string().trim().max(30).nullable().optional(),
  houseSide: houseSideSchema,
  personalityId: z.string().uuid().nullable().optional(),
  description: nullableString,
  preferredTimeStart: z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
  preferredTimeEnd: z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
  timeNote: z.string().trim().max(255).nullable().optional(),
});

export type CustomerInput = z.infer<typeof customerInputSchema>;

const addressInputSchema = z.object({
  latitude: z.number().finite().gte(-90).lte(90),
  longitude: z.number().finite().gte(-180).lte(180),
  formattedAddress: z.string().trim().max(1000).nullable().optional(),
  placeId: z.string().trim().max(255).nullable().optional(),
});

export type AddressInput = z.infer<typeof addressInputSchema>;

const assertRelationsBelongToUser = async ({
  userId,
  streetId,
  groupId,
  personalityId,
}: Pick<CustomerInput, "streetId" | "groupId" | "personalityId"> & { userId: string }) => {
  if (streetId) {
    const [street] = await db.select({ id: streets.id }).from(streets).where(and(eq(streets.id, streetId), eq(streets.userId, userId))).limit(1);
    if (!street) throw new Error("INVALID_STREET");
  }

  if (groupId) {
    const [group] = await db.select({ id: groups.id, streetId: groups.streetId }).from(groups).where(and(eq(groups.id, groupId), eq(groups.userId, userId))).limit(1);
    if (!group) throw new Error("INVALID_GROUP");
    if (streetId && group.streetId !== streetId) throw new Error("GROUP_NOT_IN_STREET");
  }

  if (personalityId) {
    const [personality] = await db.select({ id: personalityTags.id }).from(personalityTags).where(and(eq(personalityTags.id, personalityId), eq(personalityTags.userId, userId))).limit(1);
    if (!personality) throw new Error("INVALID_PERSONALITY");
  }
};

const getCustomer = async (userId: string, id: string) => {
  const [customer] = await db
    .select({
      customer: customers,
      street: streets,
      group: groups,
      personality: personalityTags,
    })
    .from(customers)
    .leftJoin(streets, eq(customers.streetId, streets.id))
    .leftJoin(groups, eq(customers.groupId, groups.id))
    .leftJoin(personalityTags, eq(customers.personalityId, personalityTags.id))
    .where(and(eq(customers.id, id), eq(customers.userId, userId)))
    .limit(1);

  if (!customer) return null;

  return {
    ...customer.customer,
    address:
      customer.customer.latitude != null && customer.customer.longitude != null
        ? {
          lat: customer.customer.latitude,
          lng: customer.customer.longitude,
          formattedAddress: customer.customer.formattedAddress,
          placeId: customer.customer.placeId,
          updatedAt: customer.customer.addressUpdatedAt?.toISOString() ?? null,
        }
        : null,
    street: customer.street,
    group: customer.group,
    personality: customer.personality,
  };
};

export const listCustomers = createServerFn({ method: "GET" })
  .validator((data: CustomerFiltersInput) => data)
  .handler(async ({ data }) => {
    const session = await ensureSession();
    const filters = data;
    const conditions = [eq(customers.userId, session.user.id)];

    if (filters.search?.trim()) {
      const q = `%${filters.search.trim()}%`;
      conditions.push(or(ilike(customers.name, q), ilike(customers.phone, q), ilike(streets.name, q), ilike(groups.name, q))!);
    }
    if (filters.streetId) conditions.push(eq(customers.streetId, filters.streetId));
    if (filters.groupId) conditions.push(eq(customers.groupId, filters.groupId));
    if (filters.personalityId) conditions.push(eq(customers.personalityId, filters.personalityId));
    if (filters.locationType) conditions.push(eq(customers.locationType, filters.locationType));

    const rows = await db
      .select({ customer: customers, street: streets, group: groups, personality: personalityTags })
      .from(customers)
      .leftJoin(streets, eq(customers.streetId, streets.id))
      .leftJoin(groups, eq(customers.groupId, groups.id))
      .leftJoin(personalityTags, eq(customers.personalityId, personalityTags.id))
      .where(and(...conditions))
      .orderBy(desc(customers.updatedAt), asc(customers.name));

    return rows.map(({ customer, street, group, personality }) => ({
      ...customer,
      address: customer.latitude != null && customer.longitude != null
        ? {
          lat: customer.latitude,
          lng: customer.longitude,
          formattedAddress: customer.formattedAddress,
          placeId: customer.placeId,
          updatedAt: customer.addressUpdatedAt?.toISOString() ?? null,
        }
        : null,
      street,
      group,
      personality,
    }));
  });

export type CustomerFiltersInput = {
  search?: string;
  streetId?: string;
  groupId?: string;
  personalityId?: string;
  locationType?: "house" | "boarding" | "office";
};

export const getCustomerById = createServerFn({ method: "GET" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const session = await ensureSession();
    return getCustomer(session.user.id, data.id);
  });

export const createCustomer = createServerFn({ method: "POST" })
  .validator(customerInputSchema)
  .handler(async ({ data }) => {
    console.log('server data', data)
    const session = await ensureSession();
    await assertRelationsBelongToUser({ ...data, userId: session.user.id });

    const [created] = await db.insert(customers).values({
      ...data,
      userId: session.user.id,
      streetId: data.streetId ?? null,
      groupId: data.groupId ?? null,
      personalityId: data.personalityId ?? null,
      boardingName: data.boardingName ?? null,
      roomNumber: data.roomNumber ?? null,
      officeName: data.officeName ?? null,
      floor: data.floor ?? null,
      roofColor: data.roofColor ?? null,
      gateColor: data.gateColor ?? null,
      houseSide: data.houseSide ?? null,
      description: data.description ?? null,
      preferredTimeStart: data.preferredTimeStart ?? null,
      preferredTimeEnd: data.preferredTimeEnd ?? null,
      timeNote: data.timeNote ?? null,
    }).returning({ id: customers.id });

    return getCustomer(session.user.id, created.id);
  });

export const updateCustomer = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid(), data: customerInputSchema }))
  .handler(async ({ data }) => {
    const session = await ensureSession();
    await assertRelationsBelongToUser({ ...data.data, userId: session.user.id });

    const [updated] = await db.update(customers)
      .set({ ...data.data, updatedAt: new Date() })
      .where(and(eq(customers.id, data.id), eq(customers.userId, session.user.id)))
      .returning({ id: customers.id });

    if (!updated) throw new Error("CUSTOMER_NOT_FOUND");
    return getCustomer(session.user.id, updated.id);
  });

export const deleteCustomer = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const session = await ensureSession();
    const [deleted] = await db.delete(customers)
      .where(and(eq(customers.id, data.id), eq(customers.userId, session.user.id)))
      .returning({ id: customers.id });

    if (!deleted) throw new Error("CUSTOMER_NOT_FOUND");
    return { id: deleted.id };
  });

export const updateCustomerAddress = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid(), address: addressInputSchema }))
  .handler(async ({ data }) => {
    const session = await ensureSession();
    const [updated] = await db.update(customers)
      .set({
        latitude: data.address.latitude,
        longitude: data.address.longitude,
        formattedAddress: data.address.formattedAddress ?? null,
        placeId: data.address.placeId ?? null,
        addressUpdatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(customers.id, data.id), eq(customers.userId, session.user.id)))
      .returning({ id: customers.id });

    if (!updated) throw new Error("CUSTOMER_NOT_FOUND");
    return getCustomer(session.user.id, updated.id);
  });

const namedEntitySchema = z.object({ name: z.string().trim().min(1).max(255) });

export const createStreet = createServerFn({ method: "POST" })
  .validator(namedEntitySchema.extend({ areaName: z.string().trim().max(255).nullable().optional() }))
  .handler(async ({ data }) => {
    const session = await ensureSession();
    const [street] = await db.insert(streets).values({ userId: session.user.id, name: data.name, areaName: data.areaName ?? null }).returning();
    return street;
  });

export const createGroup = createServerFn({ method: "POST" })
  .validator(namedEntitySchema.extend({ streetId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const session = await ensureSession();
    const [street] = await db.select({ id: streets.id }).from(streets).where(and(eq(streets.id, data.streetId), eq(streets.userId, session.user.id))).limit(1);
    if (!street) throw new Error("INVALID_STREET");
    const [group] = await db.insert(groups).values({ userId: session.user.id, streetId: data.streetId, name: data.name }).returning();
    return group;
  });

export const createPersonality = createServerFn({ method: "POST" })
  .validator(z.object({ label: z.string().trim().min(1).max(100) }))
  .handler(async ({ data }) => {
    const session = await ensureSession();
    const [personality] = await db.insert(personalityTags).values({ userId: session.user.id, label: data.label, isSystem: false }).returning();
    return personality;
  });

export const listCustomerMeta = createServerFn({ method: "GET" }).validator(() => ({})).handler(async () => {
  const session = await ensureSession();

  await Promise.all(SYSTEM_PERSONALITIES.map(async (label) => {
    await db.insert(personalityTags)
      .values({ userId: session.user.id, label, isSystem: true })
      .onConflictDoNothing();
  }));

  const [streetRows, groupRows, personalityRows] = await Promise.all([
    db.select().from(streets).where(eq(streets.userId, session.user.id)).orderBy(asc(streets.name)),
    db.select().from(groups).where(eq(groups.userId, session.user.id)).orderBy(asc(groups.name)),
    db.select().from(personalityTags).where(eq(personalityTags.userId, session.user.id)).orderBy(asc(personalityTags.isSystem), asc(personalityTags.label)),
  ]);

  return { streets: streetRows, groups: groupRows, personalities: personalityRows };
});
