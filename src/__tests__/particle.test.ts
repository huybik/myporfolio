import { describe, it, expect } from "vitest";
import { Particle } from "../effects/particle";

describe("Particle", () => {
  it("constructor sets properties", () => {
    const p = new Particle(1, 2, 3, 4, 5, 6, "#fff", 0.5, "dust", "foreground");
    expect(p.x).toBe(1);
    expect(p.y).toBe(2);
    expect(p.vx).toBe(3);
    expect(p.vy).toBe(4);
    expect(p.lifespan).toBe(5);
    expect(p.size).toBe(6);
    expect(p.color).toBe("#fff");
    expect(p.alpha).toBe(0.5);
    expect(p.type).toBe("dust");
    expect(p.layer).toBe("foreground");
  });

  it("update changes position and reduces lifespan/alpha", () => {
    const p = new Particle(0, 0, 10, 0, 2, 1, "#fff", 1.0);
    p.gravity = 0;
    p.drag = 1.0;
    p.update(1);
    expect(p.x).toBe(10);
    expect(p.lifespan).toBe(1);
    expect(p.alpha).toBeCloseTo(0.5);
  });

  it("update applies gravity and drag", () => {
    const p = new Particle(0, 0, 10, 10, 2, 1, "#fff", 1.0);
    p.gravity = 2;
    p.drag = 0.5;
    p.update(1);
    expect(p.vy).toBeCloseTo((10 + 2) * 0.5);
    expect(p.vx).toBeCloseTo(10 * 0.5);
  });
});
