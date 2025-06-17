// js/world.js
class ParallaxLayer {
  constructor(
    scrollSpeedFactor,
    color,
    elementGenerator,
    elementCount,
    game,
    world
  ) {
    this.scrollSpeedFactor = scrollSpeedFactor;
    this.color = color;
    this.elementGenerator = elementGenerator;
    this.elementCount = elementCount;
    this.game = game;
    this.world = world;
    this.elements = [];
    this.generateInitialElements();
  }
  generateInitialElements() {
    this.elements = [];
    for (let i = 0; i < this.elementCount; i++) {
      const x = Math.random() * Config.CANVAS_WIDTH * 2.5;
      const y = Math.random() * Config.CANVAS_HEIGHT;
      this.elements.push(
        this.elementGenerator(x, y, this.color, this.game, this.world)
      );
    }
  }
  update(worldScrollSpeed) {
    this.elements.forEach((element) => {
      element.x -= worldScrollSpeed * this.scrollSpeedFactor;
      const elementVisualWidth =
        element.width || (element.radius ? element.radius * 2 : 50);
      const wrapBuffer = Config.CANVAS_WIDTH * 0.5;
      const totalVirtualWidth = Config.CANVAS_WIDTH * 2.5;
      if (worldScrollSpeed > 0) {
        if (element.x + elementVisualWidth < -wrapBuffer) {
          element.x += totalVirtualWidth + Math.random() * 50;
        }
      } else if (worldScrollSpeed < 0) {
        if (element.x > Config.CANVAS_WIDTH + wrapBuffer) {
          element.x -= totalVirtualWidth + Math.random() * 50;
        }
      }
    });
  }
  render(ctx) {
    this.elements.forEach((element) => {
      const elementVisualWidth =
        element.width || (element.radius ? element.radius * 2 : 50);
      if (
        element.x + elementVisualWidth > -50 &&
        element.x < Config.CANVAS_WIDTH + 50
      ) {
        this.world.drawElement(ctx, element);
      }
    });
  }
}

