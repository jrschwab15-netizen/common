import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
const url = process.env.SUPABASE_URL,
  key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key)
  throw Error(
    "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in this process only. Never use VITE_ for a backend credential.",
  );
const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const features = JSON.parse(
    await readFile("data/municipalities.geojson", "utf8"),
  ).features,
  manifest = JSON.parse(await readFile("data/massgis-manifest.json", "utf8"));
const r = await db.rpc("import_massgis", {
  p_features: features,
  p_manifest: manifest,
});
if (r.error) throw Error(`Municipality import failed: ${r.error.message}`);
console.log(`Municipalities changed: ${r.data}`);
const aliases = JSON.parse(
    await readFile("data/aliases-validated.json", "utf8"),
  ),
  aliasManifest = JSON.parse(
    await readFile("data/aliases-manifest.json", "utf8"),
  );
const a = await db.rpc("import_massgis_aliases", {
  p_rows: aliases,
  p_manifest: aliasManifest,
});
if (a.error) throw Error(`Alias import failed: ${a.error.message}`);
console.log(`Aliases changed: ${a.data}`);
const count = await db
  .from("municipalities")
  .select("id", { count: "exact", head: true })
  .eq("state_code", "MA");
if (count.count !== 351) throw Error("Live count is not 351");
console.log(
  "Live database verified: 351 municipalities. Run SQL geometry acceptance checks too.",
);
