import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import type { CustomerFilters, CustomerGroup, Personality, Street } from "@/lib/types";

type FilterDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: CustomerFilters;
  onChange: (filters: CustomerFilters) => void;
  streets: Street[] | undefined;
  groups: CustomerGroup[] | undefined;
  personalities: Personality[] | undefined;
};

export const FilterDrawer = ({ open, onOpenChange, filters, onChange, streets, groups, personalities }: FilterDrawerProps) => {
  const toggle = <K extends keyof CustomerFilters>(key: K, value: CustomerFilters[K]) => {
    onChange({ ...filters, [key]: filters[key] === value ? undefined : value });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} >
      <DrawerContent className="mx-auto max-h-[85dvh] max-w-md">
        <DrawerHeader className="text-left"><DrawerTitle>Bộ lọc</DrawerTitle><DrawerDescription>Lọc nhanh danh sách khách hàng đã lưu.</DrawerDescription></DrawerHeader>
        <div className="space-y-5 overflow-y-auto p-4 pb-8">
          <FilterSection label="Con đường"><div className="flex flex-wrap gap-2">{streets && streets.map((street) => <Button key={street.id} variant={filters.streetId === street.id ? "default" : "outline"} size="sm" className="rounded-full" onClick={() => toggle("streetId", street.id)}>{street.name}</Button>)}</div></FilterSection>
          <FilterSection label="Nhóm"><div className="flex flex-wrap gap-2">{groups && groups.map((group) => <Button key={group.id} variant={filters.groupId === group.id ? "default" : "outline"} size="sm" className="rounded-full" onClick={() => toggle("groupId", group.id)}>{group.name}</Button>)}</div></FilterSection>
          <FilterSection label="Loại địa điểm"><div className="grid grid-cols-3 gap-2">{(["house", "boarding", "office"] as const).map((type) => <Button key={type} variant={filters.locationType === type ? "default" : "outline"} size="sm" onClick={() => toggle("locationType", type)}>{type === "house" ? "Nhà riêng" : type === "boarding" ? "Nhà trọ" : "Văn phòng"}</Button>)}</div></FilterSection>
          <FilterSection label="Tính cách"><div className="flex flex-wrap gap-2">{personalities && personalities.map((personality) => <Button key={personality.id} variant={filters.personalityId === personality.id ? "default" : "outline"} size="sm" className="rounded-full" onClick={() => toggle("personalityId", personality.id)}>{personality.label}</Button>)}</div></FilterSection>
          <Button variant="outline" className="w-full" onClick={() => onChange({})}>Xóa tất cả bộ lọc</Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

type FilterSectionProps = { label: string; children: React.ReactNode };
const FilterSection = ({ label, children }: FilterSectionProps) => <section><h3 className="mb-2 text-sm font-medium">{label}</h3>{children}</section>;
