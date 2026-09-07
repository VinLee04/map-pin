"use client";

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { CustomerForm } from "@/components/customer-form";
import { useCustomerStore } from "@/lib/customer-store";

export const Route = createFileRoute("/customers/$customerId")({ component: CustomerDetailPage });

function CustomerDetailPage() {
  const { customerId } = Route.useParams();
  const store = useCustomerStore();
  const navigate = useNavigate();
  const customer = store.customers.find((item) => String(item.id) === customerId);

  if (!customer) {
    return <div className="grid min-h-dvh place-items-center p-4"><div className="text-center"><p className="font-semibold">Không tìm thấy khách hàng</p><Button onClick={() => navigate({ to: "/" })}>Về danh sách</Button></div></div>;
  }

  return <div className="min-h-dvh bg-background"><header className="sticky top-0 z-20 border-b bg-background/95 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur"><div className="mx-auto flex max-w-md items-center gap-2"><Link className={buttonVariants({ variant: "ghost", size: "icon" })} to="/" aria-label="Quay lại"><ArrowLeft /></Link><div className="min-w-0"><h1 className="truncate font-semibold">Chỉnh sửa {customer.name}</h1><p className="text-xs text-muted-foreground">Cập nhật thông tin ghi nhớ</p></div></div></header><CustomerForm initial={customer} streets={store.streets} groups={store.groups} personalities={store.personalities} onAddGroup={store.addGroup} onAddPersonality={store.addPersonality} onSave={(next) => { store.saveCustomer(next); navigate({ to: "/" }); }} onCancel={() => navigate({ to: "/" })} /></div>;
}
