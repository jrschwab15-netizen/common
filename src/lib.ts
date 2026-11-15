import { createClient } from "@supabase/supabase-js";
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL ||
    "https://mtllkwmmuqmipavnxqpd.supabase.co",
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    "sb_publishable_iBm8XG4NUrxSSIxv7mq1zw_ox3c4HE8",
  {
    auth: {
      flowType: "pkce",
      detectSessionInUrl: false,
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);
export const categories = [
  "Litter / public bins",
  "Illegal dumping",
  "Pothole / road damage",
  "Sidewalk obstruction",
  "Public graffiti",
  "Park / trail maintenance",
  "Signs / drains / lighting",
  "Roadkill",
  "Stinging insects / nests",
  "Other non-emergency safety hazard",
  "Other public infrastructure",
];
export const publicPlaceTypes = [
  "Street / sidewalk", "Park / trail / playground", "Airport / public terminal",
  "Train / subway / bus station", "Public building / plaza", "Public waterfront / beach",
  "Other / unsure public place",
];
export function reportPlaceLabel(place: string, type = "") {
  return type && publicPlaceTypes.includes(type) ? `${type} · ${place.trim()}` : place.trim();
}
export type Place = {
  id: string;
  name: string;
  slug: string;
  county: string | null;
  municipality_type: string;
  source_version: string;
  imported_at: string;
  coverage?: Coverage;
  matched_alias?: string;
  boundary?: unknown;
};
export type Coverage = {
  directory_loaded: boolean;
  public_reporting_enabled: boolean;
  gis_responsibility_ready: boolean;
  agency_routing_ready: boolean;
  metrics_sufficient: boolean;
};
export type Report = {
  id: string;
  created_at: string;
  category: string;
  status: string;
  place_label: string;
  issue_id: string | null;
};
export async function api<T>(
  action: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL || "https://mtllkwmmuqmipavnxqpd.supabase.co"}/functions/v1/common-api`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey:
          import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
          "sb_publishable_iBm8XG4NUrxSSIxv7mq1zw_ox3c4HE8",
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ action, ...body }),
    },
  );
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      data.error || "The request could not be completed. Please retry.",
    );
  return data;
}
export function ageLabel(
  first: string,
  fixed?: string | null,
  now = Date.now(),
): string {
  const days = Math.max(
    0,
    Math.floor(
      ((fixed ? Date.parse(fixed) : now) - Date.parse(first)) / 86400000,
    ),
  );
  return fixed
    ? `Verified fixed after ${days} days`
    : `${days} ${days === 1 ? "day" : "days"} since first reported`;
}
export function emergencyText(note: string) {
  return /downed.{0,15}(line|wire)|live.{0,10}wire|\bfire\b|\binjur(y|ies|ed)\b|immediate.{0,15}danger|anaphyla(?:xis|ctic)|severe.{0,15}allergic.{0,10}reaction|(?:trouble|difficulty).{0,10}breathing/i.test(
    note,
  );
}
export function validPoint(lat: number, lng: number) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}
export async function validatePhoto(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Choose a JPEG, PNG or WebP photo.");
  if (file.size > 10 * 1024 * 1024 || file.size === 0)
    throw new Error("Photo must be between 1 byte and 10 MB.");
  const bitmap = await createImageBitmap(file);
  const valid =
    bitmap.width >= 200 &&
    bitmap.height >= 200 &&
    bitmap.width <= 12000 &&
    bitmap.height <= 12000;
  bitmap.close();
  if (!valid) throw new Error("Photo must be 200–12,000 pixels on each side.");
}
