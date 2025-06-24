import { describe, it, expect } from "vitest";
import { Palettes } from "../palettes";

describe("Palettes", () => {
  it("vehicle palette has required keys", () => {
    expect(Palettes.vehicle).toHaveProperty("CAR_BODY_MAIN");
    expect(Palettes.vehicle).toHaveProperty("CAR_HEADLIGHT_ON");
    expect(Array.isArray(Palettes.vehicle.DUST_COLOR)).toBe(true);
  });

  it("desert palette has ground and sky arrays", () => {
    expect(Array.isArray(Palettes.desert.ground)).toBe(true);
    expect(Array.isArray(Palettes.desert.sky)).toBe(true);
  });

  it("ui palette has minimap colors", () => {
    expect(Palettes.ui).toHaveProperty("MINIMAP_PLAYER");
    expect(Palettes.ui).toHaveProperty("MINIMAP_STOP_DEFAULT");
  });
});
