import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ensureSession } from "@/lib/auth.functions";

const coordinatesSchema = z.object({
  latitude: z.number().finite().gte(-90).lte(90),
  longitude: z.number().finite().gte(-180).lte(180),
});

export const reverseGeocode = createServerFn({ method: "POST" })
  .validator(coordinatesSchema)
  .handler(async ({ data }) => {
    await ensureSession();
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_MAPS_API_KEY is not configured");

    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("latlng", `${data.latitude},${data.longitude}`);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("language", "vi");

    const response = await fetch(url);
    if (!response.ok) throw new Error("GEOCODING_REQUEST_FAILED");

    const result = (await response.json()) as {
      status: string;
      results?: Array<{ formatted_address: string; place_id: string }>;
      error_message?: string;
    };

    if (result.status !== "OK" || !result.results?.[0]) {
      throw new Error(result.error_message || `GEOCODING_${result.status}`);
    }

    return {
      formattedAddress: result.results[0].formatted_address,
      placeId: result.results[0].place_id,
    };
  });
