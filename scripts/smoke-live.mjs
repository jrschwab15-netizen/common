import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { writeFile } from "node:fs/promises";
const url = "https://mtllkwmmuqmipavnxqpd.supabase.co",
  key = "sb_publishable_iBm8XG4NUrxSSIxv7mq1zw_ox3c4HE8";
const s = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const call = async (body) => {
  const r = await fetch(`${url}/functions/v1/common-api`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: key },
    body: JSON.stringify(body),
  });
  return { status: r.status, body: await r.json() };
};
const checks = [];
const directory = await s
  .from("municipalities")
  .select("id,official_state_id,name,slug", { count: "exact" });
assert.equal(directory.count, 351);
assert.equal(new Set(directory.data.map((p) => p.official_state_id)).size, 351);
checks.push("Live directory: 351 unique municipalities");
for (const q of [
  "Arlington",
  "Cambridge",
  "Boston",
  "Springfield",
  "Worcester",
]) {
  const r = await s.rpc("search_places", { q });
  assert.ok(
    r.data?.some((p) => p.name.toLowerCase() === q.toLowerCase()),
    `${q}: ${JSON.stringify(r.error)}`,
  );
}
checks.push("Five known municipality searches");
const unauthorized = await call({ action: "my-reports" });
assert.equal(unauthorized.status, 401);
checks.push("Unauthenticated owner endpoint denied");
const privateRows = await s.from("submissions").select("*");
assert.ok(privateRows.error);
checks.push("Anonymous private table read denied");
const tokenRows = await s.from("submissions").select("claim_hash");
assert.ok(tokenRows.error);
checks.push("Claim hashes inaccessible");
const badToken = await call({
  action: "track",
  id: crypto.randomUUID(),
  token: "0".repeat(64),
});
assert.equal(badToken.status, 404);
checks.push("Unknown receipt denied");
const privateStorage = await s.storage.from("originals").list();
assert.equal(privateStorage.data?.length || 0, 0);
checks.push("Original bucket cannot be enumerated");
if (process.argv.includes("--intake")) {
  const { deflateSync } = await import("node:zlib");
  const crc32 = (b) => {
    let c = 0xffffffff;
    for (const v of b) {
      c ^= v;
      for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
    }
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (name, data) => {
    const type = Buffer.from(name);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([type, data])));
    return Buffer.concat([length, type, data, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(240, 0);
  ihdr.writeUInt32BE(240, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const pixels = Buffer.alloc((240 * 3 + 1) * 240, 200);
  for (let y = 0; y < 240; y++) pixels[y * 721] = 0;
  const photo = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(pixels)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  const draft = {
    action: "intake",
    idempotency_key: crypto.randomUUID(),
    lat: 42.36,
    lng: -71.06,
    place_label: "INTERNAL QA — synthetic test, not a real public issue",
    note: "INTERNAL QA FIXTURE. Never publish or route. Delete after verification.",
    category: "Other public infrastructure",
    confirmed: true,
    mime: "image/png",
    bytes: photo.length,
  };
  const intake = await call(draft);
  assert.equal(intake.status, 200, JSON.stringify(intake.body));
  assert.match(intake.body.token, /^[0-9a-f]{64}$/);
  const { id, token, path, upload_token } = intake.body;
  const retry = await call(draft);
  assert.equal(retry.body.id, id);
  assert.equal(retry.body.token, token);
  checks.push("Intake idempotency keeps one submission and stable receipt");
  const upload = await s.storage
    .from("originals")
    .uploadToSignedUrl(path, upload_token, photo, { contentType: "image/png" });
  assert.ifError(upload.error);
  const finalized = await call({ action: "finalize", id, token });
  assert.equal(finalized.status, 200, JSON.stringify(finalized.body));
  const tracked = await call({ action: "track", id, token });
  assert.equal(tracked.body.status, "under_review");
  assert.equal(tracked.body.note, undefined);
  checks.push("Real anonymous upload + private finalization + durable receipt");
  const publicImage = await fetch(
    `${url}/storage/v1/object/public/originals/${path}`,
  );
  assert.notEqual(publicImage.status, 200);
  checks.push("Unmoderated original inaccessible through public URL");
  const claimed = await call({ action: "claim", id, token });
  assert.equal(claimed.status, 401);
  checks.push("Unauthenticated claim denied");
  // Receipt token is intentionally never logged or written to test reports.
  await writeFile("tools/qa-fixture-id.txt", id);
  checks.push(
    "Fixture retained privately for database verification; never a public case",
  );
}
await writeFile(
  "docs/live-smoke-results.json",
  JSON.stringify(
    {
      checked_at: new Date().toISOString(),
      project_ref: "mtllkwmmuqmipavnxqpd",
      checks,
    },
    null,
    2,
  ),
);
console.log(checks.join("\n"));
