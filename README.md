# Customer Memory — DB-first refactor

Bản này chuyển state chính của app từ `localStorage` sang PostgreSQL + Drizzle, dùng TanStack Start Server Functions làm boundary server và TanStack Query làm cache/client state.

## Stack

- TanStack Start
- TanStack Query v5
- TypeScript
- Drizzle ORM + PostgreSQL
- Better Auth (chỉ dùng session để xác định shipper hiện tại; chưa làm UI/account management)
- shadcn/ui (Base UI)
- Tailwind CSS
- React Compiler

TanStack Start Server Functions chạy server-side nhưng có thể được gọi type-safe từ client; đây là boundary phù hợp để truy cập DB mà không đưa Drizzle vào bundle client. urlTanStack Start Server Functionshttps://tanstack.com/start/latest/docs/framework/react/guide/server-functions

TanStack Query dùng `queryOptions` cho query keys/query functions và `useMutation` cho create/update/delete side effects. urlTanStack Query queryOptionshttps://tanstack.com/query/latest/docs/framework/react/reference/functions/queryOptions

## Kiến trúc

```text
src/
├── db/
│   ├── index.ts
│   ├── schema.ts
│   └── seed.ts
├── server/
│   ├── customer.functions.ts
│   └── maps.functions.ts
├── lib/
│   ├── auth.functions.ts
│   ├── customer.mutations.ts
│   ├── customer.queries.ts
│   ├── customer-store.ts
│   ├── data.ts
│   ├── maps.ts
│   └── types.ts
├── components/
│   ├── customer-card.tsx
│   ├── customer-detail-drawer.tsx
│   ├── customer-form.tsx
│   ├── customer-visuals.tsx
│   └── filter-drawer.tsx
└── routes/
    ├── index.tsx
    ├── customers.new.tsx
    ├── customers.$customerId.tsx
    └── settings.tsx
```

## Database

`user`, `session`, `account`, `verification` giữ vai trò Better Auth.

Dữ liệu nghiệp vụ gồm:

- `streets`: tên đường + khu vực gợi nhớ
- `groups`: nhóm do shipper tự đặt, thuộc một street
- `personality_tags`: 5 tag mặc định + tag shipper tự tạo
- `customers`: thông tin khách và vị trí Google Maps

Customer address không phải một entity riêng vì hiện tại mỗi khách chỉ cần một vị trí hiện tại. DB lưu:

- `latitude`
- `longitude`
- `formatted_address`
- `place_id`
- `address_updated_at`

Nếu sau này cần audit/lịch sử vị trí, nên tách thêm `customer_address_history` thay vì ghi đè.

## Quan trọng: userId

Mỗi bảng nghiệp vụ có `userId` và server function luôn lấy ID từ Better Auth session, không nhận `userId` từ client. Như vậy một shipper chỉ query/mutate dữ liệu của chính mình.

Better Auth trên TanStack Start khuyến nghị lấy session server-side bằng `auth.api.getSession({ headers })`; resource/server functions nên kiểm tra session trước khi thao tác dữ liệu. urlBetter Auth TanStack Start integrationhttps://better-auth.com/docs/integrations/tanstack

## Env

```env
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:3000

# Browser-visible Google Maps Embed key, nên restrict theo HTTP referrer.
VITE_GOOGLE_MAPS_API_KEY=...

# Server-only Google Geocoding key.
GOOGLE_MAPS_API_KEY=...
```

Không đặt `GOOGLE_MAPS_API_KEY` trong biến `VITE_*`.

## Drizzle

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

Nếu project đã có schema Better Auth ở file khác, không tạo thêm bảng `user/session/account/verification`; hãy giữ schema Better Auth hiện tại và merge phần `streets/groups/personalityTags/customers` vào schema được Drizzle load.

## Shadcn

Project nên có các component:

```bash
pnpm dlx shadcn@latest add button card badge input textarea select dialog drawer separator tabs alert-dialog field
```

Bản shadcn hiện tại mặc định Base UI cho project mới; Drawer dùng `swipeDirection="down"` và `showSwipeHandle`, phù hợp interaction mobile. urlshadcn/ui Drawerhttps://ui.shadcn.com/docs/components/base/drawer

## CRUD đã có

### Customer

- list
- search server-side: tên, SĐT, tên đường, nhóm
- filter: đường, nhóm, loại địa điểm, personality
- create
- update
- delete
- update current GPS location
- reverse geocode

### Metadata

- create street
- create group theo street
- create personality
- system personality được đảm bảo tồn tại theo từng shipper khi load metadata

## Luồng cập nhật vị trí

```text
Shipper mở detail
        ↓
Nhấn "Cập nhật vị trí"
        ↓
navigator.geolocation
        ↓
server function reverseGeocode()
        ↓
Google Geocoding API
        ↓
updateCustomerAddress()
        ↓
PostgreSQL
        ↓
TanStack Query invalidate/update cache
        ↓
Drawer hiển thị địa chỉ + map mới
```

## React / TypeScript convention

Các component mới dùng arrow component:

```tsx
export const CustomerCard = (props: CustomerCardProps) => {
  // ...
};
```

Props đều khai báo bằng `type`, không dùng `any` cho data model.

Drizzle types được infer từ schema thay vì tạo lại một model song song:

```ts
type CustomerRow = InferSelectModel<typeof customers>;
```

## Lưu ý về màu

Màu theme UI dùng semantic tokens của shadcn/Tailwind như `bg-background`, `bg-muted`, `text-muted-foreground`, `border-border`, `bg-primary`.

Màu mái/cổng là dữ liệu nhận diện thực tế nên được biểu diễn bằng class màu riêng, không dùng chúng làm theme màu của app.
