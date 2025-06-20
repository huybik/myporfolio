class ParallaxLayer {
  constructor(
    scrollSpeedFactor,
    elementGenerator,
    elementCount,
    game,
    world,
    layerConfig,
    isSourceLayer = false, // This flag is now primarily managed by World during transitions
    initialXOffset = 0
  ) {
    this.scrollSpeedFactor = scrollSpeedFactor;
    this.elementGenerator = elementGenerator;
    this.elementCount = elementCount;
    this.game = game;
    this.world = world;
    this.layerConfig = layerConfig;
    this.isSourceLayer = isSourceLayer; // True if this layer is part of the "old" theme during transition
    this.initialXOffset = initialXOffset; // World X offset for generating elements
    this.elements = [];
    this.generateInitialElements();
  }

  generateInitialElements() {
    this.elements = [];
    // virtualWidth is the span in world coordinates over which elements are initially scattered
    const virtualWidth = Config.CANVAS_WIDTH * 3.5; // Increased for more spread, consistent for all
    for (let i = 0; i < this.elementCount; i++) {
      // element.x will be an absolute world coordinate for this layer's parallax plane
      const x = this.initialXOffset + Math.random() * virtualWidth;
      let y;
      // Y-positioning logic (remains largely the same)
      if (
        this.layerConfig.type &&
        (this.layerConfig.type.includes("sky") ||
          this.layerConfig.type.includes("celestial") ||
          this.layerConfig.type.includes("stars") ||
          this.layerConfig.type.includes("nebulae"))
      ) {
        y = getRandomFloat(
          Config.CANVAS_HEIGHT * 0.05,
          this.world.groundLevelY * 0.55
        );
      } else if (this.layerConfig.type === "foreground_debris") {
        y = getRandomFloat(
          this.world.groundLevelY + 5,
          Config.CANVAS_HEIGHT - 5
        );
      } else if (
        this.layerConfig.type &&
        (this.layerConfig.type.includes("mountain") ||
          this.layerConfig.type.includes("distant"))
      ) {
        y = this.world.groundLevelY;
      } else {
        y = Math.random() * Config.CANVAS_HEIGHT;
      }
      this.elements.push(
        this.elementGenerator(x, y, this.layerConfig, this.game, this.world)
      );
    }
  }

  update(worldScrollSpeed) {
    // worldScrollSpeed is player.currentSpeed
    // Calculate the current "left edge" of the viewport for this parallax layer
    const layerScrolledOriginX = this.world.worldX * this.scrollSpeedFactor;
    const screenWidth = Config.CANVAS_WIDTH;

    // Update individual elements (like blinking stars, internal animations)
    this.elements.forEach((element) => {
      if (element.update) {
        element.update(this.game.deltaTime, this.game.gameTime);
      }
    });

    // Wrapping/filtering logic
    const wrapBuffer = screenWidth * 0.75; // Buffer in screen units
    // totalVirtualWidth is the distance in world units elements are wrapped by
    const totalVirtualWidth = screenWidth * 3.5;

    if (this.isSourceLayer) {
      // If this layer is part of the old theme, filter out elements
      this.elements = this.elements.filter((element) => {
        const elementVisualWidth =
          element.width || (element.radius ? element.radius * 2 : 50);
        // Remove element if its right edge (world coord) is too far left of the layer's viewport
        return (
          element.x + elementVisualWidth > layerScrolledOriginX - wrapBuffer * 2
        );
      });
    } else {
      // Not a source layer (new theme or normal operation), so wrap elements
      this.elements.forEach((element) => {
        const elementVisualWidth =
          element.width || (element.radius ? element.radius * 2 : 50);
        // Calculate element's apparent X position on the screen
        const elementScreenX = element.x - layerScrolledOriginX;

        // If element is too far left on screen, wrap its world position to the right
        if (elementScreenX + elementVisualWidth < -wrapBuffer) {
          element.x += totalVirtualWidth + Math.random() * 100 - 50; // Add to its world X
          if (element.canRandomizeYOnWrap) {
            // Y-randomization logic (remains the same)
            if (
              this.layerConfig.type &&
              (this.layerConfig.type.includes("sky") ||
                this.layerConfig.type.includes("celestial") ||
                this.layerConfig.type.includes("stars") ||
                this.layerConfig.type.includes("nebulae"))
            ) {
              element.y = getRandomFloat(
                Config.CANVAS_HEIGHT * 0.05,
                this.world.groundLevelY * 0.55
              );
            } else if (this.layerConfig.type === "foreground_debris") {
              element.y = getRandomFloat(
                this.world.groundLevelY + 5,
                Config.CANVAS_HEIGHT - 5
              );
            }
          }
        }
        // If element is too far right on screen, wrap its world position to the left
        else if (elementScreenX > screenWidth + wrapBuffer) {
          element.x -= totalVirtualWidth + Math.random() * 100 - 50; // Subtract from its world X
          if (element.canRandomizeYOnWrap) {
            // Y-randomization logic (remains the same)
            if (
              this.layerConfig.type &&
              (this.layerConfig.type.includes("sky") ||
                this.layerConfig.type.includes("celestial") ||
                this.layerConfig.type.includes("stars") ||
                this.layerConfig.type.includes("nebulae"))
            ) {
              element.y = getRandomFloat(
                Config.CANVAS_HEIGHT * 0.05,
                this.world.groundLevelY * 0.55
              );
            } else if (this.layerConfig.type === "foreground_debris") {
              element.y = getRandomFloat(
                this.world.groundLevelY + 5,
                Config.CANVAS_HEIGHT - 5
              );
            }
          }
        }
      });
    }
  }

  render(ctx) {
    const renderBuffer = 200; // Screen units buffer for culling
    const layerScrolledOriginX = this.world.worldX * this.scrollSpeedFactor;

    ctx.save();
    // Translate the context by this layer's parallax scroll amount.
    // All subsequent drawing operations for this layer will use element.x as world coordinates.
    ctx.translate(-layerScrolledOriginX, 0);

    this.elements.forEach((element) => {
      const elementVisualWidth =
        element.width || (element.radius ? element.radius * 2 : 50);

      // Culling: Compare element's world X with the viewport's world X range
      // Viewport world X range: [layerScrolledOriginX - renderBuffer, layerScrolledOriginX + Config.CANVAS_WIDTH + renderBuffer]
      if (
        element.x + elementVisualWidth > layerScrolledOriginX - renderBuffer &&
        element.x < layerScrolledOriginX + Config.CANVAS_WIDTH + renderBuffer
      ) {
        let elementAlpha = 1.0;
        if (this.world.isTransitioning) {
          if (this.isSourceLayer) {
            // This layer is part of the old theme, fading out
            elementAlpha = 1.0 - this.world.transitionProgress;
          } else {
            // This layer is part of the new theme, fading in
            elementAlpha = this.world.transitionProgress;
          }
        }
        elementAlpha = Math.max(0, Math.min(1, elementAlpha));

        if (elementAlpha <= 0.01) return; // Skip rendering if almost fully transparent

        const originalCtxAlpha = ctx.globalAlpha;
        ctx.globalAlpha *= elementAlpha;

        const activeTheme = this.world.isTransitioning
          ? this.isSourceLayer
            ? this.world.transitionSourceTheme
            : this.world.transitionTargetTheme
          : this.world.currentTheme;
        const themePalette = Palettes[activeTheme] || Palettes.desert;

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
          } else if (typeof finalColor !== "string") {
            finalColor = "#FF00FF"; // Fallback for invalid color
          }
          element.tempColor = finalColor;
        } else {
          element.tempColor = finalColor;
        }

        // drawElement uses element.x, element.y as world coordinates,
        // which is correct now because the context is translated.
        this.world.drawElement(
          ctx,
          element,
          this.game.gameTime,
          this.scrollSpeedFactor
        );

        ctx.globalAlpha = originalCtxAlpha;
      }
    });
    ctx.restore(); // Restore context translation
  }
}

