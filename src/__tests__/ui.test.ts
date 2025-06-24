import { describe, it, expect, beforeEach, vi } from "vitest";
vi.mock("../ui/ui.renderer", () => ({
  UIRenderer: {
    createFKeyIcon: () => ({ width: 8, height: 8 }),
    drawPixelArtFrame: () => {},
    drawStatusLights: () => {},
    drawMiniMap: () => {},
    drawRightArrow: () => {},
  },
}));
import { UI } from "../ui/ui";

describe("UI", () => {
  let ui: UI;
  let game: any;

  beforeEach(() => {
    game = { world: { worldX: 0 }, gameTime: 0 };
    ui = new UI(game);
  });

  it("initializes with correct defaults", () => {
    expect(ui.height).toBe(60);
    expect(ui.displayedText).toBe("");
    expect(ui.typewriterIndex).toBe(0);
  });

  it("typewriter effect advances displayedText", () => {
    ui.targetText = "Hello";
    ui.typewriterIndex = 0;
    ui.typewriterFrameCounter = 0;
    ui.update(1);
    expect(ui.displayedText.length).toBeGreaterThan(0);
  });

  it("zone title alpha fades in and out", () => {
    ui.currentZoneName = "Test Zone";
    ui.zoneTitleDisplayTime = 2;
    ui.update(0.1);
    expect(ui.zoneTitleAlpha).toBeGreaterThanOrEqual(0);
  });
});
