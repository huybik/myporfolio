// js/stops.js
const StopMarkers = {
  drawDefaultMarker: (ctx, x, y, isActive) => {
    drawPixelRect(ctx, x - 15, y - 60, 30, 60, isActive ? "yellow" : "orange");
    drawPixelRect(ctx, x - 12, y - 55, 24, 30, isActive ? "black" : "#333");
    if (isActive) {
      ctx.fillStyle = "yellow";
      ctx.font = "10px Courier New";
      ctx.textAlign = "center";
      ctx.fillText("!", x, y - 40);
      ctx.textAlign = "left";
    }
  },
  drawArcadeCabinet: (ctx, x, y, isActive) => {
    const cabinetWidth = 30;
    const cabinetHeight = 50;
    const screenHeight = 15;
    const controlPanelHeight = 8;
    const baseHeight = 5;
    const mainColor = isActive ? "#FFD700" : "#D3D3D3";
    const accentColor = "#808080";
    const screenColor = isActive ? "#00FF00" : "#008000";
    drawPixelRect(
      ctx,
      x - cabinetWidth / 2,
      y - baseHeight,
      cabinetWidth,
      baseHeight,
      accentColor
    );
    drawPixelRect(
      ctx,
      x - cabinetWidth / 2,
      y - cabinetHeight,
      cabinetWidth,
      cabinetHeight - baseHeight,
      mainColor
    );
    drawPixelRect(
      ctx,
      x - cabinetWidth / 2 - 2,
      y - baseHeight - controlPanelHeight,
      cabinetWidth + 4,
      controlPanelHeight,
      "#A0522D"
    );
    drawPixelRect(
      ctx,
      x - cabinetWidth / 2 + 3,
      y - cabinetHeight + 3,
      cabinetWidth - 6,
      screenHeight + 6,
      accentColor
    );
    drawPixelRect(
      ctx,
      x - cabinetWidth / 2 + 5,
      y - cabinetHeight + 5,
      cabinetWidth - 10,
      screenHeight,
      screenColor
    );
    if (isActive) {
      drawPixelRect(
        ctx,
        x - cabinetWidth / 2 + 7,
        y - cabinetHeight + 7,
        2,
        2,
        "#FFFF00"
      );
      drawPixelRect(
        ctx,
        x - cabinetWidth / 2 + 15,
        y - cabinetHeight + 10,
        3,
        2,
        "#FF00FF"
      );
    }
    drawPixelRect(
      ctx,
      x - cabinetWidth / 2,
      y - cabinetHeight - 8,
      cabinetWidth,
      8,
      "#FF6347"
    );
    if (isActive) {
      ctx.fillStyle = "black";
      ctx.font = "8px Courier New";
      ctx.textAlign = "center";
      ctx.fillText("AI", x, y - cabinetHeight - 1);
      ctx.textAlign = "left";
    }
  },
  drawHolographicTerminal: (ctx, x, y, isActive) => {
    const baseWidth = 35;
    const baseHeight = 8;
    const postHeight = 25;
    const screenWidth = 30;
    const screenHeight = 20;
    const primaryColor = isActive
      ? Palettes.futuristic.lights[0]
      : Palettes.futuristic.accents[1];
    const accentColor = Palettes.futuristic.buildings[2];
    drawPixelRect(
      ctx,
      x - baseWidth / 2,
      y - baseHeight,
      baseWidth,
      baseHeight,
      accentColor
    );
    drawPixelRect(
      ctx,
      x - 3,
      y - baseHeight - postHeight,
      6,
      postHeight,
      accentColor
    );
    const screenY = y - baseHeight - postHeight - screenHeight;
    if (isActive) {
      ctx.globalAlpha = 0.3;
      drawPixelRect(
        ctx,
        x - screenWidth / 2 - 5,
        screenY - 5,
        screenWidth + 10,
        screenHeight + 10,
        Palettes.futuristic.lights[0]
      );
      ctx.globalAlpha = 0.6;
      drawPixelRect(
        ctx,
        x - screenWidth / 2 - 2,
        screenY - 2,
        screenWidth + 4,
        screenHeight + 4,
        Palettes.futuristic.lights[0]
      );
      ctx.globalAlpha = 1.0;
    }
    drawPixelRect(
      ctx,
      x - screenWidth / 2,
      screenY,
      screenWidth,
      screenHeight,
      primaryColor
    );
    ctx.strokeStyle = isActive
      ? Palettes.futuristic.accents[0]
      : Palettes.futuristic.buildings[1];
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const lineY = screenY + 5 + i * 5;
      ctx.beginPath();
      ctx.moveTo(Math.floor(x - screenWidth / 2 + 3), Math.floor(lineY));
      ctx.lineTo(
        Math.floor(x + screenWidth / 2 - 3),
        Math.floor(lineY + (Math.random() - 0.5) * 2)
      );
      ctx.stroke();
    }
    if (isActive) {
      drawPixelRect(
        ctx,
        x - screenWidth / 2 + 5,
        screenY + 3,
        3,
        3,
        Palettes.futuristic.lights[1]
      );
      drawPixelRect(
        ctx,
        x + screenWidth / 2 - 8,
        screenY + screenHeight - 6,
        3,
        3,
        Palettes.futuristic.lights[2]
      );
    }
  },
  drawPixelWarehouse: (ctx, x, y, isActive) => {
    const buildingWidth = 50;
    const buildingHeight = 40;
    const roofHeight = 10;
    const doorWidth = 15;
    const doorHeight = 25;
    const mainColor = isActive
      ? Palettes.industrial.metal[1]
      : Palettes.industrial.buildings[0];
    const roofColor = Palettes.industrial.buildings[2];
    const doorColor = Palettes.industrial.metal[2];
    drawPixelRect(
      ctx,
      x - buildingWidth / 2,
      y - buildingHeight,
      buildingWidth,
      buildingHeight,
      mainColor
    );
    ctx.fillStyle = roofColor;
    ctx.beginPath();
    ctx.moveTo(
      Math.floor(x - buildingWidth / 2 - 5),
      Math.floor(y - buildingHeight)
    );
    ctx.lineTo(
      Math.floor(x + buildingWidth / 2 + 5),
      Math.floor(y - buildingHeight)
    );
    ctx.lineTo(
      Math.floor(x + buildingWidth / 2),
      Math.floor(y - buildingHeight - roofHeight)
    );
    ctx.lineTo(
      Math.floor(x - buildingWidth / 2),
      Math.floor(y - buildingHeight - roofHeight)
    );
    ctx.closePath();
    ctx.fill();
    drawPixelRect(
      ctx,
      x - doorWidth / 2,
      y - doorHeight,
      doorWidth,
      doorHeight,
      doorColor
    );
    drawPixelRect(
      ctx,
      x - doorWidth / 2,
      y - doorHeight + 5,
      doorWidth,
      2,
      lightenDarkenColor(doorColor, -30)
    );
    drawPixelRect(
      ctx,
      x - doorWidth / 2,
      y - doorHeight + 12,
      doorWidth,
      2,
      lightenDarkenColor(doorColor, -30)
    );
    if (isActive) {
      drawPixelRect(
        ctx,
        x + doorWidth / 2 + 3,
        y - doorHeight + 3,
        5,
        5,
        Palettes.gaming.props[1]
      );
      drawPixelRect(
        ctx,
        x - buildingWidth / 2 - 10,
        y - 10,
        8,
        10,
        Palettes.desert[2]
      );
      drawPixelRect(
        ctx,
        x - buildingWidth / 2 - 12,
        y - 15,
        10,
        5,
        Palettes.desert[1]
      );
    }
  },
};

