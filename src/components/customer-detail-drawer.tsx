"use client";

import { useEffect } from "react";
import { ExternalLink, MapPin, Navigation, Phone, RefreshCw, Pencil, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { customerQueryOptions } from "@/lib/customer.queries";
import { deleteCustomerMutation, updateCustomerAddressMutation } from "@/lib/customer.mutations";
import { getDirectionsUrl, getGoogleMapsEmbedUrl, getGoogleMapsUrl } from "@/lib/maps";
import { reverseGeocode } from "@/server/maps.functions";
import { HouseMarker, LocationBadge } from "./customer-visuals";
import type { Customer } from "@/lib/types";

type CustomerDetailDrawerProps = {
  customerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (customer: Customer) => void;
};

export const CustomerDetailDrawer = ({ customerId, open, onOpenChange, onEdit }: CustomerDetailDrawerProps) => {
  const queryClient = useQueryClient();
  const customerQuery = useQuery({ ...customerQueryOptions(customerId ?? ""), enabled: open && Boolean(customerId) });
  const deleteMutation = useMutation({
    ...deleteCustomerMutation,
    onSuccess: async ({ id }) => {
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.removeQueries({ queryKey: ["customer", id] });
      toast.success("Đã xóa khách hàng.");
      onOpenChange(false);
    },
    onError: () => toast.error("Không thể xóa khách hàng."),
  });
  const addressMutation = useMutation({
    ...updateCustomerAddressMutation,
    onSuccess: async (customer) => {
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      if (customer) queryClient.setQueryData(["customer", customer.id], customer);
      toast.success("Đã cập nhật vị trí hiện tại.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Không thể cập nhật vị trí."),
  });

  useEffect(() => {
    if (!open || !customerId) return;
    void queryClient.prefetchQuery(customerQueryOptions(customerId));
  }, [customerId, open, queryClient]);

  const customer = customerQuery.data;

  const updateCurrentLocation = () => {
    if (!customer) return;
    if (!navigator.geolocation) {
      toast.error("Thiết bị không hỗ trợ định vị.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const address = await reverseGeocode({ data: { latitude: coords.latitude, longitude: coords.longitude } });
          await addressMutation.mutateAsync({
            data: {
              id: customer.id,
              address: {
                latitude: coords.latitude,
                longitude: coords.longitude,
                formattedAddress: address.formattedAddress,
                placeId: address.placeId,
              },
            },
          });
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Không thể lấy địa chỉ hiện tại.");
        }
      },
      () => toast.error("Không lấy được vị trí. Hãy cho phép trình duyệt dùng vị trí của bạn."),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
    );
  };

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange} >
        <DrawerContent className="mx-auto max-h-[92dvh] max-w-md">
          {customerQuery.isPending && <div className="p-6 text-sm text-muted-foreground">Đang tải thông tin…</div>}
          {customerQuery.isError && <div className="p-6 text-sm text-destructive">Không thể tải khách hàng.</div>}
          {customer && (
            <>
              <DrawerHeader className="border-b text-left">
                <DrawerTitle>{customer.name}</DrawerTitle>
                <DrawerDescription>{customer.street?.name ?? "Chưa chọn đường"}{customer.group ? ` · ${customer.group.name}` : ""}</DrawerDescription>
              </DrawerHeader>

              <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-8">
                {customer.latitude != null && customer.longitude != null ? (
                  <div className="relative overflow-hidden rounded-xl border bg-muted">
                    {getGoogleMapsEmbedUrl(customer.latitude, customer.longitude) ? (
                      <iframe
                        title={`Bản đồ ${customer.name}`}
                        src={getGoogleMapsEmbedUrl(customer.latitude, customer.longitude) ?? undefined}
                        className="h-52 w-full border-0"
                        loading="lazy"
                        allowFullScreen
                      />
                    ) : (
                      <div className="grid h-52 place-items-center text-center text-sm text-muted-foreground">
                        <div><MapPin className="mx-auto mb-2 size-5" />Chưa cấu hình VITE_GOOGLE_MAPS_API_KEY</div>
                      </div>
                    )}
                    <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg border bg-background/95 px-3 py-2 shadow-sm">
                      <HouseMarker customer={customer} size="md" />
                    </div>
                  </div>
                ) : (
                  <div className="grid h-52 place-items-center rounded-xl border bg-muted text-center text-sm text-muted-foreground">
                    <div><MapPin className="mx-auto mb-2 size-5" />Chưa có vị trí Google Maps</div>
                  </div>
                )}

                <div className="mt-4 flex items-center gap-3">
                  <div className="grid size-12 shrink-0 place-items-center rounded-full bg-muted font-semibold text-muted-foreground">{customer.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</div>
                  <div className="min-w-0 flex-1"><p className="font-semibold">{customer.name}</p><p className="text-sm text-muted-foreground">{customer.phone}</p></div>
                  <a className={buttonVariants({ variant: "outline", size: "icon" })} href={`tel:${customer.phone}`} aria-label={`Gọi ${customer.name}`}><Phone /></a>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <LocationBadge label={customer.locationType === "house" ? "Nhà riêng" : customer.locationType === "boarding" ? "Nhà trọ" : "Văn phòng"} />
                  {customer.boardingName && <LocationBadge label={customer.boardingName} />}
                  {customer.roomNumber && <LocationBadge label={`Phòng ${customer.roomNumber}`} />}
                  {customer.officeName && <LocationBadge label={customer.officeName} />}
                  {customer.floor && <LocationBadge label={`Tầng ${customer.floor}`} />}
                  {customer.personality && <Badge className="rounded-full">{customer.personality.label}</Badge>}
                  {customer.houseSide && <LocationBadge label={customer.houseSide === "left" ? "Nhà bên trái" : "Nhà bên phải"} />}
                </div>

                {customer.formattedAddress && (
                  <div className="mt-4 rounded-xl border p-3">
                    <div className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><div><p className="text-sm font-medium">Địa chỉ Google Maps</p><p className="mt-1 text-sm text-muted-foreground">{customer.formattedAddress}</p><p className="mt-1 text-xs text-muted-foreground">Cập nhật: {customer.addressUpdatedAt?.toLocaleString("vi-VN") ?? "—"}</p></div></div>
                  </div>
                )}

                {customer.timeNote && <div className="mt-4 rounded-xl border bg-muted/50 p-3 text-sm"><span className="font-medium">Khung giờ:</span> {customer.timeNote}</div>}
                {customer.description && <div className="mt-4"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ghi chú shipper</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6">{customer.description}</p></div>}

                <Separator className="my-5" />
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => onEdit(customer)}><Pencil /> Sửa</Button>
                  <Button variant="destructive" onClick={() => deleteMutation.mutate({ data: { id: customer.id } })} disabled={deleteMutation.isPending}><Trash2 /> Xóa</Button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <a className={buttonVariants({ variant: "default" }) + " inline-flex w-full items-center justify-center gap-2"} href={customer.latitude != null && customer.longitude != null ? getDirectionsUrl(customer.latitude, customer.longitude) : undefined} target="_blank" rel="noreferrer" onClick={(event) => { if (customer.latitude == null || customer.longitude == null) event.preventDefault(); }}><Navigation /> Chỉ đường</a>
                  <Button variant="outline" onClick={updateCurrentLocation} disabled={addressMutation.isPending}><RefreshCw className={addressMutation.isPending ? "animate-spin" : ""} />{addressMutation.isPending ? "Đang cập nhật…" : "Cập nhật vị trí"}</Button>
                </div>
                {customer.latitude != null && customer.longitude != null && <a className={buttonVariants({ variant: "ghost" }) + " mt-2 inline-flex w-full items-center justify-center gap-2"} href={getGoogleMapsUrl(customer.latitude, customer.longitude)} target="_blank" rel="noreferrer"><ExternalLink /> Mở Google Maps</a>}
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
};
