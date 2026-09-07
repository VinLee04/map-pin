"use client";

import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Filter, Plus, Search, Users, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CustomerCard } from "@/components/customer-card";
import { CustomerDetailDrawer } from "@/components/customer-detail-drawer";
import { FilterDrawer } from "@/components/filter-drawer";
import type { CustomerFilters } from "@/lib/types";
import { useCustomerStore } from "@/lib/customer-store";

export const Route = createFileRoute("/")({ component: CustomerListPage });

function CustomerListPage() {
  const store = useCustomerStore();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<CustomerFilters>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const filtered = useMemo(() => store.customers.filter((customer) => {
    const q = search.trim().toLowerCase();
    const street = store.meta?.streets.find((item) => item.id === customer.streetId)?.name.toLowerCase() ?? "";
    const group = store.meta?.groups.find((item) => item.id === customer.groupId)?.name.toLowerCase() ?? "";
    const personality = store.meta?.personalities.find((item) => item.id === customer.personalityId)?.label.toLowerCase() ?? "";
    return (!q || customer.name.toLowerCase().includes(q) || customer.phone.includes(q) || street.includes(q) || group.includes(q))
      && (!filters.streetId || customer.streetId === filters.streetId)
      && (!filters.locationType || customer.locationType === filters.locationType)
      && (!filters.personalityId || customer.personalityId === filters.personalityId);
  }), [store.customers, store.meta?.streets, store.meta?.groups, store.meta?.personalities, search, filters]);

  const selected = store.customers.find((customer) => customer.id === selectedId) ?? null;
  const activeFilters = Object.values(filters).filter(Boolean).length;

  return <div className="min-h-dvh bg-background text-foreground">
    <header className="sticky top-0 z-30 border-b bg-background/95 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-md items-center justify-between"><div><h1 className="text-xl font-semibold tracking-tight">Khách hàng</h1><p className="text-sm text-muted-foreground">{store.customers.length} khách đã lưu</p></div><Link className={buttonVariants({ size: "icon" })} to="/customers/new" aria-label="Thêm khách hàng"><Plus /></Link></div>
      <div className="mx-auto mt-3 flex max-w-md gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm tên hoặc SĐT…" className="pl-9 pr-9" />{search && <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 size-8 -translate-y-1/2" onClick={() => setSearch("")} aria-label="Xóa tìm kiếm"><X /></Button>}</div><Button size="icon" variant={activeFilters ? "default" : "outline"} onClick={() => setFilterOpen(true)} className="relative" aria-label="Bộ lọc"><Filter />{activeFilters > 0 && <Badge className="absolute -right-1 -top-1 size-5 justify-center rounded-full p-0 text-[10px]">{activeFilters}</Badge>}</Button></div>
    </header>
    <main className="mx-auto max-w-md px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4">
      {filtered.length === 0 ? <div className="grid min-h-[50dvh] place-items-center text-center"><div><Users className="mx-auto size-10 text-muted-foreground/50" /><p className="mt-3 font-medium">Không tìm thấy khách hàng</p><p className="mt-1 text-sm text-muted-foreground">Thử đổi từ khóa hoặc xóa bộ lọc.</p></div></div> : <div className="space-y-2.5">{filtered.map((customer) => <CustomerCard key={customer.id} customer={customer} streetName={store.meta?.streets.find((s) => s.id === customer.streetId)?.name ?? ""} groupName={store.meta?.groups.find((g) => g.id === customer.groupId)?.name} personalityName={store.meta?.personalities.find((p) => p.id === customer.personalityId)?.label} onOpen={() => setSelectedId(customer.id)} />)}</div>}
    </main>
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 px-4 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur"><div className="mx-auto grid max-w-md grid-cols-2 gap-2"><Link className={buttonVariants({ variant: "ghost" })} to="/">Khách hàng</Link><Link className={buttonVariants({ variant: "ghost" })} to="/settings">Cài đặt dữ liệu</Link></div></nav>
    <FilterDrawer open={filterOpen} onOpenChange={setFilterOpen} filters={filters} onChange={setFilters} streets={store.meta?.streets} personalities={store.meta?.personalities} groups={store.meta?.groups} />
    <CustomerDetailDrawer open={!!selected} onOpenChange={(open) => !open && setSelectedId(null)} customer={selected} streetName={selected ? store.meta?.streets.find((s) => s.id === selected.streetId)?.name ?? "" : ""} groupName={selected ? store.meta?.groups.find((g) => g.id === selected.groupId)?.name : undefined} personalityName={selected ? store.meta?.personalities.find((p) => p.id === selected.personalityId)?.label : undefined} onUpdate={store.updateCustomer} />
  </div>;
}
