// js/ui.js
class UI {
  constructor(game) {
    this.game = game;
    this.height = 50;
    this.yPosition = Config.CANVAS_HEIGHT - this.height;
    this.backgroundColor = "rgba(0, 0, 0, 0.8)";
    this.borderColor = "#333333";
    this.textColor = "#A0D0A0";
    this.font = '16px "Courier New", Courier, monospace';
    this.infoScreenWidth = 300;
    this.infoScreenHeight = 30;
    this.infoScreenX = (Config.CANVAS_WIDTH - this.infoScreenWidth) / 2;
    this.infoScreenY =
      this.yPosition + (this.height - this.infoScreenHeight) / 2;
    this.infoScreenColor = "#102010";
    this.infoScreenBorderColor = "#204020";
    if (Config.DEBUG_MODE) console.log("UI initialized.");
  }
  drawPixelBorder(ctx, x, y, width, height, color, thickness = 1) {
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.rect(
      Math.floor(x) + 0.5,
      Math.floor(y) + 0.5,
      Math.floor(width) - 1,
      Math.floor(height) - 1
    );
    ctx.stroke();
  }
  render(ctx) {
    drawPixelRect(
      ctx,
      0,
      this.yPosition,
      Config.CANVAS_WIDTH,
      this.height,
      this.backgroundColor
    );
    this.drawPixelBorder(
      ctx,
      0,
      this.yPosition,
      Config.CANVAS_WIDTH,
      this.height,
      this.borderColor,
      2
    );
    drawPixelRect(
      ctx,
      this.infoScreenX,
      this.infoScreenY,
      this.infoScreenWidth,
      this.infoScreenHeight,
      this.infoScreenColor
    );
    this.drawPixelBorder(
      ctx,
      this.infoScreenX,
      this.infoScreenY,
      this.infoScreenWidth,
      this.infoScreenHeight,
      this.infoScreenBorderColor,
      2
    );
    ctx.fillStyle = this.textColor;
    ctx.font = this.font;
    ctx.textAlign = "center";
    const activePrompt = StopsManager.getActiveStopPrompt();
    let displayText = "";
    const currentZone = StopsManager.getCurrentZone(this.game.world.worldX);
    if (activePrompt) {
      displayText = activePrompt;
    } else if (currentZone) {
      displayText = `Zone: ${currentZone.name}`;
    } else {
      displayText = "Portfolio Drive";
    }
    const textY = this.infoScreenY + this.infoScreenHeight / 2 + 6;
    if (this.game.frameCount % 10 < 8 || !activePrompt) {
      ctx.fillText(
        displayText,
        this.infoScreenX + this.infoScreenWidth / 2,
        textY
      );
    }
    ctx.strokeStyle = "rgba(50, 100, 50, 0.15)";
    ctx.lineWidth = 1;
    for (let i = 0; i < this.infoScreenHeight; i += 3) {
      ctx.beginPath();
      ctx.moveTo(this.infoScreenX, this.infoScreenY + i + 0.5);
      ctx.lineTo(
        this.infoScreenX + this.infoScreenWidth,
        this.infoScreenY + i + 0.5
      );
      ctx.stroke();
    }
    ctx.textAlign = "left";
    this.drawStatusLights(ctx);
    this.drawMiniMapPlaceholder(ctx);
  }
  drawStatusLights(ctx) {
    const lightSize = 8;
    const padding = 10;
    const startX = padding + 20;
    const lightY = this.yPosition + (this.height - lightSize) / 2;
    for (let i = 0; i < 3; i++) {
      let lightColor = "#550000";
      if (i === 0 && this.game.player.currentSpeed !== 0)
        lightColor = "#00AA00";
      else if (i === 1 && StopsManager.activeStop) lightColor = "#FFAA00";
      else if (i === 2 && this.game.frameCount % 60 < 30)
        lightColor = "#0055AA";
      drawPixelRect(
        ctx,
        startX + i * (lightSize + padding),
        lightY,
        lightSize,
        lightSize,
        lightColor
      );
      this.drawPixelBorder(
        ctx,
        startX + i * (lightSize + padding),
        lightY,
        lightSize,
        lightSize,
        darkenColor(lightColor, 30),
        1
      );
    }
  }
  drawMiniMapPlaceholder(ctx) {
    const mapSize = this.height - 10;
    const mapX = Config.CANVAS_WIDTH - mapSize - 25;
    const mapY = this.yPosition + (this.height - mapSize) / 2;
    drawPixelRect(ctx, mapX, mapY, mapSize, mapSize, this.infoScreenColor);
    this.drawPixelBorder(
      ctx,
      mapX,
      mapY,
      mapSize,
      mapSize,
      this.infoScreenBorderColor,
      2
    );
    drawPixelRect(
      ctx,
      mapX + mapSize / 2 - 2,
      mapY + mapSize / 2 - 2,
      4,
      4,
      this.textColor
    );
    StopsManager.stops.forEach((stop, index) => {
      if (index < 3) {
        const stopProgress =
          (stop.worldPositionX - this.game.world.worldX) /
          StopsManager.stops[StopsManager.stops.length - 1].worldPositionX;
        const stopDotX = mapX + 5 + index * (mapSize / 4);
        const stopDotY = mapY + mapSize * 0.75 - stopProgress * mapSize * 0.5;
        let stopColor = "#505050";
        if (StopsManager.activeStop && StopsManager.activeStop.id === stop.id) {
          stopColor = Palettes.gaming.props[1];
        } else if (this.game.world.worldX > stop.worldPositionX) {
          stopColor = Palettes.gaming.props[0];
        }
        drawPixelRect(
          ctx,
          Math.floor(stopDotX),
          Math.floor(stopDotY),
          3,
          3,
          stopColor
        );
      }
    });
  }
}
function darkenColor(hex, percent) {
  return lightenDarkenColor(hex, -Math.abs(percent));
}
