// src/stops/stops.renderer.ts
import { Palettes } from "../palettes";
import { drawPixelRect, interpolateColor, lightenDarkenColor } from "../utils";
import { getRandomColor, getRandomInt } from "../utils";
import { drawPixelText } from "../font"; // Import drawPixelText

export const StopsRenderer = {
  drawDefaultMarker: (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    isActive: boolean,
    gameTime = 0
  ) => {
    const baseColor = isActive ? "yellow" : "orange";
    const detailColor = isActive ? "black" : "#333";

    let pulseFactor = 1.0;
    if (isActive) {
      pulseFactor = 1.0 + ((Math.sin(gameTime * 5) + 1) / 2) * 0.1;
    }

    drawPixelRect(
      ctx,
      x - 15 * pulseFactor,
      y - 60 * pulseFactor,
      30 * pulseFactor,
      60 * pulseFactor,
      baseColor
    );
    drawPixelRect(
      ctx,
      x - 12 * pulseFactor,
      y - 55 * pulseFactor,
      24 * pulseFactor,
      30 * pulseFactor,
      detailColor
    );
    if (isActive) {
      ctx.fillStyle = "yellow";
      ctx.font = "10px Courier New";
      ctx.textAlign = "center";
      ctx.fillText("!", x, y - 40);
      ctx.textAlign = "left";
    }
  },

  drawArcadeCabinet: (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    isActive: boolean,
    gameTime = 0
  ) => {
    const themePalette = Palettes.gaming;
    const cabinetWidth = 32;
    const cabinetHeight = 55;
    const baseHeight = 6;

    let mainColor = themePalette.objects_primary.base;
    let accentColor = themePalette.objects_primary.shadow;
    let highlightColor = themePalette.objects_primary.light;

    if (isActive) {
      const pulse = (Math.sin(gameTime * 6) + 1) / 2;
      mainColor = interpolateColor(
        themePalette.objects_primary.base,
        themePalette.objects_primary.light,
        pulse * 0.5
      );
    }

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
      x - cabinetWidth / 2,
      y - cabinetHeight,
      3,
      cabinetHeight - baseHeight,
      accentColor
    );
    drawPixelRect(
      ctx,
      x + cabinetWidth / 2 - 3,
      y - cabinetHeight,
      3,
      cabinetHeight - baseHeight,
      highlightColor
    );

    const cpWidth = cabinetWidth + 6;
    const controlPanelHeight = 10;
    const controlPanelColor = themePalette.objects_accent[0];
    drawPixelRect(
      ctx,
      x - cpWidth / 2,
      y - baseHeight - controlPanelHeight,
      cpWidth,
      controlPanelHeight,
      controlPanelColor
    );
    drawPixelRect(
      ctx,
      x - 5,
      y - baseHeight - controlPanelHeight - 6,
      4,
      6,
      accentColor
    );
    const joystickTopColor = themePalette.props[0];
    drawPixelRect(
      ctx,
      x - 6,
      y - baseHeight - controlPanelHeight - 9,
      6,
      3,
      joystickTopColor
    );

    drawPixelRect(
      ctx,
      x + 2,
      y - baseHeight - controlPanelHeight + 3,
      3,
      3,
      isActive ? themePalette.props[1] : themePalette.props[2]
    );
    drawPixelRect(
      ctx,
      x + 7,
      y - baseHeight - controlPanelHeight + 3,
      3,
      3,
      isActive ? themePalette.props[2] : themePalette.props[1]
    );

    const screenHeight = 18;
    drawPixelRect(
      ctx,
      x - cabinetWidth / 2 + 3,
      y - cabinetHeight + 5,
      cabinetWidth - 6,
      screenHeight + 10,
      accentColor
    );
    drawPixelRect(
      ctx,
      x - cabinetWidth / 2 + 5,
      y - cabinetHeight + 7,
      cabinetWidth - 10,
      screenHeight,
      "#000000"
    );

    if (isActive) {
      const screenFrame = Math.floor(gameTime * 2) % 3;
      const screenPixelSize = 2;
      const screenContentX = x - cabinetWidth / 2 + 6;
      const screenContentY = y - cabinetHeight + 8;
      const activeScreenColor = themePalette.emissive[0];
      const playerShipColor = themePalette.props[2];

      if (screenFrame === 0) {
        drawPixelRect(
          ctx,
          screenContentX + 4,
          screenContentY + 2,
          screenPixelSize * 2,
          screenPixelSize,
          activeScreenColor
        );
        drawPixelRect(
          ctx,
          screenContentX + 2,
          screenContentY + 4,
          screenPixelSize * 4,
          screenPixelSize,
          activeScreenColor
        );
        drawPixelRect(
          ctx,
          screenContentX,
          screenContentY + 6,
          screenPixelSize * 6,
          screenPixelSize,
          activeScreenColor
        );
        drawPixelRect(
          ctx,
          screenContentX + 2,
          screenContentY + 8,
          screenPixelSize,
          screenPixelSize,
          activeScreenColor
        );
        drawPixelRect(
          ctx,
          screenContentX + 8,
          screenContentY + 8,
          screenPixelSize,
          screenPixelSize,
          activeScreenColor
        );
      } else if (screenFrame === 1) {
        drawPixelRect(
          ctx,
          screenContentX + 6,
          screenContentY + 10,
          screenPixelSize * 2,
          screenPixelSize,
          playerShipColor
        );
        drawPixelRect(
          ctx,
          screenContentX + 4,
          screenContentY + 12,
          screenPixelSize * 4,
          screenPixelSize,
          playerShipColor
        );
      } else {
        const explosionColor = getRandomColor(themePalette.emissive);
        drawPixelRect(
          ctx,
          screenContentX + 4,
          screenContentY + 5,
          screenPixelSize * 3,
          screenPixelSize * 3,
          explosionColor
        );
      }
    }

    const marqueeHeight = 10;
    const marqueeAccentColor = themePalette.objects_accent[1];
    drawPixelRect(
      ctx,
      x - cabinetWidth / 2 - 2,
      y - cabinetHeight - marqueeHeight,
      cabinetWidth + 4,
      marqueeHeight,
      marqueeAccentColor
    );
    if (isActive) {
      drawPixelRect(
        ctx,
        x - 5,
        y - cabinetHeight - marqueeHeight + 3,
        10,
        4,
        themePalette.emissive[2]
      );
    } else {
      drawPixelRect(
        ctx,
        x - 5,
        y - cabinetHeight - marqueeHeight + 3,
        10,
        4,
        themePalette.objects_primary.shadow
      );
    }

    if (isActive) {
      const glowBaseColor = themePalette.emissive[0];
      ctx.globalAlpha = ((Math.sin(gameTime * 5) + 1) / 2) * 0.3 + 0.1;
      drawPixelRect(
        ctx,
        x - cabinetWidth / 2 - 5,
        y - cabinetHeight - marqueeHeight - 5,
        cabinetWidth + 10,
        cabinetHeight + marqueeHeight + baseHeight + 10,
        glowBaseColor
      );
      ctx.globalAlpha = 1.0;
    }
  },

  drawHolographicTerminal: (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    isActive: boolean,
    gameTime = 0
  ) => {
    const themePalette = Palettes.futuristic;
    const baseWidth = 40;
    const baseHeight = 10;
    const postHeight = 20;
    const screenWidth = 35;
    const screenHeight = 25;

    let primaryColor = themePalette.emissive[0];
    let baseStructColor = themePalette.objects_primary.base;

    if (isActive) {
      const pulse = (Math.sin(gameTime * 4) + 1) / 2;
      primaryColor = interpolateColor(
        themePalette.emissive[0],
        themePalette.emissive[1],
        pulse
      );
      baseStructColor = lightenDarkenColor(
        themePalette.objects_primary.base,
        Math.floor(pulse * 20)
      );
    }

    drawPixelRect(
      ctx,
      x - baseWidth / 2,
      y - baseHeight,
      baseWidth,
      baseHeight,
      baseStructColor
    );
    drawPixelRect(
      ctx,
      x - baseWidth / 2 + 2,
      y - baseHeight + 2,
      baseWidth - 4,
      baseHeight - 4,
      themePalette.objects_primary.shadow
    );
    drawPixelRect(
      ctx,
      x - 4,
      y - baseHeight - postHeight,
      8,
      postHeight,
      baseStructColor
    );

    const screenY = y - baseHeight - postHeight - screenHeight;
    const numLayers = isActive ? 4 : 2;
    for (let i = 0; i < numLayers; i++) {
      const layerAlpha = isActive ? 0.2 + i * 0.15 : 0.3 + i * 0.1;
      const layerOffset = isActive ? Math.sin(gameTime * 2 + i) * 3 : 0;
      const layerWidth = screenWidth + i * 4;
      const layerHeight = screenHeight + i * 2;

      ctx.globalAlpha = layerAlpha;
      drawPixelRect(
        ctx,
        x - layerWidth / 2,
        screenY - i * 2 + layerOffset,
        layerWidth,
        layerHeight,
        primaryColor
      );
      ctx.globalAlpha = 1.0;
    }

    ctx.strokeStyle = isActive
      ? themePalette.objects_accent[0]
      : themePalette.objects_primary.light;
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const lineYVal = screenY + 4 + i * (screenHeight / 5);
      const scrollOffset = isActive ? (gameTime * 15 + i * 5) % screenWidth : 0;
      ctx.beginPath();
      ctx.moveTo(
        Math.floor(x - screenWidth / 2 + 3 + scrollOffset),
        Math.floor(lineYVal)
      );
      ctx.lineTo(
        Math.floor(x - screenWidth / 2 + 3 + scrollOffset - 10),
        Math.floor(lineYVal)
      );
      ctx.stroke();

      if (isActive && Math.random() < 0.3) {
        drawPixelRect(
          ctx,
          x - screenWidth / 2 + getRandomInt(5, screenWidth - 10),
          lineYVal - 2,
          2,
          2,
          themePalette.emissive[2]
        );
      }
    }

    if (isActive) {
      ctx.globalAlpha = ((Math.sin(gameTime * 5) + 1) / 2) * 0.2 + 0.1;
      drawPixelRect(
        ctx,
        x - screenWidth / 2 - 10,
        screenY - 10,
        screenWidth + 20,
        screenHeight + 20,
        primaryColor
      );
      ctx.globalAlpha = 1.0;
    }
  },

  drawPixelWarehouse: (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    isActive: boolean,
    gameTime = 0
  ) => {
    const themePalette = Palettes.industrial;
    const buildingWidth = 55;
    const buildingHeight = 45;
    const roofHeight = 12;
    const doorWidth = 18;
    const doorHeight = 28;

    let mainColor = themePalette.objects_primary.base;
    let doorColor = themePalette.objects_accent[1];

    if (isActive) {
      const pulse = (Math.sin(gameTime * 3) + 1) / 2;
      mainColor = lightenDarkenColor(
        themePalette.objects_primary.base,
        Math.floor(pulse * 10)
      );
      doorColor = interpolateColor(
        themePalette.objects_accent[1],
        themePalette.emissive[0],
        pulse
      );
    }

    drawPixelRect(
      ctx,
      x - buildingWidth / 2,
      y - buildingHeight,
      buildingWidth / 3,
      buildingHeight,
      themePalette.objects_primary.shadow
    );
    drawPixelRect(
      ctx,
      x - buildingWidth / 2 + buildingWidth / 3,
      y - buildingHeight,
      buildingWidth / 3,
      buildingHeight,
      mainColor
    );
    drawPixelRect(
      ctx,
      x - buildingWidth / 2 + (buildingWidth * 2) / 3,
      y - buildingHeight,
      buildingWidth / 3,
      buildingHeight,
      themePalette.objects_primary.light
    );

    for (let i = 0; i < buildingHeight; i += 4) {
      drawPixelRect(
        ctx,
        x - buildingWidth / 2,
        y - buildingHeight + i,
        buildingWidth,
        1,
        lightenDarkenColor(mainColor, -20)
      );
    }

    ctx.fillStyle = themePalette.objects_primary.shadow;
    ctx.beginPath();
    ctx.moveTo(
      Math.floor(x - buildingWidth / 2 - 3),
      Math.floor(y - buildingHeight)
    );
    ctx.lineTo(
      Math.floor(x + buildingWidth / 2 + 3),
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
      x - buildingWidth / 2,
      y - buildingHeight - roofHeight,
      buildingWidth,
      2,
      lightenDarkenColor(themePalette.objects_primary.shadow, 20)
    );

    const doorX = x - doorWidth / 2;
    const doorY = y - doorHeight;
    drawPixelRect(ctx, doorX, doorY, doorWidth, doorHeight, doorColor);
    for (let i = 0; i < doorHeight; i += 6) {
      drawPixelRect(
        ctx,
        doorX,
        doorY + i,
        doorWidth,
        2,
        lightenDarkenColor(doorColor, -30)
      );
    }
    drawPixelRect(
      ctx,
      doorX + doorWidth / 2 - 2,
      doorY + doorHeight * 0.7,
      4,
      2,
      lightenDarkenColor(doorColor, -50)
    );

    if (isActive) {
      const lightOn = Math.floor(gameTime * 2) % 2 === 0;
      if (lightOn) {
        drawPixelRect(
          ctx,
          x - 2,
          y - buildingHeight - roofHeight - 5,
          4,
          3,
          themePalette.emissive[0]
        );
        ctx.globalAlpha = 0.3;
        drawPixelRect(
          ctx,
          x - 4,
          y - buildingHeight - roofHeight - 2,
          8,
          5,
          themePalette.emissive[0]
        );
        ctx.globalAlpha = 1.0;
      } else {
        drawPixelRect(
          ctx,
          x - 2,
          y - buildingHeight - roofHeight - 5,
          4,
          3,
          themePalette.objects_primary.shadow
        );
      }
    }

    drawPixelRect(
      ctx,
      x + buildingWidth / 2 - 15,
      y - buildingHeight + 5,
      10,
      8,
      themePalette.objects_primary.shadow
    );
    drawPixelRect(
      ctx,
      x + buildingWidth / 2 - 14,
      y - buildingHeight + 6,
      8,
      6,
      isActive ? themePalette.emissive[1] : themePalette.objects_accent[0]
    );

    if (isActive) {
      ctx.globalAlpha = ((Math.sin(gameTime * 5) + 1) / 2) * 0.15;
      drawPixelRect(
        ctx,
        x - buildingWidth / 2 - 5,
        y - buildingHeight - roofHeight - 5,
        buildingWidth + 10,
        buildingHeight + roofHeight + 10,
        themePalette.emissive[1]
      );
      ctx.globalAlpha = 1.0;
    }
  },

  // --- NEW RENDERER FUNCTION ---
  drawEndStopSign: (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    isActive: boolean,
    gameTime = 0
  ) => {
    const poleWidth = 6;
    const poleHeight = 60;
    const signSize = 32;
    const signY = y - poleHeight;

    // Draw pole
    drawPixelRect(
      ctx,
      x - poleWidth / 2,
      y - poleHeight,
      poleWidth,
      poleHeight,
      "#606060"
    );
    drawPixelRect(
      ctx,
      x - poleWidth / 2 + 1,
      y - poleHeight,
      poleWidth / 2,
      poleHeight,
      "#707070"
    );

    // Draw sign octagon
    const s = signSize / 2;
    const o = s * 0.414; // Offset for octagon corners
    const signColor = "#B00000";
    const borderColor = "#FFFFFF";

    ctx.fillStyle = borderColor;
    ctx.beginPath();
    ctx.moveTo(x - s + o, signY - s);
    ctx.lineTo(x + s - o, signY - s);
    ctx.lineTo(x + s, signY - s + o);
    ctx.lineTo(x + s, signY + s - o);
    ctx.lineTo(x + s - o, signY + s);
    ctx.lineTo(x - s + o, signY + s);
    ctx.lineTo(x - s, signY + s - o);
    ctx.lineTo(x - s, signY - s + o);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = signColor;
    const innerSignSize = signSize - 4;
    const is = innerSignSize / 2;
    const io = is * 0.414;
    ctx.beginPath();
    ctx.moveTo(x - is + io, signY - is);
    ctx.lineTo(x + is - io, signY - is);
    ctx.lineTo(x + is, signY - is + io);
    ctx.lineTo(x + is, signY + is - io);
    ctx.lineTo(x + is - io, signY + is);
    ctx.lineTo(x - is + io, signY + is);
    ctx.lineTo(x - is, signY + is - io);
    ctx.lineTo(x - is, signY - is + io);
    ctx.closePath();
    ctx.fill();

    // Draw "STOP" text
    drawPixelText(ctx, "STOP", x - 18, signY - 6, "#FFFFFF", 2);

    // Add flashing lights if active
    if (isActive) {
      const lightOn = Math.floor(gameTime * 4) % 2 === 0;
      if (lightOn) {
        const lightColor = "#FF0000";
        drawPixelRect(ctx, x - 4, signY - s - 8, 8, 4, lightColor);
        ctx.globalAlpha = 0.3;
        drawPixelRect(ctx, x - 6, signY - s - 10, 12, 8, lightColor);
        ctx.globalAlpha = 1.0;
      }
    }
  },
};
