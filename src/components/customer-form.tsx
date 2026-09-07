// components/customer-form.tsx

import { useMemo, useState } from "react";
import { Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { ROOF_COLORS, GATE_COLORS } from "@/lib/data";
import type { Customer, CustomerGroup, Personality, Street } from "@/lib/types";
import type { CustomerInput } from "#/server/customer.functions.ts";

type CustomerFormProps = {
  initial?: Customer | null;
  streets: Street[] | undefined;
  groups: CustomerGroup[] | undefined;
  personalities: Personality[] | undefined;
  onCreateGroup: (streetId: string, name: string) => Promise<CustomerGroup>;
  onCreatePersonality: (label: string) => Promise<Personality>;
  onSubmit: (data: CustomerInput) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
};

type FormState = CustomerInput;

const toFormState = (customer?: Customer | null): FormState => ({
  name: customer?.name ?? "",
  phone: customer?.phone ?? "",
  streetId: customer?.streetId ?? null,
  groupId: customer?.groupId ?? null,
  locationType: customer?.locationType ?? "house",
  boardingName: customer?.boardingName ?? null,
  roomNumber: customer?.roomNumber ?? null,
  officeName: customer?.officeName ?? null,
  floor: customer?.floor ?? null,
  roofColor: customer?.roofColor ?? null,
  gateColor: customer?.gateColor ?? null,
  houseSide: customer?.houseSide ?? null,
  personalityId: customer?.personalityId ?? null,
  description: customer?.description ?? null,
  preferredTimeStart: customer?.preferredTimeStart ?? null,
  preferredTimeEnd: customer?.preferredTimeEnd ?? null,
  timeNote: customer?.timeNote ?? null,
});

export const CustomerForm = ({
  initial,
  streets,
  groups,
  personalities,
  onCreateGroup,
  onCreatePersonality,
  onSubmit,
  onCancel,
  submitting = false,
}: CustomerFormProps) => {
  const [form, setForm] = useState<FormState>(() => toFormState(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [personalityDialogOpen, setPersonalityDialogOpen] = useState(false);
  const [newPersonality, setNewPersonality] = useState("");

  const availableGroups = useMemo(
    () => groups?.filter((group) => group.streetId === form.streetId),
    [groups, form.streetId],
  );

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };

  const submit = async () => {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = "Nhập tên khách hàng";
    if (!form.phone.trim()) nextErrors.phone = "Nhập số điện thoại";
    if (!form.streetId) nextErrors.streetId = "Chọn con đường";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    console.log('log', form)
    await onSubmit(form);
  };

  const addGroup = async () => {
    if (!form.streetId || !newGroupName.trim()) return;
    const group = await onCreateGroup(form.streetId, newGroupName.trim());
    update("groupId", group.id);
    setNewGroupName("");
    setGroupDialogOpen(false);
  };

  const addPersonality = async () => {
    if (!newPersonality.trim()) return;
    const personality = await onCreatePersonality(newPersonality.trim());
    update("personalityId", personality.id);
    setNewPersonality("");
    setPersonalityDialogOpen(false);
  };

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-10 pt-4">
      <FieldGroup>
        <Field>
          <FieldLabel>Tên khách hàng</FieldLabel>
          <Input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Chị Lan, anh Tuấn…" />
          {errors.name && <FieldError>{errors.name}</FieldError>}
        </Field>

        <Field>
          <FieldLabel>Số điện thoại</FieldLabel>
          <Input inputMode="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="09xxxxxxxx" />
          {errors.phone && <FieldError>{errors.phone}</FieldError>}
        </Field>

        <Field>
          <FieldLabel>Con đường</FieldLabel>
          <Select value={form.streetId ?? ""} onValueChange={(value) => { update("streetId", value || null); update("groupId", null); }}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Chọn con đường" /></SelectTrigger>
            <SelectContent>{streets?.map((street) => <SelectItem key={street.id} value={street.id}>{street.name}</SelectItem>)}</SelectContent>
          </Select>
          {errors.streetId && <FieldError>{errors.streetId}</FieldError>}
        </Field>

        <Field>
          <div className="flex items-center justify-between gap-3">
            <FieldLabel>Nhóm / vị trí gợi nhớ</FieldLabel>
            <Button type="button" variant="ghost" size="sm" disabled={!form.streetId} onClick={() => setGroupDialogOpen(true)}><Plus /> Tạo nhóm</Button>
          </div>
          <Select value={form.groupId ?? ""} onValueChange={(value) => update("groupId", value || null)} disabled={!form.streetId}>
            <SelectTrigger className="w-full"><SelectValue placeholder={form.streetId ? "Chọn nhóm" : "Chọn đường trước"} /></SelectTrigger>
            <SelectContent>{availableGroups?.map((group) => <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>)}</SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel>Loại địa điểm</FieldLabel>
          <div className="grid grid-cols-3 gap-2">
            {(["house", "boarding", "office"] as const).map((value) => (
              <Button key={value} type="button" variant={form.locationType === value ? "default" : "outline"} onClick={() => update("locationType", value)}>
                {value === "house" ? "Nhà riêng" : value === "boarding" ? "Nhà trọ" : "Văn phòng"}
              </Button>
            ))}
          </div>
        </Field>

        {form.locationType === "boarding" && <>
          <Field><FieldLabel>Tên nhà trọ</FieldLabel><Input value={form.boardingName ?? ""} onChange={(event) => update("boardingName", event.target.value || null)} placeholder="Trọ Bình An" /></Field>
          <Field><FieldLabel>Số phòng</FieldLabel><Input value={form.roomNumber ?? ""} onChange={(event) => update("roomNumber", event.target.value || null)} placeholder="P.203" /></Field>
        </>}

        {form.locationType === "office" && <Field><FieldLabel>Tên văn phòng / công ty</FieldLabel><Input value={form.officeName ?? ""} onChange={(event) => update("officeName", event.target.value || null)} placeholder="Vietcombank chi nhánh 3" /></Field>}
        {(form.locationType === "boarding" || form.locationType === "office") && <Field><FieldLabel>Tầng</FieldLabel><Input value={form.floor ?? ""} onChange={(event) => update("floor", event.target.value || null)} placeholder="2" /></Field>}

        <Field>
          <FieldLabel>Màu mái nhà <span className="font-normal text-muted-foreground">(không bắt buộc)</span></FieldLabel>
          <ColorPicker colors={ROOF_COLORS} value={form.roofColor} onChange={(value) => update("roofColor", value)} />
        </Field>

        <Field>
          <FieldLabel>Màu cổng <span className="font-normal text-muted-foreground">(không bắt buộc)</span></FieldLabel>
          <ColorPicker colors={GATE_COLORS} value={form.gateColor} onChange={(value) => update("gateColor", value)} />
        </Field>

        <Field>
          <FieldLabel>Hướng nhà <span className="font-normal text-muted-foreground">(không bắt buộc)</span></FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant={form.houseSide === "left" ? "default" : "outline"} onClick={() => update("houseSide", form.houseSide === "left" ? null : "left")}>← Bên trái</Button>
            <Button type="button" variant={form.houseSide === "right" ? "default" : "outline"} onClick={() => update("houseSide", form.houseSide === "right" ? null : "right")}>Bên phải →</Button>
          </div>
        </Field>

        <Field>
          <div className="flex items-center justify-between gap-3">
            <FieldLabel>Tính cách</FieldLabel>
            <Button type="button" variant="ghost" size="sm" onClick={() => setPersonalityDialogOpen(true)}><Plus /> Tạo mới</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {personalities?.map((personality) => (
              <Button key={personality.id} type="button" size="sm" variant={form.personalityId === personality.id ? "default" : "outline"} className="rounded-full" onClick={() => update("personalityId", form.personalityId === personality.id ? null : personality.id)}>{personality.label}</Button>
            ))}
          </div>
        </Field>

        <Field>
          <FieldLabel>Khung giờ nên giao</FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            <Input type="time" value={form.preferredTimeStart ?? ""} onChange={(event) => update("preferredTimeStart", event.target.value || null)} />
            <Input type="time" value={form.preferredTimeEnd ?? ""} onChange={(event) => update("preferredTimeEnd", event.target.value || null)} />
          </div>
          <Input className="mt-2" value={form.timeNote ?? ""} onChange={(event) => update("timeNote", event.target.value || null)} placeholder="Ví dụ: tránh 12h–13h, sau 18h mới có nhà" />
        </Field>

        <Field>
          <FieldLabel>Ghi chú riêng cho shipper</FieldLabel>
          <Textarea value={form.description ?? ""} onChange={(event) => update("description", event.target.value || null)} placeholder="Đặc điểm trước cửa, chỗ để hàng, chỗ gửi xe…" className="min-h-28" />
        </Field>
      </FieldGroup>

      <div className="mt-6 grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Hủy</Button>
        <Button type="button" onClick={submit} disabled={submitting}><Save /> {submitting ? "Đang lưu…" : "Lưu khách hàng"}</Button>
      </div>

      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle>Tạo nhóm</DialogTitle></DialogHeader><Input autoFocus value={newGroupName} onChange={(event) => setNewGroupName(event.target.value)} placeholder="Ví dụ: Tạp hóa A, Tổ 2" onKeyDown={(event) => event.key === "Enter" && void addGroup()} /><DialogFooter><Button variant="outline" onClick={() => setGroupDialogOpen(false)}>Hủy</Button><Button onClick={() => void addGroup()}>Tạo nhóm</Button></DialogFooter></DialogContent>
      </Dialog>

      <Dialog open={personalityDialogOpen} onOpenChange={setPersonalityDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle>Tạo tính cách</DialogTitle></DialogHeader><Input autoFocus value={newPersonality} onChange={(event) => setNewPersonality(event.target.value)} placeholder="Ví dụ: Hay nhận hàng trễ" onKeyDown={(event) => event.key === "Enter" && void addPersonality()} /><DialogFooter><Button variant="outline" onClick={() => setPersonalityDialogOpen(false)}>Hủy</Button><Button onClick={() => void addPersonality()}>Thêm</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
};

type ColorPickerProps = {
  colors: readonly { name: string; hex: string }[];
  value?: string | null;
  onChange: (value: string | null) => void;
};

const ColorPicker = ({ colors, value, onChange }: ColorPickerProps) => (
  <div className="flex flex-wrap gap-3">
    <Button type="button" variant={!value ? "default" : "outline"} className="h-10 rounded-full px-4" onClick={() => onChange(null)}>Không</Button>
    {colors.map((color) => (
      <button
        key={color.name}
        type="button"
        title={color.name}
        aria-label={`Màu ${color.name}`}
        aria-pressed={value === color.name}
        className={`grid size-10 place-items-center rounded-full border-2 border-border transition-transform active:scale-95 ${color.name === "Đỏ" ? "bg-[#c0392b]" : color.name === "Xanh dương" ? "bg-[#2980b9]" : color.name === "Vàng" ? "bg-[#e1a721]" : "bg-[#7f8c8d]"}`}
        onClick={() => onChange(value === color.name ? null : color.name)}
      >
        {value === color.name && <span className="text-white">✓</span>}
      </button>
    ))}
  </div>
);

export default CustomerForm;
