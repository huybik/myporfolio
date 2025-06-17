// js/world.js
class ParallaxLayer {
  constructor(
    scrollSpeedFactor,
    color,
    elementGenerator,
    elementCount,
    game,
    world,
    layerType // Added layerType
  ) {
    this.scrollSpeedFactor = scrollSpeedFactor;
    this.color = color; // Base color, might not be used if generator handles themes
    this.elementGenerator = elementGenerator; // Generator for the initial/current theme
    this.elementCount = elementCount;
    this.game = game;
    this.world = world;
    this.elements = [];
    this.layerType = layerType; // Store layer type (e.g., 'sky', 'distant', 'mid', 'ground')
    this.targetTheme = null; // Theme to transition to
    this.transitionProgress = 0; // Progress of transition (0 to 1)
    this.generateInitialElements();
  }

  generateInitialElements() {
    this.elements = [];
    for (let i = 0; i < this.elementCount; i++) {
      const x = Math.random() * Config.CANVAS_WIDTH * 2.5; // Spread elements wider
      const y = Math.random() * Config.CANVAS_HEIGHT; // y will be adjusted by generator
      this.elements.push(
        this.elementGenerator(x, y, this.color, this.game, this.world)
      );
    }
  }

  setTransition(targetTheme, transitionProgress) {
    this.targetTheme = targetTheme;
    this.transitionProgress = transitionProgress;
  }

  update(worldScrollSpeed) {
    this.elements.forEach((element, index) => {
      element.x -= worldScrollSpeed * this.scrollSpeedFactor;

      const elementVisualWidth =
        element.width || (element.radius ? element.radius * 2 : 50);
      const wrapBuffer = Config.CANVAS_WIDTH * 0.5; // Generous buffer
      const totalVirtualWidth = Config.CANVAS_WIDTH * 2.5; // Match initial spread

      // Element scrolls off left, new one appears on right
      if (
        worldScrollSpeed > 0 &&
        element.x + elementVisualWidth < -wrapBuffer
      ) {
        let generatorToUse = this.elementGenerator;
        let themeForGenerator = this.world.currentTheme; // Default to current theme if not transitioning

        if (
          this.targetTheme &&
          this.world.isTransitioning &&
          this.world.transitionSourceTheme
        ) {
          if (Math.random() < this.transitionProgress) {
            generatorToUse =
              World.layerGenerators[this.targetTheme]?.[this.layerType];
            themeForGenerator = this.targetTheme;
          } else {
            generatorToUse =
              World.layerGenerators[this.world.transitionSourceTheme]?.[
                this.layerType
              ];
            themeForGenerator = this.world.transitionSourceTheme;
          }
          // Fallback if a generator is missing for a theme/type
          if (!generatorToUse) {
            generatorToUse = this.elementGenerator;
            themeForGenerator = this.world.currentTheme; // Or source theme of layer
            if (Config.DEBUG_MODE)
              console.warn(
                `Missing generator for ${themeForGenerator}/${this.layerType}, falling back.`
              );
          }
        }

        const newX = element.x + totalVirtualWidth + Math.random() * 50; // Add some randomness to prevent exact patterns
        // Ensure y is appropriate for the element type, or let generator handle it
        const newY = element.y; // Or recalculate based on layerType/theme if needed
        this.elements[index] = generatorToUse(
          newX,
          newY,
          this.color,
          this.game,
          this.world
        );
      }
      // Element scrolls off right, new one appears on left
      else if (
        worldScrollSpeed < 0 &&
        element.x > Config.CANVAS_WIDTH + wrapBuffer
      ) {
        let generatorToUse = this.elementGenerator;
        let themeForGenerator = this.world.currentTheme;

        if (
          this.targetTheme &&
          this.world.isTransitioning &&
          this.world.transitionSourceTheme
        ) {
          if (Math.random() < this.transitionProgress) {
            generatorToUse =
              World.layerGenerators[this.targetTheme]?.[this.layerType];
            themeForGenerator = this.targetTheme;
          } else {
            generatorToUse =
              World.layerGenerators[this.world.transitionSourceTheme]?.[
                this.layerType
              ];
            themeForGenerator = this.world.transitionSourceTheme;
          }
          if (!generatorToUse) {
            generatorToUse = this.elementGenerator;
            themeForGenerator = this.world.currentTheme;
            if (Config.DEBUG_MODE)
              console.warn(
                `Missing generator for ${themeForGenerator}/${this.layerType}, falling back.`
              );
          }
        }

        const newX = element.x - totalVirtualWidth - Math.random() * 50;
        const newY = element.y;
        this.elements[index] = generatorToUse(
          newX,
          newY,
          this.color,
          this.game,
          this.world
        );
      }
    });
  }

