class ParallaxLayer {
  constructor(
    scrollSpeedFactor,
    elementGenerator,
    elementCount,
    game,
    world,
    layerConfig, // Pass the whole layerConfig object
    isSourceLayer = false,
    initialXOffset = 0
  ) {
    this.scrollSpeedFactor = scrollSpeedFactor;
    this.elementGenerator = elementGenerator;
    this.elementCount = elementCount;
    this.game = game;
    this.world = world;
    this.layerConfig = layerConfig; // Store for options like color, sizeRange
    this.isSourceLayer = isSourceLayer;
    this.initialXOffset = initialXOffset;
    this.elements = [];
    this.generateInitialElements();
  }

  generateInitialElements() {
    this.elements = [];
    // Increased virtual width to ensure elements are available when transitioning from far off-screen
    const virtualWidth = Config.CANVAS_WIDTH * (this.isSourceLayer ? 2.5 : 3.5);
    for (let i = 0; i < this.elementCount; i++) {
      const x = this.initialXOffset + Math.random() * virtualWidth;
      // Y generation can be more specific based on layer type
      let y;
      if (
        this.layerConfig.type &&
        (this.layerConfig.type.includes("sky") ||
          this.layerConfig.type.includes("celestial") ||
          this.layerConfig.type.includes("stars") ||
          this.layerConfig.type.includes("nebulae"))
      ) {
        y = getRandomFloat(0, this.world.groundLevelY * 0.6); // Sky elements higher up
      } else if (this.layerConfig.type === "foreground_debris") {
        y = getRandomFloat(
          this.world.groundLevelY + 10,
          Config.CANVAS_HEIGHT - 10
        );
      } else {
        y = Math.random() * Config.CANVAS_HEIGHT; // Original behavior
      }
      this.elements.push(
        this.elementGenerator(x, y, this.layerConfig, this.game, this.world) // Pass layerConfig
      );
    }
  }

  update(worldScrollSpeed) {
    this.elements.forEach((element) => {
      element.x -= worldScrollSpeed * this.scrollSpeedFactor;
      // Update element internal animations (like blinking lights)
      if (element.update) {
        element.update(this.game.deltaTime, this.game.gameTime);
      }
    });

    const screenWidth = Config.CANVAS_WIDTH;
    const wrapBuffer = screenWidth * 0.75; // Increased buffer
    const totalVirtualWidth = screenWidth * (this.isSourceLayer ? 2.5 : 3.5);

    if (this.isSourceLayer) {
      // Source layers elements just scroll off and get removed
      this.elements = this.elements.filter((element) => {
        const elementVisualWidth =
          element.width || (element.radius ? element.radius * 2 : 50);
        return element.x + elementVisualWidth > -wrapBuffer * 2; // More aggressive culling for source
      });
    } else {
      // Target/Normal layers wrap around
      this.elements.forEach((element) => {
        const elementVisualWidth =
          element.width || (element.radius ? element.radius * 2 : 50);
        if (worldScrollSpeed > 0) {
          // Moving right, elements scroll left
          if (element.x + elementVisualWidth < -wrapBuffer) {
            element.x += totalVirtualWidth + Math.random() * 100 - 50; // Add some randomness to prevent exact repetition
            // Re-initialize y for some elements to add variety on wrap
            if (element.canRandomizeYOnWrap) {
              if (
                this.layerConfig.type &&
                (this.layerConfig.type.includes("sky") ||
                  this.layerConfig.type.includes("celestial") ||
                  this.layerConfig.type.includes("stars") ||
                  this.layerConfig.type.includes("nebulae"))
              ) {
                element.y = getRandomFloat(0, this.world.groundLevelY * 0.6);
              } else if (this.layerConfig.type === "foreground_debris") {
                element.y = getRandomFloat(
                  this.world.groundLevelY + 10,
                  Config.CANVAS_HEIGHT - 10
                );
              } else {
                // For other types, might need specific Y ranges based on their original generation logic
                // For now, let's keep their Y or re-randomize within a general band if appropriate
                // element.y = Math.random() * Config.CANVAS_HEIGHT; // Could be too broad
              }
            }
          }
        } else if (worldScrollSpeed < 0) {
          // Moving left, elements scroll right
          if (element.x > screenWidth + wrapBuffer) {
            element.x -= totalVirtualWidth + Math.random() * 100 - 50;
            if (element.canRandomizeYOnWrap) {
              if (
                this.layerConfig.type &&
                (this.layerConfig.type.includes("sky") ||
                  this.layerConfig.type.includes("celestial") ||
                  this.layerConfig.type.includes("stars") ||
                  this.layerConfig.type.includes("nebulae"))
              ) {
                element.y = getRandomFloat(0, this.world.groundLevelY * 0.6);
              } else if (this.layerConfig.type === "foreground_debris") {
                element.y = getRandomFloat(
                  this.world.groundLevelY + 10,
                  Config.CANVAS_HEIGHT - 10
                );
              } else {
                // element.y = Math.random() * Config.CANVAS_HEIGHT;
              }
            }
          }
        }
      });
    }
  }

