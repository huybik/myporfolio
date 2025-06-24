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
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.mozImageSmoothingEnabled = false;
    this.ctx.webkitImageSmoothingEnabled = false;
    this.ctx.msImageSmoothingEnabled = false;

    // Auto-focus the canvas to capture keyboard input immediately on page load
    this.canvas.focus();

    this.player = new Player(this);
    this.world = new World(this);
    this.ui = new UI(this);

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
    this.world.update(worldScrollSpeed);
    StopsManager.update(
      this.world.worldX,
      this.player.screenX,
      this.player.width,
      this
    );
    this.ui.update(deltaTime);
    EffectsManager.update(deltaTime);

    // Handle global interactions
    this.handleGlobalInput();
  }

  handleGlobalInput() {
    // Open the link for the current zone when the interact key is pressed.
    if (Input.isInteractJustPressed()) {
      const currentZone = StopsManager.getCurrentZone(this.world.worldX);
      if (currentZone && currentZone.stopId) {
        const linkURL = Config.STOP_LINKS[currentZone.stopId];
        if (linkURL) {
          if (Config.DEBUG_MODE) {
            console.log(
              `Zone interaction: opening URL for ${currentZone.stopId}: ${linkURL}`
            );
          }
          window.open(linkURL, "_blank");
        }
      }
    }
  }

  render() {
    this.ctx.clearRect(0, 0, Config.CANVAS_WIDTH, Config.CANVAS_HEIGHT);

    // 1. World background (sky, distant layers)
    this.world.render(this.ctx);

    // 2. Background weather particles (world-space)
    this.ctx.save();
    this.ctx.translate(-this.world.worldX, 0);
    EffectsManager.renderLayer(this.ctx, "weather_background");
    this.ctx.restore();

    // 3. Stop markers (world-space)
    StopsManager.render(
      this.ctx,
      this.world.worldX,
      this.world.groundLevelY,
      this.gameTime
    );

    // 4. Particles behind player (screen-space)
    EffectsManager.renderLayer(this.ctx, "behind_player");

    // 5. Player
    this.player.render(this.ctx);

    // 6. World foreground layers
    this.world.renderForeground(this.ctx);

    // 7. Foreground weather particles (world-space)
    this.ctx.save();
    this.ctx.translate(-this.world.worldX, 0);
    EffectsManager.renderLayer(this.ctx, "weather_foreground");
    this.ctx.restore();

    // 8. Screen-wide effects
    EffectsManager.drawVignette(this.ctx);
    EffectsManager.drawScanlines(this.ctx, this.world);

    // 9. UI
    this.ui.render(this.ctx);

    // 10. Debug Info
    if (Config.DEBUG_MODE) {
      const fpsText = `FPS: ${(1 / this.deltaTime).toFixed(0)}`;
      const gameTimeText = `GT: ${this.gameTime.toFixed(1)}s`;
      const particleCount = `PC: ${EffectsManager.particles.length}`;
      drawPixelText(this.ctx, fpsText, 10, 10, "white", 1.5);
      drawPixelText(this.ctx, gameTimeText, 10, 25, "white", 1.5);
      drawPixelText(this.ctx, particleCount, 10, 40, "white", 1.5);
    }
  }

  gameLoop(currentTime) {
    const now = performance.now();
    if (this.lastTime === 0) {
      this.lastTime = now;
    }
    this.deltaTime = (now - this.lastTime) / 1000;
    this.lastTime = now;

    this.gameTime += this.deltaTime;
    this.frameCount++;

    const maxDeltaTime = (1 / Config.TARGET_FPS) * 3;
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
