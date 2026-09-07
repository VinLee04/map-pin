export const getGoogleMapsEmbedUrl = (latitude: number, longitude: number): string | null => {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  if (!key) return null;

  const params = new URLSearchParams({
    key,
    q: `${latitude},${longitude}`, // Đổi từ center thành q để hiện ghim đỏ
    zoom: "17",
    maptype: "roadmap",
  });

  return `https://www.google.com/maps/embed/v1/place?${params.toString()}`; // Đổi từ view thành place
};

export const getGoogleMapsUrl = (latitude: number, longitude: number): string =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`;

export const getDirectionsUrl = (latitude: number, longitude: number): string =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${latitude},${longitude}`)}`;