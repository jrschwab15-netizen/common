import { describe, it, expect } from "vitest";
import { ageLabel, emergencyText, validPoint, reportPlaceLabel, categories } from "./lib";
import serverSource from "../supabase/functions/common-api/index.ts?raw";
describe("issue history clocks", () => {
  it("keeps the first report clock", () => {
    expect(
      ageLabel(
        "2026-01-01T00:00:00Z",
        null,
        Date.parse("2026-01-19T00:00:00Z"),
      ),
    ).toBe("18 days since first reported");
  });
  it("freezes only at independent verification", () => {
    expect(ageLabel("2026-01-01T00:00:00Z", "2026-01-21T00:00:00Z")).toBe(
      "Verified fixed after 20 days",
    );
  });
  it("clamps future clock skew", () =>
    expect(ageLabel("2027-01-01T00:00:00Z", null, 0)).toBe(
      "0 days since first reported",
    ));
});
describe("safety input gates", () => {
  it.each([
    "downed power line",
    "live wire",
    "a fire by the drain",
    "injured person",
    "severe allergic reaction",
    "difficulty breathing",
    "anaphylaxis after a sting",
  ])("detects emergency %s", (text) => expect(emergencyText(text)).toBe(true));
  it("keeps ordinary intake available", () =>
    expect(emergencyText("Litter beside the public bin")).toBe(false));
  it("rejects impossible coordinates", () => {
    expect(validPoint(91, -71)).toBe(false);
    expect(validPoint(42, NaN)).toBe(false);
    expect(validPoint(42.3, -71.1)).toBe(true);
  });
});
describe("public-place report intake", () => {
  it("keeps non-emergency nest reports available", () => {
    expect(emergencyText("Wasp nest beside a public path; no immediate threat" )).toBe(false);
  });
  it("preserves facility context in the existing private location field", () => {
    expect(reportPlaceLabel("  Terminal B public entrance  ", "Airport / public terminal")).toBe("Airport / public terminal · Terminal B public entrance");
    expect(reportPlaceLabel("Park entrance")).toBe("Park entrance");
  });
  it("keeps frontend and server category validation aligned", () => {
    const server = serverSource.match(/const categories=(\[[^;]+\]);/)![1];
    expect(JSON.parse(server.replaceAll("'", '"'))).toEqual(categories);
  });
  it("enforces the same emergency gate on the server", () => {
    const pattern = serverSource.match(/if\(\/(downed[^\n]+)\/i\.test\(b\.note\)\)/)![1];
    const serverEmergency = new RegExp(pattern, "i");
    for (const note of ["a fire by the drain", "injured person", "severe allergic reaction", "difficulty breathing", "wasp nest beside a public path"]) {
      expect(serverEmergency.test(note)).toBe(emergencyText(note));
    }
  });
});
