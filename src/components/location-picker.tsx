// components/location-picker.tsx
//
// Dùng React Leaflet + OpenStreetMap để chọn/kéo pin vị trí — miễn phí,
// không cần Google Cloud Billing. Sau khi chọn tọa độ, gọi Google
// Geocoding API (qua server function reverseGeocode có sẵn) để lấy địa
// chỉ dạng chữ hiển thị cho shipper.
//
// Cài đặt cần thiết:
//   npm install leaflet react-leaflet
//   npm install -D @types/leaflet
//
// Lưu ý: Leaflet đọc DOM trực tiếp nên phải import CSS của nó, và phải
// fix icon mặc định (bug phổ biến khi bundler không tự resolve được
// đường dẫn ảnh marker của Leaflet).

import { useEffect, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reverseGeocode } from "@/server/maps.functions";

// Fix icon mặc định của Leaflet bị vỡ khi build qua bundler (Vite/webpack)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DEFAULT_CENTER: [number, number] = [10.7769, 106.7009]; // TP.HCM, dùng khi chưa có vị trí nào

export type PickedLocation = {
  latitude: number;
  longitude: number;
  formattedAddress: string | null;
  placeId: string | null;
};

type LocationPickerProps = {
  value: { latitude: number; longitude: number } | null;
  onChange: (location: PickedLocation) => void;
  // Chế độ chỉ xem: tắt kéo/click/nút định vị, dùng cho preview nhanh trong
  // trang chi tiết (đỡ tương tác nhầm khi shipper chỉ muốn liếc vị trí).
  readOnly?: boolean;
  // Chiều cao tùy biến — preview trong trang chi tiết có thể muốn thấp hơn form.
  height?: number;
};

// Component con: lắng nghe sự kiện click trên bản đồ để đặt lại pin
function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

export function LocationPicker({ value, onChange, readOnly = false, height = 260 }: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number]>(
    value ? [value.latitude, value.longitude] : DEFAULT_CENTER,
  );
  const [isResolving, setIsResolving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Khi value từ bên ngoài đổi (ví dụ load dữ liệu khách hàng có sẵn), đồng bộ lại pin
  useEffect(() => {
    if (value) setPosition([value.latitude, value.longitude]);
  }, [value?.latitude, value?.longitude]);

  const resolveAddress = async (lat: number, lng: number) => {
    setIsResolving(true);
    setError(null);
    try {
      const result = await reverseGeocode({ data: { latitude: lat, longitude: lng } });
      onChange({
        latitude: lat,
        longitude: lng,
        formattedAddress: result.formattedAddress,
        placeId: result.placeId,
      });
    } catch (err) {
      // Vẫn lưu tọa độ dù geocode lỗi — tọa độ là thứ quan trọng nhất để chỉ đường
      onChange({ latitude: lat, longitude: lng, formattedAddress: null, placeId: null });
      setError(err instanceof Error ? err.message : "Không lấy được địa chỉ dạng chữ, nhưng đã lưu tọa độ.");
    } finally {
      setIsResolving(false);
    }
  };

  const handlePick = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    void resolveAddress(lat, lng);
  };

  const useCurrentPosition = () => {
    if (!navigator.geolocation) {
      setError("Thiết bị không hỗ trợ định vị.");
      return;
    }
    setIsLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setIsLocating(false);
        handlePick(coords.latitude, coords.longitude);
      },
      () => {
        setIsLocating(false);
        setError("Không lấy được vị trí. Hãy cho phép trình duyệt dùng vị trí của bạn.");
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
    );
  };

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-xl border" style={{ height }}>
        <MapContainer
          center={position}
          zoom={value ? 17 : 13}
          scrollWheelZoom={!readOnly}
          dragging={!readOnly}
          zoomControl={!readOnly}
          doubleClickZoom={!readOnly}
          touchZoom={!readOnly}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker
            position={position}
            draggable={!readOnly}
            ref={markerRef}
            eventHandlers={
              readOnly
                ? undefined
                : {
                    dragend: () => {
                      const marker = markerRef.current;
                      if (!marker) return;
                      const latlng = marker.getLatLng();
                      handlePick(latlng.lat, latlng.lng);
                    },
                  }
            }
          />
          {!readOnly && <ClickHandler onPick={handlePick} />}
        </MapContainer>

        {!readOnly && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="absolute bottom-3 right-3 z-1000 shadow-md"
            onClick={useCurrentPosition}
            disabled={isLocating}
          >
            {isLocating ? <Loader2 className="animate-spin" /> : <LocateFixed />}
            {isLocating ? "Đang định vị…" : "Vị trí hiện tại"}
          </Button>
        )}
      </div>

      {!readOnly && (
        <p className="text-xs text-muted-foreground">
          Chạm vào bản đồ hoặc kéo ghim để chọn đúng vị trí. Có thể phóng to để xem tên đường xung quanh.
        </p>
      )}

      {isResolving && <p className="text-xs text-muted-foreground">Đang tìm địa chỉ…</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}