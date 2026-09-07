
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Customer } from "@/lib/types";
import { HouseMarker } from "./customer-visuals";

export function CustomerCard({ customer, streetName, groupName, personalityName, onOpen }: { customer: Customer; streetName: string; groupName?: string; personalityName?: string; onOpen: () => void }) {
  return (
    <Card className="overflow-hidden transition active:scale-[0.99] py-1">
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <button onClick={onOpen}
            className="min-w-0 flex-1 text-left"
            aria-label={`Xem chi tiết ${customer.name}`}
          >
            <div className="flex items-center gap-2 justify-between">
              <p className="truncate font-semibold">{customer.name}</p>
              <a onClick={(e) => e.preventDefault()} href={`tel:${customer.phone}`}
                aria-label={`Gọi ${customer.name}`}>
                {customer.phone.slice(-4)}
              </a>
            </div>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{streetName}{groupName ? ` · ${groupName}` : ""}</p>
            <div className="mt-2 flex items-center gap-1.5">
              {personalityName && <Badge variant="secondary" className="rounded-full text-xs">{personalityName}</Badge>}
              {customer.timeNote && <Badge variant="outline" className="rounded-full text-xs">Có lưu giờ giao</Badge>}
            </div>
            <HouseMarker customer={customer} />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
