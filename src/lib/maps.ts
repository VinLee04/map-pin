// lib/maps.ts

// Static Maps: trả về 1 tấm ảnh PNG, dùng cho preview nhanh (nhẹ pin, không
// cần load JS SDK). Cần bật "Maps Static API" trong Google Cloud Console.
// export const getStaticMapUrl = (latitude: number, longitude: number): string => {
//   const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
//   const params = new URLSearchParams({
//     center: `${latitude},${longitude}`,
//     zoom: "16",
//     size: "640x320",
//     scale: "2", // ảnh nét hơn trên màn hình retina, vẫn nhẹ vì chỉ là 1 request ảnh
//     markers: `color:red|${latitude},${longitude}`,
//   });
//   if (key) params.set("key", key);
//   return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
// };

// export const getGoogleMapsUrl = (latitude: number, longitude: number): string =>
//   `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`;

// export const getDirectionsUrl = (latitude: number, longitude: number): string =>
//   `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${latitude},${longitude}`)}`;

// lib/maps.ts
//
// Chỉ còn 2 hàm tạo URL mở Google Maps app/web ở chế độ deep link — đây là
// URL thường, KHÔNG gọi qua Google Maps Platform API nên không cần API key,
// không cần billing. Việc hiển thị bản đồ trong app dùng LocationPicker
// (Leaflet + OpenStreetMap) thay vì Static Maps.

export const getGoogleMapsUrl = (latitude: number, longitude: number): string =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`;

export const getDirectionsUrl = (latitude: number, longitude: number): string =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${latitude},${longitude}`)}`;