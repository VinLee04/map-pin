import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "@/lib/auth";

// export const ensureSession = createServerFn({ method: "GET" }).handler(async () => {
//   const headers = getRequestHeaders();
//   const session = await auth.api.getSession({ headers });

//   if (!session) {
//     throw new Error("UNAUTHORIZED");
//   }

//   return session;
// });


import { db } from "@/db";
import { user as userTable } from "@/db/schema"; // Thay đường dẫn schema bảng user của bạn cho đúng

export const ensureSession = createServerFn({ method: "GET" })
  .validator(() => ({})) // Nhớ thêm validator cho GET server function nhé
  .handler(async () => {
    const headers = getRequestHeaders();
    let session = await auth.api.getSession({ headers });

    // Nếu chưa có session (chưa đăng nhập), tự động tìm hoặc lấy user đầu tiên trong DB
    if (!session) {
      const [dbUser] = await db.select().from(userTable).limit(1);
      
      if (!dbUser) {
        throw new Error("SYSTEM_HAS_NO_USER: Vui lòng tạo ít nhất một tài khoản trong database trước.");
      }

      // Tạo giả lập session object dựa trên user đầu tiên tìm được
      session = {
        user: dbUser,
        session: {
          id: "auto-login-session",
          userId: dbUser.id,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          // Thêm các trường khác tùy theo Better-Auth hoặc cấu hình của bạn yêu cầu
        } as any,
      };
    }

    return session;
  });