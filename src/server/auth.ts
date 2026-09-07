import { queryOptions } from "@tanstack/react-query";
import { ensureSession } from "@/lib/auth.functions";

export const sessionQueryOptions = () =>
  queryOptions({
    queryKey: ["session"],
    queryFn: () => ensureSession(),
    staleTime: 1000 * 60 * 5, // Cache trong vòng 5 phút không gọi lại server
    gcTime: 1000 * 60 * 30,  // Giữ trong cache 30 phút trước khi dọn dẹp
 });