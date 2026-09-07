// routers/settings.tsx

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Plus, Route as RouteIcon, Tag, UserRound } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { customerMetaQueryOptions } from "@/lib/customer.queries";
import { createGroupMutation, createPersonalityMutation, createStreetMutation } from "@/lib/customer.mutations";

type DialogKind = "street" | "personality" | null;

export const Route = createFileRoute("/settings")({ component: SettingsPage });

const SettingsPage = () => {
  const queryClient = useQueryClient();
  const meta = useQuery(customerMetaQueryOptions);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [groupStreetId, setGroupStreetId] = useState<string | null>(null);
  const [name, setName] = useState("");

  const createStreet = useMutation({ ...createStreetMutation, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["customer-meta"] }); closeDialog(); } });
  const createGroup = useMutation({ ...createGroupMutation, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["customer-meta"] }); closeDialog(); } });
  const createPersonality = useMutation({ ...createPersonalityMutation, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["customer-meta"] }); closeDialog(); } });

  const closeDialog = () => { setDialog(null); setGroupStreetId(null); setName(""); };

  const submit = async () => {
    if (!name.trim()) return;
    if (dialog === "street") await createStreet.mutateAsync({ data: { name: name.trim() } });
    if (dialog === "personality") await createPersonality.mutateAsync({ data: { label: name.trim() } });
    if (groupStreetId) await createGroup.mutateAsync({ data: { streetId: groupStreetId, name: name.trim() } });
  };

  const isSubmitting = createStreet.isPending || createGroup.isPending || createPersonality.isPending;

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/95 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-2"><Link className={buttonVariants({ variant: "ghost", size: "icon" })} to="/" aria-label="Quay lại"><ArrowLeft /></Link><div><h1 className="font-semibold">Dữ liệu ghi nhớ</h1><p className="text-xs text-muted-foreground">Đường, nhóm và tính cách</p></div></div>
      </header>
      <main className="mx-auto max-w-md p-4 pb-10">
        <Tabs defaultValue="streets">
          <TabsList className="grid w-full grid-cols-3"><TabsTrigger value="streets">Đường</TabsTrigger><TabsTrigger value="groups">Nhóm</TabsTrigger><TabsTrigger value="personalities">Tính cách</TabsTrigger></TabsList>
          <TabsContent value="streets" className="space-y-2">
            {(meta.data?.streets ?? []).map((street) => <Card key={street.id}><CardContent className="flex items-center gap-3 p-3"><RouteIcon className="size-4 text-muted-foreground" /><span className="flex-1 font-medium">{street.name}</span><span className="text-xs text-muted-foreground">{(meta.data?.groups ?? []).filter((group) => group.streetId === street.id).length} nhóm</span></CardContent></Card>)}
            <Button className="w-full" variant="outline" onClick={() => setDialog("street")}><Plus /> Thêm con đường</Button>
          </TabsContent>
          <TabsContent value="groups" className="space-y-3">
            {(meta.data?.streets ?? []).map((street) => <Card key={street.id}><CardHeader className="pb-2"><CardTitle className="text-sm">{street.name}</CardTitle></CardHeader><CardContent className="space-y-2">{(meta.data?.groups ?? []).filter((group) => group.streetId === street.id).map((group) => <div key={group.id} className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm"><Tag className="size-4 text-muted-foreground" />{group.name}</div>)}<Button size="sm" variant="outline" onClick={() => setGroupStreetId(street.id)}><Plus /> Thêm nhóm</Button></CardContent></Card>)}
          </TabsContent>
          <TabsContent value="personalities" className="space-y-2">
            {(meta.data?.personalities ?? []).map((personality) => <Card key={personality.id}><CardContent className="flex items-center gap-3 p-3"><UserRound className="size-4 text-muted-foreground" /><span className="flex-1 font-medium">{personality.label}</span>{personality.isSystem && <span className="text-xs text-muted-foreground">Mặc định</span>}</CardContent></Card>)}
            <Button className="w-full" variant="outline" onClick={() => setDialog("personality")}><Plus /> Thêm tính cách</Button>
          </TabsContent>
        </Tabs>
      </main>
      <Dialog open={Boolean(dialog || groupStreetId)} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {groupStreetId ? "Thêm nhóm" : dialog === "street" ? "Thêm con đường" : "Thêm tính cách"}
            </DialogTitle>
          </DialogHeader>
          <Input autoFocus value={name} onChange={(event) => setName(event.target.value)}
            placeholder={groupStreetId ? "Ví dụ: Tạp hóa A, Tổ 2" : dialog === "street" ? "Tên đường" : "Ví dụ: Hay nhận hàng trễ"}
            onKeyDown={(event) => event.key === "Enter" && void submit()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Hủy</Button>
            <Button onClick={() => void submit()} disabled={isSubmitting}>{isSubmitting ? "Đang tạo…" : "Tạo"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
