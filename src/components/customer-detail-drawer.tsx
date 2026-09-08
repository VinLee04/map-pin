// components/customer-detail-drawer.tsx

import type { PickedLocation } from "@/components/location-picker";
import { LocationPicker } from "@/components/location-picker";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { deleteCustomerMutation, updateCustomerAddressMutation } from "@/lib/customer.mutations";
import { customerQueryOptions } from "@/lib/customer.queries";
import { getDirectionsUrl, getGoogleMapsUrl } from "@/lib/maps";
import type { Customer } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, MapPin, Navigation, Pencil, Phone, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { HouseMarker, LocationBadge } from "./customer-visuals";

type CustomerDetailDrawerProps = {
  customerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (customer: Customer) => void;
};

export const CustomerDetailDrawer = ({ customerId, open, onOpenChange, onEdit }: CustomerDetailDrawerProps) => {
  const queryClient = useQueryClient();
  const customerQuery = useQuery({ ...customerQueryOptions(customerId ?? ""), enabled: open && Boolean(customerId) });
  const [editingLocation, setEditingLocation] = useState(false);

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
      toast.success("Đã cập nhật vị trí.");
      setEditingLocation(false);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Không thể cập nhật vị trí."),
  });

  // Đóng lại chế độ sửa vị trí mỗi khi đổi khách hàng hoặc đóng drawer,
  // tránh giữ trạng thái map-editing lởn vởn sang lần xem tiếp theo.
  useEffect(() => {
    if (!open) setEditingLocation(false);
  }, [open, customerId]);

  useEffect(() => {
    if (!open || !customerId) return;
    void queryClient.prefetchQuery(customerQueryOptions(customerId));
  }, [customerId, open, queryClient]);

  const customer = customerQuery.data;

  const handleLocationPicked = (location: PickedLocation) => {
    if (!customer) return;
    addressMutation.mutate({
      data: {
        id: customer.id,
        address: {
          latitude: location.latitude,
          longitude: location.longitude,
          formattedAddress: location.formattedAddress,
          placeId: location.placeId,
        },
      },
    });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-h-[92dvh] max-w-md">
        {customerQuery.isPending && <div className="p-6 text-sm text-muted-foreground">Đang tải thông tin…</div>}
        {customerQuery.isError && <div className="p-6 text-sm text-destructive">Không thể tải khách hàng.</div>}
        {customer && (
          <>
            <DrawerHeader className="border-b text-left">
              <DrawerTitle>{customer.name}</DrawerTitle>
              <DrawerDescription>
                {customer.street?.name ?? "Chưa chọn đường"}
                {customer.group ? ` · ${customer.group.name}` : ""}
              </DrawerDescription>
            </DrawerHeader>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-8">
              {/* Xem nhanh: Static Maps (ảnh tĩnh, nhẹ pin). Sửa vị trí: LocationPicker (Leaflet, tương tác). */}
              {editingLocation ? (
                <LocationPicker
                  value={customer.latitude != null && customer.longitude != null ? { latitude: customer.latitude, longitude: customer.longitude } : null}
                  onChange={handleLocationPicked}
                />
              ) : customer.latitude != null && customer.longitude != null ? (
                <div className="relative overflow-hidden rounded-xl border bg-muted">
                  <LocationPicker
                    value={{ latitude: customer.latitude, longitude: customer.longitude }}
                    onChange={() => { }}
                    readOnly
                    height={208}
                  />
                  <div className="pointer-events-none absolute bottom-3 left-3 z-1000 rounded-lg border bg-background/95 px-3 py-2 shadow-sm">
                    <HouseMarker customer={customer} size="md" />
                  </div>
                </div>
              ) : (
                <div className="grid h-52 place-items-center rounded-xl border bg-muted text-center text-sm text-muted-foreground">
                  <div>
                    <MapPin className="mx-auto mb-2 size-5" />
                    Chưa có vị trí Google Maps
                  </div>
                </div>
              )}

              <div className="mt-2 flex justify-end">
                <Button type="button" size="sm" variant="ghost" onClick={() => setEditingLocation((current) => !current)}>
                  {editingLocation ? "Xong" : customer.latitude != null ? "Sửa vị trí" : "Chọn vị trí"}
                </Button>
              </div>

              <div className="mt-2 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{customer.name}</p>
                  <p className="text-sm text-muted-foreground">{customer.phone}</p>
                </div>
                <a className={buttonVariants({ variant: "outline", size: "icon" })} href={`tel:${customer.phone}`} aria-label={`Gọi ${customer.name}`}>
                  <Phone />
                </a>
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
                  <div className="flex gap-2">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Địa chỉ Google Maps</p>
                      <p className="mt-1 text-sm text-muted-foreground">{customer.formattedAddress}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Cập nhật: {customer.addressUpdatedAt ? new Date(customer.addressUpdatedAt).toLocaleString("vi-VN") : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {customer.timeNote && (
                <div className="mt-4 rounded-xl border bg-muted/50 p-3 text-sm">
                  <span className="font-medium">Khung giờ:</span> {customer.timeNote}
                </div>
              )}
              {customer.description && (
                <div className="mt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ghi chú shipper</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{customer.description}</p>
                </div>
              )}

              <Separator className="my-5" />
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => onEdit(customer)}>
                  <Pencil /> Sửa
                </Button>
                <Button variant="destructive" onClick={() => deleteMutation.mutate({ data: { id: customer.id } })} disabled={deleteMutation.isPending}>
                  <Trash2 /> Xóa
                </Button>
              </div>

              {customer.latitude != null && customer.longitude != null && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <a
                    className={buttonVariants({ variant: "default" }) + " inline-flex w-full items-center justify-center gap-2"}
                    href={getDirectionsUrl(customer.latitude, customer.longitude)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Navigation /> Chỉ đường
                  </a>
                  <a
                    className={buttonVariants({ variant: "ghost" }) + " inline-flex w-full items-center justify-center gap-2"}
                    href={getGoogleMapsUrl(customer.latitude, customer.longitude)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink /> Mở Google Maps
                  </a>
                </div>
              )}
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
};