class World {
  constructor(game) {
    this.game = game;
    this.layers = [];
    this.worldX = 0; // Represents the camera's X position in the world
    this.groundLevelY = Config.CANVAS_HEIGHT - 80;

    this.currentTheme = "desert_start";
    const initialPalette = Palettes[this.currentTheme] || Palettes.desert;
    this.skyColor = (initialPalette.sky && initialPalette.sky[0]) || "#FAD7A0";
    this.currentTopSky = this.skyColor;
    this.currentHorizonSky =
      (initialPalette.sky && initialPalette.sky[1]) ||
      lightenDarkenColor(this.currentTopSky, 30);

    this.isTransitioning = false;
    this.transitionProgress = 0;
    // Transition occurs over this many world units of player movement
    this.transitionDurationWorldUnits = Config.CANVAS_WIDTH * 1.1;

    this.transitionSourceSky = this.skyColor;
    this.transitionTargetSky = this.skyColor;
    this.transitionSourceTheme = this.currentTheme;
    this.transitionTargetTheme = this.currentTheme;

    this.sourceLayers = []; // Layers from the old theme, to be faded out
    this.targetLayers = []; // Layers for the new theme, to be faded in

    this.layers = this.initLayers(this.currentTheme, this.worldX); // Initial layers

    this.weatherParticles = [];
    this.maxWeatherParticles = 100;

    if (Config.DEBUG_MODE) console.log("World initialized.");
  }

  // Static layer configurations (World.layerConfigs) remain unchanged
  static layerConfigs = {
    desert_start: [
      {
        type: "stars_far",
        speed: 0.01,
        count: 150,
        generator: World.generateStar,
        options: { colors: ["#FFFFFF", "#FFFFE0"], sizes: [1, 1] },
      },
      {
        type: "stars_near",
        speed: 0.02,
        count: 70,
        generator: World.generateStar,
        options: { colors: ["#FFFFFF", "#F0F8FF"], sizes: [1, 2] },
      },
      {
        type: "celestial",
        speed: 0.03,
        count: 1,
        generator: World.generateCelestialBody,
        options: { type: "sun" },
      },
      {
        type: "distant_mountains",
        speed: 0.08,
        count: 10,
        generator: World.generateDesertDistant,
        options: {
          colorBase: Palettes.desert.objects_primary.shadow,
          heightRange: [80, 150],
        },
      },
      {
        type: "mid_mesas",
        speed: 0.25,
        count: 15,
        generator: World.generateDesertMid,
        options: { type: "mesa" },
      },
      {
        type: "near_rocks_cactus",
        speed: 0.5,
        count: 20,
        generator: World.generateDesertMid,
        options: { type: "mixed" },
      },
      {
        type: "ground_texture",
        speed: 1.0,
        count: 8,
        generator: World.generateDesertGround,
      },
      {
        type: "foreground_debris",
        speed: 1.5,
        count: 30,
        generator: World.generateForegroundDebris,
        options: { types: ["rock", "tumbleweed_small"] },
      },
    ],
    gaming: [
      {
        type: "stars_far",
        speed: 0.02,
        count: 100,
        generator: World.generateStar,
        options: { colors: ["#FF00FF", "#00FFFF"], sizes: [1, 1] },
      },
      {
        type: "celestial",
        speed: 0.04,
        count: 1,
        generator: World.generateCelestialBody,
        options: { type: "glitch_moon" },
      },
      {
        type: "pixel_clouds",
        speed: 0.1,
        count: 15,
        generator: World.generatePixelCloud,
        options: {
          colors: [
            Palettes.gaming.sky[1],
            lightenDarkenColor(Palettes.gaming.sky[1], 20),
          ],
          sizeRange: [30, 80],
        },
      },
      {
        type: "distant_structures",
        speed: 0.25,
        count: 12,
        generator: World.generateGamingDistant,
      },
      {
        type: "mid_elements",
        speed: 0.6,
        count: 25,
        generator: World.generateGamingMid,
      },
      {
        type: "ground_texture",
        speed: 1.0,
        count: 8,
        generator: World.generateGamingGround,
      },
      {
        type: "foreground_debris",
        speed: 1.5,
        count: 25,
        generator: World.generateForegroundDebris,
        options: { types: ["glitch_cube", "wire", "pixel_coin"] },
      },
    ],
    futuristic: [
      {
        type: "stars_far",
        speed: 0.01,
        count: 200,
        generator: World.generateStar,
        options: { colors: ["#A0A0FF", "#C0C0FF"], sizes: [1, 1] },
      },
      {
        type: "stars_near",
        speed: 0.02,
        count: 100,
        generator: World.generateStar,
        options: { colors: ["#FFFFFF", "#E0E0FF"], sizes: [1, 2] },
      },
      {
        type: "nebulae_distant",
        speed: 0.03,
        count: 5,
        generator: World.generateNebula,
        options: {
          colors: [
            Palettes.futuristic.sky[2] + "33",
            Palettes.futuristic.emissive[1] + "22",
          ],
        },
      },
      {
        type: "celestial",
        speed: 0.04,
        count: 1,
        generator: World.generateCelestialBody,
        options: { type: "tech_moon" },
      },
      {
        type: "sky_traffic",
        speed: 0.15,
        count: 20,
        generator: World.generateFuturisticSkyElement,
      },
      {
        type: "distant_towers",
        speed: 0.3,
        count: 15,
        generator: World.generateFuturisticDistant,
      },
      {
        type: "mid_platforms",
        speed: 0.55,
        count: 20,
        generator: World.generateFuturisticMid,
      },
      {
        type: "ground_guideways",
        speed: 1.0,
        count: 8,
        generator: World.generateFuturisticGround,
      },
      {
        type: "foreground_debris",
        speed: 1.5,
        count: 20,
        generator: World.generateForegroundDebris,
        options: { types: ["metal_shard", "glowing_bit", "circuit_piece"] },
      },
    ],
    industrial: [
      {
        type: "dense_clouds_low",
        speed: 0.08,
        count: 10,
        generator: World.generatePixelCloud,
        options: {
          colors: [Palettes.industrial.smoke[0], Palettes.industrial.sky[2]],
          sizeRange: [80, 150],
          yPosRange: [0.3, 0.6],
        },
      },
      {
        type: "dense_clouds_high",
        speed: 0.12,
        count: 12,
        generator: World.generatePixelCloud,
        options: {
          colors: [Palettes.industrial.smoke[1], Palettes.industrial.smoke[2]],
          sizeRange: [60, 120],
          yPosRange: [0.1, 0.4],
        },
      },
      {
        type: "distant_smokestacks",
        speed: 0.25,
        count: 12,
        generator: World.generateIndustrialDistant,
        options: { type: "smokestack" },
      },
      {
        type: "mid_buildings_pipes",
        speed: 0.6,
        count: 20,
        generator: World.generateIndustrialMid,
      },
      {
        type: "ground_asphalt_cracks",
        speed: 1.0,
        count: 8,
        generator: World.generateIndustrialGround,
      },
      {
        type: "foreground_debris",
        speed: 1.5,
        count: 35,
        generator: World.generateForegroundDebris,
        options: { types: ["rubble", "rusty_pipe_fragment", "gear"] },
      },
    ],
  };

  // Static element generator functions (generateStar, generatePixelCloud, etc.) remain unchanged
  static getSideColor(objectPalette, sideType) {
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
  }

