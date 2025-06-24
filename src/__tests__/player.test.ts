import { describe, it, expect, beforeEach, vi } from "vitest";
import { Player } from "../player/player";
import * as input from "../input";

describe("Player", () => {
  let player: Player;
  let game: any;

  beforeEach(() => {
    game = { world: { worldX: 0 }, player: {} };
    player = new Player(game);
    game.player = player;
    vi.resetAllMocks();
  });

  it("initializes with correct defaults", () => {
    expect(player.width).toBe(72);
    expect(player.height).toBe(36);
    expect(player.currentSpeed).toBe(0);
    expect(player.headlightsOn).toBe(false);
  });

  it("accelerates and decelerates", () => {
    vi.spyOn(player, "emitDustParticles").mockImplementation(() => {});
    vi.spyOn(player, "emitExhaustParticles").mockImplementation(() => {});
    vi.spyOn(player, "emitSpeedLines").mockImplementation(() => {});
    vi.spyOn(input.Input, "isMoveRightPressed").mockReturnValue(true);
    vi.spyOn(input.Input, "isMoveLeftPressed").mockReturnValue(false);
    player.update(1 / 60);
    expect(player.currentSpeed).toBeGreaterThan(0);
    vi.spyOn(input.Input, "isMoveRightPressed").mockReturnValue(false);
    vi.spyOn(input.Input, "isMoveLeftPressed").mockReturnValue(false);
    player.update(1 / 60);
    expect(player.currentSpeed).toBeLessThanOrEqual(player.maxSpeed);
  });

  it("toggles headlights", () => {
    vi.spyOn(input.Input, "isToggleHeadlightsJustPressed").mockReturnValue(
      true
    );
    player.headlightsOn = false;
    player.update(1 / 60);
    expect(player.headlightsOn).toBe(true);
  });
});