const StopsManager = {
  stops: [],
  activeStop: null,
  stopActivationRange: 100,
  init() {
    this.stops = [
      {
        id: "project_ai_game",
        worldPositionX: 1500,
        theme: "gaming",
        linkURL: "https://example.com/ai-game-project",
        promptText: "Press [F] for AI Game Project",
        markerAssetFunction: StopMarkers.drawArcadeCabinet,
        markerScreenYOffset: 0,
        isReached: false,
      },
      {
        id: "project_ai_ta",
        worldPositionX: 3500,
        theme: "futuristic",
        linkURL: "https://example.com/ai-ta-project",
        promptText: "Press [F] for AI TA Project",
        markerAssetFunction: StopMarkers.drawHolographicTerminal,
        markerScreenYOffset: 0,
        isReached: false,
      },
      {
        id: "project_truck_parts",
        worldPositionX: 5500,
        theme: "industrial",
        linkURL: "https://example.com/truck-parts-project",
        promptText: "Press [F] for Truck Parts Project",
        markerAssetFunction: StopMarkers.drawPixelWarehouse,
        markerScreenYOffset: 0,
        isReached: false,
      },
    ];
    if (Config.DEBUG_MODE)
      console.log(
        "StopsManager initialized with " + this.stops.length + " stops."
      );
  },
  update(worldCurrentX, playerScreenX, playerWidth) {
    this.activeStop = null;
    const playerWorldCenterX = worldCurrentX + playerScreenX + playerWidth / 2;
    for (const stop of this.stops) {
      const distanceToStop = Math.abs(playerWorldCenterX - stop.worldPositionX);
      if (distanceToStop < this.stopActivationRange / 2) {
        this.activeStop = stop;
        break;
      }
    }
    if (this.activeStop && Input.isInteractPressed()) {
      Config.KeyBindings.INTERACT.forEach((key) => (Input.keys[key] = false));
      if (Config.DEBUG_MODE)
        console.log(
          `Interacting with stop: ${this.activeStop.id}, opening URL: ${this.activeStop.linkURL}`
        );
      window.open(this.activeStop.linkURL, "_blank");
    }
  },
  render(ctx, worldCurrentX, playerGroundY) {
    this.stops.forEach((stop) => {
      const stopScreenX = stop.worldPositionX - worldCurrentX;
      if (
        stopScreenX > -this.stopActivationRange * 2 &&
        stopScreenX < Config.CANVAS_WIDTH + this.stopActivationRange * 2
      ) {
        const markerY = playerGroundY + stop.markerScreenYOffset;
        const isActive = this.activeStop && this.activeStop.id === stop.id;
        if (typeof stop.markerAssetFunction === "function") {
          stop.markerAssetFunction(ctx, stopScreenX, markerY, isActive);
        } else {
          StopMarkers.drawDefaultMarker(ctx, stopScreenX, markerY, isActive);
        }
        if (Config.DEBUG_MODE && isActive) {
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
  getActiveStopPrompt() {
    return this.activeStop ? this.activeStop.promptText : null;
  },
  getCurrentZone(worldCurrentX) {
    let currentZone = {
      name: "The Wasteland",
      theme: "desert_start",
      skyColor: Palettes.desert[4],
    };
    for (let i = this.stops.length - 1; i >= 0; i--) {
      const stop = this.stops[i];
      const zoneEntryPosition =
        stop.worldPositionX -
        Config.CANVAS_WIDTH * 0.75 -
        Config.CANVAS_WIDTH * 0.5;
      if (worldCurrentX > zoneEntryPosition) {
        let skyColor = Palettes.desert[4];
        if (stop.theme === "gaming") skyColor = Palettes.gaming.sky[0];
        else if (stop.theme === "futuristic")
          skyColor = Palettes.futuristic.sky[0];
        else if (stop.theme === "industrial")
          skyColor = Palettes.industrial.sky[0];
        currentZone = {
          name: `${
            stop.theme.charAt(0).toUpperCase() + stop.theme.slice(1)
          } Zone`,
          theme: stop.theme,
          skyColor: skyColor,
        };
        break;
      }
    }
    if (
      this.stops.length > 0 &&
      worldCurrentX <
        this.stops[0].worldPositionX -
          Config.CANVAS_WIDTH * 0.75 -
          Config.CANVAS_WIDTH * 0.5
    ) {
      currentZone = {
        name: "Desert Drive",
        theme: "desert_start",
        skyColor: Palettes.desert[4],
      };
    }
    return currentZone;
  },
};
StopsManager.init();
