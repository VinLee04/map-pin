// routes/customers.$customerId.tsx

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { CustomerForm } from "@/components/customer-form";
import type { PickedLocation } from "@/components/location-picker";
import { customerMetaQueryOptions, customerQueryOptions } from "@/lib/customer.queries";
import { createGroupMutation, createPersonalityMutation, updateCustomerMutation } from "@/lib/customer.mutations";
import type { CustomerInput } from "#/server/customer.functions.ts";

export const Route = createFileRoute("/customers/$customerId")({ component: EditCustomerPage });

function EditCustomerPage() {
  const { customerId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const customerQuery = useQuery(customerQueryOptions(customerId));
  const meta = useQuery(customerMetaQueryOptions);

  const updateCustomer = useMutation({
    ...updateCustomerMutation,
    onSuccess: async (customer) => {
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      if (customer) queryClient.setQueryData(["customer", customer.id], customer);
      toast.success("Đã cập nhật khách hàng.");
      await navigate({ to: "/" });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật khách hàng.");
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

  if (customerQuery.isPending || meta.isPending) {
    return <div className="grid min-h-dvh place-items-center text-sm text-muted-foreground">Đang tải…</div>;
  }

  if (customerQuery.isError || !customerQuery.data) {
    return (
      <div className="grid min-h-dvh place-items-center p-4">
        <div className="text-center">
          <p className="font-semibold">Không tìm thấy khách hàng</p>
          <Button className="mt-3" onClick={() => navigate({ to: "/" })}>
            Về danh sách
          </Button>
        </div>
      </div>
    );
  }

  // Gộp tọa độ (nếu shipper có sửa lại vị trí trong form) vào payload trước
  // khi gửi server function. Nếu location là null (không đụng tới map), giữ
  // nguyên — server function sẽ không ghi đè vị trí cũ (xem updateCustomer).
  const handleSubmit = async (data: CustomerInput, location: PickedLocation | null) => {
    await updateCustomer.mutateAsync({
      data: {
        id: customerId,
        data: {
          ...data,
          ...(location
            ? {
                latitude: location.latitude,
                longitude: location.longitude,
                formattedAddress: location.formattedAddress,
                placeId: location.placeId,
              }
            : {}),
        },
      },
    });
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/95 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-2">
          <Link className={buttonVariants({ variant: "ghost", size: "icon" })} to="/" aria-label="Quay lại">
            <ArrowLeft />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate font-semibold">Chỉnh sửa {customerQuery.data.name}</h1>
            <p className="text-xs text-muted-foreground">Cập nhật thông tin ghi nhớ</p>
          </div>
        </div>
      </header>

      <CustomerForm
        initial={customerQuery.data}
        streets={meta.data?.streets}
        groups={meta.data?.groups}
        personalities={meta.data?.personalities}
        onCreateGroup={(streetId, name) => createGroup.mutateAsync({ data: { streetId, name } })}
        onCreatePersonality={(label) => createPersonality.mutateAsync({ data: { label } })}
        onSubmit={handleSubmit}
        onCancel={() => navigate({ to: "/" })}
        submitting={updateCustomer.isPending}
      />
    </div>
  );
}