import { useState, useMemo } from "react";
import {
  Search,
  SlidersHorizontal,
  Plus,
  Phone,
  MapPin,
  Home,
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  Users,
  Settings,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { GATE_COLORS, GROUPS, INITIAL_CUSTOMERS, PERSONALITIES, ROOF_COLORS, STREETS } from "#/data.ts";


// ---------- Helpers ----------
function initials(name: string) {
  const parts = name.trim().split(" ");
  return (parts[0]?.[0] || "") + (parts[parts.length - 1]?.[0] || "");
}

function locationTypeLabel(t: string) {
  if (t === "boarding") return "Nhà trọ";
  if (t === "office") return "Văn phòng";
  return "Nhà riêng";
}

// ---------- Bottom sheet (simple, own-built, swipe-down-to-close feel via drag) ----------
function BottomSheet({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: React.ReactNode; title: string }) {
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [startY, setStartY] = useState(0);

  if (!open) return null;

  const handleStart = (clientY: number) => {
    setDragging(true);
    setStartY(clientY);
  };
  const handleMove = (clientY: number) => {
    if (!dragging) return;
    const delta = clientY - startY;
    if (delta > 0) setDragY(delta);
  };
  const handleEnd = () => {
    setDragging(false);
    if (dragY > 100) {
      onClose();
    }
    setDragY(0);
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "flex-end",
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          opacity: dragging ? Math.max(0.1, 0.45 - dragY / 400) : 0.45,
          transition: dragging ? "none" : "opacity 200ms ease",
        }}
      />
      <div
        onTouchStart={(e) => handleStart(e.touches[0].clientY)}
        onTouchMove={(e) => handleMove(e.touches[0].clientY)}
        onTouchEnd={handleEnd}
        onMouseDown={(e) => handleStart(e.clientY)}
        onMouseMove={(e) => dragging && handleMove(e.clientY)}
        onMouseUp={handleEnd}
        onMouseLeave={() => dragging && handleEnd()}
        style={{
          position: "relative",
          width: "100%",
          maxHeight: "88%",
          background: "#fff",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          boxShadow: "0 -8px 30px rgba(0,0,0,0.15)",
          transform: `translateY(${dragY}px)`,
          transition: dragging ? "none" : "transform 250ms cubic-bezier(.32,.72,0,1)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px", touchAction: "none" }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: "#d9d9d3" }} />
        </div>
        {title && (
          <div style={{ padding: "4px 20px 12px", borderBottom: "0.5px solid #eceae3", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: 17, fontWeight: 500, margin: 0, color: "#1a1a18" }}>{title}</h2>
            <button
              onClick={onClose}
              style={{ border: "none", background: "transparent", padding: 6, cursor: "pointer", color: "#8a8a82" }}
              aria-label="Đóng"
            >
              <X size={20} />
            </button>
          </div>
        )}
        <div style={{ overflowY: "auto", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

// ---------- Customer detail sheet content ----------
function CustomerDetail({ customer }: { customer: typeof INITIAL_CUSTOMERS[number] }) {
  const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${customer.lat},${customer.lng}&zoom=16&size=640x320&markers=color:red%7C${customer.lat},${customer.lng}&key=YOUR_API_KEY`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${customer.lat},${customer.lng}`;

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Static map preview */}
      <div style={{ position: "relative", width: "100%", height: 200, background: "#e8e6dc" }}>
        <img
          src={staticMapUrl}
          alt={`Bản đồ vị trí của ${customer.name}`}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          onError={(e: any) => {
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "flex";
          }}
        />
        <div
          style={{
            display: "none",
            position: "absolute",
            inset: 0,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 6,
            color: "#8a8a82",
            fontSize: 13,
          }}
        >
          <MapPin size={28} />
          <span>Xem trước bản đồ (Static Maps API)</span>
        </div>

        {/* Feature icon overlay row */}
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: 10,
            display: "flex",
            gap: 8,
          }}
        >
          {customer.roofColor && (
            <div
              title={`Mái nhà màu ${customer.roofColor}`}
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
              }}
            >
              <Home
                size={18}
                fill={ROOF_COLORS.find((c) => c.name === customer.roofColor)?.hex || "#999"}
                color={ROOF_COLORS.find((c) => c.name === customer.roofColor)?.hex || "#999"}
              />
            </div>
          )}
          {customer.gateColor && (
            <div
              title={`Cổng màu ${customer.gateColor}`}
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  background: GATE_COLORS.find((c) => c.name === customer.gateColor)?.hex || "#999",
                  border: "1px solid rgba(0,0,0,0.15)",
                }}
              />
            </div>
          )}
          {customer.houseSide && (
            <div
              title={customer.houseSide === "left" ? "Nhà bên trái" : "Nhà bên phải"}
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
              }}
            >
              {customer.houseSide === "left" ? (
                <ArrowLeft size={18} color="#1a1a18" />
              ) : (
                <ArrowRight size={18} color="#1a1a18" />
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "16px 20px" }}>
        {/* Name + phone */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "#f0ede3",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 500,
              fontSize: 16,
              color: "#5f5e56",
              flexShrink: 0,
            }}
          >
            {initials(customer.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 500, fontSize: 16, margin: 0, color: "#1a1a18" }}>{customer.name}</p>
            <p style={{ fontSize: 13, color: "#8a8a82", margin: "2px 0 0" }}>
              {customer.street} · {customer.group}
            </p>
          </div>
          <a
            href={`tel:${customer.phone}`}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "#0f6e56",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              flexShrink: 0,
            }}
            aria-label="Gọi điện"
          >
            <Phone size={18} />
          </a>
        </div>

        {/* Location type specific info */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          <span style={pillStyle}>{locationTypeLabel(customer.locationType)}</span>
          {customer.boardingName && <span style={pillStyle}>{customer.boardingName}</span>}
          {customer.roomNumber && <span style={pillStyle}>Phòng {customer.roomNumber}</span>}
          {customer.officeName && <span style={pillStyle}>{customer.officeName}</span>}
          {customer.floor && <span style={pillStyle}>Tầng {customer.floor}</span>}
          {customer.personality && (
            <span style={{ ...pillStyle, background: "#fdf1dd", color: "#854f0b" }}>
              {customer.personality}
            </span>
          )}
        </div>

        {customer.timeNote && (
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
              padding: "10px 12px",
              background: "#fdf1dd",
              borderRadius: 10,
              marginBottom: 16,
              fontSize: 13,
              color: "#633806",
            }}
          >
            <span style={{ fontWeight: 500 }}>Khung giờ:</span> {customer.timeNote}
          </div>
        )}

        {customer.description && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: "#8a8a82", margin: "0 0 4px" }}>Ghi chú của shipper</p>
            <p style={{ fontSize: 14, color: "#1a1a18", margin: 0, lineHeight: 1.6 }}>{customer.description}</p>
          </div>
        )}

        <p style={{ fontSize: 12, color: "#b0afa5", margin: "0 0 16px" }}>
          Địa chỉ cập nhật lần cuối: {customer.addressUpdatedAt}
        </p>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "12px 0",
              borderRadius: 10,
              background: "#1a1a18",
              color: "#fff",
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            <MapPin size={16} /> Chỉ đường
          </a>
          <button
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "12px 0",
              borderRadius: 10,
              background: "#fff",
              border: "1px solid #d9d9d3",
              color: "#1a1a18",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Cập nhật vị trí hiện tại
          </button>
        </div>
      </div>
    </div>
  );
}

