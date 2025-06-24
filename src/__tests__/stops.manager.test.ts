import { describe, it, expect, beforeEach } from "vitest";
import { StopsManager } from "../stops/stops.manager";

describe("StopsManager", () => {
  beforeEach(() => {
    // Re-initialize before each test to ensure a clean state
    StopsManager.init();
  });

  it("initializes stops", () => {
    expect(StopsManager.stops.length).toBeGreaterThan(0);
  });

  it("update sets activeStop when player is near", () => {
    const stop = StopsManager.stops[0];
    StopsManager.update(stop.worldPositionX - 10, 0, 10);
    expect(StopsManager.activeStop).toBe(stop);
  });

  it("getCurrentZone returns correct zone", () => {
    const stop = StopsManager.stops[0];
    const zone = StopsManager.getCurrentZone(stop.worldPositionX);
    expect(zone.stopId).toBe(stop.id);
  });

  it("getAdjacentZones returns next and previous zones", () => {
    const stop = StopsManager.stops[1];
    const adj = StopsManager.getAdjacentZones(stop.worldPositionX - 1);
    expect(adj.next).not.toBeNull();
    expect(adj.previous).not.toBeNull();
  });

  // --- New tests for the end stop feature ---
  describe("End of the Road Stop", () => {
    it("initializes with an end stop after all other project stops", () => {
      const endStop = StopsManager.stops.find(
        (s) => s.id === "end_of_the_road"
      );
      expect(endStop).toBeDefined(); // This will fail until the stop is added
      if (!endStop) return;

      const lastProjectStop = StopsManager.stops.find(
        (s) => s.id === "project_truck_parts"
      );
      expect(lastProjectStop).toBeDefined();
      if (!lastProjectStop) return;

      expect(endStop.worldPositionX).toBeGreaterThan(
        lastProjectStop.worldPositionX
      );
    });

    it("identifies when player is in the end stop slowing zone", () => {
      const endStop = StopsManager.stops.find(
        (s) => s.id === "end_of_the_road"
      );
      expect(endStop).toBeDefined();
      if (!endStop) return;

      // Assume slowing zone starts, say, 500 units before the stop
      const slowingZoneStart = endStop.worldPositionX - 500;
      const playerWorldX = slowingZoneStart + 10;

      // This function doesn't exist yet, but we're testing for its future behavior.
      // It should return a value > 0 inside the zone.
      const brakingFactor = (StopsManager as any).getEndStopBrakingFactor(
        playerWorldX
      );
      expect(brakingFactor).toBeGreaterThan(0);
      expect(brakingFactor).toBeLessThanOrEqual(1);

      const outsideZoneX = slowingZoneStart - 10;
      const brakingFactorOutside = (
        StopsManager as any
      ).getEndStopBrakingFactor(outsideZoneX);
      expect(brakingFactorOutside).toBe(0);
    });

    it("identifies when player is at the end stop", () => {
      const endStop = StopsManager.stops.find(
        (s) => s.id === "end_of_the_road"
      );
      expect(endStop).toBeDefined();
      if (!endStop) return;

      const playerAtStopX = endStop.worldPositionX;
      const playerBeforeStopX = endStop.worldPositionX - 10;

      // This function also doesn't exist yet. It will be used for the hard stop.
      const atStop = (StopsManager as any).isPlayerAtEndStop(playerAtStopX);
      expect(atStop).toBe(true);

      const notAtStop = (StopsManager as any).isPlayerAtEndStop(
        playerBeforeStopX
      );
      expect(notAtStop).toBe(false);
    });
  });
});
