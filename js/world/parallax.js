// js/world/parallax.js
class ParallaxLayer {
  constructor(
    scrollSpeedFactor,
    elementGenerator,
    elementCount,
    game,
    world,
    layerConfig,
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
      let y;
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
      const element = this.elementGenerator(
        x,
        y,
        this.layerConfig,
        this.game,
        this.world
      );
      element.scrollSpeedFactor = this.scrollSpeedFactor; // Tag element with its layer's speed
      this.elements.push(element);
    }
  }

  update(worldScrollSpeed) {
    const layerScrolledOriginX = this.world.worldX * this.scrollSpeedFactor;
    const screenWidth = Config.CANVAS_WIDTH;

    this.elements.forEach((element) => {
      if (element.update) {
        element.update(this.game.deltaTime, this.game.gameTime);
      }
    });

    const wrapBuffer = screenWidth * 0.75;
    const totalVirtualWidth = screenWidth * 3.5;

    if (this.isSourceLayer) {
      this.elements = this.elements.filter((element) => {
        const elementVisualWidth =
          element.width || (element.radius ? element.radius * 2 : 50);
        return (
          element.x + elementVisualWidth > layerScrolledOriginX - wrapBuffer * 2
        );
      });
    } else {
      this.elements.forEach((element) => {
        const elementVisualWidth =
          element.width || (element.radius ? element.radius * 2 : 50);
        const elementScreenX = element.x - layerScrolledOriginX;

        if (elementScreenX + elementVisualWidth < -wrapBuffer) {
          element.x += totalVirtualWidth + Math.random() * 100 - 50;
          if (element.canRandomizeYOnWrap) {
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
        } else if (elementScreenX > screenWidth + wrapBuffer) {
          element.x -= totalVirtualWidth + Math.random() * 100 - 50;
          if (element.canRandomizeYOnWrap) {
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
          if (this.isSourceLayer) {
            elementAlpha = 1.0 - this.world.transitionProgress;
          } else {
            elementAlpha = this.world.transitionProgress;
          }
        }
        elementAlpha = Math.max(0, Math.min(1, elementAlpha));

        if (elementAlpha <= 0.01) return;

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
            finalColor = "#FF00FF";
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
