// src/world/renderer.ts
import {
  drawPixelRect,
  getRandomColor,
  getRandomFloat,
  getRandomInt,
  lightenDarkenColor,
} from "../utils";
import { Palettes } from "../palettes";
import { World } from "./world";
import { Config } from "../config";

// Define a base interface for all world elements
export interface WorldElement {
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  size?: number;
  radius?: number;
  color?: string;
  colors?: any;
  originalColor: string;
  tempColor?: string; // For temporary color changes like tinting
  scrollSpeedFactor?: number;
  isEmissive?: boolean;
  canRandomizeYOnWrap?: boolean;
  update?: (deltaTime: number, gameTime: number) => void;
  [key: string]: any; // Allow other properties
}

export const WorldRenderer = {
  getSideColor(objectPalette: any, sideType: "light" | "shadow" | "base") {
    if (!objectPalette || typeof objectPalette !== "object") {
      return "#FF00FF";
    }
    switch (sideType) {
      case "light":
        return objectPalette.light || objectPalette.base || "#FFFFFF";
      case "shadow":
        return objectPalette.shadow || objectPalette.base || "#000000";
      case "base":
      default:
        return objectPalette.base || "#808080";
    }
  },

  drawElement(
    ctx: CanvasRenderingContext2D,
    element: WorldElement,
    gameTime: number,
    world: World
  ) {
    const drawColor = element.tempColor || element.color || "#FF00FF";
    const scrollSpeedFactor = element.scrollSpeedFactor || 1.0;

    let yOffset = 0;
    const activeThemeForHaze = world.isTransitioning
      ? world.transitionTargetTheme
      : world.currentTheme;
    if (
      activeThemeForHaze === "desert_start" &&
      scrollSpeedFactor < 0.3 &&
      element.y > world.groundLevelY * 0.7
    ) {
      const waveAmplitude = 0.5 + scrollSpeedFactor * 2;
      const waveFrequency = 0.03;
      yOffset =
        Math.sin(element.x * waveFrequency + gameTime * 3) * waveAmplitude;
    }
    const drawY = element.y + yOffset;

    switch (element.type) {
      case "rect":
        drawPixelRect(
          ctx,
          element.x,
          drawY,
          element.width!,
          element.height!,
          drawColor
        );
        break;

      case "star":
        const currentAlpha = ctx.globalAlpha;
        const blinkFactor =
          element.blinkFactor !== undefined
            ? element.blinkFactor
            : (Math.sin(gameTime * element.blinkRate + element.blinkPhase) +
                1) /
              2;
        ctx.globalAlpha *= element.initialBrightness * blinkFactor;
        drawPixelRect(
          ctx,
          element.x,
          drawY,
          element.size!,
          element.size!,
          drawColor
        );
        ctx.globalAlpha = currentAlpha;
        break;

      case "celestial_body":
        const celAlpha = ctx.globalAlpha;
        ctx.globalAlpha *= 0.5;
        drawPixelRect(
          ctx,
          element.x - element.radius! * 1.2,
          drawY - element.radius! * 1.2,
          element.radius! * 2.4,
          element.radius! * 2.4,
          element.glowColor
        );
        ctx.globalAlpha = celAlpha;
        drawPixelRect(
          ctx,
          element.x - element.radius!,
          drawY - element.radius!,
          element.radius! * 2,
          element.radius! * 2,
          drawColor
        );
        if (element.celestialType === "tech_moon") {
          drawPixelRect(
            ctx,
            element.x - element.radius! * 0.8,
            drawY - element.radius! * 0.2,
            element.radius! * 1.6,
            element.radius! * 0.4,
            lightenDarkenColor(drawColor, -30)
          );
          drawPixelRect(
            ctx,
            element.x - element.radius! * 0.2,
            drawY - element.radius! * 0.8,
            element.radius! * 0.4,
            element.radius! * 1.6,
            lightenDarkenColor(drawColor, -30)
          );
          if (Math.floor(gameTime * 3) % 2 === 0) {
            drawPixelRect(
              ctx,
              element.x + getRandomFloat(-1, 1) * element.radius! * 0.7,
              drawY + getRandomFloat(-1, 1) * element.radius! * 0.7,
              2,
              2,
              Palettes.futuristic.emissive[1]
            );
          }
        } else if (
          element.celestialType === "glitch_moon" &&
          Math.floor(gameTime * 10) % 3 === 0
        ) {
          const glitchColor = getRandomColor(Palettes.gaming.emissive);
          drawPixelRect(
            ctx,
            element.x - element.radius! + getRandomInt(-5, 5),
            drawY - element.radius! + getRandomInt(-5, 5),
            element.radius! * 2 + getRandomInt(-2, 2),
            element.radius! * 2 + getRandomInt(-2, 2),
            glitchColor
          );
        } else if (element.celestialType === "sun") {
          const numRays = 8;
          for (let i = 0; i < numRays; i++) {
            const angle = (i / numRays) * Math.PI * 2 + gameTime * 0.1;
            const rayLength = element.radius! * 1.5;
            const rayStartX =
              element.x + Math.cos(angle) * element.radius! * 0.8;
            const rayStartY = drawY + Math.sin(angle) * element.radius! * 0.8;
            const rayEndX = element.x + Math.cos(angle) * rayLength;
            const rayEndY = drawY + Math.sin(angle) * rayLength;
            ctx.globalAlpha =
              celAlpha * 0.15 * ((Math.sin(gameTime * 2 + i) + 1) / 2);
            ctx.strokeStyle = element.glowColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(rayStartX, rayStartY);
            ctx.lineTo(rayEndX, rayEndY);
            ctx.stroke();
          }
          ctx.globalAlpha = celAlpha;
        }
        break;

      case "pixelCloud":
        const blockSize = Math.max(2, Math.floor(element.width! / 10));
        const numPuffs =
          Math.floor(element.width! / blockSize) *
          Math.floor(element.height! / blockSize) *
          0.7;
        for (let i = 0; i < numPuffs; i++) {
          const puffX =
            element.x + Math.random() * (element.width! - blockSize);
          const puffY = drawY + Math.random() * (element.height! - blockSize);
          const puffColor =
            Math.random() < 0.7 ? element.colors[0] : element.colors[1];
          drawPixelRect(
            ctx,
            puffX,
            puffY,
            blockSize * getRandomFloat(0.8, 1.5),
            blockSize * getRandomFloat(0.8, 1.5),
            puffColor
          );
        }
        break;

      case "nebula":
        const nebulaAlpha = ctx.globalAlpha;
        const numParticles = Math.floor(
          (element.width! * element.height! * element.density) / 25
        );
        for (let i = 0; i < numParticles; i++) {
          const px = element.x + Math.random() * element.width!;
          const py = drawY + Math.random() * element.height!;
          const psize = getRandomInt(3, 8);
          ctx.globalAlpha = nebulaAlpha * getRandomFloat(0.3, 0.7);
          drawPixelRect(
            ctx,
            px,
            py,
            psize,
            psize,
            getRandomColor(element.colors)
          );
        }
        ctx.globalAlpha = nebulaAlpha;
        break;

      case "rect_simple_mountain":
        drawPixelRect(
          ctx,
          element.x,
          drawY,
          element.width!,
          element.height!,
          drawColor
        );
        drawPixelRect(
          ctx,
          element.x,
          drawY,
          element.width! * 0.3,
          element.height!,
          lightenDarkenColor(drawColor, -15)
        );
        drawPixelRect(
          ctx,
          element.x + element.width! * 0.7,
          drawY,
          element.width! * 0.3,
          element.height!,
          lightenDarkenColor(drawColor, 15)
        );
        break;

      case "mesa":
        const hThird = element.height! / 3;
        drawPixelRect(
          ctx,
          element.x,
          drawY,
          element.width!,
          hThird,
          this.getSideColor(element.colors, "light")
        );
        drawPixelRect(
          ctx,
          element.x,
          drawY + hThird,
          element.width!,
          hThird,
          this.getSideColor(element.colors, "base")
        );
        drawPixelRect(
          ctx,
          element.x,
          drawY + hThird * 2,
          element.width!,
          hThird,
          this.getSideColor(element.colors, "shadow")
        );
        for (let i = 0; i < 5; i++) {
          const lineX = element.x + getRandomInt(5, element.width! - 5);
          drawPixelRect(
            ctx,
            lineX,
            drawY + hThird,
            1,
            hThird * 2,
            lightenDarkenColor(this.getSideColor(element.colors, "base"), -20)
          );
        }
        break;

      case "cactus":
        drawPixelRect(
          ctx,
          element.x,
          drawY,
          element.width!,
          element.height!,
          drawColor
        );
        const armWidth = element.width! * 0.75;
        const armHeight = element.height! * 0.4;
        if (element.height! > 25) {
          drawPixelRect(
            ctx,
            element.x - armWidth,
            drawY + element.height! * 0.2,
            armWidth,
            armHeight * 0.5,
            drawColor
          );
          drawPixelRect(
            ctx,
            element.x + element.width!,
            drawY + element.height! * 0.3,
            armWidth,
            armHeight * 0.5,
            drawColor
          );
        }
        break;

      case "rock_pile":
        const numRocks = getRandomInt(3, 7);
        for (let i = 0; i < numRocks; i++) {
          const rSize = element.size! * getRandomFloat(0.3, 0.6);
          const rX = element.x + (Math.random() - 0.5) * element.size! * 0.5;
          const rY =
            drawY + element.size! - rSize - Math.random() * element.size! * 0.3;
          drawPixelRect(
            ctx,
            rX,
            rY,
            rSize,
            rSize,
            getRandomColor(element.colors)
          );
        }
        break;

      case "textured_ground_rect":
        drawPixelRect(
          ctx,
          element.x,
          drawY,
          element.width!,
          element.height!,
          element.baseColor
        );
        if (!element.details) {
          element.details = [];
          const numDetails = Math.floor(
            (element.width! * element.height!) /
              (element.textureType === "futuristic_guideways" ? 100 : 200)
          );
          for (let i = 0; i < numDetails; i++) {
            const detail: any = {};
            detail.x_offset = Math.random() * element.width!;
            detail.y_offset = Math.random() * element.height! * 0.3;
            detail.color = getRandomColor(element.detailColors);
            if (element.textureType === "desert_cracks_pebbles") {
              detail.w =
                Math.random() < 0.5 ? getRandomInt(5, 15) : getRandomInt(1, 3);
              detail.h =
                Math.random() < 0.5 ? getRandomInt(1, 3) : getRandomInt(5, 15);
            } else if (element.textureType === "gaming_grid_flowers") {
              detail.w = getRandomInt(2, 4);
              detail.h = getRandomInt(2, 4);
              if (Math.random() < 0.1)
                detail.color = Palettes.gaming.emissive[2];
            } else if (element.textureType === "futuristic_guideways") {
              detail.w =
                Math.random() < 0.7
                  ? element.width! * getRandomFloat(0.3, 0.8)
                  : getRandomInt(3, 6);
              detail.h =
                Math.random() < 0.7 ? getRandomInt(1, 2) : getRandomInt(3, 6);
              if (detail.h <= 2 && Math.random() < 0.8) {
                detail.color = getRandomColor(Palettes.futuristic.emissive);
              }
            } else if (element.textureType === "industrial_asphalt_cracks") {
              detail.w =
                Math.random() < 0.5 ? getRandomInt(10, 30) : getRandomInt(2, 5);
              detail.h =
                Math.random() < 0.5 ? getRandomInt(1, 3) : getRandomInt(2, 5);
              if (Math.random() < 0.05) {
                detail.color = Palettes.industrial.emissive[0];
              }
            } else {
              detail.w = getRandomInt(2, 8);
              detail.h = getRandomInt(2, 8);
            }
            element.details.push(detail);
          }
        }
        element.details.forEach((detail: any) => {
          const detailDrawX = element.x + detail.x_offset;
          const detailDrawY = element.y + detail.y_offset + (drawY - element.y);
          drawPixelRect(
            ctx,
            detailDrawX,
            detailDrawY,
            detail.w,
            detail.h,
            detail.color
          );
        });
        break;

      case "debris":
        if (
          element.debrisType === "wire" ||
          element.debrisType === "rusty_pipe_fragment" ||
          element.debrisType === "circuit_piece"
        ) {
          drawPixelRect(
            ctx,
            element.x,
            drawY,
            element.size!,
            element.height!,
            drawColor
          );
        } else if (element.debrisType === "gear") {
          const r = element.size! / 2;
          drawPixelRect(
            ctx,
            element.x - r,
            drawY - r,
            element.size!,
            element.size!,
            drawColor
          );
          for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const toothX = element.x + Math.cos(angle) * r;
            const toothY = drawY + Math.sin(angle) * r;
            drawPixelRect(
              ctx,
              toothX - 1,
              toothY - 1,
              2,
              2,
              lightenDarkenColor(drawColor, -20)
            );
          }
        } else {
          drawPixelRect(
            ctx,
            element.x,
            drawY,
            element.size!,
            element.size!,
            drawColor
          );
        }
        break;

      case "pixelStructure":
        const structBlockSize = Math.max(3, Math.floor(element.width! / 10));
        const objPalette = element.colors;
        for (let i = 0; i < element.width! / structBlockSize; i++) {
          for (let j = 0; j < element.height! / structBlockSize; j++) {
            if (
              Math.random() < element.density &&
              element.height! - j * structBlockSize >
                Math.random() * element.height! * 0.5
            ) {
              let blockColor = this.getSideColor(objPalette, "base");
              if (i < element.width! / structBlockSize / 3)
                blockColor = this.getSideColor(objPalette, "shadow");
              else if (i > ((element.width! / structBlockSize) * 2) / 3)
                blockColor = this.getSideColor(objPalette, "light");
              const activeThemeForLights = world.isTransitioning
                ? world.transitionTargetTheme
                : world.currentTheme;
              if (
                Math.random() < 0.05 &&
                (activeThemeForLights === "gaming" ||
                  activeThemeForLights === "futuristic")
              ) {
                if (Math.floor(gameTime * (3 + Math.random() * 2)) % 2 === 0) {
                  blockColor = getRandomColor(
                    (Palettes as any)[activeThemeForLights].emissive
                  );
                }
              }
              drawPixelRect(
                ctx,
                element.x + i * structBlockSize,
                drawY + j * structBlockSize,
                structBlockSize,
                structBlockSize,
                blockColor
              );
            }
          }
        }
        break;

      case "rect_floating_island":
        drawPixelRect(
          ctx,
          element.x,
          drawY,
          element.width!,
          element.height! * 0.7,
          element.colors.top
        );
        drawPixelRect(
          ctx,
          element.x,
          drawY + element.height! * 0.7,
          element.width!,
          element.height! * 0.3,
          element.colors.bottom
        );
        for (let i = 0; i < 3; i++) {
          drawPixelRect(
            ctx,
            element.x + getRandomInt(0, element.width! - 5),
            drawY + getRandomInt(0, element.height! * 0.7 - 5),
            5,
            5,
            lightenDarkenColor(element.colors.top, -20)
          );
        }
        break;

      case "pixelTree":
        drawPixelRect(
          ctx,
          element.x + element.leavesWidth / 2 - element.trunkWidth / 2,
          drawY + element.leavesHeight,
          element.trunkWidth,
          element.trunkHeight,
          element.trunkColor
        );
        const leafBlockSize = Math.max(2, Math.floor(element.leavesWidth / 5));
        for (let r = 0; r < element.leavesHeight / leafBlockSize; r++) {
          for (let c = 0; c < element.leavesWidth / leafBlockSize; c++) {
            if (Math.random() < 0.8) {
              const color =
                Math.random() < 0.7
                  ? element.leavesColor
                  : element.leavesHighlight;
              drawPixelRect(
                ctx,
                element.x + c * leafBlockSize,
                drawY + r * leafBlockSize,
                leafBlockSize,
                leafBlockSize,
                color
              );
            }
          }
        }
        break;

      case "giant_mushroom":
        drawPixelRect(
          ctx,
          element.x - element.stemWidth / 2,
          drawY + element.capRadius,
          element.stemWidth,
          element.stemHeight,
          element.colors.stem
        );
        drawPixelRect(
          ctx,
          element.x - element.capRadius,
          drawY,
          element.capRadius * 2,
          element.capRadius,
          element.colors.capTop
        );
        const numSpots = getRandomInt(3, 7);
        for (let i = 0; i < numSpots; i++) {
          const spotSize = element.capRadius * 0.2;
          const spotX =
            element.x -
            element.capRadius +
            Math.random() * (element.capRadius * 2 - spotSize);
          const spotY = drawY + Math.random() * (element.capRadius - spotSize);
          drawPixelRect(
            ctx,
            spotX,
            spotY,
            spotSize,
            spotSize,
            element.colors.capSpots
          );
        }
        break;

      case "power_up_box":
        drawPixelRect(
          ctx,
          element.x,
          drawY,
          element.size!,
          element.size!,
          element.colors.box
        );
        if (Math.floor(gameTime * 2) % 2 === 0 || !element.isEmissive) {
          drawPixelRect(
            ctx,
            element.x + element.size! * 0.3,
            drawY + element.size! * 0.2,
            element.size! * 0.4,
            element.size! * 0.15,
            element.colors.symbol
          );
          drawPixelRect(
            ctx,
            element.x + element.size! * 0.55,
            drawY + element.size! * 0.35,
            element.size! * 0.15,
            element.size! * 0.15,
            element.colors.symbol
          );
          drawPixelRect(
            ctx,
            element.x + element.size! * 0.4,
            drawY + element.size! * 0.5,
            element.size! * 0.2,
            element.size! * 0.15,
            element.colors.symbol
          );
          drawPixelRect(
            ctx,
            element.x + element.size! * 0.4,
            drawY + element.size! * 0.8,
            element.size! * 0.2,
            element.size! * 0.1,
            element.colors.symbol
          );
        }
        break;

      case "futuristicTower":
        const ftObjPalette = element.colors;
        const ftBaseC = this.getSideColor(ftObjPalette, "base");
        const ftLightC = this.getSideColor(ftObjPalette, "light");
        const ftShadowC = this.getSideColor(ftObjPalette, "shadow");
        drawPixelRect(
          ctx,
          element.x,
          drawY,
          element.width!,
          element.height!,
          ftBaseC
        );
        drawPixelRect(
          ctx,
          element.x,
          drawY,
          element.width! * 0.2,
          element.height!,
          ftShadowC
        );
        drawPixelRect(
          ctx,
          element.x + element.width! * 0.8,
          drawY,
          element.width! * 0.2,
          element.height!,
          ftLightC
        );
        if (!element.lights) {
          element.lights = [];
          const numLights = Math.floor(element.height! / 15);
          for (let i = 0; i < numLights; i++) {
            element.lights.push({
              x_offset: getRandomInt(
                element.width! * 0.2,
                element.width! * 0.8 - 1
              ),
              y_offset: getRandomInt(
                element.height! * 0.1,
                element.height! * 0.9 - 1
              ),
              color: getRandomColor(element.lightColors),
              blinkRate: getRandomFloat(1, 4),
              blinkPhase: getRandomFloat(0, Math.PI * 2),
            });
          }
        }
        element.lights.forEach((light: any) => {
          if (
            Math.floor(gameTime * light.blinkRate + light.blinkPhase) % 2 ===
            0
          ) {
            drawPixelRect(
              ctx,
              element.x + light.x_offset,
              drawY + light.y_offset,
              1,
              1,
              light.color
            );
          }
        });
        drawPixelRect(
          ctx,
          element.x + element.width! * 0.4,
          drawY - 10,
          element.width! * 0.2,
          10,
          ftBaseC
        );
        drawPixelRect(
          ctx,
          element.x + element.width! * 0.45,
          drawY - 15,
          element.width! * 0.1,
          5,
          getRandomColor(element.lightColors)
        );
        break;

      case "rect_platform":
        drawPixelRect(
          ctx,
          element.x,
          drawY,
          element.width!,
          element.height!,
          element.colors.base
        );
        drawPixelRect(
          ctx,
          element.x,
          drawY + element.height! - 2,
          element.width!,
          2,
          element.colors.trim
        );
        break;

      case "energy_pylon":
        drawPixelRect(
          ctx,
          element.x,
          drawY,
          element.width!,
          element.height!,
          element.colors.structure
        );
        const pulse = (Math.sin(gameTime * 5) + 1) / 2;
        const coreHeight = element.height! * (0.3 + pulse * 0.2);
        const coreY = drawY + (element.height! - coreHeight) / 2;
        drawPixelRect(
          ctx,
          element.x + element.width! * 0.25,
          coreY,
          element.width! * 0.5,
          coreHeight,
          element.colors.emissive_core
        );
        break;

      case "industrialBuilding":
      case "industrialSmokestack":
        const ibObjPalette = element.colors;
        const ibBaseC = this.getSideColor(ibObjPalette, "base");
        const ibLightC = this.getSideColor(ibObjPalette, "light");
        const ibShadowC = this.getSideColor(ibObjPalette, "shadow");
        drawPixelRect(
          ctx,
          element.x,
          drawY,
          element.width!,
          element.height!,
          ibBaseC
        );
        drawPixelRect(
          ctx,
          element.x,
          drawY,
          element.width! * 0.2,
          element.height!,
          ibShadowC
        );
        drawPixelRect(
          ctx,
          element.x + element.width! * 0.8,
          drawY,
          element.width! * 0.2,
          element.height!,
          ibLightC
        );
        const numFeatures = Math.floor(
          (element.width! * element.height!) / 500
        );
        for (let i = 0; i < numFeatures; i++) {
          const fX =
            element.x +
            getRandomInt(element.width! * 0.2, element.width! * 0.8 - 5);
          const fY =
            drawY +
            getRandomInt(element.height! * 0.1, element.height! * 0.8 - 5);
          const fW = getRandomInt(3, 8);
          const fH = getRandomInt(3, 8);
          drawPixelRect(
            ctx,
            fX,
            fY,
            fW,
            fH,
            Math.random() < 0.2
              ? getRandomColor(Palettes.industrial.emissive)
              : ibShadowC
          );
        }
        if (element.type === "industrialSmokestack") {
          if (Math.random() < 0.03) {
            world.emitIndustrialSmoke(element.x + element.width! / 2, drawY);
          }
        }
        break;

      case "rect_crates":
        drawPixelRect(
          ctx,
          element.x,
          drawY,
          element.width!,
          element.height!,
          drawColor
        );
        drawPixelRect(
          ctx,
          element.x + 1,
          drawY + 1,
          element.width! - 2,
          element.height! - 2,
          lightenDarkenColor(drawColor, -20)
        );
        drawPixelRect(
          ctx,
          element.x + element.width! * 0.4,
          drawY,
          2,
          element.height!,
          lightenDarkenColor(drawColor, -30)
        );
        drawPixelRect(
          ctx,
          element.x,
          drawY + element.height! * 0.4,
          element.width!,
          2,
          lightenDarkenColor(drawColor, -30)
        );
        break;

      case "rect_pipes":
        drawPixelRect(
          ctx,
          element.x,
          drawY,
          element.width!,
          element.height!,
          drawColor
        );
        drawPixelRect(
          ctx,
          element.x,
          drawY,
          element.width!,
          element.height! * 0.3,
          lightenDarkenColor(drawColor, 20)
        );
        break;

      case "rubble_pile":
        for (let i = 0; i < 5; i++) {
          const rX = element.x + (Math.random() - 0.5) * element.size! * 0.8;
          const rY =
            drawY +
            (Math.random() - 0.5) * element.size! * 0.3 +
            element.size! * 0.2;
          const rSize = element.size! * getRandomFloat(0.2, 0.5);
          drawPixelRect(
            ctx,
            rX,
            rY,
            rSize,
            rSize,
            getRandomColor(element.colors)
          );
        }
        break;

      default:
        if (Config.DEBUG_MODE)
          console.warn(`Unknown world element type: ${element.type}`);
        break;
    }
  },
};