  render(ctx) {
    const renderBuffer = 200; // Increased render buffer
    this.elements.forEach((element) => {
      const elementVisualWidth =
        element.width || (element.radius ? element.radius * 2 : 50);
      if (
        element.x + elementVisualWidth > -renderBuffer &&
        element.x < Config.CANVAS_WIDTH + renderBuffer
      ) {
        // III.2.A Alpha Fading for Elements during transition
        let elementAlpha = 1.0;
        if (this.world.isTransitioning) {
          if (this.isSourceLayer) {
            // Fading out
            elementAlpha = 1.0 - this.world.transitionProgress;
          } else {
            // Fading in (only if this layer belongs to target theme)
            if (
              this.world.targetLayers &&
              this.world.targetLayers.includes(this)
            ) {
              elementAlpha = this.world.transitionProgress;
            } else if (
              this.world.sourceLayers &&
              !this.world.sourceLayers.includes(this)
            ) {
              // If it's not a source layer and not yet a target layer (e.g. persistent layer), keep full alpha
              elementAlpha = 1.0;
            } else if (!this.world.sourceLayers) {
              // If sourceLayers is null (e.g. initial state, not transitioning)
              elementAlpha = 1.0;
            } else {
              // This case should ideally not happen if logic is correct
              elementAlpha = 0; // Default to fade out if unsure
            }
          }
        }
        elementAlpha = Math.max(0, Math.min(1, elementAlpha));
        const originalCtxAlpha = ctx.globalAlpha;
        ctx.globalAlpha *= elementAlpha; // Multiply with current alpha for nested effects

        // I.2.C Atmospheric Perspective/Tinting
        const activeTheme = this.world.isTransitioning
          ? this.world.transitionTargetTheme
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
            // Check finalColor before using
            finalColor = interpolateColor(
              finalColor,
              skyHorizonColor,
              tintFactor
            );
            if (this.scrollSpeedFactor < 0.3) {
              finalColor = desaturateColor(finalColor, tintFactor * 0.5);
            }
          } else if (typeof finalColor !== "string") {
            // console.warn("Atmospheric perspective: finalColor is not a string for element", element, "color:", finalColor);
            finalColor = "#FF00FF"; // Fallback for non-string colors
          }
          element.tempColor = finalColor;
        } else {
          element.tempColor = finalColor;
        }

        this.world.drawElement(
          ctx,
          element,
          this.game.gameTime,
          this.scrollSpeedFactor
        );

        ctx.globalAlpha = originalCtxAlpha; // Reset alpha
      }
    });
  }
}

class World {
  constructor(game) {
    this.game = game;
    this.layers = [];
    this.worldX = 0;
    this.groundLevelY = Config.CANVAS_HEIGHT - 80; // Adjusted ground level

    this.currentTheme = "desert_start"; // Initial theme
    const initialPalette = Palettes[this.currentTheme] || Palettes.desert;
    this.skyColor = (initialPalette.sky && initialPalette.sky[0]) || "#FAD7A0"; // Top sky color
    this.currentTopSky = this.skyColor;
    this.currentHorizonSky =
      (initialPalette.sky && initialPalette.sky[1]) ||
      lightenDarkenColor(this.currentTopSky, 30);

    this.isTransitioning = false;
    this.transitionProgress = 0;
    this.transitionDurationWorldUnits = Config.CANVAS_WIDTH * 1.1; // Slightly longer transition

    this.transitionSourceSky = this.skyColor;
    this.transitionTargetSky = this.skyColor;
    this.transitionSourceTheme = this.currentTheme;
    this.transitionTargetTheme = this.currentTheme;

    this.sourceLayers = null;
    this.targetLayers = null;

    this.layers = this.initLayers(this.currentTheme);

    // II.4.A Dynamic Environmental Effects
    this.weatherParticles = [];
    this.maxWeatherParticles = 100; // e.g., for rain/snow

    if (Config.DEBUG_MODE) console.log("World initialized.");
  }

