import { mkdir, writeFile, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
export const itemUrl =
  "https://www.arcgis.com/sharing/rest/content/items/54538f2f92d04c34957e6c2d460d0e5a?f=json";
const layer =
  "https://services1.arcgis.com/hGdibHYSPO59RG1h/arcgis/rest/services/Massachusetts_Municipalities_Hosted/FeatureServer/0";
export const slugify = (name, id) =>
  `${name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}-ma-${id}`;
export function validate(features) {
  if (
    features.length !== 351 ||
    new Set(features.map((f) => f.properties.TOWN_ID)).size !== 351
  )
    throw Error("Expected exactly 351 unique official TOWN_ID values");
  for (const f of features) {
    if (
      !Number.isInteger(f.properties.TOWN_ID) ||
      f.properties.TOWN_ID < 1 ||
      f.properties.TOWN_ID > 351 ||
      !f.properties.TOWN ||
      !["C", "T", "TC"].includes(f.properties.TYPE) ||
      !["MultiPolygon", "Polygon"].includes(f.geometry?.type)
    )
      throw Error(`Invalid municipality ${f.properties.TOWN_ID}`);
  }
}
const sql = (v) =>
  v == null ? "null" : `'${String(v).replaceAll("'", "''")}'`;
if (process.argv[1]?.endsWith("import-massgis.mjs")) {
  await mkdir("data", { recursive: true });
  const get = async (url) => {
    const r = await fetch(url);
    if (!r.ok) throw Error(`Download failed: ${r.status} ${url}`);
    return r;
  };
  const metadata = await (await get(itemUrl)).json(),
    schema = await (await get(`${layer}?f=json`)).json();
  if (
    metadata.owner !== "MassGIS" ||
    !["TOWN_ID", "TOWN", "TYPE", "COUNTY"].every((n) =>
      schema.fields.some((f) => f.name === n),
    )
  )
    throw Error(
      "Authoritative source owner or schema changed; review required",
    );
  const url = `${layer}/query?where=1%3D1&outFields=TOWN,TOWN_ID,TYPE,COUNTY&outSR=4326&f=geojson&orderByFields=TOWN_ID`;
  const raw = await (await get(url)).text(),
    collection = JSON.parse(raw);
  validate(collection.features);
  const checksum = createHash("sha256").update(raw).digest("hex"),
    version = new Date(schema.editingInfo.dataLastEditDate).toISOString();
  const manifest = {
    source_url: url,
    metadata_url: itemUrl,
    owner: metadata.owner,
    retrieved_at: new Date().toISOString(),
    source_version: version,
    item_modified: new Date(metadata.modified).toISOString(),
    checksum,
    record_count: 351,
    original_crs: schema.spatialReference,
    output_crs: "EPSG:4326",
    license: metadata.licenseInfo,
    geometry_repairs: [],
    fields: schema.fields.map((f) => ({ name: f.name, domain: f.domain })),
  };
  let previous;
  try {
    previous = JSON.parse(await readFile("data/massgis-manifest.json", "utf8"));
  } catch {}
  console.log(
    JSON.stringify({
      records: 351,
      checksum,
      changed: previous?.checksum !== checksum,
      types: collection.features.reduce(
        (a, f) => ((a[f.properties.TYPE] = (a[f.properties.TYPE] || 0) + 1), a),
        {},
      ),
    }),
  );
  if (process.argv.includes("--dry-run")) process.exit(0);
  await writeFile("data/municipalities.geojson", raw);
  await writeFile(
    "data/massgis-manifest.json",
    JSON.stringify(manifest, null, 2),
  );
  const statement = `begin; select public.import_massgis(${sql(JSON.stringify(collection.features))}::jsonb,${sql(JSON.stringify(manifest))}::jsonb); commit;`;
  await writeFile("data/massgis-import.sql", statement);
  console.log(
    "Prepared SQL; database is NOT seeded until SQL is applied and the live count/geometry queries pass.",
  );
}
