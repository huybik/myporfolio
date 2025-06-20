// js/ui/ui.renderer.js
const UIRenderer = {
  // I.1.C UI Elements: Frames
  drawPixelArtFrame(ctx, x, y, width, height, themeColors = Palettes.ui) {
    const outerDark = themeColors.FRAME_DARK || "#101010";
    const midLight = themeColors.FRAME_LIGHT || "#404040";
    const innerHighlight = themeColors.FRAME_HIGHLIGHT || "#606060";
    const thickness = 2; // Each band thickness

    drawPixelRect(ctx, x, y, width, height, outerDark);
    drawPixelRect(
      ctx,
      x + thickness,
      y + thickness,
      width - thickness * 2,
      height - thickness * 2,
      midLight
    );
    drawPixelRect(
      ctx,
      x + thickness * 2,
      y + thickness * 2,
      width - thickness * 4,
      height - thickness * 4,
      innerHighlight
    );
  },

  drawSimplePixelBorder(ctx, x, y, width, height, color, thickness = 1) {
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    for (let i = 0; i < thickness; i++) {
      ctx.strokeRect(
        Math.floor(x) + i + 0.5,
        Math.floor(y) + i + 0.5,
        Math.floor(width) - 1 - i * 2,
        Math.floor(height) - 1 - i * 2
      );
    }
  },

  createFKeyIcon(fontSettings) {
    const size = 8 * fontSettings.scale;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    const s = fontSettings.scale;
    drawPixelRect(ctx, 0, 0, 8 * s, 8 * s, Palettes.ui.BUTTON_F_KEY_BG);
    drawPixelRect(
      ctx,
      1 * s,
      1 * s,
      6 * s,
      6 * s,
      lightenDarkenColor(Palettes.ui.BUTTON_F_KEY_BG, 20)
    );

    const fData = PixelFontData["F"];
    const charOffsetX = 2 * s;
    const charOffsetY = 1 * s;
    ctx.fillStyle = Palettes.ui.BUTTON_F_KEY_FG;
    for (let r = 0; r < fData.length; r++) {
      for (let c = 0; c < fData[r].length; c++) {
        if (fData[r][c] === 1) {
          drawPixelRect(
            ctx,
            charOffsetX + c * s,
            charOffsetY + r * s,
            s,
            s,
            Palettes.ui.BUTTON_F_KEY_FG
          );
        }
      }
    }
    return canvas;
  },

  drawRightArrow(ctx, x, y, size, color) {
    const s = Math.max(1, Math.floor(size / 6));
    const shaftWidth = s * 3;
    const shaftHeight = s * 2;

    // shaft
    drawPixelRect(ctx, x, y - shaftHeight / 2, shaftWidth, shaftHeight, color);

    // head
    const headStartX = x + shaftWidth;
    // Base of the arrow head (tallest part)
    drawPixelRect(ctx, headStartX, y - s * 3, s, s * 6, color);
    // Middle part
    drawPixelRect(ctx, headStartX + s, y - s * 2, s, s * 4, color);
    // Tip (pointy part)
    drawPixelRect(ctx, headStartX + s * 2, y - s, s, s * 2, color);
  },

  // I.1.C UI Icons: Status Lights
  drawStatusLights(ctx, ui, panelY) {
    const lightSize = 8 * ui.fontSettings.scale;
    const padding = 5 * ui.fontSettings.scale;
    const startX = padding + 20;
    const lightY = panelY + (ui.height - lightSize) / 2;

    const status = [
      {
        active: ui.game.player.currentSpeed !== 0,
        colorOn: "#00AA00",
        colorOff: "#550000",
        icon: "engine",
      },
      {
        active: !!StopsManager.activeStop,
        colorOn: "#FFAA00",
        colorOff: "#553300",
        icon: "signal",
      },
      {
        active: ui.game.player.headlightsOn,
        colorOn: "#FFFF00",
        colorOff: "#555500",
        icon: "light",
      },
    ];

    status.forEach((s, i) => {
      let lightColor = s.active ? s.colorOn : s.colorOff;
      if (s.active && (s.icon === "signal" || s.icon === "light")) {
        if (Math.floor((ui.game.gameTime * 3) / 8) % 2 === 0) {
          lightColor = lightenDarkenColor(lightColor, -40);
        }
      }

      drawPixelRect(
        ctx,
        startX + i * (lightSize + padding),
        lightY,
        lightSize,
        lightSize,
        lightColor
      );
      this.drawSimplePixelBorder(
        ctx,
        startX + i * (lightSize + padding),
        lightY,
        lightSize,
        lightSize,
        lightenDarkenColor(lightColor, -30),
        ui.fontSettings.scale > 1 ? 2 : 1
      );
    });
  },

  // I.1.C UI Icons: Minimap & III.1.C Minimap Enhancements
  drawMiniMap(ctx, ui, panelY) {
    const mapDimension = ui.height - 10 * ui.fontSettings.scale;
    const mapWidth = mapDimension;
    const mapHeight = mapDimension;

    const mapX = Config.CANVAS_WIDTH - mapWidth - 15 * ui.fontSettings.scale;
    const mapY = panelY + (ui.height - mapHeight) / 2;

    this.drawPixelArtFrame(
      ctx,
      mapX - 3,
      mapY - 3,
      mapWidth + 6,
      mapHeight + 6
    );
    drawPixelRect(ctx, mapX, mapY, mapWidth, mapHeight, ui.infoScreenColor);

    const texColor = Palettes.ui.MINIMAP_TEXTURE;
    for (let mx = 0; mx < mapWidth; mx += 4 * ui.fontSettings.scale) {
      for (let my = 0; my < mapHeight; my += 4 * ui.fontSettings.scale) {
        if (
          (mx / (4 * ui.fontSettings.scale) +
            my / (4 * ui.fontSettings.scale)) %
            2 ===
          0
        ) {
          drawPixelRect(
            ctx,
            mapX + mx,
            mapY + my,
            2 * ui.fontSettings.scale,
            2 * ui.fontSettings.scale,
            texColor
          );
        }
      }
    }

    const playerIconSize = 3 * ui.fontSettings.scale;
    const playerMapX = mapX + mapWidth * 0.2 - playerIconSize / 2;
    const playerMapY = mapY + mapHeight / 2 - playerIconSize / 2;

    drawPixelRect(
      ctx,
      playerMapX,
      playerMapY,
      playerIconSize,
      playerIconSize,
      Palettes.ui.MINIMAP_PLAYER
    );
    drawPixelRect(
      ctx,
      playerMapX + playerIconSize,
      playerMapY + playerIconSize / 3,
      playerIconSize / 3,
      playerIconSize / 3,
      Palettes.ui.MINIMAP_PLAYER
    );

    const mapRangeWorldUnits = StopsManager.zoneEntryLeadDistance * 2.5;
    const mapDisplayRangePixels = mapWidth * 0.7;

    StopsManager.stops.forEach((stop, stopIndex) => {
      const distanceToPlayer = stop.worldPositionX - ui.game.world.worldX;
      const normalizedDist = distanceToPlayer / mapRangeWorldUnits;

      if (normalizedDist < 1 && normalizedDist > -0.2) {
        const stopDotSize = 2 * ui.fontSettings.scale;
        const stopDotX = playerMapX + normalizedDist * mapDisplayRangePixels;
        const yOffset =
          (stopIndex - (StopsManager.stops.length - 1) / 2) *
          (stopDotSize * 2.5);
        const stopDotY = mapY + mapHeight / 2 - stopDotSize / 2 + yOffset;

        if (
          stopDotX >= mapX &&
          stopDotX < mapX + mapWidth - stopDotSize &&
          stopDotY >= mapY &&
          stopDotY < mapY + mapHeight - stopDotSize
        ) {
          let stopColor = Palettes.ui.MINIMAP_STOP_DEFAULT;
          if (stop.theme === "gaming")
            stopColor = Palettes.ui.MINIMAP_STOP_GAMING;
          else if (stop.theme === "futuristic")
            stopColor = Palettes.ui.MINIMAP_STOP_FUTURISTIC;
          else if (stop.theme === "industrial")
            stopColor = Palettes.ui.MINIMAP_STOP_INDUSTRIAL;

          if (
            StopsManager.activeStop &&
            StopsManager.activeStop.id === stop.id
          ) {
            const pulse = (Math.sin(ui.game.gameTime) + 1) / 2;
            const pulseSizeIncrease = Math.floor(
              pulse * 2 * ui.fontSettings.scale
            );
            const s = stopDotSize + pulseSizeIncrease;
            drawPixelRect(
              ctx,
              Math.floor(stopDotX - (s - stopDotSize) / 2),
              Math.floor(stopDotY - (s - stopDotSize) / 2),
              s,
              s,
              lightenDarkenColor(stopColor, 30)
            );
          } else {
            drawPixelRect(
              ctx,
              Math.floor(stopDotX),
              Math.floor(stopDotY),
              stopDotSize,
              stopDotSize,
              stopColor
            );
          }
        }
      }
    });

    let nextStopForBoundary = null;
    for (const stop of StopsManager.stops) {
      if (
        stop.worldPositionX - StopsManager.zoneEntryLeadDistance >
        ui.game.world.worldX
      ) {
        nextStopForBoundary = stop;
        break;
      }
    }
    if (nextStopForBoundary) {
      const boundaryWorldX =
        nextStopForBoundary.worldPositionX - StopsManager.zoneEntryLeadDistance;
      const distanceToBoundary = boundaryWorldX - ui.game.world.worldX;
      const normalizedBoundaryDist = distanceToBoundary / mapRangeWorldUnits;

      if (normalizedBoundaryDist < 1 && normalizedBoundaryDist >= 0) {
        const boundaryLineX =
          playerMapX + normalizedBoundaryDist * mapDisplayRangePixels;
        const boundaryLineWidth = 1 * ui.fontSettings.scale;

        if (
          boundaryLineX >= mapX &&
          boundaryLineX < mapX + mapWidth - boundaryLineWidth
        ) {
          ctx.globalAlpha = 0.3;
          drawPixelRect(
            ctx,
            Math.floor(boundaryLineX),
            mapY,
            boundaryLineWidth,
            mapHeight,
            Palettes.ui.FRAME_HIGHLIGHT
          );
          ctx.globalAlpha = 1.0;
        }
      }
    }
  },
};
