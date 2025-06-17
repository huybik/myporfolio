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
    this.player = new Player(this);
    this.ui = new UI(this);
    this.world = new World(this);
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
      this.player.width
    );
  }
  render() {
    this.world.render(this.ctx);
    const playerGroundY =
      this.player.effectiveY + this.player.height - this.player.wheelRadius;
    StopsManager.render(this.ctx, this.world.worldX, playerGroundY);
    this.player.render(this.ctx);
    this.ui.render(this.ctx);
    if (Config.DEBUG_MODE) {
      this.ctx.fillStyle = "white";
      this.ctx.font = "12px Courier New";
      this.ctx.textAlign = "left";
      this.ctx.fillText(`FPS: ${(1 / this.deltaTime).toFixed(0)}`, 10, 20);
      this.ctx.fillText(`GameTime: ${this.gameTime.toFixed(2)}s`, 10, 35);
    }
  }
  gameLoop(currentTime) {
    if (this.lastTime === 0) {
      this.lastTime = currentTime;
    }
    this.deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    this.gameTime += this.deltaTime;
    this.frameCount++;
    const maxDeltaTime = (1 / Config.TARGET_FPS) * 3;
    if (this.deltaTime > maxDeltaTime) {
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
