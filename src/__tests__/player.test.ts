import { describe, it, expect, beforeEach, vi } from "vitest";
import { Player } from "../player/player";
import * as input from "../input";
import { StopsManager } from "../stops/stops.manager";

describe("Player", () => {
  let player: Player;
  let game: any;

  beforeEach(() => {
    // Mock game object
    game = {
      world: { worldX: 0 },
      player: {},
      deltaTime: 1 / 60,
      gameTime: 0,
    };
    player = new Player(game);
    game.player = player;

    // Mock input to avoid depending on real key presses
    vi.spyOn(input.Input, "isMoveRightPressed").mockReturnValue(false);
    vi.spyOn(input.Input, "isMoveLeftPressed").mockReturnValue(false);
    vi.spyOn(input.Input, "isToggleHeadlightsJustPressed").mockReturnValue(
      false
    );

    // Mock particle emitters to keep tests clean
    vi.spyOn(player, "emitDustParticles").mockImplementation(() => {});
    vi.spyOn(player, "emitExhaustParticles").mockImplementation(() => {});
    vi.spyOn(player, "emitSpeedLines").mockImplementation(() => {});

    // Reset all mocks before each test
    vi.restoreAllMocks();
  });

  it("initializes with correct defaults", () => {
    expect(player.width).toBe(72);
    expect(player.height).toBe(36);
    expect(player.currentSpeed).toBe(0);
    expect(player.headlightsOn).toBe(false);
  });

  it("accelerates and decelerates", () => {
    vi.spyOn(input.Input, "isMoveRightPressed").mockReturnValue(true);
    player.update(1 / 60);
    expect(player.currentSpeed).toBeGreaterThan(0);

    vi.spyOn(input.Input, "isMoveRightPressed").mockReturnValue(false);
    // Let it decelerate for a bit
    player.update(1 / 60);
    expect(player.currentSpeed).toBeLessThan(player.maxSpeed);
  });

  it("toggles headlights", () => {
    vi.spyOn(input.Input, "isToggleHeadlightsJustPressed").mockReturnValue(
      true
    );
    player.headlightsOn = false;
    player.update(1 / 60);
    expect(player.headlightsOn).toBe(true);
  });

  // --- New tests for the end stop feature ---
  describe("End Stop Behavior", () => {
    beforeEach(() => {
      // Mock the hypothetical functions on StopsManager that will be implemented with the feature.
      // We are defining the "contract" that the Player class will use.
      vi.spyOn(StopsManager, "getEndStopBrakingFactor" as any).mockReturnValue(
        0
      );
      vi.spyOn(StopsManager, "isPlayerAtEndStop" as any).mockReturnValue(false);
    });

    it("gradually slows down when approaching the end stop, even when accelerating", () => {
      // Simulate being in the slowing zone by having the mock return a braking value
      vi.spyOn(StopsManager, "getEndStopBrakingFactor" as any).mockReturnValue(
        0.5
      );

      player.currentSpeed = player.maxSpeed;
      const initialSpeed = player.currentSpeed;

      // Simulate player holding down accelerate key
      vi.spyOn(input.Input, "isMoveRightPressed").mockReturnValue(true);

      player.update(1 / 60);

      // Speed should decrease due to the braking factor, despite acceleration input
      expect(player.currentSpeed).toBeLessThan(initialSpeed);
    });

    it("comes to a complete stop in the slowing zone", () => {
      // Simulate being deep in the slowing zone with maximum braking
      vi.spyOn(StopsManager, "getEndStopBrakingFactor" as any).mockReturnValue(
        1.0
      );
      player.currentSpeed = player.maxSpeed / 2;
      vi.spyOn(input.Input, "isMoveRightPressed").mockReturnValue(true);

      // Simulate for enough frames to guarantee a stop
      for (let i = 0; i < 300; i++) {
        player.update(1 / 60);
      }

      expect(player.currentSpeed).toBe(0);
    });

    it("cannot move forward when at the end stop", () => {
      // Simulate being exactly at the stop
      vi.spyOn(StopsManager, "isPlayerAtEndStop" as any).mockReturnValue(true);

      player.currentSpeed = 0;

      // Simulate player trying to move right
      vi.spyOn(input.Input, "isMoveRightPressed").mockReturnValue(true);

      player.update(1 / 60);

      // Speed should not become positive
      expect(player.currentSpeed).toBeLessThanOrEqual(0);
    });

    it("can move backward when at the end stop", () => {
      // Simulate being at the stop
      vi.spyOn(StopsManager, "isPlayerAtEndStop" as any).mockReturnValue(true);

      player.currentSpeed = 0;

      // Simulate player trying to move left
      vi.spyOn(input.Input, "isMoveLeftPressed").mockReturnValue(true);

      player.update(1 / 60);

      // Speed should become negative, indicating backward movement
      expect(player.currentSpeed).toBeLessThan(0);
    });
  });
});
