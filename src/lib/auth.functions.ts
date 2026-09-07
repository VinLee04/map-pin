import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user as userTable } from "@/db/schema";
import { createServerFn } from "@tanstack/react-start";

export const ensureSession = createServerFn({ method: "GET" }).handler(async () => {
  const headers = getRequestHeaders();
  const session = await auth.api.getSession({ headers });

  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  return session;
});

// Hàm thường — gọi trực tiếp trong các server function khác, KHÔNG qua network
export async function getSessionOrFallback() {
  const headers = getRequestHeaders();
  let session = await auth.api.getSession({ headers });

  if (!session) {
    const [dbUser] = await db.select().from(userTable).limit(1);
    if (!dbUser) {
      throw new Error("SYSTEM_HAS_NO_USER: Vui lòng tạo ít nhất một tài khoản trong database trước.");
    }
    session = {
      user: dbUser,
      session: {
        id: "auto-login-session",
        userId: dbUser.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      } as any,
    };
  }
  return session;
}