const pillStyle = {
  fontSize: 12,
  padding: "5px 10px",
  borderRadius: 999,
  background: "#f0ede3",
  color: "#5f5e56",
  fontWeight: 500,
};

// ---------- Filter panel ----------
function FilterPanel({ filters, setFilters, onClose }: { filters: { street: string | null; locationType: string | null; personality: string | null }; setFilters: React.Dispatch<React.SetStateAction<{ street: string | null; locationType: string | null; personality: string | null }>>; onClose: () => void }) {
  const toggle = (key: string, value: string | null) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key] === value ? null : value,
    }));
  };

  return (
    <div style={{ padding: "4px 20px 20px" }}>
      <FilterSection label="Con đường">
        <ChipRow
          options={STREETS}
          selected={filters.street}
          onSelect={(v: string | null) => toggle("street", v)}
        />
      </FilterSection>

      <FilterSection label="Loại địa điểm">
        <ChipRow
          options={[
            { value: "house", label: "Nhà riêng" },
            { value: "boarding", label: "Nhà trọ" },
            { value: "office", label: "Văn phòng" },
          ]}
          selected={filters.locationType}
          onSelect={(v: string | null) => toggle("locationType", v)}
        />
      </FilterSection>

      <FilterSection label="Tính cách">
        <ChipRow
          options={PERSONALITIES}
          selected={filters.personality}
          onSelect={(v: string | null) => toggle("personality", v)}
        />
      </FilterSection>

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button
          onClick={() => setFilters({ street: null, locationType: null, personality: null })}
          style={{
            flex: 1,
            padding: "12px 0",
            borderRadius: 10,
            border: "1px solid #d9d9d3",
            background: "#fff",
            fontSize: 14,
            fontWeight: 500,
            color: "#1a1a18",
            cursor: "pointer",
          }}
        >
          Xóa lọc
        </button>
        <button
          onClick={onClose}
          style={{
            flex: 1,
            padding: "12px 0",
            borderRadius: 10,
            border: "none",
            background: "#1a1a18",
            fontSize: 14,
            fontWeight: 500,
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Áp dụng
        </button>
      </div>
    </div>
  );
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 13, fontWeight: 500, color: "#5f5e56", margin: "0 0 10px" }}>{label}</p>
      {children}
    </div>
  );
}

