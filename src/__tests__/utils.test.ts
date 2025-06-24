import { describe, it, expect, vi } from "vitest";
import {
  drawPixelRect,
  drawPixel,
  getRandomInt,
  getRandomFloat,
  getRandomColor,
} from "../utils";

describe("utils", () => {
  it("getRandomInt returns integer in range", () => {
    for (let i = 0; i < 100; i++) {
      const val = getRandomInt(1, 5);
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(5);
      expect(Number.isInteger(val)).toBe(true);
    }
  });

  it("getRandomFloat returns float in range", () => {
    for (let i = 0; i < 100; i++) {
      const val = getRandomFloat(1, 5);
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThan(5);
    }
  });

  it("getRandomColor returns a color from palette", () => {
    const palette = ["#fff", "#000", "#123"];
    for (let i = 0; i < 10; i++) {
      expect(palette).toContain(getRandomColor(palette));
    }
  });

  it("drawPixelRect calls fillRect with correct args", () => {
    const ctx = { fillStyle: "", fillRect: vi.fn() } as any;
    drawPixelRect(ctx, 1.2, 2.7, 3.9, 4.1, "#abc");
    expect(ctx.fillStyle).toBe("#abc");
    expect(ctx.fillRect).toHaveBeenCalledWith(1, 2, 3, 4);
  });

  it("drawPixel calls fillRect with correct args", () => {
    const ctx = { fillStyle: "", fillRect: vi.fn() } as any;
    drawPixel(ctx, 2.5, 3.5, "#def", 2);
    expect(ctx.fillStyle).toBe("#def");
    expect(ctx.fillRect).toHaveBeenCalledWith(5, 7, 2, 2);
  });
});
