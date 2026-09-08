// routes/customers.new.tsx

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { CustomerForm } from "@/components/customer-form";
import type { PickedLocation } from "@/components/location-picker";
import { customerMetaQueryOptions } from "@/lib/customer.queries";
import { createCustomerMutation, createGroupMutation, createPersonalityMutation } from "@/lib/customer.mutations";
import type { CustomerInput } from "#/server/customer.functions.ts";

export const Route = createFileRoute("/customers/new")({ component: NewCustomerPage });

function NewCustomerPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const meta = useQuery(customerMetaQueryOptions);

  const createCustomer = useMutation({
    ...createCustomerMutation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Đã thêm khách hàng.");
      await navigate({ to: "/" });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Không thể thêm khách hàng.");
    },
  });

  const createGroup = useMutation({
    ...createGroupMutation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["customer-meta"] });
    },
  });

  const createPersonality = useMutation({
    ...createPersonalityMutation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["customer-meta"] });
    },
  });

  // Gộp toạ độ đã chọn (nếu có) vào payload trước khi gửi server function tạo khách hàng.
  // Vị trí là optional nên location có thể null — khi đó chỉ gửi các field còn lại.
  const handleSubmit = async (data: CustomerInput, location: PickedLocation | null) => {
    await createCustomer.mutateAsync({
      ...data,
      ...(location
        ? {
            latitude: location.latitude,
            longitude: location.longitude,
            formattedAddress: location.formattedAddress,
            placeId: location.placeId,
          }
        : {}),
    });
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/95 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-2">
          <Link className={buttonVariants({ variant: "ghost", size: "icon" })} to="/" aria-label="Quay lại">
            <ArrowLeft />
          </Link>
          <div>
            <h1 className="font-semibold">Thêm khách hàng</h1>
            <p className="text-xs text-muted-foreground">Lưu để giao lần sau nhanh hơn</p>
          </div>
        </div>
      </header>

      <CustomerForm
        streets={meta.data?.streets}
        groups={meta.data?.groups}
        personalities={meta.data?.personalities}
        onCreateGroup={(streetId, name) => createGroup.mutateAsync({ data: { streetId, name } })}
        onCreatePersonality={(label) => createPersonality.mutateAsync({ data: { label } })}
        onSubmit={handleSubmit}
        onCancel={() => navigate({ to: "/" })}
        submitting={createCustomer.isPending}
      />
    </div>
  );
}