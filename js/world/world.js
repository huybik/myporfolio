// js/world/world.js
class World {
  constructor(game) {
    this.game = game;
    this.layers = [];
    this.worldX = 0;
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
    this.transitionDurationWorldUnits = Config.CANVAS_WIDTH * 1.1;

    this.transitionSourceSky = this.skyColor;
    this.transitionTargetSky = this.skyColor;
    this.transitionSourceTheme = this.currentTheme;
    this.transitionTargetTheme = this.currentTheme;

    this.sourceLayers = [];
    this.targetLayers = [];

    this.layers = this.initLayers(this.currentTheme, this.worldX);

    if (Config.DEBUG_MODE) console.log("World initialized.");
  }

  initLayers(theme, initialWorldXOffset = 0) {
    const newLayers = [];
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
    } else if (
      !this.isTransitioning &&
      this.currentTheme === newThemeData.theme
    ) {
      const currentPalette = Palettes[this.currentTheme] || Palettes.desert;
      this.skyColor =
        (currentPalette.sky && currentPalette.sky[0]) || this.skyColor;
      this.currentTopSky = this.skyColor;
      this.currentHorizonSky =
        (currentPalette.sky && currentPalette.sky[1]) ||
        lightenDarkenColor(this.currentTopSky, 30);
    }
  }

  emitIndustrialSmoke(x, y) {
    const smokeParticle = new Particle(
      x + getRandomFloat(-5, 5), // World X
      y + getRandomFloat(-5, 0), // World Y
      getRandomFloat(-5, 5),
      getRandomFloat(-10, -20),
      getRandomFloat(1, 3),
      getRandomInt(3, 8),
      getRandomColor(Palettes.industrial.smoke),
      getRandomFloat(0.2, 0.5),
      "weather",
      "weather_background" // Render layer
    );
    smokeParticle.gravity = -5;
    EffectsManager.addParticle(smokeParticle);
  }

  emitWeatherParticles() {
    const theme = this.isTransitioning
      ? this.transitionTargetTheme
      : this.currentTheme;
    const chance = Math.random();
    const paletteForWeather = Palettes[theme] || Palettes.desert;

    const spawnEdgeChoice = Math.random();
    let particleWorldX;
    if (spawnEdgeChoice < 0.45) {
      particleWorldX = this.worldX - 10;
    } else if (spawnEdgeChoice < 0.9) {
      particleWorldX = this.worldX + Config.CANVAS_WIDTH + 10;
    } else {
      particleWorldX = this.worldX + getRandomFloat(0, Config.CANVAS_WIDTH);
    }

    let particleWorldY = -10;

    if (theme === "desert_start" && chance < 0.05) {
      particleWorldY = getRandomFloat(
        this.groundLevelY - 50,
        this.groundLevelY + 20
      );
      const particle = new Particle(
        particleWorldX,
        particleWorldY,
        (particleWorldX < this.worldX + Config.CANVAS_WIDTH / 2 ? 1 : -1) *
          getRandomFloat(20, 50),
        getRandomFloat(-10, 10),
        getRandomFloat(3, 6),
        getRandomInt(2, 5),
        getRandomColor(paletteForWeather.generic_dust || ["#A0522D"]),
        getRandomFloat(0.1, 0.4),
        "weather",
        "weather_foreground"
      );
      particle.drag = 0.99;
      EffectsManager.addParticle(particle);
    } else if (theme === "industrial" && chance < 0.1) {
      const particle = new Particle(
        this.worldX + getRandomFloat(0, Config.CANVAS_WIDTH),
        particleWorldY,
        getRandomFloat(-5, 5),
        getRandomFloat(30, 60),
        getRandomFloat(2, 4),
        getRandomInt(1, 2),
        getRandomColor(
          (paletteForWeather.smoke || ["#A9A9A9"]).map((c) => c + "66")
        ),
        getRandomFloat(0.2, 0.5),
        "weather",
        "weather_foreground"
      );
      EffectsManager.addParticle(particle);
    }
  }

  update(worldScrollSpeed) {
    this.worldX += worldScrollSpeed;

    const currentZoneInfo = StopsManager.getCurrentZone(this.worldX);
    this.handleThemeChange(currentZoneInfo);

    if (this.isTransitioning) {
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
        this.transitionProgress = 1;
      }
      this.transitionProgress = Math.min(this.transitionProgress, 1);

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

        this.layers = this.targetLayers;
        this.layers.forEach((layer) => (layer.isSourceLayer = false));
        this.sourceLayers = [];
        this.targetLayers = [];
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
      ctx.fillStyle = themePalette.atmosphere.fogColor;
      ctx.fillRect(0, 0, Config.CANVAS_WIDTH, Config.CANVAS_HEIGHT);
    }

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
        return;
      layer.render(ctx);
    });
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
  }
}
