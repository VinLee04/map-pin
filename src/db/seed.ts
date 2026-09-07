import "dotenv/config";
import { db } from "@/db";
import { personalityTags } from "@/db/schema";
import { SYSTEM_PERSONALITIES } from "@/lib/data";

// Run this only after creating a real Better Auth user. Replace the ID below.
const userId = process.env.SEED_USER_ID;

if (!userId) throw new Error("SEED_USER_ID is required");

await db.insert(personalityTags).values(
  SYSTEM_PERSONALITIES.map((label) => ({ userId, label, isSystem: true })),
).onConflictDoNothing();

console.log("Seeded system personality tags.");
process.exit(0);
