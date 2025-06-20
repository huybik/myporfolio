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

    const currentZone = StopsManager.getCurrentZone(this.game.world.worldX);
    let displayText = "Portfolio Drive"; // Default text
    let hasInteractivePrompt = false;

    if (currentZone) {
      if (currentZone.linkURL) {
        displayText = `${currentZone.name}-Press F to enter`;
        hasInteractivePrompt = true;
      } else if (currentZone.name) {
        // For zones without a direct link (e.g., "Desert Drive")
        displayText = `${currentZone.name}`;
      }
    }

    const textY = this.infoScreenY + this.infoScreenHeight / 2 + 6;

    // Blinking logic for interactive prompts
    if (hasInteractivePrompt) {
      // Blink the text
      ctx.fillText(
        displayText,
        this.infoScreenX + this.infoScreenWidth / 2,
        textY
      );
    } else {
      // Always display non-interactive text
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
      let lightColor = "#550000"; // Off
      if (i === 0 && this.game.player.currentSpeed !== 0) {
        lightColor = "#00AA00"; // Green for moving
      } else if (i === 1 && StopsManager.activeStop) {
        // Yellow if near a marker (StopsManager.activeStop is set when close to a marker)
        lightColor = "#FFAA00";
      } else if (i === 2 && this.game.frameCount % 60 < 30) {
        lightColor = "#0055AA"; // Blue, blinking (system pulse or generic indicator)
      }
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
        // Limit to 3 dots for simplicity
        const stopProgress =
          (stop.worldPositionX - this.game.world.worldX) /
          (StopsManager.stops[StopsManager.stops.length - 1].worldPositionX ||
            1); // Avoid div by zero if only one stop
        const stopDotX = mapX + 5 + index * (mapSize / 4);
        // Adjust Y position calculation for minimap dots
        let stopDotY = mapY + mapSize * 0.75 - stopProgress * mapSize * 0.5;
        stopDotY = Math.max(mapY + 2, Math.min(mapY + mapSize - 5, stopDotY));

        let stopColor = "#505050"; // Default inactive
        if (StopsManager.activeStop && StopsManager.activeStop.id === stop.id) {
          stopColor = Palettes.gaming.props[1]; // Yellow if marker is active
        } else if (
          this.game.world.worldX >
          stop.worldPositionX - StopsManager.stopActivationRange / 2
        ) {
          // Check if player has passed the marker or is very close to it from the left
          const currentZoneForMinimap = StopsManager.getCurrentZone(
            this.game.world.worldX
          );
          if (
            currentZoneForMinimap &&
            currentZoneForMinimap.stopId === stop.id
          ) {
            // If currently in the zone associated with this stop
            stopColor = Palettes.gaming.props[2]; // Green for current zone's marker
          } else if (
            this.game.world.worldX >
            stop.worldPositionX + StopsManager.stopActivationRange / 2
          ) {
            stopColor = Palettes.gaming.props[0]; // Red if passed
          }
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
