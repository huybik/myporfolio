import { describe, it, expect, beforeEach } from "vitest";
import { StopsManager } from "../stops/stops.manager";

describe("StopsManager", () => {
  beforeEach(() => {
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
});