  static generateStar(x, y, layerConfig, game, world) {
    const options = layerConfig.options || {};
    const sizeArray = options.sizes || [1, 1];
    const size = getRandomInt(sizeArray[0], sizeArray[1]);
    const colorArray = options.colors || ["#FFFFFF"];
    const starColor = getRandomColor(colorArray);
    return {
      type: "star",
      x: x, // World X for this element
      y: y, // World Y for this element
      size: size,
      color: starColor,
      initialBrightness: getRandomFloat(0.5, 1.0),
      blinkRate: getRandomFloat(1, 5),
      blinkPhase: getRandomFloat(0, Math.PI * 2),
      originalColor: starColor,
      canRandomizeYOnWrap: true,
      update: function (deltaTime, gameTime) {
        // Example of an element's own update
        // Blinking logic can be handled here if needed, or in drawElement
        this.blinkFactor =
          (Math.sin(gameTime * this.blinkRate + this.blinkPhase) + 1) / 2;
      },
    };
  }

  static generateCelestialBody(x, y, layerConfig, game, world) {
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
      canRandomizeYOnWrap: false, // Usually, celestial bodies don't randomize Y on wrap
    };
  }

  static generatePixelCloud(x, y, layerConfig, game, world) {
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
        // Y position relative to screen/sky area
        Config.CANVAS_HEIGHT * yPosRange[0],
        world.groundLevelY * yPosRange[1]
      ),
      width: cloudWidth,
      height: cloudHeight,
      colors: cloudColors,
      originalColor: cloudColors[0], // For tinting
      canRandomizeYOnWrap: true,
    };
  }

  static generateNebula(x, y, layerConfig, game, world) {
    const options = layerConfig.options || {};
    const nebulaColors = options.colors || [
      Palettes.futuristic.sky[2] + "33",
      Palettes.futuristic.emissive[1] + "22",
    ];
    return {
      type: "nebula",
      x: x,
      y: y, // y is absolute world y for this layer
      width: getRandomInt(200, 400),
      height: getRandomInt(100, 250),
      colors: nebulaColors,
      density: getRandomFloat(0.1, 0.3),
      originalColor: nebulaColors[0],
      isEmissive: true,
      canRandomizeYOnWrap: true,
    };
  }

  static generateDesertDistant(x, y, layerConfig, game, world) {
    const options = layerConfig.options || {};
    const heightRange = options.heightRange || [50, 100];
    const width = getRandomInt(30, 70);
    const height = getRandomInt(heightRange[0], heightRange[1]);
    const color = options.colorBase || Palettes.desert.objects_primary.shadow;
    return {
      type: "rect_simple_mountain",
      x: x,
      // Y is relative to groundLevelY, effectively a world Y
      y: world.groundLevelY - height - getRandomInt(10, 40),
      width: width,
      height: height,
      color: color,
      originalColor: color,
      canRandomizeYOnWrap: false, // Mountains usually don't change Y
    };
  }

  static generateDesertMid(x, y, layerConfig, game, world) {
    const options = layerConfig.options || {};
    const r = Math.random();
    let element;

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
  }

  static generateDesertGround(x, y, layerConfig, game, world) {
    const baseColor = Palettes.desert.ground[0];
    const detailColors = [Palettes.desert.ground[2], Palettes.desert.ground[3]];
    const segmentWidth = Config.CANVAS_WIDTH * 0.5 + getRandomInt(0, 20);
    return {
      type: "textured_ground_rect",
      x: x,
      y: world.groundLevelY, // Ground elements are at groundLevelY
      width: segmentWidth,
      height: Config.CANVAS_HEIGHT - world.groundLevelY,
      baseColor: baseColor,
      detailColors: detailColors,
      textureType: "desert_cracks_pebbles",
      originalColor: baseColor,
      canRandomizeYOnWrap: false,
    };
  }

  static generateForegroundDebris(x, y, layerConfig, game, world) {
    const options = layerConfig.options || { types: ["rock"] };
    const type = getRandomColor(options.types);
    let element = {
      type: "debris",
      x: x,
      y: y, // y is absolute world y for this layer
      size: getRandomInt(3, 8),
      color: "#000000", // Default, will be overridden
      debrisType: type,
      originalColor: "#000000",
      canRandomizeYOnWrap: true, // Debris can often change Y
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
        element.size = getRandomInt(10, 20); // This is width for wire
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
        element.size = getRandomInt(6, 12); // Width
        element.height = getRandomInt(2, 4);
        break;
      case "rubble":
        element.color = getRandomColor(Palettes.industrial.ground.slice(1, 3));
        break;
      case "rusty_pipe_fragment":
        element.color = getRandomColor(Palettes.industrial.objects_accent);
        element.size = getRandomInt(10, 18); // Width
        element.height = getRandomInt(3, 5);
        break;
      case "gear":
        element.color = Palettes.industrial.objects_primary.shadow;
        element.size = getRandomInt(7, 10);
        break;
    }
    element.originalColor = element.color; // Set originalColor after specific color is determined
    return element;
  }

  static generateGamingDistant(x, y, layerConfig, game, world) {
    const r = Math.random();
    let element;
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
        y: world.groundLevelY - height - getRandomInt(50, 150), // Higher up
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
  }

  static generateGamingMid(x, y, layerConfig, game, world) {
    const r = Math.random();
    let element;
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
        trunkColor: Palettes.desert.objects_accent[0], // Brown trunk
        leavesColor: Palettes.gaming.ground[0], // Green leaves
        leavesHighlight: Palettes.gaming.ground[2],
        originalColor: Palettes.gaming.ground[0],
      };
    } else if (r < 0.7) {
      const stemHeight = getRandomInt(15, 30);
      const capRadius = getRandomInt(10, 25);
      element = {
        type: "giant_mushroom",
        x: x,
        y: world.groundLevelY - stemHeight - capRadius, // Y is top of mushroom
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
          symbol: Palettes.gaming.emissive[0], // Yellow '?'
        },
        originalColor: getRandomColor(Palettes.gaming.objects_accent),
        isEmissive: true, // Symbol might be emissive
      };
    }
    element.canRandomizeYOnWrap = false;
    return element;
  }

  static generateGamingGround(x, y, layerConfig, game, world) {
    const segmentWidth = 40; // Width of checkerboard squares
    // Calculate color based on world position to make checkerboard pattern
    const colorIndex = Math.floor(x / segmentWidth) % 2;
    const baseColor = Palettes.gaming.ground[colorIndex];
    const detailColors = [
      Palettes.gaming.ground[2], // Light green detail
      Palettes.gaming.ground[3], // Dark green shadow/detail
      Palettes.gaming.emissive[2], // Pink emissive for flowers/dots
    ];
    return {
      type: "textured_ground_rect",
      x: x,
      y: world.groundLevelY,
      width: Config.CANVAS_WIDTH * 0.5 + getRandomInt(0, 10), // Width of this ground segment
      height: Config.CANVAS_HEIGHT - world.groundLevelY,
      baseColor: baseColor,
      detailColors: detailColors,
      textureType: "gaming_grid_flowers",
      originalColor: baseColor,
      canRandomizeYOnWrap: false,
    };
  }

  static generateFuturisticSkyElement(x, y, layerConfig, game, world) {
    const r = Math.random();
    if (r < 0.7) {
      const width = getRandomInt(15, 40);
      const height = getRandomInt(5, 10);
      const color = Palettes.futuristic.objects_primary.shadow + "AA";
      return {
        type: "rect", // Simple rect for distant flying vehicle silhouette
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
      const color = getRandomColor(Palettes.futuristic.emissive) + "66"; // Semi-transparent trail
      return {
        type: "rect", // Simple rect for energy beam/trail
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
  }

  static generateFuturisticDistant(x, y, layerConfig, game, world) {
    const buildingWidth = getRandomInt(40, 90);
    const buildingHeight = getRandomInt(150, Config.CANVAS_HEIGHT * 0.7);
    return {
      type: "futuristicTower",
      x: x,
      y: world.groundLevelY - buildingHeight, // Y is top of tower
      width: buildingWidth,
      height: buildingHeight,
      colors: Palettes.futuristic.objects_primary,
      lightColors: Palettes.futuristic.emissive,
      originalColor: Palettes.futuristic.objects_primary.base,
      canRandomizeYOnWrap: false,
    };
  }

  static generateFuturisticMid(x, y, layerConfig, game, world) {
    const r = Math.random();
    if (r < 0.6) {
      const platWidth = getRandomInt(50, 120);
      const platHeight = getRandomInt(10, 25);
      return {
        type: "rect_platform",
        x: x,
        y: world.groundLevelY - platHeight - getRandomInt(10, 80), // Y is top of platform
        width: platWidth,
        height: platHeight,
        colors: {
          base: Palettes.futuristic.objects_primary.base,
          trim: Palettes.futuristic.emissive[0], // Emissive trim
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
        y: world.groundLevelY - pylonHeight, // Y is top of pylon
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
  }

  static generateFuturisticGround(x, y, layerConfig, game, world) {
    const panelWidth = 80; // Width of ground panels/segments
    // Determine color based on world position for variety
    const colorIndex = Math.floor(x / panelWidth) % 3;
    const baseColor =
      Palettes.futuristic.ground[
        colorIndex === 0 ? 0 : colorIndex === 1 ? 1 : 0
      ];
    const detailColors = [
      Palettes.futuristic.ground[2], // Detail lines/panels
      Palettes.futuristic.emissive[0], // Emissive guideway lines
      Palettes.futuristic.emissive[1], // Other emissive details
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
  }

  static generateIndustrialDistant(x, y, layerConfig, game, world) {
    const options = layerConfig.options || {};
    const buildingWidth = getRandomInt(70, 150);
    const buildingHeight = getRandomInt(100, Config.CANVAS_HEIGHT * 0.5);
    return {
      type:
        options.type === "smokestack"
          ? "industrialSmokestack"
          : "industrialBuilding",
      x: x,
      y: world.groundLevelY - buildingHeight, // Y is top
      width: buildingWidth,
      height: buildingHeight,
      colors: Palettes.industrial.objects_primary,
      accentColors: Palettes.industrial.objects_accent,
      smokeColors: Palettes.industrial.smoke, // For smokestacks
      originalColor: Palettes.industrial.objects_primary.base,
      canRandomizeYOnWrap: false,
    };
  }

  static generateIndustrialMid(x, y, layerConfig, game, world) {
    const r = Math.random();
    let element;
    if (r < 0.4) {
      const size = getRandomInt(15, 30);
      const crateColor = getRandomColor(Palettes.industrial.objects_accent);
      element = {
        type: "rect_crates",
        x,
        y: world.groundLevelY - size, // Y is top of crate
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
        y: world.groundLevelY - thickness - getRandomInt(0, 40), // Y is top of pipe
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
        y: world.groundLevelY - pileSize * 0.7, // Y is approx top
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
  }

  static generateIndustrialGround(x, y, layerConfig, game, world) {
    const r = Math.random();
    let baseColor;
    if (r < 0.6) baseColor = Palettes.industrial.ground[0]; // Dark asphalt
    else if (r < 0.8)
      baseColor = Palettes.industrial.ground[1]; // Lighter concrete
    else baseColor = Palettes.industrial.objects_accent[1]; // Rusty patches
    const detailColors = [
      Palettes.industrial.ground[3], // Cracks/shadows
      Palettes.industrial.objects_accent[0], // Oil stains/rust
      Palettes.industrial.emissive[0], // Warning lights/sparks (rare)
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
  }

  // drawElement method remains unchanged as it uses element.x, element.y which are now consistently world coords
  // and the context translation in ParallaxLayer.render handles the screen positioning.
  drawElement(ctx, element, gameTime, scrollSpeedFactor = 1.0) {
    const drawColor = element.tempColor || element.color || "#FF00FF";

    let yOffset = 0;
    const activeThemeForHaze = this.isTransitioning
      ? this.transitionTargetTheme
      : this.currentTheme;
    if (
      activeThemeForHaze === "desert_start" &&
      scrollSpeedFactor < 0.3 &&
      element.y > this.groundLevelY * 0.7
    ) {
      const waveAmplitude = 0.5 + scrollSpeedFactor * 2;
      const waveFrequency = 0.03;
      // Use element.x (world coordinate) for consistent wave pattern regardless of screen position
      yOffset =
        Math.sin(element.x * waveFrequency + gameTime * 3) * waveAmplitude;
    }
    // element.y is already a world Y, drawY is the final world Y for drawing
    const drawY = element.y + yOffset;

    if (element.type === "rect") {
      drawPixelRect(
        ctx,
        element.x,
        drawY,
        element.width,
        element.height,
        drawColor
      );
    } else if (element.type === "star") {
      const currentAlpha = ctx.globalAlpha;
      // Element's own update function might set blinkFactor
      const blinkFactor =
        element.blinkFactor !== undefined
          ? element.blinkFactor
          : (Math.sin(gameTime * element.blinkRate + element.blinkPhase) + 1) /
            2;
      ctx.globalAlpha *= element.initialBrightness * blinkFactor;
      drawPixelRect(
        ctx,
        element.x,
        drawY,
        element.size,
        element.size,
        drawColor
      );
      ctx.globalAlpha = currentAlpha;
    } else if (element.type === "celestial_body") {
      const currentAlpha = ctx.globalAlpha;
      ctx.globalAlpha *= 0.5; // Glow alpha
      drawPixelRect(
        ctx,
        element.x - element.radius * 1.2,
        drawY - element.radius * 1.2,
        element.radius * 2.4,
        element.radius * 2.4,
        element.glowColor
      );
      ctx.globalAlpha = currentAlpha; // Restore alpha for main body
      drawPixelRect(
        ctx,
        element.x - element.radius,
        drawY - element.radius,
        element.radius * 2,
        element.radius * 2,
        drawColor
      );
      // Celestial body specific details (tech_moon, glitch_moon, sun rays)
      if (element.celestialType === "tech_moon") {
        drawPixelRect(
          ctx,
          element.x - element.radius * 0.8,
          drawY - element.radius * 0.2,
          element.radius * 1.6,
          element.radius * 0.4,
          lightenDarkenColor(drawColor, -30)
        );
        drawPixelRect(
          ctx,
          element.x - element.radius * 0.2,
          drawY - element.radius * 0.8,
          element.radius * 0.4,
          element.radius * 1.6,
          lightenDarkenColor(drawColor, -30)
        );
        if (Math.floor(gameTime * 3) % 2 === 0) {
          drawPixelRect(
            ctx,
            element.x + getRandomFloat(-1, 1) * element.radius * 0.7,
            drawY + getRandomFloat(-1, 1) * element.radius * 0.7,
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
          element.x - element.radius + getRandomInt(-5, 5),
          drawY - element.radius + getRandomInt(-5, 5),
          element.radius * 2 + getRandomInt(-2, 2),
          element.radius * 2 + getRandomInt(-2, 2),
          glitchColor
        );
      } else if (element.celestialType === "sun") {
        const numRays = 8;
        for (let i = 0; i < numRays; i++) {
          const angle = (i / numRays) * Math.PI * 2 + gameTime * 0.1;
          const rayLength = element.radius * 1.5;
          const rayStartX = element.x + Math.cos(angle) * element.radius * 0.8;
          const rayStartY = drawY + Math.sin(angle) * element.radius * 0.8;
          const rayEndX = element.x + Math.cos(angle) * rayLength;
          const rayEndY = drawY + Math.sin(angle) * rayLength;
          ctx.globalAlpha =
            currentAlpha * 0.15 * ((Math.sin(gameTime * 2 + i) + 1) / 2);
          ctx.strokeStyle = element.glowColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(rayStartX, rayStartY);
          ctx.lineTo(rayEndX, rayEndY);
          ctx.stroke();
        }
        ctx.globalAlpha = currentAlpha;
      }
    } else if (element.type === "pixelCloud") {
      const blockSize = Math.max(2, Math.floor(element.width / 10));
      const numPuffs =
        Math.floor(element.width / blockSize) *
        Math.floor(element.height / blockSize) *
        0.7;
      for (let i = 0; i < numPuffs; i++) {
        const puffX = element.x + Math.random() * (element.width - blockSize);
        const puffY = drawY + Math.random() * (element.height - blockSize); // drawY is already the cloud's base Y
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
    } else if (element.type === "nebula") {
      const currentAlpha = ctx.globalAlpha;
      const numParticles = Math.floor(
        (element.width * element.height * element.density) / 25
      );
      for (let i = 0; i < numParticles; i++) {
        const px = element.x + Math.random() * element.width;
        const py = drawY + Math.random() * element.height; // drawY is nebula's base Y
        const psize = getRandomInt(3, 8);
        ctx.globalAlpha = currentAlpha * getRandomFloat(0.3, 0.7);
        drawPixelRect(
          ctx,
          px,
          py,
          psize,
          psize,
          getRandomColor(element.colors)
        );
      }
      ctx.globalAlpha = currentAlpha;
    } else if (element.type === "rect_simple_mountain") {
      drawPixelRect(
        ctx,
        element.x,
        drawY,
        element.width,
        element.height,
        drawColor
      );
      drawPixelRect(
        ctx,
        element.x,
        drawY,
        element.width * 0.3,
        element.height,
        lightenDarkenColor(drawColor, -15)
      );
      drawPixelRect(
        ctx,
        element.x + element.width * 0.7,
        drawY,
        element.width * 0.3,
        element.height,
        lightenDarkenColor(drawColor, 15)
      );
    } else if (element.type === "mesa") {
      const hThird = element.height / 3;
      drawPixelRect(
        ctx,
        element.x,
        drawY,
        element.width,
        hThird,
        World.getSideColor(element.colors, "light")
      );
      drawPixelRect(
        ctx,
        element.x,
        drawY + hThird,
        element.width,
        hThird,
        World.getSideColor(element.colors, "base")
      );
      drawPixelRect(
        ctx,
        element.x,
        drawY + hThird * 2,
        element.width,
        hThird,
        World.getSideColor(element.colors, "shadow")
      );
      for (let i = 0; i < 5; i++) {
        const lineX = element.x + getRandomInt(5, element.width - 5);
        drawPixelRect(
          ctx,
          lineX,
          drawY + hThird,
          1,
          hThird * 2,
          lightenDarkenColor(World.getSideColor(element.colors, "base"), -20)
        );
      }
    } else if (element.type === "cactus") {
      drawPixelRect(
        ctx,
        element.x,
        drawY,
        element.width,
        element.height,
        drawColor
      );
      const armWidth = element.width * 0.75;
      const armHeight = element.height * 0.4;
      if (element.height > 25) {
        // Only draw arms for taller cacti
        drawPixelRect(
          ctx,
          element.x - armWidth,
          drawY + element.height * 0.2,
          armWidth,
          armHeight * 0.5,
          drawColor
        );
        drawPixelRect(
          ctx,
          element.x + element.width,
          drawY + element.height * 0.3,
          armWidth,
          armHeight * 0.5,
          drawColor
        );
      }
    } else if (element.type === "rock_pile") {
      const numRocks = getRandomInt(3, 7);
      for (let i = 0; i < numRocks; i++) {
        const rSize = element.size * getRandomFloat(0.3, 0.6);
        const rX = element.x + (Math.random() - 0.5) * element.size * 0.5;
        const rY =
          drawY + element.size - rSize - Math.random() * element.size * 0.3; // Rocks sit on top of each other within the pile
        drawPixelRect(
          ctx,
          rX,
          rY,
          rSize,
          rSize,
          getRandomColor(element.colors)
        );
      }
    } else if (element.type === "textured_ground_rect") {
      drawPixelRect(
        ctx,
        element.x,
        drawY,
        element.width,
        element.height,
        element.baseColor
      );
      const numDetails = Math.floor(
        (element.width * element.height) /
          (element.textureType === "futuristic_guideways" ? 100 : 200)
      );
      for (let i = 0; i < numDetails; i++) {
        const detailX = element.x + Math.random() * element.width;
        const detailY = drawY + Math.random() * element.height * 0.3; // Details mostly on upper part of ground
        let dW, dH;
        let detailColor = getRandomColor(element.detailColors);

        if (element.textureType === "desert_cracks_pebbles") {
          dW = Math.random() < 0.5 ? getRandomInt(5, 15) : getRandomInt(1, 3); // Cracks or pebbles
          dH = Math.random() < 0.5 ? getRandomInt(1, 3) : getRandomInt(5, 15);
        } else if (element.textureType === "gaming_grid_flowers") {
          dW = getRandomInt(2, 4);
          dH = getRandomInt(2, 4);
          if (Math.random() < 0.1) detailColor = Palettes.gaming.emissive[2]; // Random pink flower
        } else if (element.textureType === "futuristic_guideways") {
          dW =
            Math.random() < 0.7
              ? element.width * getRandomFloat(0.3, 0.8)
              : getRandomInt(3, 6); // Long lines or small squares
          dH = Math.random() < 0.7 ? getRandomInt(1, 2) : getRandomInt(3, 6);
          if (dH <= 2 && Math.random() < 0.8)
            detailColor = getRandomColor(Palettes.futuristic.emissive); // Emissive lines
        } else if (element.textureType === "industrial_asphalt_cracks") {
          dW = Math.random() < 0.5 ? getRandomInt(10, 30) : getRandomInt(2, 5); // Cracks or debris
          dH = Math.random() < 0.5 ? getRandomInt(1, 3) : getRandomInt(2, 5);
          // Lane markings (example, needs to be tied to element.x for consistent scrolling)
          const laneMarkingY = drawY + element.height * 0.15;
          // This calculation for lane markings needs to be based on element.x relative to a grid
          // For simplicity, this example just draws some static-looking lines.
          // A more robust way would be to calculate based on (element.x % (dashLength+gapLength))
          if (i < 2 && Math.floor((element.x + gameTime * 10) / 50) % 2 === 0) {
            // Example of moving dashes
            // drawPixelRect(ctx, element.x, laneMarkingY + i * 5, element.width, 2, Palettes.industrial.emissive[1]);
          }
          if (Math.random() < 0.05)
            detailColor = Palettes.industrial.emissive[0]; // Random orange spark/stain
        } else {
          // Default details
          dW = getRandomInt(2, 8);
          dH = getRandomInt(2, 8);
        }
        drawPixelRect(ctx, detailX, detailY, dW, dH, detailColor);
      }
    } else if (element.type === "debris") {
      if (
        element.debrisType === "wire" ||
        element.debrisType === "rusty_pipe_fragment" ||
        element.debrisType === "circuit_piece"
      ) {
        drawPixelRect(
          ctx,
          element.x,
          drawY,
          element.size,
          element.height,
          drawColor
        ); // size is width here
      } else if (element.debrisType === "gear") {
        const r = element.size / 2;
        drawPixelRect(
          ctx,
          element.x - r,
          drawY - r,
          element.size,
          element.size,
          drawColor
        ); // Main circle
        for (let i = 0; i < 6; i++) {
          // Teeth
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
        // Default square/cube debris
        drawPixelRect(
          ctx,
          element.x,
          drawY,
          element.size,
          element.size,
          drawColor
        );
      }
    } else if (element.type === "pixelStructure") {
      const structBlockSize = Math.max(3, Math.floor(element.width / 10));
      const objPalette = element.colors;
      for (let i = 0; i < element.width / structBlockSize; i++) {
        for (let j = 0; j < element.height / structBlockSize; j++) {
          if (
            Math.random() < element.density &&
            element.height - j * structBlockSize >
              Math.random() * element.height * 0.5
          ) {
            let blockColor = World.getSideColor(objPalette, "base");
            if (i < element.width / structBlockSize / 3)
              blockColor = World.getSideColor(objPalette, "shadow");
            else if (i > ((element.width / structBlockSize) * 2) / 3)
              blockColor = World.getSideColor(objPalette, "light");

            const activeThemeForLights = this.isTransitioning
              ? this.transitionTargetTheme
              : this.currentTheme;
            if (
              Math.random() < 0.05 &&
              (activeThemeForLights === "gaming" ||
                activeThemeForLights === "futuristic")
            ) {
              if (Math.floor(gameTime * (3 + Math.random() * 2)) % 2 === 0) {
                blockColor = getRandomColor(
                  Palettes[activeThemeForLights].emissive
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
    } else if (element.type === "rect_floating_island") {
      drawPixelRect(
        ctx,
        element.x,
        drawY,
        element.width,
        element.height * 0.7,
        element.colors.top
      );
      drawPixelRect(
        ctx,
        element.x,
        drawY + element.height * 0.7,
        element.width,
        element.height * 0.3,
        element.colors.bottom
      );
      for (let i = 0; i < 3; i++) {
        // Detail
        drawPixelRect(
          ctx,
          element.x + getRandomInt(0, element.width - 5),
          drawY + getRandomInt(0, element.height * 0.7 - 5),
          5,
          5,
          lightenDarkenColor(element.colors.top, -20)
        );
      }
    } else if (element.type === "pixelTree") {
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
    } else if (element.type === "giant_mushroom") {
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
    } else if (element.type === "power_up_box") {
      drawPixelRect(
        ctx,
        element.x,
        drawY,
        element.size,
        element.size,
        element.colors.box
      );
      // Draw '?' symbol (simplified)
      if (Math.floor(gameTime * 2) % 2 === 0 || !element.isEmissive) {
        // Blinking effect for symbol
        drawPixelRect(
          ctx,
          element.x + element.size * 0.3,
          drawY + element.size * 0.2,
          element.size * 0.4,
          element.size * 0.15,
          element.colors.symbol
        ); // Top bar of ?
        drawPixelRect(
          ctx,
          element.x + element.size * 0.55,
          drawY + element.size * 0.35,
          element.size * 0.15,
          element.size * 0.15,
          element.colors.symbol
        ); // Curve part
        drawPixelRect(
          ctx,
          element.x + element.size * 0.4,
          drawY + element.size * 0.5,
          element.size * 0.2,
          element.size * 0.15,
          element.colors.symbol
        ); // Middle bar
        drawPixelRect(
          ctx,
          element.x + element.size * 0.4,
          drawY + element.size * 0.8,
          element.size * 0.2,
          element.size * 0.1,
          element.colors.symbol
        ); // Dot
      }
    } else if (element.type === "futuristicTower") {
      const objPalette = element.colors;
      const baseC = World.getSideColor(objPalette, "base");
      const lightC = World.getSideColor(objPalette, "light");
      const shadowC = World.getSideColor(objPalette, "shadow");

      drawPixelRect(
        ctx,
        element.x,
        drawY,
        element.width,
        element.height,
        baseC
      );
      drawPixelRect(
        ctx,
        element.x,
        drawY,
        element.width * 0.2,
        element.height,
        shadowC
      ); // Left shadow
      drawPixelRect(
        ctx,
        element.x + element.width * 0.8,
        drawY,
        element.width * 0.2,
        element.height,
        lightC
      ); // Right highlight

      // Lights
      if (!element.lights) {
        // Initialize lights once
        element.lights = [];
        const numLights = Math.floor(element.height / 15);
        for (let i = 0; i < numLights; i++) {
          element.lights.push({
            x_offset: getRandomInt(
              element.width * 0.2,
              element.width * 0.8 - 1
            ),
            y_offset: getRandomInt(
              element.height * 0.1,
              element.height * 0.9 - 1
            ),
            color: getRandomColor(element.lightColors),
            blinkRate: getRandomFloat(1, 4),
            blinkPhase: getRandomFloat(0, Math.PI * 2),
          });
        }
      }
      element.lights.forEach((light) => {
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
      // Antenna/top structure
      drawPixelRect(
        ctx,
        element.x + element.width * 0.4,
        drawY - 10,
        element.width * 0.2,
        10,
        baseC
      );
      drawPixelRect(
        ctx,
        element.x + element.width * 0.45,
        drawY - 15,
        element.width * 0.1,
        5,
        getRandomColor(element.lightColors)
      );
    } else if (element.type === "rect_platform") {
      drawPixelRect(
        ctx,
        element.x,
        drawY,
        element.width,
        element.height,
        element.colors.base
      );
      drawPixelRect(
        ctx,
        element.x,
        drawY + element.height - 2,
        element.width,
        2,
        element.colors.trim
      ); // Emissive trim at bottom
    } else if (element.type === "energy_pylon") {
      drawPixelRect(
        ctx,
        element.x,
        drawY,
        element.width,
        element.height,
        element.colors.structure
      );
      const pulse = (Math.sin(gameTime * 5) + 1) / 2; // Pulsing effect for core
      const coreHeight = element.height * (0.3 + pulse * 0.2);
      const coreY = drawY + (element.height - coreHeight) / 2;
      drawPixelRect(
        ctx,
        element.x + element.width * 0.25,
        coreY,
        element.width * 0.5,
        coreHeight,
        element.colors.emissive_core
      );
    } else if (
      element.type === "industrialBuilding" ||
      element.type === "industrialSmokestack"
    ) {
      const objPalette = element.colors;
      const baseC = World.getSideColor(objPalette, "base");
      const lightC = World.getSideColor(objPalette, "light");
      const shadowC = World.getSideColor(objPalette, "shadow");

      drawPixelRect(
        ctx,
        element.x,
        drawY,
        element.width,
        element.height,
        baseC
      );
      drawPixelRect(
        ctx,
        element.x,
        drawY,
        element.width * 0.2,
        element.height,
        shadowC
      );
      drawPixelRect(
        ctx,
        element.x + element.width * 0.8,
        drawY,
        element.width * 0.2,
        element.height,
        lightC
      );

      // Windows/details
      const numFeatures = Math.floor((element.width * element.height) / 500);
      for (let i = 0; i < numFeatures; i++) {
        const fX =
          element.x +
          getRandomInt(element.width * 0.2, element.width * 0.8 - 5);
        const fY =
          drawY + getRandomInt(element.height * 0.1, element.height * 0.8 - 5);
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
            : shadowC
        );
      }
      // Smokestack smoke
      if (element.type === "industrialSmokestack" && this.weatherParticles) {
        // Check if weatherParticles exists (it's on World instance)
        if (
          Math.random() < 0.03 &&
          this.weatherParticles.length < this.maxWeatherParticles
        ) {
          // Reduced frequency
          const smokeX = element.x + element.width / 2 + getRandomFloat(-5, 5);
          const smokeY = drawY + getRandomFloat(-5, 0); // Smoke emits from top
          const smokeParticle = new Particle(
            smokeX,
            smokeY,
            getRandomFloat(-5, 5),
            getRandomFloat(-10, -20), // Vx, Vy (upwards)
            getRandomFloat(1, 3), // Lifespan
            getRandomInt(3, 8), // Size
            getRandomColor(element.smokeColors), // Color
            getRandomFloat(0.2, 0.5), // Alpha
            "weather" // Type
          );
          smokeParticle.gravity = -5; // Rises
          this.weatherParticles.push(smokeParticle);
        }
      }
    } else if (element.type === "rect_crates") {
      drawPixelRect(
        ctx,
        element.x,
        drawY,
        element.width,
        element.height,
        drawColor
      );
      drawPixelRect(
        ctx,
        element.x + 1,
        drawY + 1,
        element.width - 2,
        element.height - 2,
        lightenDarkenColor(drawColor, -20)
      ); // Inner shadow
      // Panel lines
      drawPixelRect(
        ctx,
        element.x + element.width * 0.4,
        drawY,
        2,
        element.height,
        lightenDarkenColor(drawColor, -30)
      );
      drawPixelRect(
        ctx,
        element.x,
        drawY + element.height * 0.4,
        element.width,
        2,
        lightenDarkenColor(drawColor, -30)
      );
    } else if (element.type === "rect_pipes") {
      drawPixelRect(
        ctx,
        element.x,
        drawY,
        element.width,
        element.height,
        drawColor
      );
      drawPixelRect(
        ctx,
        element.x,
        drawY,
        element.width,
        element.height * 0.3,
        lightenDarkenColor(drawColor, 20)
      ); // Top highlight
    } else if (element.type === "rubble_pile") {
      for (let i = 0; i < 5; i++) {
        const rX = element.x + (Math.random() - 0.5) * element.size * 0.8;
        const rY =
          drawY +
          (Math.random() - 0.5) * element.size * 0.3 +
          element.size * 0.2; // Position within pile
        const rSize = element.size * getRandomFloat(0.2, 0.5);
        drawPixelRect(
          ctx,
          rX,
          rY,
          rSize,
          rSize,
          getRandomColor(element.colors)
        );
      }
    }
  }

  initLayers(theme, initialWorldXOffset = 0) {
    const newLayers = [];
    const config =
      World.layerConfigs[theme] || World.layerConfigs["desert_start"];
    config.forEach((lc) => {
      newLayers.push(
        new ParallaxLayer(
          lc.speed,
          lc.generator,
          lc.count,
          this.game,
          this,
          lc,
          false, // New layers are not source layers by default
          initialWorldXOffset // Pass the worldX offset for element generation
        )
      );
    });
    newLayers.sort((a, b) => a.scrollSpeedFactor - b.scrollSpeedFactor);
    return newLayers;
  }

  handleThemeChange(newThemeData) {
    if (this.currentTheme !== newThemeData.theme && !this.isTransitioning) {
      if (Config.DEBUG_MODE) {
        console.log(
          `Starting transition from ${this.currentTheme} to ${newThemeData.theme} at worldX: ${this.worldX}`
        );
      }
      this.isTransitioning = true;
      this.transitionProgress = 0;

      const sourcePalette = Palettes[this.currentTheme] || Palettes.desert;
      this.transitionSourceSky =
        (sourcePalette.sky && sourcePalette.sky[0]) || this.skyColor;

      const targetPalette = Palettes[newThemeData.theme] || Palettes.desert;
      this.transitionTargetSky =
        (targetPalette.sky && targetPalette.sky[0]) || "#87CEEB";

      this.transitionSourceTheme = this.currentTheme;
      this.transitionTargetTheme = newThemeData.theme;

      // Current layers become source layers
      this.sourceLayers = this.layers;
      this.sourceLayers.forEach((layer) => {
        layer.isSourceLayer = true; // Mark them as source for fade-out and filtering
      });

      // Initialize new layers for the target theme.
      // Elements in these layers will be generated starting from an offset
      // relative to the current worldX, ensuring they appear from the direction of travel.
      const targetLayerInitialX =
        this.worldX +
        (this.game.player.currentSpeed >= 0
          ? Config.CANVAS_WIDTH
          : -Config.CANVAS_WIDTH * 2.5); // Adjusted for backward motion too

      this.targetLayers = this.initLayers(
        this.transitionTargetTheme,
        targetLayerInitialX
      );
      this.targetLayers.forEach((layer) => (layer.isSourceLayer = false)); // Ensure they are not source

      this.weatherParticles = []; // Clear old weather
    } else if (
      !this.isTransitioning &&
      this.currentTheme === newThemeData.theme
    ) {
      // Update sky colors if not transitioning but theme is confirmed (e.g., initial state)
      const currentPalette = Palettes[this.currentTheme] || Palettes.desert;
      this.skyColor =
        (currentPalette.sky && currentPalette.sky[0]) || this.skyColor;
      this.currentTopSky = this.skyColor;
      this.currentHorizonSky =
        (currentPalette.sky && currentPalette.sky[1]) ||
        lightenDarkenColor(this.currentTopSky, 30);
    }
  }

  updateWeatherParticles(deltaTime) {
    const buffer = 20; // Culling buffer in world units
    for (let i = this.weatherParticles.length - 1; i >= 0; i--) {
      const particle = this.weatherParticles[i];
      particle.update(deltaTime);
      if (
        particle.lifespan <= 0 ||
        particle.y > Config.CANVAS_HEIGHT + buffer || // Assuming particle.y is world Y, but weather often uses screen Y. Let's assume world Y for now.
        particle.y < -buffer ||
        particle.x < this.worldX - buffer || // Particle world X vs camera world X - buffer
        particle.x > this.worldX + Config.CANVAS_WIDTH + buffer // Particle world X vs camera world X + screen width + buffer
      ) {
        this.weatherParticles.splice(i, 1);
      }
    }
  }

  emitWeatherParticles() {
    if (this.weatherParticles.length >= this.maxWeatherParticles) return;

    const theme = this.isTransitioning
      ? this.transitionTargetTheme
      : this.currentTheme;
    const chance = Math.random();
    const paletteForWeather = Palettes[theme] || Palettes.desert;

    // Particle X positions should be in world coordinates, relative to the current view
    const spawnEdgeChoice = Math.random();
    let particleWorldX;
    if (spawnEdgeChoice < 0.45) {
      // Spawn from left edge of screen
      particleWorldX = this.worldX - 10;
    } else if (spawnEdgeChoice < 0.9) {
      // Spawn from right edge of screen
      particleWorldX = this.worldX + Config.CANVAS_WIDTH + 10;
    } else {
      // Spawn from top
      particleWorldX = this.worldX + getRandomFloat(0, Config.CANVAS_WIDTH);
    }

    let particleWorldY = -10; // Default spawn from top

    if (theme === "desert_start" && chance < 0.05) {
      particleWorldY = getRandomFloat(
        this.groundLevelY - 50,
        this.groundLevelY + 20
      );
      const particle = new Particle(
        particleWorldX,
        particleWorldY,
        (particleWorldX < this.worldX + Config.CANVAS_WIDTH / 2 ? 1 : -1) *
          getRandomFloat(20, 50), // Move inwards
        getRandomFloat(-10, 10),
        getRandomFloat(3, 6),
        getRandomInt(2, 5),
        getRandomColor(paletteForWeather.generic_dust || ["#A0522D"]),
        getRandomFloat(0.1, 0.4),
        "weather"
      );
      particle.drag = 0.99;
      this.weatherParticles.push(particle);
    } else if (theme === "industrial" && chance < 0.1) {
      particleWorldY = -10; // Spawn from top
      const particle = new Particle(
        this.worldX + getRandomFloat(0, Config.CANVAS_WIDTH),
        particleWorldY,
        getRandomFloat(-5, 5),
        getRandomFloat(30, 60), // Fall downwards
        getRandomFloat(2, 4),
        getRandomInt(1, 2),
        getRandomColor(
          (paletteForWeather.smoke || ["#A9A9A9"]).map((c) => c + "66")
        ),
        getRandomFloat(0.2, 0.5),
        "weather"
      );
      this.weatherParticles.push(particle);
    } else if (theme === "gaming" && chance < 0.03) {
      particleWorldY = getRandomFloat(0, Config.CANVAS_HEIGHT); // Spawn anywhere vertically
      const particle = new Particle(
        particleWorldX,
        particleWorldY,
        getRandomFloat(-20, 20),
        getRandomFloat(-20, 20),
        getRandomFloat(0.2, 0.5),
        getRandomInt(2, 4),
        getRandomColor(Palettes.gaming.emissive),
        getRandomFloat(0.5, 0.8),
        "weather"
      );
      particle.drag = 0.9;
      this.weatherParticles.push(particle);
    } else if (theme === "futuristic" && chance < 0.04) {
      particleWorldY = getRandomFloat(0, Config.CANVAS_HEIGHT); // Spawn anywhere vertically
      const particle = new Particle(
        particleWorldX,
        particleWorldY,
        getRandomFloat(-10, 10),
        getRandomFloat(-10, 10),
        getRandomFloat(1, 2),
        getRandomInt(1, 3),
        getRandomColor(Palettes.futuristic.emissive.map((c) => c + "44")),
        getRandomFloat(0.3, 0.6),
        "weather"
      );
      particle.gravity = getRandomFloat(-2, 2);
      this.weatherParticles.push(particle);
    }
  }

  update(worldScrollSpeed) {
    this.worldX += worldScrollSpeed; // Update camera position

    const currentZoneInfo = StopsManager.getCurrentZone(this.worldX);
    this.handleThemeChange(currentZoneInfo);

    if (this.isTransitioning) {
      // Update both source and target layers
      this.sourceLayers.forEach((layer) => layer.update(worldScrollSpeed));
      this.targetLayers.forEach((layer) => layer.update(worldScrollSpeed));

      if (this.transitionDurationWorldUnits > 0 && worldScrollSpeed !== 0) {
        const progressIncrement =
          Math.abs(worldScrollSpeed) / this.transitionDurationWorldUnits;
        this.transitionProgress += progressIncrement;
      } else if (
        this.transitionDurationWorldUnits === 0 &&
        worldScrollSpeed !== 0
      ) {
        this.transitionProgress = 1; // Instant transition if duration is 0
      }
      this.transitionProgress = Math.min(this.transitionProgress, 1);

      // Interpolate sky colors
      const sourcePalette =
        Palettes[this.transitionSourceTheme] || Palettes.desert;
      const targetPalette =
        Palettes[this.transitionTargetTheme] || Palettes.desert;
      const sourceTop =
        (sourcePalette.sky && sourcePalette.sky[0]) || this.transitionSourceSky;
      const sourceHorizon =
        (sourcePalette.sky && sourcePalette.sky[1]) ||
        lightenDarkenColor(sourceTop, 30);
      const targetTop =
        (targetPalette.sky && targetPalette.sky[0]) || this.transitionTargetSky;
      const targetHorizon =
        (targetPalette.sky && targetPalette.sky[1]) ||
        lightenDarkenColor(targetTop, 30);
      this.currentTopSky = interpolateColor(
        sourceTop,
        targetTop,
        this.transitionProgress
      );
      this.currentHorizonSky = interpolateColor(
        sourceHorizon,
        targetHorizon,
        this.transitionProgress
      );

      if (this.transitionProgress >= 1) {
        if (Config.DEBUG_MODE)
          console.log(`Transition to ${this.transitionTargetTheme} complete.`);
        this.isTransitioning = false;
        this.currentTheme = this.transitionTargetTheme;

        const finalPalette = Palettes[this.currentTheme] || Palettes.desert;
        this.skyColor =
          (finalPalette.sky && finalPalette.sky[0]) || this.transitionTargetSky;
        this.currentTopSky = this.skyColor;
        this.currentHorizonSky =
          (finalPalette.sky && finalPalette.sky[1]) ||
          lightenDarkenColor(this.currentTopSky, 30);

        this.layers = this.targetLayers; // New theme's layers are now the main layers
        this.layers.forEach((layer) => (layer.isSourceLayer = false)); // Ensure flag is false
        this.sourceLayers = []; // Clear source layers
        this.targetLayers = []; // Clear target layers
      }
    } else {
      // Not transitioning
      this.layers.forEach((layer) => layer.update(worldScrollSpeed));
      // Ensure sky colors are set for the current theme
      const currentPalette = Palettes[this.currentTheme] || Palettes.desert;
      this.currentTopSky =
        (currentPalette.sky && currentPalette.sky[0]) || this.skyColor;
      this.currentHorizonSky =
        (currentPalette.sky && currentPalette.sky[1]) ||
        lightenDarkenColor(this.currentTopSky, 30);
    }

    this.emitWeatherParticles();
    this.updateWeatherParticles(this.game.deltaTime);
  }

  render(ctx) {
    // Draw sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, this.groundLevelY);
    skyGradient.addColorStop(0, this.currentTopSky);
    skyGradient.addColorStop(1, this.currentHorizonSky);
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, Config.CANVAS_WIDTH, Config.CANVAS_HEIGHT);

    // Draw atmospheric fog/haze
    const activeThemeForFog = this.isTransitioning
      ? this.transitionTargetTheme
      : this.currentTheme;
    const themePalette = Palettes[activeThemeForFog] || Palettes.desert;
    if (
      themePalette.atmosphere &&
      themePalette.atmosphere.fogColor &&
      themePalette.atmosphere.fogColor !== "rgba(0,0,0,0.0)"
    ) {
      const originalAlpha = ctx.globalAlpha;
      if (
        typeof themePalette.atmosphere.fogColor === "string" &&
        themePalette.atmosphere.fogColor.includes("rgba")
      ) {
        ctx.fillStyle = themePalette.atmosphere.fogColor;
      } else {
        ctx.globalAlpha = 0.15; // Default alpha if not specified in color string
        ctx.fillStyle = themePalette.atmosphere.fogColor || "#FFFFFF";
      }
      ctx.fillRect(0, 0, Config.CANVAS_WIDTH, Config.CANVAS_HEIGHT);
      ctx.globalAlpha = originalAlpha;
    }

    // Determine which layers to render
    const layersToRender = this.isTransitioning
      ? [...this.sourceLayers, ...this.targetLayers].sort(
          (a, b) => a.scrollSpeedFactor - b.scrollSpeedFactor
        )
      : this.layers;

    layersToRender.forEach((layer) => {
      if (
        layer.layerConfig.type === "foreground_debris" &&
        layer.scrollSpeedFactor > 1
      )
        return; // Skip foreground debris here
      layer.render(ctx);
    });

    // Render weather particles (adjust Y conditions as needed for layering)
    // These particles' X,Y are world coordinates.
    // Particle.render expects screen coordinates for its this.x, this.y.
    ctx.save();
    ctx.translate(-this.worldX, 0); // Translate context to draw weather particles at their world positions
    this.weatherParticles.forEach((p) => {
      if (
        p.type === "weather" &&
        p.y < this.groundLevelY + 40 &&
        p.y > this.groundLevelY * 0.3
      ) {
        p.render(ctx); // p.x and p.y are world coordinates, context is translated
      }
    });
    ctx.restore();
  }

  renderForeground(ctx) {
    const layersToRender = this.isTransitioning
      ? [...this.sourceLayers, ...this.targetLayers].sort(
          (a, b) => a.scrollSpeedFactor - b.scrollSpeedFactor
        )
      : this.layers;

    layersToRender.forEach((layer) => {
      if (
        layer.layerConfig.type === "foreground_debris" &&
        layer.scrollSpeedFactor > 1
      ) {
        layer.render(ctx);
      }
    });

    ctx.save();
    ctx.translate(-this.worldX, 0); // Translate context for foreground weather particles
    this.weatherParticles.forEach((p) => {
      if (
        p.type === "weather" &&
        (p.y >= this.groundLevelY + 40 || p.y <= this.groundLevelY * 0.3)
      ) {
        p.render(ctx); // p.x and p.y are world coordinates
      }
    });
    ctx.restore();
  }
}
