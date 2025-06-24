// src/world/parallax.ts
import { Config } from "../config";
import { desaturateColor, getRandomFloat, interpolateColor } from "../utils";
import { WorldElement, WorldRenderer } from "./renderer";
import { ElementGenerator, LayerConfig } from "./generators";
import { IGame } from "../types";
import { World } from "./world";
import { Palettes } from "../palettes";

export class ParallaxLayer {
  scrollSpeedFactor: number;
  elementGenerator: ElementGenerator;
  elementCount: number;
  game: IGame;
  world: World;
  layerConfig: LayerConfig;
  isSourceLayer: boolean;
  initialXOffset: number;
  elements: WorldElement[];

  constructor(
    scrollSpeedFactor: number,
    elementGenerator: ElementGenerator,
    elementCount: number,
    game: IGame,
    world: World,
    layerConfig: LayerConfig,
    isSourceLayer = false,
    initialXOffset = 0
  ) {
    this.scrollSpeedFactor = scrollSpeedFactor;
    this.elementGenerator = elementGenerator;
    this.elementCount = elementCount;
    this.game = game;
    this.world = world;
    this.layerConfig = layerConfig;
    this.isSourceLayer = isSourceLayer;
    this.initialXOffset = initialXOffset;
    this.elements = [];
    this.generateInitialElements();
  }

  generateInitialElements() {
    this.elements = [];
    const virtualWidth = Config.CANVAS_WIDTH * 3.5;
    for (let i = 0; i < this.elementCount; i++) {
      const x = this.initialXOffset + Math.random() * virtualWidth;
      const y = Math.random() * Config.CANVAS_HEIGHT; // Simplified, generator will override
      const element = this.elementGenerator(
        x,
        y,
        this.layerConfig,
        this.game,
        this.world
      );
      element.scrollSpeedFactor = this.scrollSpeedFactor;
      this.elements.push(element);
    }
  }

  update(_worldScrollSpeed: number) {
    const layerScrolledOriginX = this.world.worldX * this.scrollSpeedFactor;
    const screenWidth = Config.CANVAS_WIDTH;
    const wrapBuffer = screenWidth * 0.75;
    const totalVirtualWidth = screenWidth * 3.5;

    this.elements.forEach((element) => {
      if (element.update) {
        element.update(this.game.deltaTime, this.game.gameTime);
      }

      const elementVisualWidth =
        element.width || (element.radius ? element.radius * 2 : 50);
      const elementScreenX = element.x - layerScrolledOriginX;

      if (elementScreenX + elementVisualWidth < -wrapBuffer) {
        element.x += totalVirtualWidth + Math.random() * 100 - 50;
        if (element.canRandomizeYOnWrap) {
          element.y = getRandomFloat(
            Config.CANVAS_HEIGHT * 0.05,
            this.world.groundLevelY * 0.55
          );
        }
      } else if (elementScreenX > screenWidth + wrapBuffer) {
        element.x -= totalVirtualWidth + Math.random() * 100 - 50;
        if (element.canRandomizeYOnWrap) {
          element.y = getRandomFloat(
            Config.CANVAS_HEIGHT * 0.05,
            this.world.groundLevelY * 0.55
          );
        }
      }
    });
  }

  render(ctx: CanvasRenderingContext2D) {
    const renderBuffer = 200;
    const layerScrolledOriginX = this.world.worldX * this.scrollSpeedFactor;

    ctx.save();
    ctx.translate(-layerScrolledOriginX, 0);

    this.elements.forEach((element) => {
      const elementVisualWidth =
        element.width || (element.radius ? element.radius * 2 : 50);

      if (
        element.x + elementVisualWidth > layerScrolledOriginX - renderBuffer &&
        element.x < layerScrolledOriginX + Config.CANVAS_WIDTH + renderBuffer
      ) {
        let elementAlpha = 1.0;
        if (this.world.isTransitioning) {
          elementAlpha = this.isSourceLayer
            ? 1.0 - this.world.transitionProgress
            : this.world.transitionProgress;
        }
        if (elementAlpha <= 0.01) return;

        const originalCtxAlpha = ctx.globalAlpha;
        ctx.globalAlpha *= elementAlpha;

        const activeTheme = this.world.isTransitioning
          ? this.isSourceLayer
            ? this.world.transitionSourceTheme
            : this.world.transitionTargetTheme
          : this.world.currentTheme;
        const themePalette = (Palettes as any)[activeTheme] || Palettes.desert;

        let finalColor = element.originalColor || element.color;
        if (this.scrollSpeedFactor < 0.8 && !element.isEmissive) {
          const tintFactor = Math.min(0.6, (1 - this.scrollSpeedFactor) * 0.7);
          const skyHorizonColor =
            (themePalette.sky && themePalette.sky[1]) ||
            this.world.currentHorizonSky ||
            "#ABCDEF";
          if (finalColor && typeof finalColor === "string") {
            finalColor = interpolateColor(
              finalColor,
              skyHorizonColor,
              tintFactor
            );
            if (this.scrollSpeedFactor < 0.3) {
              finalColor = desaturateColor(finalColor, tintFactor * 0.5);
            }
          }
          element.tempColor = finalColor;
        } else {
          element.tempColor = finalColor;
        }

        WorldRenderer.drawElement(ctx, element, this.game.gameTime, this.world);
        ctx.globalAlpha = originalCtxAlpha;
      }
    });
    ctx.restore();
  }
}
