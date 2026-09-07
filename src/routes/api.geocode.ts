import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/geocode")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { lat, lng } = await request.json();
        if (typeof lat !== "number" || typeof lng !== "number") {
          return Response.json({ message: "Tọa độ không hợp lệ" }, { status: 400 });
        }

        const key = process.env.GOOGLE_MAPS_API_KEY;
        if (!key) return Response.json({ message: "Thiếu GOOGLE_MAPS_API_KEY" }, { status: 500 });

        const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
        url.searchParams.set("latlng", `${lat},${lng}`);
        url.searchParams.set("key", key);
        url.searchParams.set("language", "vi");

        const googleResponse = await fetch(url);
        if (!googleResponse.ok) return Response.json({ message: "Google Geocoding lỗi" }, { status: 502 });
        const data = await googleResponse.json();
        const result = data.results?.[0];

        return Response.json({ formattedAddress: result?.formatted_address, placeId: result?.place_id });
      },
    },
  },
});
