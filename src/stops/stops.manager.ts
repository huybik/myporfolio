// src/stops/stops.manager.ts
import { Config } from "../config";
import { Palettes } from "../palettes";
import { StopsRenderer } from "./stops.renderer";

export interface Stop {
  id: string;
  worldPositionX: number;
  theme: string;
  promptText: string;
  markerAssetFunction: keyof typeof StopsRenderer;
  markerScreenYOffset: number;
  isReached: boolean;
}

export interface Zone {
  name: string;
  theme: string;
  skyColor: string;
  promptText: string;
  stopId: string | null;
}

export const StopsManager = {
  stops: [] as Stop[],
  activeStop: null as Stop | null,
  stopActivationRange: 120,
  zoneEntryLeadDistance: Config.CANVAS_WIDTH * 1.25,
  endStopSlowingDistance: 500, // The distance before the end stop where the car starts to slow down.

  init() {
    const initialStopPosition = 1500;
    const distanceBetweenStops = 2000;

    this.stops = [
      {
        id: "project_ai_game",
        worldPositionX: initialStopPosition,
        theme: "gaming",
        promptText: "Press [F] to visit AI Game Project",
        markerAssetFunction: "drawArcadeCabinet",
        markerScreenYOffset: 0,
        isReached: false,
      },
      {
        id: "project_ai_ta",
        worldPositionX: initialStopPosition + distanceBetweenStops,
        theme: "futuristic",
        promptText: "Press [F] to visit AI TA Project",
        markerAssetFunction: "drawHolographicTerminal",
        markerScreenYOffset: 0,
        isReached: false,
      },
      {
        id: "project_truck_parts",
        worldPositionX: initialStopPosition + 2 * distanceBetweenStops,
        theme: "industrial",
        promptText: "Press [F] to visit Auto Parts Project",
        markerAssetFunction: "drawPixelWarehouse",
        markerScreenYOffset: 0,
        isReached: false,
      },
      // --- NEW END STOP ---
      {
        id: "end_of_the_road",
        worldPositionX: initialStopPosition + 3 * distanceBetweenStops,
        theme: "industrial", // Keep the theme from the last zone
        promptText: "The end of the road.",
        markerAssetFunction: "drawEndStopSign",
        markerScreenYOffset: 0,
        isReached: false,
      },
    ];
    if (Config.DEBUG_MODE)
      console.log(
        "StopsManager initialized with " + this.stops.length + " stops."
      );
  },

  // --- NEW FUNCTION ---
  getEndStopBrakingFactor(playerWorldX: number): number {
    const endStop = this.stops.find((s) => s.id === "end_of_the_road");
    if (!endStop) return 0;

    const distanceToStop = endStop.worldPositionX - playerWorldX;
    if (distanceToStop > this.endStopSlowingDistance || distanceToStop < 0) {
      return 0;
    }

    // Player is in the slowing zone. Calculate a factor from 0 to 1.
    const progressIntoZone = 1 - distanceToStop / this.endStopSlowingDistance;
    return Math.max(0, Math.min(1, progressIntoZone));
  },

  // --- NEW FUNCTION ---
  isPlayerAtEndStop(playerWorldX: number): boolean {
    const endStop = this.stops.find((s) => s.id === "end_of_the_road");
    if (!endStop) return false;

    return playerWorldX >= endStop.worldPositionX;
  },

  update(worldCurrentX: number, playerScreenX: number, playerWidth: number) {
    this.activeStop = null;
    const playerWorldCenterX = worldCurrentX + playerScreenX + playerWidth / 2;

    for (const stop of this.stops) {
      // The end stop doesn't need to be "activated" in the same way for links.
      if (stop.id === "end_of_the_road") continue;

      const distanceToStopMarker = Math.abs(
        playerWorldCenterX - stop.worldPositionX
      );
      if (distanceToStopMarker < this.stopActivationRange / 2) {
        this.activeStop = stop;
        break;
      }
    }
  },

  render(
    ctx: CanvasRenderingContext2D,
    worldCurrentX: number,
    playerGroundY: number,
    gameTime: number
  ) {
    this.stops.forEach((stop) => {
      const stopScreenX = stop.worldPositionX - worldCurrentX;
      if (
        stopScreenX > -this.stopActivationRange * 3 &&
        stopScreenX < Config.CANVAS_WIDTH + this.stopActivationRange * 3
      ) {
        const markerY = playerGroundY + stop.markerScreenYOffset;

        // For the end stop, "isActive" can mean the player is in the slowing zone.
        const isSlowing =
          this.getEndStopBrakingFactor(
            worldCurrentX + Config.CANVAS_WIDTH / 2
          ) > 0;
        const isActiveMarker =
          !!(this.activeStop && this.activeStop.id === stop.id) ||
          (stop.id === "end_of_the_road" && isSlowing);

        const rendererFunc =
          StopsRenderer[stop.markerAssetFunction] ||
          StopsRenderer.drawDefaultMarker;
        rendererFunc(ctx, stopScreenX, markerY, isActiveMarker, gameTime);

        if (
          Config.DEBUG_MODE &&
          isActiveMarker &&
          stop.id !== "end_of_the_road"
        ) {
          ctx.strokeStyle = "yellow";
          ctx.lineWidth = 1;
          const debugRadius = this.stopActivationRange / 2;
          ctx.beginPath();
          ctx.arc(
            Math.floor(stopScreenX),
            Math.floor(markerY - 30),
            Math.floor(debugRadius),
            0,
            Math.PI * 2
          );
          ctx.stroke();
        }
      }
    });
  },

  getCurrentZone(worldCurrentX: number): Zone {
    let currentZone: Zone = {
      name: "The Long Road",
      theme: "desert_start",
      skyColor: Palettes.desert.sky[0],
      promptText: "Portfolio Drive",
      stopId: null,
    };

    for (let i = this.stops.length - 1; i >= 0; i--) {
      const stop = this.stops[i];
      const zoneStartPos = stop.worldPositionX - this.zoneEntryLeadDistance;

      if (worldCurrentX >= zoneStartPos) {
        const themePalette = (Palettes as any)[stop.theme] || Palettes.desert;
        currentZone = {
          name: `${
            stop.theme.charAt(0).toUpperCase() + stop.theme.slice(1)
          } Sector`,
          theme: stop.theme,
          skyColor: themePalette.sky[0] || "#87CEEB",
          promptText: stop.promptText,
          stopId: stop.id,
        };
        break;
      }
    }

    if (this.stops.length > 0) {
      const firstStop = this.stops[0];
      const firstZoneStartPos =
        firstStop.worldPositionX - this.zoneEntryLeadDistance;
      if (worldCurrentX < firstZoneStartPos) {
        currentZone = {
          name: "Desert Approach",
          theme: "desert_start",
          skyColor: Palettes.desert.sky[0],
          promptText: "The Journey Begins...",
          stopId: null,
        };
      }
    }
    return currentZone;
  },

  getAdjacentZones(worldCurrentX: number) {
    const getZoneName = (stop: Stop | undefined) => {
      if (!stop) return null;
      // Don't show "End Of The Road Sector" as a next zone.
      if (stop.id === "end_of_the_road") return null;
      return `${
        stop.theme.charAt(0).toUpperCase() + stop.theme.slice(1)
      } Sector`;
    };
    const desertZoneName = "The Long Road";

    let nextBoundary = Infinity;
    let nextZoneName: string | null = null;
    for (const stop of this.stops) {
      const boundary = stop.worldPositionX - this.zoneEntryLeadDistance;
      if (boundary > worldCurrentX) {
        nextBoundary = boundary;
        nextZoneName = getZoneName(stop);
        break;
      }
    }

    let prevBoundary = -Infinity;
    let prevZoneName: string | null = null;
    let prevStopIndex = -1;
    for (let i = this.stops.length - 1; i >= 0; i--) {
      const stop = this.stops[i];
      const boundary = stop.worldPositionX - this.zoneEntryLeadDistance;
      if (boundary <= worldCurrentX) {
        prevBoundary = boundary;
        prevStopIndex = i;
        break;
      }
    }

    if (prevStopIndex === -1) {
      prevZoneName = null;
    } else if (prevStopIndex === 0) {
      prevZoneName = desertZoneName;
    } else {
      prevZoneName = getZoneName(this.stops[prevStopIndex - 1]);
    }

    const fadeDistance = Config.CANVAS_WIDTH * 2.5;
    const distanceToNext = nextBoundary - worldCurrentX;
    const distancePastPrev = worldCurrentX - prevBoundary;

    let nextZoneInfo = null;
    if (nextZoneName && distanceToNext < fadeDistance) {
      nextZoneInfo = {
        name: nextZoneName,
        alpha: Math.max(0, 1.0 - distanceToNext / fadeDistance),
      };
    }

    let prevZoneInfo = null;
    if (prevZoneName && distancePastPrev < fadeDistance) {
      prevZoneInfo = {
        name: prevZoneName,
        alpha: Math.max(0, 1.0 - distancePastPrev / fadeDistance),
      };
    }

    return { previous: prevZoneInfo, next: nextZoneInfo };
  },
};
