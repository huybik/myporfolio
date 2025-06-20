class ParallaxLayer {
  constructor(
    scrollSpeedFactor,
    color,
    elementGenerator,
    elementCount,
    game,
    world,
    layerType,
    isSourceLayer = false,
    initialXOffset = 0
  ) {
    this.scrollSpeedFactor = scrollSpeedFactor;
    this.color = color;
    this.elementGenerator = elementGenerator;
    this.elementCount = elementCount;
    this.game = game;
    this.world = world;
    this.layerType = layerType;
    this.isSourceLayer = isSourceLayer;
    this.initialXOffset = initialXOffset;
    this.elements = [];
    this.generateInitialElements();
  }

  generateInitialElements() {
    this.elements = [];
    const virtualWidth = Config.CANVAS_WIDTH * 2.5;
    for (let i = 0; i < this.elementCount; i++) {
      const x = this.initialXOffset + Math.random() * virtualWidth;
      const y = Math.random() * Config.CANVAS_HEIGHT;
      this.elements.push(
        this.elementGenerator(x, y, this.color, this.game, this.world)
      );
    }
  }

  update(worldScrollSpeed) {
    this.elements.forEach((element) => {
      element.x -= worldScrollSpeed * this.scrollSpeedFactor;
    });

    if (this.isSourceLayer) {
      this.elements = this.elements.filter((element) => {
        const elementVisualWidth =
          element.width || (element.radius ? element.radius * 2 : 50);
        return element.x + elementVisualWidth > -100; // Increased buffer for removal
      });
    } else {
      const screenWidth = Config.CANVAS_WIDTH;
      const wrapBuffer = screenWidth * 0.5;
      const totalVirtualWidth = screenWidth * 2.5;

      this.elements.forEach((element) => {
        const elementVisualWidth =
          element.width || (element.radius ? element.radius * 2 : 50);

        if (worldScrollSpeed > 0) {
          if (element.x + elementVisualWidth < -wrapBuffer) {
            element.x += totalVirtualWidth;
            element.x += Math.random() * 50 - 25;
          }
        } else if (worldScrollSpeed < 0) {
          if (element.x > screenWidth + wrapBuffer) {
            element.x -= totalVirtualWidth;
            element.x += Math.random() * 50 - 25;
          }
        }
      });
    }
  }

  render(ctx) {
    const renderBuffer = 100;
    this.elements.forEach((element) => {
      const elementVisualWidth =
        element.width || (element.radius ? element.radius * 2 : 50);
      if (
        element.x + elementVisualWidth > -renderBuffer &&
        element.x < Config.CANVAS_WIDTH + renderBuffer
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
    this.transitionDurationWorldUnits = Config.CANVAS_WIDTH * 1.0; // Duration of sky change etc.
    this.transitionSourceSky = this.skyColor;
    this.transitionTargetSky = this.skyColor;
    this.transitionSourceTheme = this.currentTheme;
    this.transitionTargetTheme = this.currentTheme;
    this.sourceLayers = null;
    this.targetLayers = null;
    // this.bufferDistance = Config.CANVAS_WIDTH * 0.5; // Not directly used here anymore
    this.layers = this.initLayers(this.currentTheme);
    if (Config.DEBUG_MODE) console.log("World initialized.");
  }

  static layerConfigs = {
    desert_start: [
      { type: "distant", speed: 0.05, count: 10 },
      { type: "distant", speed: 0.15, count: 15 },
      { type: "mid", speed: 0.4, count: 20 },
      { type: "ground", speed: 1.0, count: 6 },
    ],
    gaming: [
      { type: "sky", speed: 0.08, count: 15 },
      { type: "distant", speed: 0.25, count: 12 },
      { type: "mid", speed: 0.6, count: 25 },
      { type: "ground", speed: 1.0, count: 6 },
    ],
    futuristic: [
      { type: "sky", speed: 0.06, count: 20 },
      { type: "distant", speed: 0.15, count: 15 },
      { type: "mid", speed: 0.5, count: 20 },
      { type: "ground", speed: 1.0, count: 6 },
    ],
    industrial: [
      { type: "sky", speed: 0.1, count: 15 },
      { type: "distant", speed: 0.25, count: 12 },
      { type: "mid", speed: 0.6, count: 20 },
      { type: "ground", speed: 1.0, count: 6 },
    ],
  };

  static layerGenerators = {
    desert_start: {
      distant: World.generateDesertDistant,
      mid: World.generateDesertMid,
      ground: World.generateDesertGround,
    },
    gaming: {
      sky: World.generateGamingSkyElement,
      distant: World.generateGamingDistant,
      mid: World.generateGamingMid,
      ground: World.generateGamingGround,
    },
    futuristic: {
      sky: World.generateFuturisticSkyElement,
      distant: World.generateFuturisticDistant,
      mid: World.generateFuturisticMid,
      ground: World.generateFuturisticGround,
    },
    industrial: {
      sky: World.generateIndustrialSkyElement,
      distant: World.generateIndustrialDistant,
      mid: World.generateIndustrialMid,
      ground: World.generateIndustrialGround,
    },
  };

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
    let scrollFactor = 1.0;
    const activeLayers = world.isTransitioning
      ? world.targetLayers
      : world.layers;
    if (activeLayers && activeLayers.length > 0) {
      const groundLayer = activeLayers.find(
        (l) =>
          l.layerType === "ground" &&
          l.elementGenerator === World.generateGamingGround
      );
      if (groundLayer) scrollFactor = groundLayer.scrollSpeedFactor;
    }

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
    let scrollFactor = 1.0;
    const activeLayers = world.isTransitioning
      ? world.targetLayers
      : world.layers;
    if (activeLayers && activeLayers.length > 0) {
      const groundLayer = activeLayers.find(
        (l) =>
          l.layerType === "ground" &&
          l.elementGenerator === World.generateFuturisticGround
      );
      if (groundLayer) scrollFactor = groundLayer.scrollSpeedFactor;
    }
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

  initLayers(theme, initialXOffset = 0) {
    const newLayers = [];
    const config =
      World.layerConfigs[theme] || World.layerConfigs["desert_start"];
    config.forEach((lc) => {
      newLayers.push(
        new ParallaxLayer(
          lc.speed,
          "",
          World.layerGenerators[theme][lc.type],
          lc.count,
          this.game,
          this,
          lc.type,
          false,
          initialXOffset
        )
      );
    });
    return newLayers;
  }

  handleThemeChange(newThemeData) {
    if (this.currentTheme !== newThemeData.theme && !this.isTransitioning) {
      if (Config.DEBUG_MODE)
        console.log(
          `Starting transition from ${this.currentTheme} to ${newThemeData.theme}`
        );
      this.isTransitioning = true;
      this.transitionProgress = 0;

      this.transitionSourceSky = this.skyColor;
      this.transitionTargetSky = newThemeData.skyColor;
      this.transitionSourceTheme = this.currentTheme;
      this.transitionTargetTheme = newThemeData.theme;

      this.sourceLayers = this.layers;
      this.sourceLayers.forEach((layer) => {
        layer.isSourceLayer = true;
      });

      // Initialize new layers for the target theme, starting further off-screen to the right
      // This creates a buffer where old assets can scroll off before new ones appear.
      // Config.CANVAS_WIDTH * 1.5 means new assets start 1.5 screen widths away.
      // They will become visible after player travels 0.5 screen widths into the transition.
      const targetLayerInitialXOffset = Config.CANVAS_WIDTH * 1.5;
      this.targetLayers = this.initLayers(
        this.transitionTargetTheme,
        targetLayerInitialXOffset
      );
    } else if (
      !this.isTransitioning &&
      this.currentTheme === newThemeData.theme
    ) {
      // This case handles if getCurrentZone returns the same theme but maybe a different sky color
      // (though current getCurrentZone logic doesn't change sky for same theme)
      this.skyColor = newThemeData.skyColor;
    }
  }

  update(worldScrollSpeed) {
    this.worldX += worldScrollSpeed;
    const currentZoneInfo = StopsManager.getCurrentZone(this.worldX);
    this.handleThemeChange(currentZoneInfo);

    if (this.isTransitioning) {
      if (this.sourceLayers) {
        this.sourceLayers.forEach((layer) => layer.update(worldScrollSpeed));
      }
      if (this.targetLayers) {
        this.targetLayers.forEach((layer) => layer.update(worldScrollSpeed));
      }

      if (this.transitionDurationWorldUnits > 0 && worldScrollSpeed !== 0) {
        const progressIncrement =
          Math.abs(worldScrollSpeed) / this.transitionDurationWorldUnits;
        this.transitionProgress += progressIncrement;
      } else if (
        this.transitionDurationWorldUnits === 0 &&
        worldScrollSpeed !== 0
      ) {
        // Ensure progress if duration is 0 but moving
        this.transitionProgress = 1;
      } else if (
        this.transitionDurationWorldUnits === 0 &&
        worldScrollSpeed === 0
      ) {
        // If duration is 0 and not moving, do nothing to progress to avoid instant snap if player is idle at boundary
      }

      this.transitionProgress = Math.min(this.transitionProgress, 1);

      this.skyColor = interpolateColor(
        this.transitionSourceSky,
        this.transitionTargetSky,
        this.transitionProgress
      );

      if (this.transitionProgress >= 1) {
        if (Config.DEBUG_MODE)
          console.log(`Transition to ${this.transitionTargetTheme} complete.`);
        this.isTransitioning = false;
        this.currentTheme = this.transitionTargetTheme;
        this.skyColor = this.transitionTargetSky; // Ensure final sky color is set
        this.layers = this.targetLayers; // Old sourceLayers are naturally culled by their update logic

        this.sourceLayers = null;
        this.targetLayers = null;
      }
    } else {
      // Not transitioning, just update current layers
      this.layers.forEach((layer) => layer.update(worldScrollSpeed));
    }
  }

  render(ctx) {
    ctx.fillStyle = this.skyColor;
    ctx.fillRect(0, 0, Config.CANVAS_WIDTH, Config.CANVAS_HEIGHT);

    // Render active layers or transitioning layers
    if (this.isTransitioning) {
      if (this.sourceLayers) {
        this.sourceLayers.forEach((layer) => layer.render(ctx));
      }
      if (this.targetLayers) {
        this.targetLayers.forEach((layer) => layer.render(ctx));
      }
    } else {
      this.layers.forEach((layer) => layer.render(ctx));
    }

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
        if (this.sourceLayers)
          ctx.fillText(
            `Source Layers: ${this.sourceLayers.reduce(
              (sum, l) => sum + l.elements.length,
              0
            )} elements`,
            10,
            90
          );
        if (this.targetLayers)
          ctx.fillText(
            `Target Layers: ${this.targetLayers.reduce(
              (sum, l) => sum + l.elements.length,
              0
            )} elements`,
            10,
            105
          );
      } else {
        ctx.fillText(
          `Active Layers: ${this.layers.reduce(
            (sum, l) => sum + l.elements.length,
            0
          )} elements`,
          10,
          90
        );
      }
      ctx.fillText(themeStatus, 10, 75);
    }
  }
}
