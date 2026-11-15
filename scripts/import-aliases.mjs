import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
const source =
  "https://s3.us-east-1.amazonaws.com/download.massgis.digital.mass.gov/shapefiles/state/TOWNNAME_LOOKUP.zip";
if (!process.argv.includes("--local")) {
  const r = await fetch(source);
  if (!r.ok) throw Error(`Download failed ${r.status}`);
  await mkdir("data", { recursive: true });
  await writeFile("data/aliases.zip", new Uint8Array(await r.arrayBuffer()));
  const result = spawnSync(
    "powershell.exe",
    [
      "-NoProfile",
      "-Command",
      "Expand-Archive -LiteralPath data\\aliases.zip -DestinationPath data\\aliases -Force",
    ],
    { stdio: "inherit" },
  );
  if (result.status) throw Error("ZIP extraction failed");
}
const bytes = await readFile(
  "data/aliases/TOWNNAME_LOOKUP/TOWNNAME_LOOKUP.dbf",
);
const count = bytes.readUInt32LE(4),
  header = bytes.readUInt16LE(8),
  length = bytes.readUInt16LE(10),
  fields = [];
for (let pos = 32; pos < header - 1; pos += 32) {
  if (bytes[pos] === 13) break;
  fields.push({
    name: bytes
      .subarray(pos, pos + 11)
      .toString("ascii")
      .replace(/\0.*$/, ""),
    type: String.fromCharCode(bytes[pos + 11]),
    length: bytes[pos + 16],
  });
}
console.log({
  fields,
  count,
  encoding: (
    await readFile("data/aliases/TOWNNAME_LOOKUP/TOWNNAME_LOOKUP.cpg", "utf8")
  ).trim(),
});
if (
  !["ALT_NAME", "TOWN", "TOWN_ID", "COUNTY", "COMMENTS"].every((name) =>
    fields.some((f) => f.name === name),
  )
)
  throw Error("Alias schema changed; review required");
const encoding = (
  await readFile("data/aliases/TOWNNAME_LOOKUP/TOWNNAME_LOOKUP.cpg", "utf8")
).trim();
const decode = new TextDecoder(encoding),
  rows = [];
for (let i = 0; i < count; i++) {
  const start = header + i * length;
  if (bytes[start] === 42) continue;
  let offset = start + 1;
  const row = {};
  for (const f of fields) {
    row[f.name] = decode
      .decode(bytes.subarray(offset, offset + f.length))
      .trim();
    offset += f.length;
  }
  rows.push(row);
}
const municipalities = JSON.parse(
  await readFile("data/municipalities.geojson", "utf8"),
).features;
const ids = new Set(municipalities.map((f) => String(f.properties.TOWN_ID)));
const valid = [],
  unmatched = [],
  seen = new Set();
for (const row of rows) {
  const id = String(Number(row.TOWN_ID));
  const alias = row.ALT_NAME.normalize("NFC").trim();
  const normalized = alias
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (!alias || !ids.has(id)) {
    unmatched.push(row);
    continue;
  }
  const key = id + ":" + normalized;
  if (seen.has(key)) continue;
  seen.add(key);
  valid.push({
    official_state_id: id,
    alias,
    alias_normalized: normalized,
    alias_type: "alternate",
    source_comment: row.COMMENTS,
  });
}
const zip = await readFile("data/aliases.zip");
const manifest = {
  source_url: source,
  metadata_url:
    "https://www.mass.gov/info-details/massgis-data-massachusetts-community-names-lookup-table",
  retrieved_at: new Date().toISOString(),
  source_version: `dbf-${1900 + bytes[1]}-${String(bytes[2]).padStart(2, "0")}-${String(bytes[3]).padStart(2, "0")}`,
  checksum: createHash("sha256").update(zip).digest("hex"),
  dbf_checksum: createHash("sha256").update(bytes).digest("hex"),
  records: count,
  approved_aliases: valid.length,
  unmatched: unmatched.length,
  encoding,
  license: "MassGIS public records; see source metadata",
  fields,
};
await writeFile(
  "data/aliases-manifest.json",
  JSON.stringify(manifest, null, 2),
);
await writeFile(
  "data/aliases-unmatched.json",
  JSON.stringify(unmatched, null, 2),
);
await writeFile("data/aliases-validated.json", JSON.stringify(valid));
console.log({
  aliases: valid.length,
  unmatched: unmatched.length,
  examples: valid.filter((v) =>
    /^(east arlington|jamaica plain)$/i.test(v.alias),
  ),
});
