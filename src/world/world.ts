// src/world/world.ts
import { Config } from "../config";
import { Palettes } from "../palettes";
import { ParallaxLayer } from "./parallax";
import { WorldThemes } from "./themes";
import { WorldGenerators } from "./generators";
import { StopsManager, Zone } from "../stops/stops.manager";
import { EffectsManager } from "../effects/effectsManager";
import { Particle } from "../effects/particle";
import { getRandomColor, getRandomFloat, interpolateColor } from "../utils";
import { IGame } from "../types";

export class World {
  game: IGame;
  layers: ParallaxLayer[];
  worldX: number;
  groundLevelY: number;
  currentTheme: string;
  skyColor: string;
  currentTopSky: string;
  currentHorizonSky: string;
  isTransitioning: boolean;
  transitionProgress: number;
  transitionDurationWorldUnits: number;
  transitionSourceTheme: string;
  transitionTargetTheme: string;
  sourceLayers: ParallaxLayer[];
  targetLayers: ParallaxLayer[];

  constructor(game: IGame) {
    this.game = game;
    this.worldX = 0;
    this.groundLevelY = Config.CANVAS_HEIGHT - 80;
    this.currentTheme = "desert_start";
    const initialPalette =
      (Palettes as any)[this.currentTheme] || Palettes.desert;
    this.skyColor = initialPalette.sky[0];
    this.currentTopSky = this.skyColor;
    this.currentHorizonSky = initialPalette.sky[1];
    this.isTransitioning = false;
    this.transitionProgress = 0;
    this.transitionDurationWorldUnits = Config.CANVAS_WIDTH * 1.1;
    this.transitionSourceTheme = this.currentTheme;
    this.transitionTargetTheme = this.currentTheme;
    this.sourceLayers = [];
    this.targetLayers = [];
    this.layers = this.initLayers(this.currentTheme);

    if (Config.DEBUG_MODE) console.log("World initialized.");
  }

  initLayers(theme: string, initialWorldXOffset = 0): ParallaxLayer[] {
    const newLayers: ParallaxLayer[] = [];
    const config = WorldThemes[theme] || WorldThemes["desert_start"];
    config.forEach((lc) => {
      const generatorFunc = WorldGenerators[lc.generator];
      if (generatorFunc) {
        newLayers.push(
          new ParallaxLayer(
            lc.speed,
            generatorFunc,
            lc.count,
            this.game,
            this,
            lc,
            false,
            initialWorldXOffset
          )
        );
      }
    });
    newLayers.sort((a, b) => a.scrollSpeedFactor - b.scrollSpeedFactor);
    return newLayers;
  }

  handleThemeChange(newZone: Zone) {
    if (this.currentTheme !== newZone.theme && !this.isTransitioning) {
      this.isTransitioning = true;
      this.transitionProgress = 0;
      this.transitionSourceTheme = this.currentTheme;
      this.transitionTargetTheme = newZone.theme;
      this.sourceLayers = this.layers;
      this.sourceLayers.forEach((layer) => (layer.isSourceLayer = true));
      const targetLayerInitialX =
        this.worldX +
        (this.game.player.currentSpeed >= 0
          ? Config.CANVAS_WIDTH
          : -Config.CANVAS_WIDTH * 2.5);
      this.targetLayers = this.initLayers(
        this.transitionTargetTheme,
        targetLayerInitialX
      );
      this.targetLayers.forEach((layer) => (layer.isSourceLayer = false));
    }
  }

  emitIndustrialSmoke(x: number, y: number) {
    const smokeParticle = new Particle(
      x + getRandomFloat(-5, 5),
      y + getRandomFloat(-5, 0),
      getRandomFloat(-5, 5),
      getRandomFloat(-10, -20),
      getRandomFloat(1, 3),
      3,
      getRandomColor(Palettes.industrial.smoke),
      getRandomFloat(0.2, 0.5),
      "weather",
      "weather_background"
    );
    smokeParticle.gravity = -5;
    EffectsManager.addParticle(smokeParticle);
  }

  update(worldScrollSpeed: number) {
    this.worldX += worldScrollSpeed;
    const currentZoneInfo = StopsManager.getCurrentZone(this.worldX);
    this.handleThemeChange(currentZoneInfo);

    if (this.isTransitioning) {
      this.sourceLayers.forEach((layer) => layer.update(worldScrollSpeed));
      this.targetLayers.forEach((layer) => layer.update(worldScrollSpeed));

      if (this.transitionDurationWorldUnits > 0 && worldScrollSpeed !== 0) {
        this.transitionProgress +=
          Math.abs(worldScrollSpeed) / this.transitionDurationWorldUnits;
      }
      this.transitionProgress = Math.min(this.transitionProgress, 1);

      const sourcePalette =
        (Palettes as any)[this.transitionSourceTheme] || Palettes.desert;
      const targetPalette =
        (Palettes as any)[this.transitionTargetTheme] || Palettes.desert;
      this.currentTopSky = interpolateColor(
        sourcePalette.sky[0],
        targetPalette.sky[0],
        this.transitionProgress
      );
      this.currentHorizonSky = interpolateColor(
        sourcePalette.sky[1],
        targetPalette.sky[1],
        this.transitionProgress
      );

      if (this.transitionProgress >= 1) {
        this.isTransitioning = false;
        this.currentTheme = this.transitionTargetTheme;
        this.layers = this.targetLayers;
        this.layers.forEach((layer) => (layer.isSourceLayer = false));
        this.sourceLayers = [];
        this.targetLayers = [];
      }
    } else {
      this.layers.forEach((layer) => layer.update(worldScrollSpeed));
      const currentPalette =
        (Palettes as any)[this.currentTheme] || Palettes.desert;
      this.currentTopSky = currentPalette.sky[0];
      this.currentHorizonSky = currentPalette.sky[1];
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    const skyGradient = ctx.createLinearGradient(0, 0, 0, this.groundLevelY);
    skyGradient.addColorStop(0, this.currentTopSky);
    skyGradient.addColorStop(1, this.currentHorizonSky);
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, Config.CANVAS_WIDTH, Config.CANVAS_HEIGHT);

    const layersToRender = this.isTransitioning
      ? [...this.sourceLayers, ...this.targetLayers].sort(
          (a, b) => a.scrollSpeedFactor - b.scrollSpeedFactor
        )
      : this.layers;

    layersToRender.forEach((layer) => {
      if (layer.layerConfig.type !== "foreground_debris") {
        layer.render(ctx);
      }
    });
  }

  renderForeground(ctx: CanvasRenderingContext2D) {
    const layersToRender = this.isTransitioning
      ? [...this.sourceLayers, ...this.targetLayers]
      : this.layers;

    layersToRender.forEach((layer) => {
      if (layer.layerConfig.type === "foreground_debris") {
        layer.render(ctx);
      }
    });
  }
}
