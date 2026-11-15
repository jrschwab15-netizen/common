import { describe, it, expect } from "vitest";
import { ageLabel, emergencyText, validPoint } from "./lib";
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
  ])("detects emergency %s", (text) => expect(emergencyText(text)).toBe(true));
  it("keeps ordinary intake available", () =>
    expect(emergencyText("Litter beside the public bin")).toBe(false));
  it("rejects impossible coordinates", () => {
    expect(validPoint(91, -71)).toBe(false);
    expect(validPoint(42, NaN)).toBe(false);
    expect(validPoint(42.3, -71.1)).toBe(true);
  });
});
