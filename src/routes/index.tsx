// routes/index.tsx

import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Filter, Plus, Search, Users, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CustomerCard } from "@/components/customer-card";
import { CustomerDetailDrawer } from "@/components/customer-detail-drawer";
import { FilterDrawer } from "@/components/filter-drawer";
import { customerListQueryOptions, customerMetaQueryOptions } from "@/lib/customer.queries";
import type { CustomerFiltersInput } from "#/server/customer.functions.ts";

const EmptyState = () => (
  <div className="grid min-h-[50dvh] place-items-center text-center">
    <div>
      <Users className="mx-auto size-10 text-muted-foreground/50" />
      <p className="mt-3 font-medium">Không tìm thấy khách hàng</p>
      <p className="mt-1 text-sm text-muted-foreground">Thử đổi từ khóa hoặc xóa bộ lọc.</p>
    </div>
  </div>
);

export const Route = createFileRoute("/")({ component: CustomerListPage });

function CustomerListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<CustomerFiltersInput>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const customersQuery = useQuery(customerListQueryOptions({ ...filters, search }));
  const metaQuery = useQuery(customerMetaQueryOptions);

  const customers = customersQuery.data ?? [];
  const meta = metaQuery.data;
  const activeFilters = Object.values(filters).filter(Boolean).length;

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b bg-background/95 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Khách hàng</h1>
            <p className="text-sm text-muted-foreground">{customers.length} khách đã lưu</p>
          </div>
          <Link className={buttonVariants({ size: "icon" })} to="/customers/new" aria-label="Thêm khách hàng">
            <Plus />
          </Link>
        </div>
        <div className="mx-auto mt-3 flex max-w-md gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên hoặc SĐT…"
              className="pl-9 pr-9"
            />
            {search && (
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-1 top-1/2 size-8 -translate-y-1/2"
                onClick={() => setSearch("")}
                aria-label="Xóa tìm kiếm"
              >
                <X />
              </Button>
            )}
          </div>
          <Button
            size="icon"
            variant={activeFilters ? "default" : "outline"}
            onClick={() => setFilterOpen(true)}
            className="relative"
            aria-label="Bộ lọc"
          >
            <Filter />
            {activeFilters > 0 && (
              <Badge className="absolute -right-1 -top-1 size-5 justify-center rounded-full p-0 text-[10px]">
                {activeFilters}
              </Badge>
            )}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4">
        {customersQuery.isPending ? (
          <div className="grid min-h-[50dvh] place-items-center text-sm text-muted-foreground">Đang tải…</div>
        ) : customers.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2.5">
            {customers.map((customer) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                streetName={customer.street?.name ?? ""}
                groupName={customer.group?.name}
                personalityName={customer.personality?.label}
                onOpen={() => setSelectedId(customer.id)}
              />
            ))}
          </div>
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 px-4 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-2 gap-2">
          <Link className={buttonVariants({ variant: "ghost" })} to="/">
            Khách hàng
          </Link>
          <Link className={buttonVariants({ variant: "ghost" })} to="/settings">
            Cài đặt dữ liệu
          </Link>
        </div>
      </nav>

      <FilterDrawer
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={filters}
        onChange={setFilters}
        streets={meta?.streets}
        groups={meta?.groups}
        personalities={meta?.personalities}
      />

      <CustomerDetailDrawer
        customerId={selectedId}
        open={!!selectedId}
        onOpenChange={(open) => !open && setSelectedId(null)}
        onEdit={(customer) => {
          setSelectedId(null);
          navigate({ to: "/customers/$customerId", params: { customerId: customer.id } });
        }}
      />
    </div>
  );
}