class World {
  constructor(game) {
    this.game = game;
    this.layers = [];
    this.worldX = 0;
    this.groundLevelY = Config.CANVAS_HEIGHT - 70;
    this.currentTheme = "desert_start";
    this.skyColor = Palettes.desert[4];
    this.isTransitioning = false;
    this.transitionProgress = 0;
    this.transitionDurationWorldUnits = Config.CANVAS_WIDTH * 1.0;
    this.transitionSourceSky = this.skyColor;
    this.transitionTargetSky = this.skyColor;
    this.transitionSourceTheme = this.currentTheme;
    this.transitionTargetTheme = this.currentTheme;
    this.switchedLayersForCurrentTransition = false;
    this.initLayers(this.currentTheme);
    if (Config.DEBUG_MODE) console.log("World initialized.");
  }
  static generateDesertDistant(x, y, baseColor, game, world) {
    const width = getRandomInt(20, 40);
    const height = getRandomInt(50, 100);
    return {
      type: "rect",
      x: x,
      y: world.groundLevelY - height - getRandomInt(20, 50),
      width: width,
      height: height,
      color: getRandomColor(Palettes.desert.slice(1, 3)),
    };
  }
  static generateDesertMid(x, y, baseColor, game, world) {
    const r = Math.random();
    if (r < 0.6) {
      const cactusHeight = getRandomInt(20, 50);
      return {
        type: "cactus",
        x: x,
        y: world.groundLevelY - cactusHeight,
        width: getRandomInt(6, 12),
        height: cactusHeight,
        color: Palettes.desert[1],
      };
    } else {
      const size = getRandomInt(10, 25);
      return {
        type: "rect",
        x: x,
        y: world.groundLevelY - size,
        width: size * (1 + Math.random() * 0.5),
        height: size,
        color: Palettes.desert[2],
      };
    }
  }
  static generateDesertGround(x, y, baseColor, game, world) {
    return {
      type: "rect",
      x: x,
      y: world.groundLevelY,
      width: Config.CANVAS_WIDTH * 0.5 + getRandomInt(0, 10),
      height: 70,
      color: Palettes.desert[0],
    };
  }
  static generateGamingSkyElement(x, y, baseColor, game, world) {
    const cloudWidth = getRandomInt(30, 70);
    const cloudHeight = getRandomInt(15, 30);
    return {
      type: "pixelCloud",
      x: x,
      y: getRandomInt(20, Config.CANVAS_HEIGHT * 0.3),
      width: cloudWidth,
      height: cloudHeight,
      color: "#FFFFFF",
      blockColor: "#D0D0F0",
    };
  }
  static generateGamingDistant(x, y, baseColor, game, world) {
    const width = getRandomInt(40, 80);
    const height = getRandomInt(60, 120);
    return {
      type: "pixelStructure",
      x: x,
      y: world.groundLevelY - height - getRandomInt(10, 30),
      width: width,
      height: height,
      colors: Palettes.gaming.structures,
      density: 0.7,
    };
  }
  static generateGamingMid(x, y, baseColor, game, world) {
    if (Math.random() < 0.5) {
      const trunkHeight = getRandomInt(10, 20);
      const leavesHeight = getRandomInt(20, 35);
      const leavesWidth = getRandomInt(15, 30);
      return {
        type: "pixelTree",
        x: x,
        y: world.groundLevelY - trunkHeight - leavesHeight,
        trunkWidth: getRandomInt(4, 7),
        trunkHeight: trunkHeight,
        trunkColor: "#704214",
        leavesWidth: leavesWidth,
        leavesHeight: leavesHeight,
        leavesColor: Palettes.gaming.terrain[0],
      };
    } else {
      const size = getRandomInt(10, 20);
      return {
        type: "rect",
        x: x,
        y: world.groundLevelY - size - getRandomInt(5, 40),
        width: size,
        height: size,
        color: getRandomColor(Palettes.gaming.props),
      };
    }
  }
  static generateGamingGround(x, y, baseColor, game, world) {
    const segmentWidth = 40;
    const groundLayer = world.layers.find(
      (l) => l.elementGenerator === World.generateGamingGround
    );
    const scrollFactor = groundLayer ? groundLayer.scrollSpeedFactor : 1.0;
    return {
      type: "rect",
      x: x,
      y: world.groundLevelY,
      width: Config.CANVAS_WIDTH * 0.5 + getRandomInt(0, 10),
      height: 70,
      color:
        Math.floor((x + world.worldX * scrollFactor) / segmentWidth) % 2 === 0
          ? Palettes.gaming.terrain[0]
          : Palettes.gaming.terrain[1],
    };
  }
  static generateFuturisticSkyElement(x, y, baseColor, game, world) {
    if (Math.random() < 0.7) {
      const size = getRandomInt(10, 40);
      return {
        type: "rect",
        x: x,
        y: getRandomInt(20, Config.CANVAS_HEIGHT * 0.4),
        width: size,
        height: size / getRandomInt(2, 4),
        color: getRandomColor(
          Palettes.futuristic.accents.map((c) => lightenDarkenColor(c, -100))
        ),
      };
    } else {
      const length = getRandomInt(50, 150);
      return {
        type: "rect",
        x: x,
        y: getRandomInt(Config.CANVAS_HEIGHT * 0.1, Config.CANVAS_HEIGHT * 0.5),
        width: length,
        height: 1,
        color: getRandomColor(Palettes.futuristic.lights.map((c) => `${c}33`)),
      };
    }
  }
  static generateFuturisticDistant(x, y, baseColor, game, world) {
    const buildingWidth = getRandomInt(30, 70);
    const buildingHeight = getRandomInt(
      100,
      Math.floor(Config.CANVAS_HEIGHT * 0.6)
    );
    return {
      type: "futuristicTower",
      x: x,
      y: world.groundLevelY - buildingHeight,
      width: buildingWidth,
      height: buildingHeight,
      colors: Palettes.futuristic.buildings,
      lightColors: Palettes.futuristic.lights,
    };
  }
  static generateFuturisticMid(x, y, baseColor, game, world) {
    if (Math.random() < 0.6) {
      const platWidth = getRandomInt(40, 100);
      const platHeight = getRandomInt(10, 30);
      return {
        type: "rect",
        x: x,
        y: world.groundLevelY - platHeight - getRandomInt(0, 50),
        width: platWidth,
        height: platHeight,
        color: getRandomColor(Palettes.futuristic.buildings.slice(0, 2)),
      };
    } else {
      const orbRadius = getRandomInt(5, 15);
      return {
        type: "glowingOrb",
        x: x,
        y: world.groundLevelY - orbRadius - getRandomInt(20, 70),
        radius: orbRadius,
        color: getRandomColor(Palettes.futuristic.lights),
      };
    }
  }
  static generateFuturisticGround(x, y, baseColor, game, world) {
    const panelWidth = 60;
    const groundLayer = world.layers.find(
      (l) => l.elementGenerator === World.generateFuturisticGround
    );
    const scrollFactor = groundLayer ? groundLayer.scrollSpeedFactor : 1.0;
    return {
      type: "rect",
      x: x,
      y: world.groundLevelY,
      width: Config.CANVAS_WIDTH * 0.5 + getRandomInt(0, 10),
      height: 70,
      color:
        Math.floor((x + world.worldX * scrollFactor) / panelWidth) % 3 === 0
          ? Palettes.futuristic.buildings[3]
          : Palettes.futuristic.buildings[2],
    };
  }
  static generateIndustrialSkyElement(x, y, baseColor, game, world) {
    if (Math.random() < 0.5) {
      const stackWidth = getRandomInt(8, 20);
      const stackHeight = getRandomInt(
        50,
        Math.floor(Config.CANVAS_HEIGHT * 0.5)
      );
      return {
        type: "rect",
        x: x,
        y: world.groundLevelY - stackHeight - getRandomInt(50, 100),
        width: stackWidth,
        height: stackHeight,
        color: Palettes.industrial.buildings[3],
      };
    } else {
      const cloudWidth = getRandomInt(50, 150);
      const cloudHeight = getRandomInt(20, 40);
      return {
        type: "pixelCloud",
        x: x,
        y: getRandomInt(
          Math.floor(Config.CANVAS_HEIGHT * 0.1),
          Math.floor(Config.CANVAS_HEIGHT * 0.3)
        ),
        width: cloudWidth,
        height: cloudHeight,
        color: Palettes.industrial.smoke[0],
        blockColor: Palettes.industrial.smoke[1],
      };
    }
  }
  static generateIndustrialDistant(x, y, baseColor, game, world) {
    const buildingWidth = getRandomInt(60, 120);
    const buildingHeight = getRandomInt(
      80,
      Math.floor(Config.CANVAS_HEIGHT * 0.4)
    );
    return {
      type: "industrialBuilding",
      x: x,
      y: world.groundLevelY - buildingHeight,
      width: buildingWidth,
      height: buildingHeight,
      colors: Palettes.industrial.buildings,
      accentColors: Palettes.industrial.metal,
    };
  }
  static generateIndustrialMid(x, y, baseColor, game, world) {
    if (Math.random() < 0.4) {
      const crateSize = getRandomInt(15, 30);
      return {
        type: "rect",
        x: x,
        y: world.groundLevelY - crateSize,
        width: crateSize,
        height: crateSize,
        color: getRandomColor(Palettes.desert.slice(1, 3)),
      };
    } else {
      const pipeLength = getRandomInt(30, 80);
      const pipeThickness = getRandomInt(5, 10);
      return {
        type: "rect",
        x: x,
        y: world.groundLevelY - pipeThickness - getRandomInt(0, 30),
        width: pipeLength,
        height: pipeThickness,
        color: getRandomColor(Palettes.industrial.metal),
      };
    }
  }
  static generateIndustrialGround(x, y, baseColor, game, world) {
    let color;
    const r = Math.random();
    if (r < 0.6) color = Palettes.industrial.metal[0];
    else if (r < 0.8) color = Palettes.industrial.buildings[3];
    else color = Palettes.desert[2];
    return {
      type: "rect",
      x: x,
      y: world.groundLevelY,
      width: Config.CANVAS_WIDTH * 0.5 + getRandomInt(0, 10),
      height: 70,
      color: color,
    };
  }
  drawElement(ctx, element) {
    if (element.type === "rect") {
      drawPixelRect(
        ctx,
        element.x,
        element.y,
        element.width,
        element.height,
        element.color
      );
      return;
    }
    if (element.type === "cactus") {
      drawPixelRect(
        ctx,
        element.x,
        element.y,
        element.width,
        element.height,
        element.color
      );
      const armWidth = element.width * 0.75;
      const armHeight = element.height * 0.4;
      if (element.height > 25) {
        drawPixelRect(
          ctx,
          element.x - armWidth,
          element.y + element.height * 0.2,
          armWidth,
          armHeight * 0.5,
          element.color
        );
        drawPixelRect(
          ctx,
          element.x + element.width,
          element.y + element.height * 0.3,
          armWidth,
          armHeight * 0.5,
          element.color
        );
      }
      return;
    }
    if (element.type === "pixelCloud") {
      const blockSize = 5;
      for (let i = 0; i < element.width / blockSize; i++) {
        for (let j = 0; j < element.height / blockSize; j++) {
          if (Math.random() > 0.25) {
            drawPixelRect(
              ctx,
              element.x + i * blockSize,
              element.y + j * blockSize,
              blockSize,
              blockSize,
              (i + j) % 2 === 0 ? element.color : element.blockColor
            );
          }
        }
      }
      return;
    }
    if (element.type === "pixelStructure") {
      const structBlockSize = Math.max(5, Math.floor(element.width / 10));
      for (let i = 0; i < element.width / structBlockSize; i++) {
        for (let j = 0; j < element.height / structBlockSize; j++) {
          if (
            Math.random() < element.density &&
            element.height - j * structBlockSize >
              Math.random() * element.height * 0.6
          ) {
            drawPixelRect(
              ctx,
              element.x + i * structBlockSize,
              element.y + j * structBlockSize,
              structBlockSize,
              structBlockSize,
              getRandomColor(element.colors)
            );
          }
        }
      }
      return;
    }
    if (element.type === "pixelTree") {
      drawPixelRect(
        ctx,
        element.x + element.leavesWidth / 2 - element.trunkWidth / 2,
        element.y + element.leavesHeight,
        element.trunkWidth,
        element.trunkHeight,
        element.trunkColor
      );
      drawPixelRect(
        ctx,
        element.x,
        element.y,
        element.leavesWidth,
        element.leavesHeight,
        element.leavesColor
      );
      drawPixelRect(
        ctx,
        element.x + 2,
        element.y + 2,
        element.leavesWidth - 4,
        element.leavesHeight - 4,
        lightenDarkenColor(element.leavesColor, -30)
      );
      return;
    }
    if (element.type === "futuristicTower") {
      const baseColor = element.colors[getRandomInt(0, 1)];
      drawPixelRect(
        ctx,
        element.x,
        element.y,
        element.width,
        element.height,
        baseColor
      );
      const numLights = getRandomInt(
        Math.floor(element.height / 20),
        Math.floor(element.height / 10)
      );
      for (let i = 0; i < numLights; i++) {
        if (Math.random() < 0.7) {
          const lightX =
            element.x +
            getRandomInt(
              Math.floor(element.width * 0.1),
              Math.floor(element.width * 0.9) - 2
            );
          const lightY =
            element.y +
            getRandomInt(
              Math.floor(element.height * 0.1),
              Math.floor(element.height * 0.9) - 2
            );
          const lightSize = getRandomInt(1, 3);
          drawPixelRect(
            ctx,
            lightX,
            lightY,
            lightSize,
            lightSize,
            getRandomColor(element.lightColors)
          );
        }
      }
      drawPixelRect(
        ctx,
        element.x + element.width * 0.2,
        element.y - 5,
        element.width * 0.6,
        5,
        getRandomColor(element.lightColors)
      );
      return;
    }
    if (element.type === "glowingOrb") {
      ctx.globalAlpha = 0.5;
      drawPixelRect(
        ctx,
        element.x - element.radius,
        element.y - element.radius,
        element.radius * 2,
        element.radius * 2,
        element.color
      );
      ctx.globalAlpha = 1.0;
      drawPixelRect(
        ctx,
        element.x - element.radius * 0.6,
        element.y - element.radius * 0.6,
        element.radius * 1.2,
        element.radius * 1.2,
        lightenDarkenColor(element.color, 50)
      );
      return;
    }
    if (element.type === "industrialBuilding") {
      const mainColor = getRandomColor(element.colors);
      drawPixelRect(
        ctx,
        element.x,
        element.y,
        element.width,
        element.height,
        mainColor
      );
      const numFeatures = getRandomInt(2, 5);
      for (let i = 0; i < numFeatures; i++) {
        if (Math.random() < 0.8) {
          const featureX =
            element.x +
            getRandomInt(
              Math.floor(element.width * 0.1),
              Math.floor(element.width * 0.8)
            );
          const featureY =
            element.y +
            getRandomInt(
              Math.floor(element.height * 0.1),
              Math.floor(element.height * 0.8)
            );
          const featureW = getRandomInt(5, 15);
          const featureH = getRandomInt(5, 10);
          drawPixelRect(
            ctx,
            featureX,
            featureY,
            featureW,
            featureH,
            lightenDarkenColor(mainColor, -40)
          );
        }
      }
      drawPixelRect(
        ctx,
        element.x,
        element.y - 3,
        element.width,
        3,
        getRandomColor(element.accentColors)
      );
      return;
    }
  }
  initLayers(theme) {
    this.layers = [];
    const layerConfigs = {
      desert_start: [
        { speed: 0.05, generator: World.generateDesertDistant, count: 10 },
        { speed: 0.15, generator: World.generateDesertDistant, count: 15 },
        { speed: 0.4, generator: World.generateDesertMid, count: 20 },
        { speed: 1.0, generator: World.generateDesertGround, count: 6 },
      ],
      gaming: [
        { speed: 0.08, generator: World.generateGamingSkyElement, count: 15 },
        { speed: 0.25, generator: World.generateGamingDistant, count: 12 },
        { speed: 0.6, generator: World.generateGamingMid, count: 25 },
        { speed: 1.0, generator: World.generateGamingGround, count: 6 },
      ],
      futuristic: [
        {
          speed: 0.06,
          generator: World.generateFuturisticSkyElement,
          count: 20,
        },
        { speed: 0.15, generator: World.generateFuturisticDistant, count: 15 },
        { speed: 0.5, generator: World.generateFuturisticMid, count: 20 },
        { speed: 1.0, generator: World.generateFuturisticGround, count: 6 },
      ],
      industrial: [
        {
          speed: 0.1,
          generator: World.generateIndustrialSkyElement,
          count: 15,
        },
        { speed: 0.25, generator: World.generateIndustrialDistant, count: 12 },
        { speed: 0.6, generator: World.generateIndustrialMid, count: 20 },
        { speed: 1.0, generator: World.generateIndustrialGround, count: 6 },
      ],
    };
    const config = layerConfigs[theme] || layerConfigs["desert_start"];
    config.forEach((lc) => {
      this.layers.push(
        new ParallaxLayer(lc.speed, "", lc.generator, lc.count, this.game, this)
      );
    });
  }
  handleThemeChange(newThemeData) {
    if (
      this.transitionTargetTheme !== newThemeData.theme &&
      !this.isTransitioning
    ) {
      if (this.currentTheme !== newThemeData.theme) {
        if (Config.DEBUG_MODE)
          console.log(
            `Starting transition from ${this.currentTheme} (layers) to ${newThemeData.theme}`
          );
        this.isTransitioning = true;
        this.transitionProgress = 0;
        this.transitionSourceSky = this.skyColor;
        this.transitionTargetSky = newThemeData.skyColor;
        this.transitionSourceTheme = this.currentTheme;
        this.transitionTargetTheme = newThemeData.theme;
        this.switchedLayersForCurrentTransition = false;
      }
    } else if (
      !this.isTransitioning &&
      this.currentTheme === newThemeData.theme
    ) {
      this.skyColor = newThemeData.skyColor;
    }
  }
  update(worldScrollSpeed) {
    this.worldX += worldScrollSpeed;
    const currentZoneInfo = StopsManager.getCurrentZone(this.worldX);
    this.handleThemeChange(currentZoneInfo);
    if (this.isTransitioning) {
      if (this.transitionDurationWorldUnits > 0 && worldScrollSpeed !== 0) {
        const progressIncrement =
          Math.abs(worldScrollSpeed) / this.transitionDurationWorldUnits;
        this.transitionProgress += progressIncrement;
      } else if (this.transitionDurationWorldUnits === 0) {
        this.transitionProgress = 1;
      }
      this.transitionProgress = Math.min(this.transitionProgress, 1);
      this.skyColor = interpolateColor(
        this.transitionSourceSky,
        this.transitionTargetSky,
        this.transitionProgress
      );
      if (
        this.transitionProgress >= 0.5 &&
        !this.switchedLayersForCurrentTransition
      ) {
        if (Config.DEBUG_MODE)
          console.log(
            `Transition midpoint: Switching layers from ${this.currentTheme} to ${this.transitionTargetTheme}`
          );
        this.currentTheme = this.transitionTargetTheme;
        this.initLayers(this.currentTheme);
        this.switchedLayersForCurrentTransition = true;
      }
      if (this.transitionProgress >= 1) {
        if (Config.DEBUG_MODE)
          console.log(`Transition to ${this.transitionTargetTheme} complete.`);
        this.isTransitioning = false;
        this.currentTheme = this.transitionTargetTheme;
        this.skyColor = this.transitionTargetSky;
        if (!this.switchedLayersForCurrentTransition) {
          this.initLayers(this.currentTheme);
        }
        this.transitionTargetTheme = this.currentTheme;
      }
    } else {
      if (this.currentTheme !== currentZoneInfo.theme) {
        this.currentTheme = currentZoneInfo.theme;
        this.initLayers(this.currentTheme);
      }
      this.skyColor = currentZoneInfo.skyColor;
    }
    this.layers.forEach((layer) => layer.update(worldScrollSpeed));
  }
  render(ctx) {
    ctx.fillStyle = this.skyColor;
    ctx.fillRect(0, 0, Config.CANVAS_WIDTH, Config.CANVAS_HEIGHT);
    this.layers.forEach((layer) => layer.render(ctx));
    if (Config.DEBUG_MODE) {
      ctx.fillStyle = "white";
      ctx.font = "12px Courier New";
      ctx.textAlign = "left";
      ctx.fillText(`WorldX: ${this.worldX.toFixed(0)}`, 10, 60);
      let themeStatus = `Theme: ${this.currentTheme}`;
      if (this.isTransitioning) {
        themeStatus += ` (T: ${this.transitionTargetTheme} ${Math.round(
          this.transitionProgress * 100
        )}%)`;
      }
      ctx.fillText(themeStatus, 10, 75);
    }
  }
}
