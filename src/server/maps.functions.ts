// server/maps.functions.ts

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSessionOrFallback } from "@/lib/auth.functions";

const coordinatesSchema = z.object({
  latitude: z.number().finite().gte(-90).lte(90),
  longitude: z.number().finite().gte(-180).lte(180),
});

// Nominatim (OpenStreetMap) — miễn phí, không cần API key, không cần billing.
// Chính sách sử dụng yêu cầu: tối đa 1 request/giây, kèm User-Agent định danh
// ứng dụng. Với quy mô nội bộ (1 vài shipper) không cần lo giới hạn này.
// https://operations.osmfoundation.org/policies/nominatim/
export const reverseGeocode = createServerFn({ method: "POST" })
  .validator(coordinatesSchema)
  .handler(async ({ data }) => {
    await getSessionOrFallback();

    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", String(data.latitude));
    url.searchParams.set("lon", String(data.longitude));
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("accept-language", "vi");
    url.searchParams.set("zoom", "18"); // mức chi tiết cao nhất (đến từng tòa nhà)

    const response = await fetch(url, {
      headers: {
        // Bắt buộc theo chính sách của Nominatim — thay bằng tên/domain thật của app bạn
        "User-Agent": "MapPinShipperApp/1.0 (contact: viinhloii2310@gmail.com)",
      },
    });

    if (!response.ok) throw new Error("GEOCODING_REQUEST_FAILED");

    const result = (await response.json()) as {
      display_name?: string;
      place_id?: number;
      error?: string;
    };

    if (result.error || !result.display_name) {
      throw new Error(result.error || "GEOCODING_NO_RESULT");
    }

    return {
      formattedAddress: result.display_name,
      placeId: result.place_id != null ? String(result.place_id) : null,
    };
  });