  render(ctx) {
    this.elements.forEach((element) => {
      const elementVisualWidth =
        element.width || (element.radius ? element.radius * 2 : 50);
      // Render if element is potentially visible (add some buffer)
      if (
        element.x + elementVisualWidth > -Config.CANVAS_WIDTH * 0.25 &&
        element.x < Config.CANVAS_WIDTH * 1.25
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

    this.currentTheme = "desert_start"; // Initial theme
    this.skyColor = Palettes.desert[4]; // Initial sky color

    this.isTransitioning = false;
    this.transitionProgress = 0; // 0 to 1
    this.transitionDurationWorldUnits = Config.CANVAS_WIDTH * 1.5; // Distance over which transition occurs

    this.transitionSourceTheme = this.currentTheme;
    this.transitionTargetTheme = this.currentTheme;
    this.transitionSourceSky = this.skyColor;
    this.transitionTargetSky = this.skyColor;

    this.initLayers(this.currentTheme);
    if (Config.DEBUG_MODE) console.log("World initialized.");
  }

  // Static mapping of themes to layer generators
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

  // Desert theme generators
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

  // Gaming theme generators
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
      (l) =>
        l.elementGenerator === World.generateGamingGround ||
        (l.layerType === "ground" &&
          (l.world.currentTheme === "gaming" ||
            l.world.transitionTargetTheme === "gaming"))
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

  // Futuristic theme generators
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
        color: getRandomColor(Palettes.futuristic.lights.map((c) => `${c}33`)), // Transparent
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
      (l) =>
        l.elementGenerator === World.generateFuturisticGround ||
        (l.layerType === "ground" &&
          (l.world.currentTheme === "futuristic" ||
            l.world.transitionTargetTheme === "futuristic"))
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

  // Industrial theme generators
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
        y: world.groundLevelY - stackHeight - getRandomInt(50, 100), // Higher up
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
        color: getRandomColor(Palettes.desert.slice(1, 3)), // Re-using desert palette for wooden crates
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
    if (r < 0.6) color = Palettes.industrial.metal[0]; // Concrete/metal look
    else if (r < 0.8) color = Palettes.industrial.buildings[3]; // Darker ground
    else color = Palettes.desert[2]; // Dirt patches
    return {
      type: "rect",
      x: x,
      y: world.groundLevelY,
      width: Config.CANVAS_WIDTH * 0.5 + getRandomInt(0, 10),
      height: 70,
      color: color,
    };
  }

  // Element drawing method
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
        // Only draw arms for taller cacti
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
      const blockSize = 5; // Size of each "pixel" in the cloud
      for (let i = 0; i < element.width / blockSize; i++) {
        for (let j = 0; j < element.height / blockSize; j++) {
          if (Math.random() > 0.25) {
            // Sparseness
            drawPixelRect(
              ctx,
              element.x + i * blockSize,
              element.y + j * blockSize,
              blockSize,
              blockSize,
              (i + j) % 2 === 0 ? element.color : element.blockColor // Simple pattern
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
            Math.random() < element.density && // Overall density
            // Tapering effect: more blocks at bottom
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
      // Trunk
      drawPixelRect(
        ctx,
        element.x + element.leavesWidth / 2 - element.trunkWidth / 2,
        element.y + element.leavesHeight,
        element.trunkWidth,
        element.trunkHeight,
        element.trunkColor
      );
      // Leaves main block
      drawPixelRect(
        ctx,
        element.x,
        element.y,
        element.leavesWidth,
        element.leavesHeight,
        element.leavesColor
      );
      // Leaves inner detail
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
      const baseColor = element.colors[getRandomInt(0, 1)]; // Pick one of the base building colors
      drawPixelRect(
        ctx,
        element.x,
        element.y,
        element.width,
        element.height,
        baseColor
      );
      // Add some "windows" or lights
      const numLights = getRandomInt(
        Math.floor(element.height / 20),
        Math.floor(element.height / 10)
      );
      for (let i = 0; i < numLights; i++) {
        if (Math.random() < 0.7) {
          // Chance to draw a light
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
      // Top antenna/feature
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
      ctx.globalAlpha = 0.5; // Outer glow
      drawPixelRect(
        ctx,
        element.x - element.radius,
        element.y - element.radius,
        element.radius * 2,
        element.radius * 2,
        element.color
      );
      ctx.globalAlpha = 1.0; // Core
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
      // Add some features like vents or panels
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
      // Roofline detail
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

    const config = layerConfigs[theme] || layerConfigs["desert_start"]; // Fallback
    const themeGenerators =
      World.layerGenerators[theme] || World.layerGenerators["desert_start"];

    config.forEach((lc) => {
      const generatorFunction = themeGenerators[lc.type];
      if (!generatorFunction) {
        if (Config.DEBUG_MODE)
          console.warn(
            `No generator for theme ${theme}, layer type ${lc.type}. Skipping layer.`
          );
        return;
      }
      this.layers.push(
        new ParallaxLayer(
          lc.speed,
          "", // Color - less relevant now as generators pick from palettes
          generatorFunction,
          lc.count,
          this.game,
          this,
          lc.type // Pass layer type
        )
      );
    });
  }

  handleThemeChange(newThemeData) {
    if (this.isTransitioning) {
      // Already transitioning. Check if the target needs to change.
      if (this.transitionTargetTheme !== newThemeData.theme) {
        // Target changed mid-transition. Start a new one from current interpolated state.
        if (Config.DEBUG_MODE)
          console.log(
            `World: Transition target changed from ${this.transitionTargetTheme} to ${newThemeData.theme}.`
          );

        // The source theme for the new transition is the one we were *just* transitioning from,
        // or the current fully established theme if the previous transition was very short.
        // For simplicity, we use the current sky color as the source sky.
        // The source *theme* for layer elements will be the `currentTheme` (last fully committed theme).
        this.transitionSourceSky = this.skyColor; // Current interpolated sky is the new source sky
        this.transitionSourceTheme = this.currentTheme; // The theme before this whole transition sequence started

        this.transitionTargetTheme = newThemeData.theme;
        this.transitionTargetSky = newThemeData.skyColor;
        this.transitionProgress = 0; // Restart progress for the new target.

        if (Config.DEBUG_MODE)
          console.log(
            `World: New transition initiated: ${this.transitionSourceTheme} -> ${this.transitionTargetTheme}`
          );
      }
      // If target is the same, do nothing, continue current transition.
    } else {
      // Not currently transitioning. Check if new theme is different from current settled theme.
      if (this.currentTheme !== newThemeData.theme) {
        // Need to start a new transition.
        if (Config.DEBUG_MODE)
          console.log(
            `World: Starting transition from ${this.currentTheme} to ${newThemeData.theme}.`
          );
        this.isTransitioning = true;
        this.transitionProgress = 0;
        this.transitionSourceTheme = this.currentTheme;
        this.transitionSourceSky = this.skyColor; // Sky color of the current (source) theme
        this.transitionTargetTheme = newThemeData.theme;
        this.transitionTargetSky = newThemeData.skyColor;
      } else {
        // Theme is the same, not transitioning. Just ensure sky color is correct.
        this.skyColor = newThemeData.skyColor;
      }
    }
  }

  update(worldScrollSpeed) {
    this.worldX += worldScrollSpeed;
    const currentZoneInfo = StopsManager.getCurrentZone(this.worldX);

    this.handleThemeChange(currentZoneInfo);

    if (this.isTransitioning) {
      if (this.transitionDurationWorldUnits > 0 && worldScrollSpeed !== 0) {
        // Progress is based on how much of the transition distance has been covered
        this.transitionProgress +=
          Math.abs(worldScrollSpeed) / this.transitionDurationWorldUnits;
      } else if (this.transitionDurationWorldUnits === 0) {
        // Instant transition
        this.transitionProgress = 1;
      }
      this.transitionProgress = Math.min(this.transitionProgress, 1); // Cap at 1

      this.skyColor = interpolateColor(
        this.transitionSourceSky,
        this.transitionTargetSky,
        this.transitionProgress
      );

      // Inform layers about the ongoing transition
      this.layers.forEach((layer) =>
        layer.setTransition(this.transitionTargetTheme, this.transitionProgress)
      );

      if (this.transitionProgress >= 1) {
        // Transition complete
        if (Config.DEBUG_MODE)
          console.log(
            `World: Transition to ${this.transitionTargetTheme} complete.`
          );
        this.currentTheme = this.transitionTargetTheme;
        this.skyColor = this.transitionTargetSky; // Ensure final color is exact
        this.isTransitioning = false;
        // this.transitionProgress = 0; // Reset for next potential transition

        // Regenerate layers to be purely the new theme
        this.initLayers(this.currentTheme);
        // New layers are created by initLayers, their internal transition state is reset.
      }
    } else {
      // Not transitioning. Ensure layers are not in a transition state.
      // This is mostly for safety or if a transition was aborted.
      // If initLayers was just called, new layers are already clean.
      this.layers.forEach((layer) => layer.setTransition(null, 0));

      // If currentTheme somehow differs from zone without transition (e.g. initial load, or error)
      if (this.currentTheme !== currentZoneInfo.theme) {
        if (Config.DEBUG_MODE)
          console.warn(
            `World: Mismatch! currentTheme=${this.currentTheme}, zoneTheme=${currentZoneInfo.theme} but not transitioning. Forcing sync.`
          );
        this.currentTheme = currentZoneInfo.theme;
        this.skyColor = currentZoneInfo.skyColor;
        this.initLayers(this.currentTheme); // Full switch
      } else {
        // If theme is same, ensure sky color is accurate (e.g. if it was default before first zone check)
        this.skyColor = currentZoneInfo.skyColor;
      }
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
        themeStatus = `Transition: ${this.transitionSourceTheme} -> ${
          this.transitionTargetTheme
        } (${Math.round(this.transitionProgress * 100)}%)`;
      }
      ctx.fillText(themeStatus, 10, 75);
    }
  }
}
