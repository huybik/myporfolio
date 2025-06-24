// src/world/generators.ts
import { Config } from "../config";
import { Palettes } from "../palettes";
import {
  getRandomColor,
  getRandomFloat,
  getRandomInt,
  lightenDarkenColor,
} from "../utils";
import { World } from "./world";
import { WorldElement } from "./renderer";
import { IGame } from "../types";

// A type for the layer configuration passed to generators
export interface LayerConfig {
  type: string;
  options?: { [key: string]: any };
  [key: string]: any;
}

// A generic generator function type
export type ElementGenerator = (
  x: number,
  y: number,
  layerConfig: LayerConfig,
  game: IGame,
  world: World
) => WorldElement;

export const WorldGenerators: { [key: string]: ElementGenerator } = {
  generateStar(x, y, layerConfig): WorldElement {
    const options = layerConfig.options || {};
    const sizeArray = options.sizes || [1, 1];
    const size = getRandomInt(sizeArray[0], sizeArray[1]);
    const colorArray = options.colors || ["#FFFFFF"];
    const starColor = getRandomColor(colorArray);
    return {
      type: "star",
      x: x,
      y: y,
      size: size,
      color: starColor,
      initialBrightness: getRandomFloat(0.5, 1.0),
      blinkRate: getRandomFloat(1, 5),
      blinkPhase: getRandomFloat(0, Math.PI * 2),
      originalColor: starColor,
      canRandomizeYOnWrap: true,
      update: function (_deltaTime: number, gameTime: number) {
        this.blinkFactor =
          (Math.sin(gameTime * this.blinkRate + this.blinkPhase) + 1) / 2;
      },
    };
  },

  generateCelestialBody(x, y, layerConfig): WorldElement {
    const options = layerConfig.options || {};
    const type = options.type || "sun";
    let radius, color, glowColor;

    switch (type) {
      case "moon":
        radius = getRandomInt(25, 40);
        color = "#E0E0E0";
        glowColor = "#F0F0F0";
        break;
      case "tech_moon":
        radius = getRandomInt(30, 45);
        color = Palettes.futuristic.objects_primary.base;
        glowColor = Palettes.futuristic.emissive[0] + "AA";
        break;
      case "glitch_moon":
        radius = getRandomInt(20, 35);
        color = Palettes.gaming.objects_accent[0];
        glowColor = Palettes.gaming.emissive[1] + "88";
        break;
      case "sun":
      default:
        radius = getRandomInt(30, 50);
        color = Palettes.desert.emissive[0];
        glowColor = lightenDarkenColor(Palettes.desert.emissive[0], 50) + "CC";
        break;
    }
    return {
      type: "celestial_body",
      x: x,
      y: y,
      radius: radius,
      color: color,
      glowColor: glowColor,
      celestialType: type,
      originalColor: color,
      isEmissive: true,
      canRandomizeYOnWrap: false,
    };
  },

  generatePixelCloud(x, _y, layerConfig, _game, world): WorldElement {
    const options = layerConfig.options || {};
    const sizeRange = options.sizeRange || [20, 50];
    const cloudWidth = getRandomInt(sizeRange[0], sizeRange[1]);
    const cloudHeight = getRandomInt(sizeRange[0] * 0.4, sizeRange[1] * 0.7);
    const yPosRange = options.yPosRange || [0.05, 0.4];
    const cloudColors = options.colors || ["#FFFFFF", "#DDDDFF"];

    return {
      type: "pixelCloud",
      x: x,
      y: getRandomFloat(
        Config.CANVAS_HEIGHT * yPosRange[0],
        world.groundLevelY * yPosRange[1]
      ),
      width: cloudWidth,
      height: cloudHeight,
      colors: cloudColors,
      originalColor: cloudColors[0],
      canRandomizeYOnWrap: true,
    };
  },

  generateNebula(x, y, layerConfig): WorldElement {
    const options = layerConfig.options || {};
    const nebulaColors = options.colors || [
      Palettes.futuristic.sky[2] + "33",
      Palettes.futuristic.emissive[1] + "22",
    ];
    return {
      type: "nebula",
      x: x,
      y: y,
      width: getRandomInt(200, 400),
      height: getRandomInt(100, 250),
      colors: nebulaColors,
      density: getRandomFloat(0.1, 0.3),
      originalColor: nebulaColors[0],
      isEmissive: true,
      canRandomizeYOnWrap: true,
    };
  },

  generateDesertDistant(x, _y, layerConfig, _game, world): WorldElement {
    const options = layerConfig.options || {};
    const heightRange = options.heightRange || [50, 100];
    const width = getRandomInt(30, 70);
    const height = getRandomInt(heightRange[0], heightRange[1]);
    const color = options.colorBase || Palettes.desert.objects_primary.shadow;
    return {
      type: "rect_simple_mountain",
      x: x,
      y: world.groundLevelY - height - getRandomInt(10, 40),
      width: width,
      height: height,
      color: color,
      originalColor: color,
      canRandomizeYOnWrap: false,
    };
  },

  generateDesertMid(x, _y, layerConfig, _game, world): WorldElement {
    const options = layerConfig.options || {};
    const r = Math.random();
    let element: WorldElement;

    if (options.type === "mesa" || (options.type === "mixed" && r < 0.4)) {
      const mesaWidth = getRandomInt(60, 150);
      const mesaHeight = getRandomInt(30, 80);
      element = {
        type: "mesa",
        x: x,
        y: world.groundLevelY - mesaHeight - getRandomInt(0, 20),
        width: mesaWidth,
        height: mesaHeight,
        colors: Palettes.desert.objects_primary,
        originalColor: Palettes.desert.objects_primary.base,
      };
    } else if (options.type === "mixed" && r < 0.8) {
      const cactusHeight = getRandomInt(20, 60);
      element = {
        type: "cactus",
        x: x,
        y: world.groundLevelY - cactusHeight,
        width: getRandomInt(6, 14),
        height: cactusHeight,
        color: Palettes.desert.objects_primary.base,
        originalColor: Palettes.desert.objects_primary.base,
      };
    } else {
      const rockSize = getRandomInt(15, 35);
      element = {
        type: "rock_pile",
        x: x,
        y: world.groundLevelY - rockSize,
        size: rockSize,
        colors: [
          Palettes.desert.objects_primary.base,
          Palettes.desert.objects_primary.shadow,
        ],
        originalColor: Palettes.desert.objects_primary.base,
      };
    }
    element.canRandomizeYOnWrap = false;
    return element;
  },

  generateDesertGround(x, _y, _layerConfig, _game, world): WorldElement {
    const baseColor = Palettes.desert.ground[0];
    const detailColors = [Palettes.desert.ground[2], Palettes.desert.ground[3]];
    const segmentWidth = Config.CANVAS_WIDTH * 0.5 + getRandomInt(0, 20);
    return {
      type: "textured_ground_rect",
      x: x,
      y: world.groundLevelY,
      width: segmentWidth,
      height: Config.CANVAS_HEIGHT - world.groundLevelY,
      baseColor: baseColor,
      detailColors: detailColors,
      textureType: "desert_cracks_pebbles",
      originalColor: baseColor,
      canRandomizeYOnWrap: false,
    };
  },

  generateForegroundDebris(x, y, layerConfig): WorldElement {
    const options = layerConfig.options || { types: ["rock"] };
    const type = getRandomColor(options.types);
    let element: WorldElement = {
      type: "debris",
      x: x,
      y: y,
      size: getRandomInt(3, 8),
      color: "#000000",
      debrisType: type,
      originalColor: "#000000",
      canRandomizeYOnWrap: true,
    };

    switch (type) {
      case "rock":
        element.color = getRandomColor([
          Palettes.desert.ground[2],
          Palettes.desert.ground[3],
        ]);
        break;
      case "tumbleweed_small":
        element.color = Palettes.desert.objects_accent[0];
        element.size = getRandomInt(8, 15);
        break;
      case "glitch_cube":
        element.color = getRandomColor(Palettes.gaming.emissive);
        element.isEmissive = true;
        break;
      case "wire":
        element.color = Palettes.gaming.objects_primary.shadow;
        element.size = getRandomInt(10, 20);
        element.height = getRandomInt(1, 2);
        break;
      case "pixel_coin":
        element.color = Palettes.gaming.emissive[0];
        element.size = getRandomInt(5, 8);
        element.isEmissive = true;
        break;
      case "metal_shard":
        element.color = Palettes.futuristic.objects_primary.base;
        break;
      case "glowing_bit":
        element.color = getRandomColor(Palettes.futuristic.emissive);
        element.isEmissive = true;
        break;
      case "circuit_piece":
        element.color = Palettes.futuristic.objects_accent[1];
        element.size = getRandomInt(6, 12);
        element.height = getRandomInt(2, 4);
        break;
      case "rubble":
        element.color = getRandomColor(Palettes.industrial.ground.slice(1, 3));
        break;
      case "rusty_pipe_fragment":
        element.color = getRandomColor(Palettes.industrial.objects_accent);
        element.size = getRandomInt(10, 18);
        element.height = getRandomInt(3, 5);
        break;
      case "gear":
        element.color = Palettes.industrial.objects_primary.shadow;
        element.size = getRandomInt(7, 10);
        break;
    }
    element.originalColor = element.color!;
    return element;
  },

  generateGamingDistant(x, _y, _layerConfig, _game, world): WorldElement {
    const r = Math.random();
    let element: WorldElement;
    if (r < 0.5) {
      const width = getRandomInt(30, 60);
      const height = getRandomInt(80, Config.CANVAS_HEIGHT * 0.5);
      element = {
        type: "pixelStructure",
        x: x,
        y: world.groundLevelY - height - getRandomInt(10, 30),
        width: width,
        height: height,
        colors: Palettes.gaming.objects_primary,
        density: 0.6,
        originalColor: Palettes.gaming.objects_primary.base,
      };
    } else if (r < 0.8) {
      const width = getRandomInt(50, 100);
      const height = getRandomInt(20, 40);
      element = {
        type: "rect_floating_island",
        x: x,
        y: world.groundLevelY - height - getRandomInt(50, 150),
        width: width,
        height: height,
        colors: {
          top: Palettes.gaming.ground[2],
          bottom: Palettes.gaming.ground[3],
        },
        originalColor: Palettes.gaming.ground[2],
      };
    } else {
      const width = getRandomInt(20, 30);
      const height = getRandomInt(40, 60);
      element = {
        type: "rect",
        x: x,
        y: world.groundLevelY - height - getRandomInt(20, 50),
        width: width,
        height: height,
        color: Palettes.gaming.objects_primary.shadow,
        originalColor: Palettes.gaming.objects_primary.shadow,
      };
    }
    element.canRandomizeYOnWrap = false;
    return element;
  },

  generateGamingMid(x, _y, _layerConfig, _game, world): WorldElement {
    const r = Math.random();
    let element: WorldElement;
    if (r < 0.4) {
      const trunkHeight = getRandomInt(10, 25);
      const leavesHeight = getRandomInt(20, 40);
      const leavesWidth = getRandomInt(15, 35);
      element = {
        type: "pixelTree",
        x: x,
        y: world.groundLevelY - trunkHeight - leavesHeight,
        trunkWidth: getRandomInt(4, 8),
        trunkHeight: trunkHeight,
        leavesWidth: leavesWidth,
        trunkColor: Palettes.desert.objects_accent[0],
        leavesColor: Palettes.gaming.ground[0],
        leavesHighlight: Palettes.gaming.ground[2],
        originalColor: Palettes.gaming.ground[0],
      };
    } else if (r < 0.7) {
      const stemHeight = getRandomInt(15, 30);
      const capRadius = getRandomInt(10, 25);
      element = {
        type: "giant_mushroom",
        x: x,
        y: world.groundLevelY - stemHeight - capRadius,
        stemHeight: stemHeight,
        stemWidth: getRandomInt(5, 10),
        capRadius: capRadius,
        colors: {
          stem: Palettes.gaming.objects_primary.light,
          capTop: getRandomColor(Palettes.gaming.props),
          capSpots: getRandomColor(Palettes.gaming.emissive),
        },
        originalColor: getRandomColor(Palettes.gaming.props),
      };
    } else {
      const size = getRandomInt(10, 20);
      element = {
        type: "power_up_box",
        x: x,
        y: world.groundLevelY - size - getRandomInt(0, 10),
        size: size,
        colors: {
          box: getRandomColor(Palettes.gaming.objects_accent),
          symbol: Palettes.gaming.emissive[0],
        },
        originalColor: getRandomColor(Palettes.gaming.objects_accent),
        isEmissive: true,
      };
    }
    element.canRandomizeYOnWrap = false;
    return element;
  },

  generateGamingGround(x, _y, _layerConfig, _game, world): WorldElement {
    const segmentWidth = 40;
    const colorIndex = Math.floor(x / segmentWidth) % 2;
    const baseColor = Palettes.gaming.ground[colorIndex];
    const detailColors = [
      Palettes.gaming.ground[2],
      Palettes.gaming.ground[3],
      Palettes.gaming.emissive[2],
    ];
    return {
      type: "textured_ground_rect",
      x: x,
      y: world.groundLevelY,
      width: Config.CANVAS_WIDTH * 0.5 + getRandomInt(0, 10),
      height: Config.CANVAS_HEIGHT - world.groundLevelY,
      baseColor: baseColor,
      detailColors: detailColors,
      textureType: "gaming_grid_flowers",
      originalColor: baseColor,
      canRandomizeYOnWrap: false,
    };
  },

  generateFuturisticSkyElement(x, _y, _layerConfig): WorldElement {
    const r = Math.random();
    if (r < 0.7) {
      const width = getRandomInt(15, 40);
      const height = getRandomInt(5, 10);
      const color = Palettes.futuristic.objects_primary.shadow + "AA";
      return {
        type: "rect",
        x,
        y: getRandomFloat(
          Config.CANVAS_HEIGHT * 0.1,
          Config.CANVAS_HEIGHT * 0.4
        ),
        width,
        height,
        color,
        originalColor: color,
        canRandomizeYOnWrap: true,
      };
    } else {
      const width = getRandomInt(50, 150);
      const height = getRandomInt(1, 3);
      const color = getRandomColor(Palettes.futuristic.emissive) + "66";
      return {
        type: "rect",
        x,
        y: getRandomFloat(
          Config.CANVAS_HEIGHT * 0.1,
          Config.CANVAS_HEIGHT * 0.5
        ),
        width,
        height,
        color,
        originalColor: color,
        isEmissive: true,
        canRandomizeYOnWrap: true,
      };
    }
  },

  generateFuturisticDistant(x, _y, _layerConfig, _game, world): WorldElement {
    const buildingWidth = getRandomInt(40, 90);
    const buildingHeight = getRandomInt(150, Config.CANVAS_HEIGHT * 0.7);
    return {
      type: "futuristicTower",
      x: x,
      y: world.groundLevelY - buildingHeight,
      width: buildingWidth,
      height: buildingHeight,
      colors: Palettes.futuristic.objects_primary,
      lightColors: Palettes.futuristic.emissive,
      originalColor: Palettes.futuristic.objects_primary.base,
      canRandomizeYOnWrap: false,
    };
  },

  generateFuturisticMid(x, _y, _layerConfig, _game, world): WorldElement {
    const r = Math.random();
    if (r < 0.6) {
      const platWidth = getRandomInt(50, 120);
      const platHeight = getRandomInt(10, 25);
      return {
        type: "rect_platform",
        x: x,
        y: world.groundLevelY - platHeight - getRandomInt(10, 80),
        width: platWidth,
        height: platHeight,
        colors: {
          base: Palettes.futuristic.objects_primary.base,
          trim: Palettes.futuristic.emissive[0],
        },
        originalColor: Palettes.futuristic.objects_primary.base,
        canRandomizeYOnWrap: false,
      };
    } else {
      const pylonHeight = getRandomInt(30, 70);
      const pylonWidth = getRandomInt(5, 10);
      return {
        type: "energy_pylon",
        x: x,
        y: world.groundLevelY - pylonHeight,
        width: pylonWidth,
        height: pylonHeight,
        colors: {
          structure: Palettes.futuristic.objects_primary.shadow,
          emissive_core: getRandomColor(Palettes.futuristic.emissive),
        },
        originalColor: Palettes.futuristic.objects_primary.shadow,
        isEmissive: true,
        canRandomizeYOnWrap: false,
      };
    }
  },

  generateFuturisticGround(x, _y, _layerConfig, _game, world): WorldElement {
    const panelWidth = 80;
    const colorIndex = Math.floor(x / panelWidth) % 3;
    const baseColor =
      Palettes.futuristic.ground[
        colorIndex === 0 ? 0 : colorIndex === 1 ? 1 : 0
      ];
    const detailColors = [
      Palettes.futuristic.ground[2],
      Palettes.futuristic.emissive[0],
      Palettes.futuristic.emissive[1],
    ];
    return {
      type: "textured_ground_rect",
      x: x,
      y: world.groundLevelY,
      width: Config.CANVAS_WIDTH * 0.5 + getRandomInt(0, 10),
      height: Config.CANVAS_HEIGHT - world.groundLevelY,
      baseColor: baseColor,
      detailColors: detailColors,
      textureType: "futuristic_guideways",
      originalColor: baseColor,
      canRandomizeYOnWrap: false,
    };
  },

  generateIndustrialDistant(x, _y, layerConfig, _game, world): WorldElement {
    const options = layerConfig.options || {};
    const buildingWidth = getRandomInt(70, 150);
    const buildingHeight = getRandomInt(100, Config.CANVAS_HEIGHT * 0.5);
    return {
      type:
        options.type === "smokestack"
          ? "industrialSmokestack"
          : "industrialBuilding",
      x: x,
      y: world.groundLevelY - buildingHeight,
      width: buildingWidth,
      height: buildingHeight,
      colors: Palettes.industrial.objects_primary,
      accentColors: Palettes.industrial.objects_accent,
      smokeColors: Palettes.industrial.smoke,
      originalColor: Palettes.industrial.objects_primary.base,
      canRandomizeYOnWrap: false,
    };
  },

  generateIndustrialMid(x, _y, _layerConfig, _game, world): WorldElement {
    const r = Math.random();
    let element: WorldElement;
    if (r < 0.4) {
      const size = getRandomInt(15, 30);
      const crateColor = getRandomColor(Palettes.industrial.objects_accent);
      element = {
        type: "rect_crates",
        x,
        y: world.groundLevelY - size,
        width: size,
        height: size,
        color: crateColor,
        originalColor: crateColor,
      };
    } else if (r < 0.7) {
      const length = getRandomInt(40, 100);
      const thickness = getRandomInt(8, 15);
      const pipeColor = Palettes.industrial.objects_primary.shadow;
      element = {
        type: "rect_pipes",
        x,
        y: world.groundLevelY - thickness - getRandomInt(0, 40),
        width: length,
        height: thickness,
        color: pipeColor,
        originalColor: pipeColor,
      };
    } else {
      const pileSize = getRandomInt(20, 40);
      element = {
        type: "rubble_pile",
        x: x,
        y: world.groundLevelY - pileSize * 0.7,
        size: pileSize,
        colors: [
          Palettes.industrial.ground[1],
          Palettes.industrial.objects_primary.shadow,
          Palettes.industrial.objects_accent[0],
        ],
        originalColor: Palettes.industrial.ground[1],
      };
    }
    element.canRandomizeYOnWrap = false;
    return element;
  },

  generateIndustrialGround(x, _y, _layerConfig, _game, world): WorldElement {
    const r = Math.random();
    let baseColor;
    if (r < 0.6) baseColor = Palettes.industrial.ground[0];
    else if (r < 0.8) baseColor = Palettes.industrial.ground[1];
    else baseColor = Palettes.industrial.objects_accent[1];
    const detailColors = [
      Palettes.industrial.ground[3],
      Palettes.industrial.objects_accent[0],
      Palettes.industrial.emissive[0],
    ];
    return {
      type: "textured_ground_rect",
      x: x,
      y: world.groundLevelY,
      width: Config.CANVAS_WIDTH * 0.5 + getRandomInt(0, 10),
      height: Config.CANVAS_HEIGHT - world.groundLevelY,
      baseColor: baseColor,
      detailColors: detailColors,
      textureType: "industrial_asphalt_cracks",
      originalColor: baseColor,
      canRandomizeYOnWrap: false,
    };
  },
};
