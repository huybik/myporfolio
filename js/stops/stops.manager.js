// js/stops/stops.manager.js
const StopsManager = {
  stops: [],
  activeStop: null,
  stopActivationRange: 120,
  zoneEntryLeadDistance: Config.CANVAS_WIDTH * 1.25,

  init() {
    const initialStopPosition = 2500;
    const distanceBetweenStops = 4500;

    this.stops = [
      {
        id: "project_ai_game",
        worldPositionX: initialStopPosition,
        theme: "gaming",
        promptText: "AI Game Project-[F] to Enter",
        markerAssetFunction: "drawArcadeCabinet", // Use string name
        markerScreenYOffset: 0,
        isReached: false,
      },
      {
        id: "project_ai_ta",
        worldPositionX: initialStopPosition + distanceBetweenStops,
        theme: "futuristic",
        promptText: "AI TA Project-[F] to Enter",
        markerAssetFunction: "drawHolographicTerminal", // Use string name
        markerScreenYOffset: 0,
        isReached: false,
      },
      {
        id: "project_truck_parts",
        worldPositionX: initialStopPosition + 2 * distanceBetweenStops,
        theme: "industrial",
        promptText: "Auto Parts Project-[F] to Enter",
        markerAssetFunction: "drawPixelWarehouse", // Use string name
        markerScreenYOffset: 0,
        isReached: false,
      },
    ];
    if (Config.DEBUG_MODE)
      console.log(
        "StopsManager initialized with " + this.stops.length + " stops."
      );
  },

  update(worldCurrentX, playerScreenX, playerWidth, game) {
    this.activeStop = null;
    const playerWorldCenterX = worldCurrentX + playerScreenX + playerWidth / 2;

    for (const stop of this.stops) {
      const distanceToStopMarker = Math.abs(
        playerWorldCenterX - stop.worldPositionX
      );
      if (distanceToStopMarker < this.stopActivationRange / 2) {
        this.activeStop = stop;
        if (Input.isInteractJustPressed()) {
          const linkURL = Config.STOP_LINKS[stop.id];
          if (linkURL) {
            if (Config.DEBUG_MODE) {
              console.log(
                `Interacting with stop: ${stop.promptText}, opening URL: ${linkURL}`
              );
            }
            window.open(linkURL, "_blank");
          }
        }
        break;
      }
    }
  },

  render(ctx, worldCurrentX, playerGroundY, gameTime) {
    this.stops.forEach((stop) => {
      const stopScreenX = stop.worldPositionX - worldCurrentX;
      if (
        stopScreenX > -this.stopActivationRange * 3 &&
        stopScreenX < Config.CANVAS_WIDTH + this.stopActivationRange * 3
      ) {
        const markerY = playerGroundY + stop.markerScreenYOffset;
        const isActiveMarker =
          this.activeStop && this.activeStop.id === stop.id;

        const rendererFunc =
          StopsRenderer[stop.markerAssetFunction] ||
          StopsRenderer.drawDefaultMarker;
        rendererFunc(ctx, stopScreenX, markerY, isActiveMarker, gameTime);

        if (Config.DEBUG_MODE && isActiveMarker) {
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

  getCurrentZone(worldCurrentX) {
    let currentZone = {
      name: "The Long Road",
      theme: "desert_start",
      skyColor: (Palettes.desert.sky && Palettes.desert.sky[0]) || "#FAD7A0",
      promptText: "Portfolio Drive",
      stopId: null,
    };

    for (let i = this.stops.length - 1; i >= 0; i--) {
      const stop = this.stops[i];
      const zoneStartPos = stop.worldPositionX - this.zoneEntryLeadDistance;

      if (worldCurrentX >= zoneStartPos) {
        let themePalette = Palettes[stop.theme] || Palettes.desert;
        currentZone = {
          name: `${
            stop.theme.charAt(0).toUpperCase() + stop.theme.slice(1)
          } Sector`,
          theme: stop.theme,
          skyColor: (themePalette.sky && themePalette.sky[0]) || "#87CEEB",
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
          skyColor:
            (Palettes.desert.sky && Palettes.desert.sky[0]) || "#FAD7A0",
          promptText: "The Journey Begins...",
          stopId: null,
        };
      }
    }
    return currentZone;
  },
};
StopsManager.init();