  // II.1 & II.2 Layer Configurations
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
      }, // Themed stars
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
        options: { types: ["glitch_cube", "wire"] },
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
        options: { types: ["metal_shard", "glowing_bit"] },
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
        options: { types: ["rubble", "rusty_pipe_fragment"] },
      },
    ],
  };

  static getGenerator(theme, type) {
    // Helper to find generator, can be expanded if layerConfigs don't directly store func
    const themeConfig = World.layerConfigs[theme];
    if (themeConfig) {
      const layerInfo = themeConfig.find((lc) => lc.type === type);
      if (layerInfo) return layerInfo.generator;
    }
    // Fallback or error
    // console.warn(`Generator not found for theme: ${theme}, type: ${type}. Falling back to desert distant.`);
    return World.generateDesertDistant;
  }

  // --- Element Generators --- (now take layerConfig as third param)

  static generateStar(x, y, layerConfig, game, world) {
    const options = layerConfig.options || {};
    const sizeArray = options.sizes || [1, 1];
    const size = getRandomInt(sizeArray[0], sizeArray[1]);
    const colorArray = options.colors || ["#FFFFFF"];
    const starColor = getRandomColor(colorArray);
    return {
      type: "star",
      x: x,
      y: y, // Y is set higher up during layer generation
      size: size,
      color: starColor,
      initialBrightness: getRandomFloat(0.5, 1.0),
      blinkRate: getRandomFloat(1, 5),
      blinkPhase: getRandomFloat(0, Math.PI * 2),
      originalColor: starColor, // For tinting
      canRandomizeYOnWrap: true,
    };
  }

  static generateCelestialBody(x, y, layerConfig, game, world) {
    const options = layerConfig.options || {};
    const type = options.type || "sun"; // sun, moon, tech_moon, glitch_moon
    let radius, color, glowColor;

    switch (type) {
      case "moon":
        radius = getRandomInt(25, 40);
        color = "#E0E0E0";
        glowColor = "#FFFFFF";
        break;
      case "tech_moon":
        radius = getRandomInt(30, 45);
        color = Palettes.futuristic.objects_primary.base;
        glowColor = Palettes.futuristic.emissive[0];
        break;
      case "glitch_moon":
        radius = getRandomInt(20, 35);
        color = Palettes.gaming.objects_accent[0];
        glowColor = Palettes.gaming.emissive[1];
        break;
      case "sun":
      default:
        radius = getRandomInt(30, 50);
        color = Palettes.desert.emissive[0];
        glowColor = lightenDarkenColor(Palettes.desert.emissive[0], 50);
        break;
    }
    return {
      type: "celestial_body",
      x: x,
      y: y, // Y is set higher up
      radius: radius,
      color: color,
      glowColor: glowColor,
      celestialType: type, // Store for specific drawing logic
      originalColor: color,
      isEmissive: true, // Don't apply atmospheric tint
      canRandomizeYOnWrap: false, // Keep sun/moon at consistent height relative to layer
    };
  }

  static generatePixelCloud(x, y, layerConfig, game, world) {
    const options = layerConfig.options || {};
    const sizeRange = options.sizeRange || [20, 50];
    const cloudWidth = getRandomInt(sizeRange[0], sizeRange[1]);
    const cloudHeight = getRandomInt(sizeRange[0] * 0.4, sizeRange[1] * 0.7);
    const yPosRange = options.yPosRange || [0.05, 0.4]; // Percentage of sky height
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
      y: y, // Y is set higher up
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
    const color = options.colorBase || Palettes.desert.objects_primary.shadow; // Use the object property
    return {
      type: "rect_simple_mountain", // More specific type
      x: x,
      y: world.groundLevelY - height - getRandomInt(10, 40), // Ensure they sit on horizon
      width: width,
      height: height,
      color: color,
      originalColor: color,
      canRandomizeYOnWrap: false, // Keep mountains on horizon
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
        colors: {
          // This is an object, not an array
          top: Palettes.desert.objects_primary.light,
          middle: Palettes.desert.objects_primary.base,
          bottom: Palettes.desert.objects_primary.shadow,
        },
        originalColor: Palettes.desert.objects_primary.base,
      };
    } else if (options.type === "mixed" && r < 0.8) {
      // Cactus
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
      // Rock Pile
      const rockSize = getRandomInt(15, 35);
      element = {
        type: "rock_pile",
        x: x,
        y: world.groundLevelY - rockSize,
        size: rockSize,
        colors: [
          Palettes.desert.objects_primary.base,
          Palettes.desert.objects_primary.shadow,
        ], // This is an array for getRandomColor
        originalColor: Palettes.desert.objects_primary.base,
      };
    }
    element.canRandomizeYOnWrap = false; // Mid-ground elements usually fixed relative to ground
    return element;
  }

  static generateDesertGround(x, y, layerConfig, game, world) {
    // Procedural Textures for ground
    const baseColor = Palettes.desert.ground[0];
    const detailColors = [Palettes.desert.ground[2], Palettes.desert.ground[3]];
    const segmentWidth = Config.CANVAS_WIDTH * 0.5 + getRandomInt(0, 20);
    return {
      type: "textured_ground_rect",
      x: x,
      y: world.groundLevelY,
      width: segmentWidth,
      height: Config.CANVAS_HEIGHT - world.groundLevelY, // Fill to bottom
      baseColor: baseColor,
      detailColors: detailColors,
      textureType: "desert_cracks_pebbles",
      originalColor: baseColor,
      canRandomizeYOnWrap: false,
    };
  }

  // II.3.C Foreground Debris Layer
  static generateForegroundDebris(x, y, layerConfig, game, world) {
    const options = layerConfig.options || { types: ["rock"] };
    const type = getRandomColor(options.types); // options.types should be an array
    let element = {
      type: "debris",
      x: x,
      y: y, // Y is set by layer generator to be low on screen
      size: getRandomInt(3, 8),
      color: "#000000", // Default, will be overridden
      debrisType: type,
      originalColor: "#000000",
      canRandomizeYOnWrap: true, // Debris can appear at different foreground Y levels
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
        element.size = getRandomInt(10, 20); // Length
        element.height = getRandomInt(1, 2); // Thickness
        break;
      case "metal_shard":
        element.color = Palettes.futuristic.objects_primary.base;
        break;
      case "glowing_bit":
        element.color = getRandomColor(Palettes.futuristic.emissive);
        element.isEmissive = true;
        break;
      case "rubble":
        element.color = getRandomColor(Palettes.industrial.ground.slice(1, 3));
        break;
      case "rusty_pipe_fragment":
        element.color = getRandomColor(Palettes.industrial.objects_accent);
        element.size = getRandomInt(10, 18); // Length
        element.height = getRandomInt(3, 5); // Thickness
        break;
    }
    element.originalColor = element.color;
    return element;
  }

  static generateGamingDistant(x, y, layerConfig, game, world) {
    const r = Math.random();
    let element;
    if (r < 0.5) {
      // Tall pixel structure
      const width = getRandomInt(30, 60);
      const height = getRandomInt(80, Config.CANVAS_HEIGHT * 0.5);
      element = {
        type: "pixelStructure",
        x: x,
        y: world.groundLevelY - height - getRandomInt(10, 30),
        width: width,
        height: height,
        colors: Palettes.gaming.objects_primary, // This is an object {base, light, shadow}
        density: 0.6,
        originalColor: Palettes.gaming.objects_primary.base,
      };
    } else {
      // Floating island type
      const width = getRandomInt(50, 100);
      const height = getRandomInt(20, 40);
      element = {
        type: "rect_floating_island",
        x: x,
        y: world.groundLevelY - height - getRandomInt(50, 150),
        width: width,
        height: height,
        colors: {
          // This is an object
          top: Palettes.gaming.ground[2],
          bottom: Palettes.gaming.ground[3], // Ensure this is ground[3], not objects_primary.shadow
        },
        originalColor: Palettes.gaming.ground[2],
      };
    }
    element.canRandomizeYOnWrap = false;
    return element;
  }

  static generateGamingMid(x, y, layerConfig, game, world) {
    const r = Math.random();
    let element;
    if (r < 0.4) {
      // Pixel Tree
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
      // Giant Mushroom
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
          // Object
          stem: Palettes.gaming.objects_primary.light,
          capTop: getRandomColor(Palettes.gaming.props), // props is an array
          capSpots: getRandomColor(Palettes.gaming.emissive), // emissive is an array
        },
        originalColor: getRandomColor(Palettes.gaming.props),
      };
    } else {
      // Power Up Box
      const size = getRandomInt(10, 20);
      element = {
        type: "power_up_box",
        x: x,
        y: world.groundLevelY - size - getRandomInt(0, 10), // Can float slightly
        size: size,
        colors: {
          // Object
          box: getRandomColor(Palettes.gaming.objects_accent), // objects_accent is an array
          symbol: Palettes.gaming.emissive[0],
        },
        originalColor: getRandomColor(Palettes.gaming.objects_accent),
        isEmissive: true, // The symbol part
      };
    }
    element.canRandomizeYOnWrap = false;
    return element;
  }

  static generateGamingGround(x, y, layerConfig, game, world) {
    const segmentWidth = 40;
    const scrollFactor = layerConfig.speed || 1.0;
    const colorIndex =
      Math.floor((x + world.worldX * scrollFactor) / segmentWidth) % 2;
    const baseColor = Palettes.gaming.ground[colorIndex];
    const detailColors = [Palettes.gaming.ground[2], Palettes.gaming.ground[3]];
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
  }

  static generateFuturisticSkyElement(x, y, layerConfig, game, world) {
    const width = getRandomInt(20, 100);
    const height = getRandomInt(2, 5);
    const color = getRandomColor(Palettes.futuristic.emissive) + "66"; // Semi-transparent
    return {
      type: "rect",
      x,
      y: getRandomFloat(20, Config.CANVAS_HEIGHT * 0.5),
      width,
      height,
      color,
      originalColor: color,
      isEmissive: true,
      canRandomizeYOnWrap: true,
    };
  }
  static generateFuturisticDistant(x, y, layerConfig, game, world) {
    const buildingWidth = getRandomInt(40, 90);
    const buildingHeight = getRandomInt(150, Config.CANVAS_HEIGHT * 0.7);
    return {
      type: "futuristicTower",
      x: x,
      y: world.groundLevelY - buildingHeight,
      width: buildingWidth,
      height: buildingHeight,
      colors: Palettes.futuristic.objects_primary, // This is an object {base, light, shadow}
      lightColors: Palettes.futuristic.emissive, // This is an array
      originalColor: Palettes.futuristic.objects_primary.base,
      canRandomizeYOnWrap: false,
    };
  }
  static generateFuturisticMid(x, y, layerConfig, game, world) {
    const platWidth = getRandomInt(50, 120);
    const platHeight = getRandomInt(10, 25);
    return {
      type: "rect_platform", // Specific type
      x: x,
      y: world.groundLevelY - platHeight - getRandomInt(10, 80),
      width: platWidth,
      height: platHeight,
      colors: {
        // Object
        base: Palettes.futuristic.objects_primary.base,
        trim: Palettes.futuristic.emissive[0],
      },
      originalColor: Palettes.futuristic.objects_primary.base,
      canRandomizeYOnWrap: false,
    };
  }
  static generateFuturisticGround(x, y, layerConfig, game, world) {
    const panelWidth = 80;
    const scrollFactor = layerConfig.speed || 1.0;
    const colorIndex =
      Math.floor((x + world.worldX * scrollFactor) / panelWidth) % 3;
    const baseColor =
      Palettes.futuristic.ground[
        colorIndex === 0 ? 0 : colorIndex === 1 ? 1 : 0
      ]; // Alternate two base ground colors
    const detailColors = [
      Palettes.futuristic.ground[2],
      Palettes.futuristic.emissive[0],
    ]; // Lines and emissive bits
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
      y: world.groundLevelY - buildingHeight,
      width: buildingWidth,
      height: buildingHeight,
      colors: Palettes.industrial.objects_primary, // This is an object {base, light, shadow}
      accentColors: Palettes.industrial.objects_accent, // Rust, etc. (array)
      smokeColors: Palettes.industrial.smoke, // (array)
      originalColor: Palettes.industrial.objects_primary.base,
      canRandomizeYOnWrap: false,
    };
  }
  static generateIndustrialMid(x, y, layerConfig, game, world) {
    const r = Math.random();
    let element;
    let originalCrateColor = getRandomColor(Palettes.industrial.objects_accent); // objects_accent is an array
    let originalPipeColor = Palettes.industrial.objects_primary.shadow;

    if (r < 0.5) {
      // Crates/Barrels
      const size = getRandomInt(15, 30);
      element = {
        type: "rect_crates",
        x,
        y: world.groundLevelY - size,
        width: size,
        height: size,
        color: originalCrateColor,
        originalColor: originalCrateColor,
      };
    } else {
      // Pipes
      const length = getRandomInt(40, 100);
      const thickness = getRandomInt(8, 15);
      element = {
        type: "rect_pipes",
        x,
        y: world.groundLevelY - thickness - getRandomInt(0, 40),
        width: length,
        height: thickness,
        color: originalPipeColor,
        originalColor: originalPipeColor,
      };
    }
    element.canRandomizeYOnWrap = false;
    return element;
  }
  static generateIndustrialGround(x, y, layerConfig, game, world) {
    const r = Math.random();
    let baseColor;
    if (r < 0.6) baseColor = Palettes.industrial.ground[0]; // Dark grey asphalt
    else if (r < 0.8)
      baseColor = Palettes.industrial.ground[1]; // Lighter concrete
    else baseColor = Palettes.industrial.objects_accent[1]; // Patches of dirt/rust
    const detailColors = [
      Palettes.industrial.ground[3],
      Palettes.industrial.objects_accent[0],
    ]; // Cracks, rust stains
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

  // --- DrawElement ---
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
      yOffset =
        Math.sin(element.x * waveFrequency + gameTime * 3) * waveAmplitude;
    }
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
      const currentAlpha = ctx.globalAlpha; // Preserve current alpha from layer transition
      const blinkFactor =
        (Math.sin(gameTime * element.blinkRate + element.blinkPhase) + 1) / 2;
      ctx.globalAlpha *= element.initialBrightness * blinkFactor;
      drawPixelRect(
        ctx,
        element.x,
        drawY,
        element.size,
        element.size,
        drawColor
      );
      ctx.globalAlpha = currentAlpha; // Restore alpha
    } else if (element.type === "celestial_body") {
      const currentAlpha = ctx.globalAlpha;
      ctx.globalAlpha *= 0.5;
      drawPixelRect(
        ctx,
        element.x - element.radius * 1.2,
        drawY - element.radius * 1.2,
        element.radius * 2.4,
        element.radius * 2.4,
        element.glowColor
      );
      ctx.globalAlpha = currentAlpha; // Restore for main body
      drawPixelRect(
        ctx,
        element.x - element.radius,
        drawY - element.radius,
        element.radius * 2,
        element.radius * 2,
        drawColor
      );
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
      } else if (
        element.celestialType === "glitch_moon" &&
        Math.floor(gameTime * 10) % 3 === 0
      ) {
        drawPixelRect(
          ctx,
          element.x - element.radius + getRandomInt(-3, 3),
          drawY - element.radius + getRandomInt(-3, 3),
          element.radius * 2,
          element.radius * 2,
          getRandomColor(Palettes.gaming.emissive)
        );
      }
    } else if (element.type === "pixelCloud") {
      const blockSize = Math.max(2, Math.floor(element.width / 10));
      const numPuffs =
        Math.floor(element.width / blockSize) *
        Math.floor(element.height / blockSize) *
        0.7;
      for (let i = 0; i < numPuffs; i++) {
        const puffX = element.x + Math.random() * (element.width - blockSize);
        const puffY = drawY + Math.random() * (element.height - blockSize);
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
        const py = drawY + Math.random() * element.height;
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
      ctx.globalAlpha = currentAlpha; // Restore
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
        element.colors.top
      );
      drawPixelRect(
        ctx,
        element.x,
        drawY + hThird,
        element.width,
        hThird,
        element.colors.middle
      );
      drawPixelRect(
        ctx,
        element.x,
        drawY + hThird * 2,
        element.width,
        hThird,
        element.colors.bottom
      );
      for (let i = 0; i < 5; i++) {
        const lineX = element.x + getRandomInt(5, element.width - 5);
        drawPixelRect(
          ctx,
          lineX,
          drawY + hThird,
          1,
          hThird * 2,
          lightenDarkenColor(element.colors.middle, -20)
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
          drawY + element.size - rSize - Math.random() * element.size * 0.3;
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
      const numDetails = Math.floor((element.width * element.height) / 200);
      for (let i = 0; i < numDetails; i++) {
        const detailX = element.x + Math.random() * element.width;
        const detailY = drawY + Math.random() * element.height * 0.3;
        let dW, dH;
        if (element.textureType === "desert_cracks_pebbles") {
          dW = Math.random() < 0.5 ? getRandomInt(5, 15) : getRandomInt(1, 3);
          dH = Math.random() < 0.5 ? getRandomInt(1, 3) : getRandomInt(5, 15);
        } else if (element.textureType === "gaming_grid_flowers") {
          dW = getRandomInt(2, 4);
          dH = getRandomInt(2, 4);
        } else if (element.textureType === "futuristic_guideways") {
          dW = Math.random() < 0.7 ? element.width * 0.8 : getRandomInt(3, 6);
          dH = Math.random() < 0.7 ? getRandomInt(1, 2) : getRandomInt(3, 6);
        } else if (element.textureType === "industrial_asphalt_cracks") {
          dW = Math.random() < 0.5 ? getRandomInt(10, 30) : getRandomInt(2, 5);
          dH = Math.random() < 0.5 ? getRandomInt(1, 3) : getRandomInt(2, 5);
        } else {
          dW = getRandomInt(2, 8);
          dH = getRandomInt(2, 8);
        }
        drawPixelRect(
          ctx,
          detailX,
          detailY,
          dW,
          dH,
          getRandomColor(element.detailColors)
        );
      }
    } else if (element.type === "debris") {
      if (
        element.debrisType === "wire" ||
        element.debrisType === "rusty_pipe_fragment"
      ) {
        drawPixelRect(
          ctx,
          element.x,
          drawY,
          element.size,
          element.height,
          drawColor
        );
      } else {
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
      const Ecolors = element.colors; // element.colors is an object {base, light, shadow}
      for (let i = 0; i < element.width / structBlockSize; i++) {
        for (let j = 0; j < element.height / structBlockSize; j++) {
          if (
            Math.random() < element.density &&
            element.height - j * structBlockSize >
              Math.random() * element.height * 0.5
          ) {
            let blockColor = Ecolors.base;
            if (i < element.width / structBlockSize / 3)
              blockColor = Ecolors.shadow;
            else if (i > ((element.width / structBlockSize) * 2) / 3)
              blockColor = Ecolors.light;

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
      if (Math.floor(gameTime * 2) % 2 === 0 || !element.isEmissive) {
        drawPixelRect(
          ctx,
          element.x + element.size * 0.3,
          drawY + element.size * 0.2,
          element.size * 0.4,
          element.size * 0.15,
          element.colors.symbol
        );
        drawPixelRect(
          ctx,
          element.x + element.size * 0.55,
          drawY + element.size * 0.35,
          element.size * 0.15,
          element.size * 0.15,
          element.colors.symbol
        );
        drawPixelRect(
          ctx,
          element.x + element.size * 0.4,
          drawY + element.size * 0.5,
          element.size * 0.2,
          element.size * 0.15,
          element.colors.symbol
        );
        drawPixelRect(
          ctx,
          element.x + element.size * 0.4,
          drawY + element.size * 0.8,
          element.size * 0.2,
          element.size * 0.1,
          element.colors.symbol
        );
      }
    } else if (element.type === "futuristicTower") {
      const Ecolors = element.colors; // element.colors is Palettes.futuristic.objects_primary
      const baseC = Ecolors.base;
      const lightC = Ecolors.light;
      const shadowC = Ecolors.shadow;

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

      const numLights = element.lights
        ? element.lights.length
        : Math.floor(element.height / 15);
      if (!element.lights) {
        element.lights = [];
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
            color: getRandomColor(element.lightColors), // element.lightColors is an array
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
      );
    } else if (
      element.type === "industrialBuilding" ||
      element.type === "industrialSmokestack"
    ) {
      const Ecolors = element.colors; // element.colors is Palettes.industrial.objects_primary
      const baseC = Ecolors.base;
      const lightC = Ecolors.light;
      const shadowC = Ecolors.shadow;

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
      if (element.type === "industrialSmokestack") {
        if (Math.random() < 0.3) {
          const smokeX = element.x + element.width / 2 + getRandomFloat(-5, 5);
          const smokeY = drawY + getRandomFloat(-5, 0);
          const smokeParticle = new Particle(
            smokeX,
            smokeY,
            getRandomFloat(-5, 5),
            getRandomFloat(-10, -20),
            getRandomFloat(1, 3),
            getRandomInt(3, 8),
            getRandomColor(element.smokeColors),
            getRandomFloat(0.2, 0.5),
            "weather"
          );
          smokeParticle.gravity = -5;
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
      );
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
          lc.generator,
          lc.count,
          this.game,
          this,
          lc,
          false,
          initialXOffset
        )
      );
    });
    newLayers.sort((a, b) => a.scrollSpeedFactor - b.scrollSpeedFactor);
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

      const sourcePalette = Palettes[this.currentTheme] || Palettes.desert;
      this.transitionSourceSky =
        (sourcePalette.sky && sourcePalette.sky[0]) || this.skyColor;

      const targetPalette = Palettes[newThemeData.theme] || Palettes.desert;
      this.transitionTargetSky =
        (targetPalette.sky && targetPalette.sky[0]) || "#87CEEB";

      this.transitionSourceTheme = this.currentTheme;
      this.transitionTargetTheme = newThemeData.theme;

      this.sourceLayers = this.layers;
      this.sourceLayers.forEach((layer) => {
        layer.isSourceLayer = true;
      });

      const targetLayerInitialXOffset = this.worldX + Config.CANVAS_WIDTH;
      this.targetLayers = this.initLayers(
        this.transitionTargetTheme,
        targetLayerInitialXOffset
      );

      this.weatherParticles = [];
    } else if (
      !this.isTransitioning &&
      this.currentTheme === newThemeData.theme
    ) {
      const currentPalette = Palettes[this.currentTheme] || Palettes.desert;
      this.skyColor =
        (currentPalette.sky && currentPalette.sky[0]) || this.skyColor; // Update current top sky color
      this.currentTopSky = this.skyColor;
      this.currentHorizonSky =
        (currentPalette.sky && currentPalette.sky[1]) ||
        lightenDarkenColor(this.currentTopSky, 30);
    }
  }

  updateWeatherParticles(deltaTime) {
    for (let i = this.weatherParticles.length - 1; i >= 0; i--) {
      this.weatherParticles[i].update(deltaTime);
      if (
        this.weatherParticles[i].lifespan <= 0 ||
        this.weatherParticles[i].y > Config.CANVAS_HEIGHT + 20 ||
        this.weatherParticles[i].y < -20 ||
        this.weatherParticles[i].x < -20 ||
        this.weatherParticles[i].x > Config.CANVAS_WIDTH + 20
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

    if (theme === "desert_start" && chance < 0.05) {
      const particle = new Particle(
        Math.random() < 0.5 ? -10 : Config.CANVAS_WIDTH + 10,
        getRandomFloat(this.groundLevelY - 50, this.groundLevelY + 20),
        (Math.random() < 0.5 ? 1 : -1) * getRandomFloat(20, 50),
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
      const particle = new Particle(
        getRandomFloat(0, Config.CANVAS_WIDTH),
        -10,
        getRandomFloat(-5, 5),
        getRandomFloat(30, 60),
        getRandomFloat(2, 4),
        getRandomInt(1, 2),
        getRandomColor(
          (paletteForWeather.smoke || ["#A9A9A9"]).map((c) => c + "66")
        ),
        getRandomFloat(0.2, 0.5),
        "weather"
      );
      this.weatherParticles.push(particle);
    }
  }

  update(worldScrollSpeed) {
    this.worldX += worldScrollSpeed;
    const currentZoneInfo = StopsManager.getCurrentZone(this.worldX);
    this.handleThemeChange(currentZoneInfo);

    if (this.isTransitioning) {
      if (this.sourceLayers)
        this.sourceLayers.forEach((layer) => layer.update(worldScrollSpeed));
      if (this.targetLayers)
        this.targetLayers.forEach((layer) => layer.update(worldScrollSpeed));

      if (this.transitionDurationWorldUnits > 0 && worldScrollSpeed !== 0) {
        const progressIncrement =
          Math.abs(worldScrollSpeed) / this.transitionDurationWorldUnits;
        this.transitionProgress += progressIncrement;
      } else if (
        this.transitionDurationWorldUnits === 0 &&
        worldScrollSpeed !== 0
      ) {
        this.transitionProgress = 1;
      }
      this.transitionProgress = Math.min(this.transitionProgress, 1);

      const sourcePalette =
        Palettes[this.transitionSourceTheme] || Palettes.desert;
      const targetPalette =
        Palettes[this.transitionTargetTheme] || Palettes.desert;

      const sourceTop =
        (sourcePalette.sky && sourcePalette.sky[0]) || this.transitionSourceSky; // Use transitionSourceSky as fallback
      const sourceHorizon =
        (sourcePalette.sky && sourcePalette.sky[1]) ||
        lightenDarkenColor(sourceTop, 30);

      const targetTop =
        (targetPalette.sky && targetPalette.sky[0]) || this.transitionTargetSky; // Use transitionTargetSky as fallback
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

        this.layers = this.targetLayers;
        this.sourceLayers = null;
        this.targetLayers = null;
      }
    } else {
      this.layers.forEach((layer) => layer.update(worldScrollSpeed));
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
    const skyGradient = ctx.createLinearGradient(0, 0, 0, this.groundLevelY);
    skyGradient.addColorStop(0, this.currentTopSky);
    skyGradient.addColorStop(1, this.currentHorizonSky);
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, Config.CANVAS_WIDTH, Config.CANVAS_HEIGHT);

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
      // Apply fog with its own alpha, don't multiply if it's already rgba
      if (
        typeof themePalette.atmosphere.fogColor === "string" &&
        themePalette.atmosphere.fogColor.includes("rgba")
      ) {
        ctx.fillStyle = themePalette.atmosphere.fogColor;
      } else {
        ctx.globalAlpha = 0.15; // Default alpha for non-rgba fog colors
        ctx.fillStyle = themePalette.atmosphere.fogColor || "#FFFFFF"; // Fallback color
      }
      ctx.fillRect(0, 0, Config.CANVAS_WIDTH, Config.CANVAS_HEIGHT);
      ctx.globalAlpha = originalAlpha; // Reset alpha
    }

    const layersToRender = this.isTransitioning
      ? [...(this.sourceLayers || []), ...(this.targetLayers || [])].sort(
          (a, b) => a.scrollSpeedFactor - b.scrollSpeedFactor
        )
      : this.layers;

    layersToRender.forEach((layer) => {
      if (
        layer.layerConfig.type === "foreground_debris" &&
        layer.scrollSpeedFactor > 1
      )
        return;
      layer.render(ctx);
    });

    this.weatherParticles.forEach((p) => {
      if (p.type === "weather" && p.y < this.groundLevelY + 20) {
        p.render(ctx);
      }
    });
  }

  renderForeground(ctx) {
    const layersToRender = this.isTransitioning
      ? [...(this.sourceLayers || []), ...(this.targetLayers || [])].sort(
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
  }
}
