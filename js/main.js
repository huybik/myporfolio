// js/main.js
class Game {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.lastTime = 0;
    this.gameTime = 0;
    this.deltaTime = 0;
    this.frameCount = 0;
    this.player = null;
    this.world = null;
    this.ui = null;
    this.init();
  }
  init() {
    this.canvas.width = Config.CANVAS_WIDTH;
    this.canvas.height = Config.CANVAS_HEIGHT;
    // Crucial for pixel art: disable image smoothing
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.mozImageSmoothingEnabled = false;
    this.ctx.webkitImageSmoothingEnabled = false;
    this.ctx.msImageSmoothingEnabled = false;

    this.player = new Player(this);
    this.world = new World(this); // World needs player for groundLevelY relative positioning
    this.ui = new UI(this); // UI needs game for gameTime and other states

    // Initialize StopsManager (already self-initializes, but good to be aware)
    // StopsManager.init();

    if (Config.DEBUG_MODE) {
      console.log(
        "Game initialized with Player, World, StopsManager, and UI ready."
      );
    }
    this.gameLoop = this.gameLoop.bind(this);
    requestAnimationFrame(this.gameLoop);
  }

  update(deltaTime) {
    this.player.update(deltaTime);
    const worldScrollSpeed = this.player.currentSpeed;
    this.world.update(worldScrollSpeed); // World update might change theme, affecting UI
    StopsManager.update(
      this.world.worldX,
      this.player.screenX,
      this.player.width,
      this
    ); // Pass game for gameTime
    this.ui.update(deltaTime); // UI update depends on game state (theme, active stop)
    EffectsManager.update(deltaTime); // Update global effects like screen-wide particles
  }

  render() {
    // Clear canvas (though world sky usually covers this)
    this.ctx.clearRect(0, 0, Config.CANVAS_WIDTH, Config.CANVAS_HEIGHT);

    this.world.render(this.ctx); // Renders sky, parallax layers (except some foreground)

    const playerGroundY = this.world.groundLevelY; // Use world's ground level
    StopsManager.render(
      this.ctx,
      this.world.worldX,
      playerGroundY,
      this.gameTime
    );

    this.player.render(this.ctx); // Renders player and its particles (dust, exhaust)

    this.world.renderForeground(this.ctx); // Renders foreground elements after player

    // Global screen effects before UI
    EffectsManager.drawVignette(this.ctx); // III.2.B Vignette
    EffectsManager.drawScanlines(this.ctx, this.world); // III.2.B Scanlines

    this.ui.render(this.ctx); // Renders UI on top of everything

    if (Config.DEBUG_MODE) {
      this.ctx.fillStyle = "white";
      // Use UI's pixel text for debug if available, else fallback
      if (this.ui && typeof this.ui.drawPixelText === "function") {
        const fpsText = `FPS: ${(1 / this.deltaTime).toFixed(0)}`;
        const gameTimeText = `GT: ${this.gameTime.toFixed(1)}s`;
        this.ui.drawPixelText(this.ctx, fpsText, 10, 10, "white", 1.5);
        this.ui.drawPixelText(this.ctx, gameTimeText, 10, 25, "white", 1.5);
      } else {
        this.ctx.font = "12px Courier New";
        this.ctx.textAlign = "left";
        this.ctx.fillText(`FPS: ${(1 / this.deltaTime).toFixed(0)}`, 10, 20);
        this.ctx.fillText(`GameTime: ${this.gameTime.toFixed(2)}s`, 10, 35);
      }
    }
  }

  gameLoop(currentTime) {
    const now = performance.now(); // Use performance.now() for higher precision
    if (this.lastTime === 0) {
      this.lastTime = now;
    }
    // Calculate deltaTime in seconds
    this.deltaTime = (now - this.lastTime) / 1000;
    this.lastTime = now;

    this.gameTime += this.deltaTime;
    this.frameCount++;

    // Delta time clamping to prevent physics explosions on tab resume / lag spikes
    const maxDeltaTime = (1 / Config.TARGET_FPS) * 3; // Allow up to 3 frames worth of catch-up
    if (this.deltaTime > maxDeltaTime) {
      if (Config.DEBUG_MODE)
        console.warn(
          `DeltaTime capped from ${this.deltaTime.toFixed(
            4
          )} to ${maxDeltaTime.toFixed(4)}`
        );
      this.deltaTime = maxDeltaTime;
    }

    this.update(this.deltaTime);
    this.render();
    requestAnimationFrame(this.gameLoop);
  }
}

window.onload = () => {
  const game = new Game();
};
