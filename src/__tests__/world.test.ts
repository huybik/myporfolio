import { describe, it, expect, beforeEach } from "vitest";
import { World } from "../world/world";

describe("World", () => {
  let world: World;
  let game: any;

  beforeEach(() => {
    game = { player: { currentSpeed: 0 }, world: {} };
    world = new World(game);
    game.world = world;
  });

  it("initializes with correct theme and sky", () => {
    expect(world.currentTheme).toBe("desert_start");
    expect(world.currentTopSky).toBeTruthy();
  });

  it("updates worldX on update", () => {
    const prevX = world.worldX;
    world.update(10);
    expect(world.worldX).toBe(prevX + 10);
  });

  it("handles theme change", () => {
    const zone = { theme: "gaming" } as any;
    world.handleThemeChange(zone);
    expect(world.isTransitioning).toBe(true);
    world.transitionProgress = 1;
    world.update(0);
    expect(world.isTransitioning).toBe(false);
    expect(world.currentTheme).toBe("gaming");
  });
});