function ChipRow({ options, selected, onSelect }: { options: (string | { value: string; label: string })[]; selected: string | null; onSelect: (value: string | null) => void }) {
  const normalized = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {normalized.map((opt) => {
        const active = selected === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: active ? "1px solid #1a1a18" : "1px solid #e0ded4",
              background: active ? "#1a1a18" : "#fff",
              color: active ? "#fff" : "#1a1a18",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {active && <Check size={13} />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------- Customer list card ----------
function CustomerCard({ customer, onOpen }: { customer: typeof INITIAL_CUSTOMERS[number]; onOpen: (customer: typeof INITIAL_CUSTOMERS[number]) => void }) {
  return (
    <button
      onClick={() => onOpen(customer)}
      style={{
        width: "100%",
        textAlign: "left",
        background: "#fff",
        border: "1px solid #eceae3",
        borderRadius: 14,
        padding: "14px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "#f0ede3",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 500,
          fontSize: 14,
          color: "#5f5e56",
          flexShrink: 0,
        }}
      >
        {initials(customer.name)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <p style={{ fontWeight: 500, fontSize: 15, margin: 0, color: "#1a1a18" }}>{customer.name}</p>
          {customer.houseSide === "left" && <ArrowLeft size={13} color="#b0afa5" />}
          {customer.houseSide === "right" && <ArrowRight size={13} color="#b0afa5" />}
        </div>
        <p
          style={{
            fontSize: 13,
            color: "#8a8a82",
            margin: "2px 0 0",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {customer.street} · {customer.group}
        </p>
      </div>
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        {customer.roofColor && (
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: ROOF_COLORS.find((c) => c.name === customer.roofColor)?.hex,
            }}
          />
        )}
        {customer.gateColor && (
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: GATE_COLORS.find((c) => c.name === customer.gateColor)?.hex,
            }}
          />
        )}
      </div>
      <ChevronRight size={18} color="#c9c7bb" />
    </button>
  );
}

// ---------- Form field wrapper ----------
function Field({ label, children, optional }: { label: string; children: React.ReactNode; optional?: boolean }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#5f5e56", marginBottom: 6 }}>
        {label}
        {optional && <span style={{ color: "#b0afa5", fontWeight: 400 }}> (không bắt buộc)</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 12px",
  borderRadius: 10,
  border: "1px solid #e0ded4",
  fontSize: 15,
  color: "#1a1a18",
  background: "#fff",
  outline: "none",
};

// ---------- Add/Edit form ----------
function CustomerForm({ initial, onSave, onCancel }: { initial: any; onSave: (form: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState(
    initial || {
      name: "",
      phone: "",
      street: "",
      group: "",
      locationType: "house",
      boardingName: "",
      roomNumber: "",
      officeName: "",
      floor: "",
      roofColor: "",
      gateColor: "",
      houseSide: "",
      personality: "",
      description: "",
      timeNote: "",
    }
  );
  const [errors, setErrors] = useState({});
  const [newPersonalityMode, setNewPersonalityMode] = useState(false);
  const [newPersonalityValue, setNewPersonalityValue] = useState("");
  const [personalityOptions, setPersonalityOptions] = useState(PERSONALITIES);

  const availableGroups = form.street ? GROUPS[form.street] || [] : [];

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Nhập tên khách hàng";
    if (!form.phone.trim()) newErrors.phone = "Nhập số điện thoại";
    if (!form.street) newErrors.street = "Chọn con đường";
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      onSave(form);
    }
  };

  const confirmNewPersonality = () => {
    const val = newPersonalityValue.trim();
    if (!val) return;
    if (!personalityOptions.includes(val)) {
      setPersonalityOptions((prev) => [...prev, val]);
    }
    update("personality", val);
    setNewPersonalityValue("");
    setNewPersonalityMode(false);
  };

  return (
    <div style={{ padding: "4px 20px 32px" }}>
      <Field label="Tên khách hàng">
        <input
          style={{ ...inputStyle, borderColor: errors.name ? "#e24b4a" : "#e0ded4" }}
          placeholder="Chị Lan, anh Tuấn..."
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
        />
        {errors.name && <p style={{ fontSize: 12, color: "#e24b4a", margin: "4px 0 0" }}>{errors.name}</p>}
      </Field>

      <Field label="Số điện thoại">
        <input
          style={{ ...inputStyle, borderColor: errors.phone ? "#e24b4a" : "#e0ded4" }}
          placeholder="09xxxxxxxx"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
        />
        {errors.phone && <p style={{ fontSize: 12, color: "#e24b4a", margin: "4px 0 0" }}>{errors.phone}</p>}
      </Field>

      <Field label="Con đường">
        <select
          style={{ ...inputStyle, borderColor: errors.street ? "#e24b4a" : "#e0ded4" }}
          value={form.street}
          onChange={(e) => {
            update("street", e.target.value);
            update("group", "");
          }}
        >
          <option value="">Chọn con đường</option>
          {STREETS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {errors.street && <p style={{ fontSize: 12, color: "#e24b4a", margin: "4px 0 0" }}>{errors.street}</p>}
      </Field>

      <Field label="Nhóm / vị trí gợi nhớ" optional>
        <select
          style={inputStyle}
          value={form.group}
          disabled={!form.street}
          onChange={(e) => update("group", e.target.value)}
        >
          <option value="">{form.street ? "Chọn nhóm" : "Chọn đường trước"}</option>
          {availableGroups.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Loại địa điểm">
        <ChipRow
          options={[
            { value: "house", label: "Nhà riêng" },
            { value: "boarding", label: "Nhà trọ" },
            { value: "office", label: "Văn phòng" },
          ]}
          selected={form.locationType}
          onSelect={(v) => update("locationType", v)}
        />
      </Field>

      {form.locationType === "boarding" && (
        <>
          <Field label="Tên nhà trọ">
            <input
              style={inputStyle}
              placeholder="Trọ Bình An..."
              value={form.boardingName}
              onChange={(e) => update("boardingName", e.target.value)}
            />
          </Field>
          <Field label="Số phòng" optional>
            <input
              style={inputStyle}
              placeholder="P.203"
              value={form.roomNumber}
              onChange={(e) => update("roomNumber", e.target.value)}
            />
          </Field>
        </>
      )}

      {form.locationType === "office" && (
        <Field label="Tên văn phòng / công ty">
          <input
            style={inputStyle}
            placeholder="Vietcombank chi nhánh 3..."
            value={form.officeName}
            onChange={(e) => update("officeName", e.target.value)}
          />
        </Field>
      )}

      {(form.locationType === "boarding" || form.locationType === "office") && (
        <Field label="Tầng" optional>
          <input
            style={inputStyle}
            placeholder="2"
            value={form.floor}
            onChange={(e) => update("floor", e.target.value)}
          />
        </Field>
      )}

      <Field label="Màu mái nhà" optional>
        <ColorPicker colors={ROOF_COLORS} selected={form.roofColor} onSelect={(v) => update("roofColor", v)} />
      </Field>

      <Field label="Màu cổng" optional>
        <ColorPicker colors={GATE_COLORS} selected={form.gateColor} onSelect={(v) => update("gateColor", v)} />
      </Field>

      <Field label="Hướng nhà" optional>
        <ChipRow
          options={[
            { value: "left", label: "Bên trái" },
            { value: "right", label: "Bên phải" },
          ]}
          selected={form.houseSide}
          onSelect={(v) => update("houseSide", v)}
        />
      </Field>

      <Field label="Tính cách" optional>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: newPersonalityMode ? 10 : 0 }}>
          {personalityOptions.map((p) => {
            const active = form.personality === p;
            return (
              <button
                key={p}
                onClick={() => update("personality", active ? "" : p)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 999,
                  border: active ? "1px solid #1a1a18" : "1px solid #e0ded4",
                  background: active ? "#1a1a18" : "#fff",
                  color: active ? "#fff" : "#1a1a18",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                {p}
              </button>
            );
          })}
          <button
            onClick={() => setNewPersonalityMode(true)}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: "1px dashed #c9c7bb",
              background: "#fff",
              color: "#5f5e56",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Plus size={13} /> Tạo mới
          </button>
        </div>
        {newPersonalityMode && (
          <div style={{ display: "flex", gap: 8 }}>
            <input
              autoFocus
              style={{ ...inputStyle, flex: 1 }}
              placeholder="Nhập tính cách mới..."
              value={newPersonalityValue}
              onChange={(e) => setNewPersonalityValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmNewPersonality()}
            />
            <button
              onClick={confirmNewPersonality}
              style={{
                padding: "0 16px",
                borderRadius: 10,
                border: "none",
                background: "#1a1a18",
                color: "#fff",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Thêm
            </button>
          </div>
        )}
      </Field>

      <Field label="Khung giờ nên giao" optional>
        <input
          style={inputStyle}
          placeholder="Tránh 12h-13h trưa, sau 18h mới có nhà..."
          value={form.timeNote}
          onChange={(e) => update("timeNote", e.target.value)}
        />
      </Field>

      <Field label="Ghi chú thêm" optional>
        <textarea
          style={{ ...inputStyle, minHeight: 80, resize: "vertical", fontFamily: "inherit" }}
          placeholder="Ghi chú riêng của bạn về khách hàng này..."
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
        />
      </Field>

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            padding: "13px 0",
            borderRadius: 10,
            border: "1px solid #d9d9d3",
            background: "#fff",
            fontSize: 15,
            fontWeight: 500,
            color: "#1a1a18",
            cursor: "pointer",
          }}
        >
          Hủy
        </button>
        <button
          onClick={handleSubmit}
          style={{
            flex: 1,
            padding: "13px 0",
            borderRadius: 10,
            border: "none",
            background: "#1a1a18",
            fontSize: 15,
            fontWeight: 500,
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Lưu khách hàng
        </button>
      </div>
    </div>
  );
}

function ColorPicker({ colors, selected, onSelect }) {
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <button
        onClick={() => onSelect("")}
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: selected === "" ? "2px solid #1a1a18" : "1px solid #e0ded4",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "#b0afa5",
          fontSize: 11,
        }}
      >
        Không
      </button>
      {colors.map((c) => (
        <button
          key={c.name}
          onClick={() => onSelect(c.name)}
          title={c.name}
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: selected === c.name ? "2px solid #1a1a18" : "1px solid rgba(0,0,0,0.08)",
            background: c.hex,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {selected === c.name && <Check size={16} color="#fff" />}
        </button>
      ))}
    </div>
  );
}

// ---------- Main App ----------
export default function AppDemo() {
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ street: null, locationType: null, personality: null });
  const [filterOpen, setFilterOpen] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState(null);
  const [activeTab, setActiveTab] = useState("list"); // list | add | settings
  const [editing, setEditing] = useState(null);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q || c.name.toLowerCase().includes(q) || c.phone.includes(q);
      const matchesStreet = !filters.street || c.street === filters.street;
      const matchesType = !filters.locationType || c.locationType === filters.locationType;
      const matchesPersonality = !filters.personality || c.personality === filters.personality;
      return matchesSearch && matchesStreet && matchesType && matchesPersonality;
    });
  }, [customers, search, filters]);

  const handleSaveNew = (form) => {
    const newCustomer = {
      ...form,
      id: Date.now(),
      lat: 10.945 + Math.random() * 0.01,
      lng: 106.82 + Math.random() * 0.01,
      addressUpdatedAt: "Vừa xong",
    };
    setCustomers((prev) => [newCustomer, ...prev]);
    setActiveTab("list");
  };

  return (
    <div
      style={{
        maxWidth: 400,
        margin: "0 auto",
        height: 720,
        background: "#f7f6f1",
        display: "flex",
        flexDirection: "column",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        position: "relative",
        overflow: "hidden",
        borderRadius: 24,
        border: "1px solid #e0ded4",
      }}
    >
      {/* Header */}
      <div style={{ padding: "18px 20px 12px", background: "#f7f6f1" }}>
        <h1 style={{ fontSize: 20, fontWeight: 500, margin: "0 0 14px", color: "#1a1a18" }}>
          {activeTab === "list" ? "Khách hàng" : activeTab === "add" ? "Thêm khách hàng" : "Cài đặt"}
        </h1>

        {activeTab === "list" && (
          <div style={{ display: "flex", gap: 8 }}>
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#fff",
                border: "1px solid #e0ded4",
                borderRadius: 10,
                padding: "0 12px",
                height: 42,
              }}
            >
              <Search size={16} color="#b0afa5" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên hoặc SĐT..."
                style={{
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  flex: 1,
                  background: "transparent",
                  color: "#1a1a18",
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{ border: "none", background: "transparent", padding: 2, cursor: "pointer", color: "#b0afa5" }}
                  aria-label="Xóa tìm kiếm"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              onClick={() => setFilterOpen(true)}
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                border: activeFilterCount > 0 ? "1px solid #1a1a18" : "1px solid #e0ded4",
                background: activeFilterCount > 0 ? "#1a1a18" : "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                cursor: "pointer",
                flexShrink: 0,
              }}
              aria-label="Bộ lọc"
            >
              <SlidersHorizontal size={17} color={activeFilterCount > 0 ? "#fff" : "#1a1a18"} />
              {activeFilterCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: "#d85a30",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: activeTab === "list" ? "4px 20px 20px" : 0 }}>
        {activeTab === "list" && (
          <>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#b0afa5" }}>
                <Users size={32} style={{ marginBottom: 10, opacity: 0.5 }} />
                <p style={{ fontSize: 14, margin: 0 }}>Không tìm thấy khách hàng phù hợp</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filtered.map((c) => (
                  <CustomerCard key={c.id} customer={c} onOpen={setDetailCustomer} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "add" && (
          <CustomerForm onSave={handleSaveNew} onCancel={() => setActiveTab("list")} />
        )}

        {activeTab === "settings" && (
          <div style={{ padding: "4px 20px" }}>
            <p style={{ fontSize: 14, color: "#8a8a82" }}>
              Quản lý con đường, nhóm và danh sách tính cách tại đây (demo chưa triển khai).
            </p>
          </div>
        )}
      </div>

      {/* Bottom tab bar */}
      <div
        style={{
          display: "flex",
          borderTop: "0.5px solid #e0ded4",
          background: "#fff",
          padding: "8px 0 max(8px, env(safe-area-inset-bottom))",
        }}
      >
        <TabButton
          icon={Users}
          label="Danh sách"
          active={activeTab === "list"}
          onClick={() => setActiveTab("list")}
        />
        <TabButton
          icon={Plus}
          label="Thêm mới"
          active={activeTab === "add"}
          onClick={() => setActiveTab("add")}
        />
        <TabButton
          icon={Settings}
          label="Cài đặt"
          active={activeTab === "settings"}
          onClick={() => setActiveTab("settings")}
        />
      </div>

      {/* Filter bottom sheet */}
      <BottomSheet open={filterOpen} onClose={() => setFilterOpen(false)} title="Bộ lọc">
        <FilterPanel filters={filters} setFilters={setFilters} onClose={() => setFilterOpen(false)} />
      </BottomSheet>

      {/* Detail bottom sheet */}
      <BottomSheet open={!!detailCustomer} onClose={() => setDetailCustomer(null)}>
        {detailCustomer && <CustomerDetail customer={detailCustomer} />}
      </BottomSheet>
    </div>
  );
}



type TabButtonProps = {
  icon: LucideIcon,
  label: string,
  active: boolean,
  onClick: () => void
}

const TabButton = ({ icon, label, active, onClick }: TabButtonProps) => {
  const Icon  = icon;
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        color: active ? "#1a1a18" : "#b0afa5",
        padding: "4px 0",
      }}
    >
      <Icon />
      <span style={{ fontSize: 11, fontWeight: 500 }}>{label}</span>
    </button>
  );
}