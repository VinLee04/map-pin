"use client";

import { CustomerForm } from "@/components/customer-form";
import { buttonVariants } from "@/components/ui/button";
import { useCustomerStore } from "@/lib/customer-store";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/customers/new")({ component: NewCustomerPage });

function NewCustomerPage() {
  const store = useCustomerStore();

  const { streets, groups, personalities } = store.meta ?? { streets: [], groups: [], personalities: [] };
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/95 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-2">
          <Link className={buttonVariants({ variant: "ghost", size: "icon" })} to="/">
            <ArrowLeft />
          </Link>
          <div>
            <h1 className="font-semibold">Thêm khách hàng</h1>
            <p className="text-xs text-muted-foreground">Lưu để giao lần sau nhanh hơn</p>
          </div>
        </div>
      </header>
      <CustomerForm
        streets={streets}
        groups={groups}
        personalities={personalities}
        onAddGroup={(data: any) => store.createGroup.mutate(data)}
        onAddPersonality={(data: any) => store.createPersonality.mutate(data)}
        onSubmit={(customer) => {
          store.createCustomer.mutate(customer, {
            onSuccess: () => {
              navigate({ to: "/" });
            },
          });
        }}
        onCancel={() => navigate({ to: "/" })}
      />
    </div>
  );
}