import { ArrowLeft, ArrowRight, Home } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Customer } from "@/lib/types";

const ROOF_ICON_CLASS: Record<string, string> = {
  Đỏ: "text-[#c0392b]",
  "Xanh dương": "text-[#2980b9]",
  Vàng: "text-[#e1a721]",
  Xám: "text-[#7f8c8d]",
};

const GATE_DOT_CLASS: Record<string, string> = {
  Đen: "bg-[#2c2c2a]",
  Nâu: "bg-[#8b5e34]",
  Trắng: "bg-[#d8d8d0]",
  "Xanh lá": "bg-[#3b6d11]",
};

type HouseMarkerProps = { customer: Customer; size?: "sm" | "md" };

export const HouseMarker = ({ customer, size = "sm" }: HouseMarkerProps) => {
  const iconSize = size === "md" ? "size-5" : "size-4";
  const wrapper = size === "md" ? "gap-2" : "gap-1.5";
  return (
    <span className={`inline-flex items-center ${wrapper}`} aria-label="Đặc điểm nhà">
      {customer.roofColor && <Home className={`${iconSize} ${ROOF_ICON_CLASS[customer.roofColor] ?? "text-muted-foreground"}`} fill="currentColor" />}
      {customer.gateColor && <span className={`size-3 rounded-sm border border-black/10 ${GATE_DOT_CLASS[customer.gateColor] ?? "bg-muted-foreground"}`} title={`Cổng ${customer.gateColor}`} />}
      {customer.houseSide === "left" && <ArrowLeft className={`${iconSize} text-muted-foreground`} />}
      {customer.houseSide === "right" && <ArrowRight className={`${iconSize} text-muted-foreground`} />}
    </span>
  );
};

type LocationBadgeProps = { label: string };
export const LocationBadge = ({ label }: LocationBadgeProps) => <Badge variant="secondary" className="rounded-full">{label}</Badge>;
