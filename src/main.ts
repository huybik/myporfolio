// src/main.ts
import { Config } from "./config";
import { Input } from "./input";
import { Player } from "./player/player";
import { World } from "./world/world";
import { UI } from "./ui/ui";
import { StopsManager } from "./stops/stops.manager";
import { EffectsManager } from "./effects/effectsManager";
import { drawPixelText } from "./font";
import { IGame } from "./types";

class Game implements IGame {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  lastTime: number;
  gameTime: number;
  deltaTime: number;
  frameCount: number;
  player!: Player;
  world!: World;
  ui!: UI;

  constructor() {
    this.canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d")!;
    this.lastTime = 0;
    this.gameTime = 0;
    this.deltaTime = 0;
    this.frameCount = 0;

    this.init();
  }

  init() {
    this.canvas.width = Config.CANVAS_WIDTH;
    this.canvas.height = Config.CANVAS_HEIGHT;
    this.ctx.imageSmoothingEnabled = false;
    this.canvas.focus();

    Input.init();
    StopsManager.init();

    this.player = new Player(this);
    this.world = new World(this);
    this.ui = new UI(this);

    if (Config.DEBUG_MODE) {
      console.log("Game initialized.");
    }
    this.gameLoop = this.gameLoop.bind(this);
    requestAnimationFrame(this.gameLoop);
  }

  update(deltaTime: number) {
    this.player.update(deltaTime);
    const worldScrollSpeed = this.player.currentSpeed;
    this.world.update(worldScrollSpeed);
    StopsManager.update(
      this.world.worldX,
      this.player.screenX,
      this.player.width
    );
    this.ui.update(deltaTime);
    EffectsManager.update(deltaTime);
    this.handleGlobalInput();
  }

  handleGlobalInput() {
    if (Input.isJustPressed("INTERACT")) {
      const currentZone = StopsManager.getCurrentZone(this.world.worldX);
      if (currentZone && currentZone.stopId) {
        const linkURL =
          Config.STOP_LINKS[
            currentZone.stopId as keyof typeof Config.STOP_LINKS
          ];
        if (linkURL) {
          window.open(linkURL, "_blank");
        }
      }
    }
  }

  render() {
    this.ctx.clearRect(0, 0, Config.CANVAS_WIDTH, Config.CANVAS_HEIGHT);
    this.world.render(this.ctx);
    this.ctx.save();
    this.ctx.translate(-this.world.worldX, 0);
    EffectsManager.renderLayer(this.ctx, "weather_background");
    this.ctx.restore();
    StopsManager.render(
      this.ctx,
      this.world.worldX,
      this.world.groundLevelY,
      this.gameTime
    );
    EffectsManager.renderLayer(this.ctx, "behind_player");
    this.player.render(this.ctx);
    this.world.renderForeground(this.ctx);
    this.ctx.save();
    this.ctx.translate(-this.world.worldX, 0);
    EffectsManager.renderLayer(this.ctx, "weather_foreground");
    this.ctx.restore();
    EffectsManager.drawVignette(this.ctx);
    EffectsManager.drawScanlines(this.ctx, this.world);
    this.ui.render(this.ctx);

    if (Config.DEBUG_MODE) {
      const fpsText = `FPS: ${(1 / this.deltaTime).toFixed(0)}`;
      drawPixelText(this.ctx, fpsText, 10, 10, "white", 1.5);
    }
  }

  gameLoop(currentTime: number) {
    if (this.lastTime === 0) this.lastTime = currentTime;
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

new Game();
