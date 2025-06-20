// js/ui.js
class UI {
  constructor(game) {
    this.game = game;
    this.height = 60; // Increased height for more space
    this.yPosition = Config.CANVAS_HEIGHT - this.height;
    this.backgroundColor = "rgba(10, 20, 10, 0.85)"; // Darker, slightly green
    this.borderColor = Palettes.ui.FRAME_DARK; // Using new palette
    this.textColor = "#B0E0B0"; // Lighter green text

    // Using a basic pixel font rendering for now
    this.fontSettings = {
      charHeight: PixelFontData.charHeight,
      charSpacing: PixelFontData.charSpacing,
      lineHeight: PixelFontData.lineHeight,
      scale: 2, // Scale up the pixel font
    };

    this.infoScreenWidth = 350; // Wider info screen
    this.infoScreenHeight = 28; // Adjusted height
    this.infoScreenX = (Config.CANVAS_WIDTH - this.infoScreenWidth) / 2;
    this.infoScreenY =
      this.yPosition + (this.height - this.infoScreenHeight) / 2 - 5; // Shifted up a bit
    this.infoScreenColor = "rgba(20, 40, 20, 0.9)";
    this.infoScreenBorderColor = Palettes.ui.FRAME_LIGHT;

    // III.1.A TextAppearing (Info Screen)
    this.displayedText = "";
    this.targetText = "";
    this.typewriterIndex = 0;
    this.typewriterFrameCounter = 0; // Used with Config.UI_TYPEWRITER_SPEED

    // III.1.A UI Panel Entrance
    this.panelYOffset = this.height; // Start off-screen
    this.panelIntroSpeed = Config.UI_PANEL_INTRO_SPEED;

    // F-Key Icon for prompt
    this.fKeyIcon = this.createFKeyIcon();

    if (Config.DEBUG_MODE) console.log("UI initialized.");
  }

  // I.1.C UI Elements: Frames
  drawPixelArtFrame(ctx, x, y, width, height, themeColors = Palettes.ui) {
    const outerDark = themeColors.FRAME_DARK || "#101010";
    const midLight = themeColors.FRAME_LIGHT || "#404040";
    const innerHighlight = themeColors.FRAME_HIGHLIGHT || "#606060";
    const thickness = 2; // Each band thickness

    // Outer border
    drawPixelRect(ctx, x, y, width, height, outerDark);
    // Mid border
    drawPixelRect(
      ctx,
      x + thickness,
      y + thickness,
      width - thickness * 2,
      height - thickness * 2,
      midLight
    );
    // Inner highlight
    drawPixelRect(
      ctx,
      x + thickness * 2,
      y + thickness * 2,
      width - thickness * 4,
      height - thickness * 4,
      innerHighlight
    );
    // Innermost fill (optional, if the frame itself is the background)
    // drawPixelRect(ctx, x + thickness*3, y + thickness*3, width - thickness*6, height - thickness*6, themeColors.BACKGROUND || "#050505");
  }

  // Fallback if drawPixelArtFrame is too complex or for simpler borders
  drawSimplePixelBorder(ctx, x, y, width, height, color, thickness = 1) {
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    // Stroking on pixel boundaries needs 0.5 offset for crisp lines
    for (let i = 0; i < thickness; i++) {
      ctx.strokeRect(
        Math.floor(x) + i + 0.5,
        Math.floor(y) + i + 0.5,
        Math.floor(width) - 1 - i * 2,
        Math.floor(height) - 1 - i * 2
      );
    }
  }

  // I.1.C Custom Pixel Font (Bitmap Font simulation)
  drawPixelText(
    ctx,
    text,
    startX,
    startY,
    color,
    scale = 1,
    customFontSettings = this.fontSettings
  ) {
    ctx.fillStyle = color;
    let currentX = startX;
    const charHeight = customFontSettings.charHeight * scale;

    for (let char of text.toUpperCase()) {
      // Assuming font data is uppercase
      const charData = PixelFontData[char] || PixelFontData["?"]; // Fallback to '?'
      const charWidth =
        (charData[0] ? charData[0].length : PixelFontData.DEFAULT_CHAR_WIDTH) *
        scale;

      if (char === " ") {
        currentX +=
          PixelFontData.DEFAULT_CHAR_WIDTH * scale +
          customFontSettings.charSpacing * scale;
        continue;
      }

      for (let r = 0; r < charData.length; r++) {
        for (let c = 0; c < charData[r].length; c++) {
          if (charData[r][c] === 1) {
            drawPixelRect(
              ctx,
              currentX + c * scale,
              startY + r * scale,
              scale,
              scale,
              color
            );
          }
        }
      }
      currentX += charWidth + customFontSettings.charSpacing * scale;
    }
    return currentX; // Return end X for potential chaining
  }

  createFKeyIcon() {
    // 8x8 pixel art F key
    const size = 8 * this.fontSettings.scale; // Scale it like text
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    const s = this.fontSettings.scale; // shortcut for scale
    drawPixelRect(ctx, 0, 0, 8 * s, 8 * s, Palettes.ui.BUTTON_F_KEY_BG); // Keycap bg
    drawPixelRect(
      ctx,
      1 * s,
      1 * s,
      6 * s,
      6 * s,
      lightenDarkenColor(Palettes.ui.BUTTON_F_KEY_BG, 20)
    ); // Inner highlight

    // 'F' letter
    const fData = PixelFontData["F"];
    const charOffsetX = 2 * s;
    const charOffsetY = 1 * s;
    ctx.fillStyle = Palettes.ui.BUTTON_F_KEY_FG;
    for (let r = 0; r < fData.length; r++) {
      for (let c = 0; c < fData[r].length; c++) {
        if (fData[r][c] === 1) {
          drawPixelRect(
            ctx,
            charOffsetX + c * s,
            charOffsetY + r * s,
            s,
            s,
            Palettes.ui.BUTTON_F_KEY_FG
          );
        }
      }
    }
    return canvas;
  }

  update(deltaTime) {
    // UI Panel Entrance
    if (this.panelYOffset > 0) {
      this.panelYOffset -= this.panelIntroSpeed * (60 * deltaTime); // Make speed consistent
      if (this.panelYOffset < 0) this.panelYOffset = 0;
    }

    // Text Appearing (Typewriter)
    const currentZone = StopsManager.getCurrentZone(this.game.world.worldX);
    let newTargetText = "Portfolio Drive"; // Default
    let hasInteractivePrompt = false;

    if (currentZone) {
      if (
        StopsManager.activeStop &&
        Config.STOP_LINKS[StopsManager.activeStop.id]
      ) {
        // If near an interactive stop, prioritize its prompt
        newTargetText = `${StopsManager.activeStop.promptText} - [F] to Enter`;
        hasInteractivePrompt = true;
      } else if (currentZone.promptText) {
        newTargetText = currentZone.promptText;
      }
    }

    if (this.targetText !== newTargetText) {
      this.targetText = newTargetText;
      this.displayedText = "";
      this.typewriterIndex = 0;
      this.typewriterFrameCounter = 0;
    }

    if (this.typewriterIndex < this.targetText.length) {
      this.typewriterFrameCounter += 60 * deltaTime;
      const charsToAdvance = Math.floor(
        this.typewriterFrameCounter / Config.UI_TYPEWRITER_SPEED
      );
      if (charsToAdvance > 0) {
        this.typewriterIndex += charsToAdvance;
        this.typewriterFrameCounter %= Config.UI_TYPEWRITER_SPEED; // Keep remainder for next frame
        this.displayedText = this.targetText.substring(0, this.typewriterIndex);
      }
    } else {
      this.displayedText = this.targetText; // Ensure full text is shown once done
    }
  }

  render(ctx) {
    const actualYPosition = this.yPosition + this.panelYOffset;

    // Main UI Panel Background
    drawPixelRect(
      ctx,
      0,
      actualYPosition,
      Config.CANVAS_WIDTH,
      this.height,
      this.backgroundColor
    );
    // Main UI Panel Border (using new frame drawer)
    this.drawPixelArtFrame(
      ctx,
      0,
      actualYPosition,
      Config.CANVAS_WIDTH,
      this.height
    );

    // Info Screen Background & Border
    this.drawPixelArtFrame(
      ctx,
      this.infoScreenX,
      actualYPosition + (this.height - this.infoScreenHeight) / 2 - 5,
      this.infoScreenWidth,
      this.infoScreenHeight
    );
    drawPixelRect(
      ctx,
      this.infoScreenX + 6,
      actualYPosition + (this.height - this.infoScreenHeight) / 2 - 5 + 6,
      this.infoScreenWidth - 12,
      this.infoScreenHeight - 12,
      this.infoScreenColor
    );

    // Text Rendering (using pixel font)
    const textY =
      actualYPosition +
      (this.height - this.infoScreenHeight) / 2 -
      5 +
      this.infoScreenHeight / 2 -
      (this.fontSettings.charHeight * this.fontSettings.scale) / 2;

    // Calculate text width for centering
    let textToRender = this.displayedText;
    let textWidth = 0;
    for (let char of textToRender.toUpperCase()) {
      const charData = PixelFontData[char] || PixelFontData["?"];
      textWidth +=
        (charData[0] ? charData[0].length : PixelFontData.DEFAULT_CHAR_WIDTH) *
        this.fontSettings.scale;
      textWidth += this.fontSettings.charSpacing * this.fontSettings.scale;
    }
    textWidth -= this.fontSettings.charSpacing * this.fontSettings.scale; // Remove last spacing

    const textStartX =
      this.infoScreenX + (this.infoScreenWidth - textWidth) / 2;

    // III.1.B Interactive Prompt Animation
    let hasInteractivePromptThisFrame = false;
    if (
      StopsManager.activeStop &&
      Config.STOP_LINKS[StopsManager.activeStop.id]
    ) {
      hasInteractivePromptThisFrame = textToRender.includes("[F]");
    }

    if (hasInteractivePromptThisFrame) {
      const fKeyIndex = textToRender.indexOf("[F]");
      const preText = textToRender.substring(0, fKeyIndex);
      const postText = textToRender.substring(fKeyIndex + 3); // Length of "[F]"

      let currentX = this.drawPixelText(
        ctx,
        preText,
        textStartX,
        textY,
        this.textColor,
        this.fontSettings.scale
      );

      // Draw F-Key Icon
      const iconY =
        textY -
        (this.fKeyIcon.height -
          this.fontSettings.charHeight * this.fontSettings.scale) /
          2; // Align icon vertically

      // Removed pulsing alpha for F-Key icon
      // let iconPulseAlpha = 1.0;
      // if (Math.floor(this.game.gameTime * 4) % 2 === 0) {
      //   iconPulseAlpha =
      //     0.7 + ((Math.sin(this.game.gameTime * 10) + 1) / 2) * 0.3;
      // }
      // ctx.globalAlpha = iconPulseAlpha;

      ctx.drawImage(this.fKeyIcon, currentX, iconY);
      // ctx.globalAlpha = 1.0; // Reset if it was changed, but now it's not.

      currentX +=
        this.fKeyIcon.width +
        this.fontSettings.charSpacing * this.fontSettings.scale;

      this.drawPixelText(
        ctx,
        postText,
        currentX,
        textY,
        this.textColor,
        this.fontSettings.scale
      );
    } else {
      this.drawPixelText(
        ctx,
        textToRender,
        textStartX,
        textY,
        this.textColor,
        this.fontSettings.scale
      );
    }

    // Scanlines on info screen (subtle)
    ctx.strokeStyle = "rgba(50, 100, 50, 0.1)";
    ctx.lineWidth = 1;
    const infoScreenActualY =
      actualYPosition + (this.height - this.infoScreenHeight) / 2 - 5;
    for (
      let i = 0;
      i < this.infoScreenHeight;
      i += 2 * this.fontSettings.scale
    ) {
      // Scale scanlines too
      ctx.beginPath();
      ctx.moveTo(this.infoScreenX, infoScreenActualY + i + 0.5);
      ctx.lineTo(
        this.infoScreenX + this.infoScreenWidth,
        infoScreenActualY + i + 0.5
      );
      ctx.stroke();
    }

    this.drawStatusLights(ctx, actualYPosition);
    this.drawMiniMap(ctx, actualYPosition); // Changed from Placeholder
  }

  // I.1.C UI Icons: Status Lights
  drawStatusLights(ctx, panelY) {
    const lightSize = 8 * this.fontSettings.scale; // Scaled lights
    const padding = 5 * this.fontSettings.scale;
    const startX = padding + 20;
    const lightY = panelY + (this.height - lightSize) / 2;

    const status = [
      {
        active: this.game.player.currentSpeed !== 0,
        colorOn: "#00AA00",
        colorOff: "#550000",
        icon: "engine",
      },
      {
        active: !!StopsManager.activeStop,
        colorOn: "#FFAA00",
        colorOff: "#553300",
        icon: "signal",
      },
      {
        active: this.game.player.headlightsOn,
        colorOn: "#FFFF00",
        colorOff: "#555500",
        icon: "light",
      },
    ];

    status.forEach((s, i) => {
      let lightColor = s.active ? s.colorOn : s.colorOff;
      if (s.active && (s.icon === "signal" || s.icon === "light")) {
        // Blinking for active signal/light
        if (Math.floor(this.game.gameTime * 3) % 2 === 0) {
          lightColor = lightenDarkenColor(lightColor, -40);
        }
      }

      drawPixelRect(
        ctx,
        startX + i * (lightSize + padding),
        lightY,
        lightSize,
        lightSize,
        lightColor
      );
      this.drawSimplePixelBorder(
        ctx,
        startX + i * (lightSize + padding),
        lightY,
        lightSize,
        lightSize,
        darkenColor(lightColor, 30),
        this.fontSettings.scale > 1 ? 2 : 1
      );
      // Could draw tiny icons inside the lights here if desired
    });
  }

  // I.1.C UI Icons: Minimap
  // III.1.C Minimap Enhancements
  drawMiniMap(ctx, panelY) {
    const mapSize = this.height - 10 * this.fontSettings.scale;
    const mapX = Config.CANVAS_WIDTH - mapSize - 15 * this.fontSettings.scale;
    const mapY = panelY + (this.height - mapSize) / 2;

    // Background and Border
    this.drawPixelArtFrame(ctx, mapX - 3, mapY - 3, mapSize + 6, mapSize + 6); // Outer frame
    drawPixelRect(ctx, mapX, mapY, mapSize, mapSize, this.infoScreenColor); // Inner BG

    // Subtle Background Texture
    const texColor = Palettes.ui.MINIMAP_TEXTURE;
    for (let mx = 0; mx < mapSize; mx += 4 * this.fontSettings.scale) {
      for (let my = 0; my < mapSize; my += 4 * this.fontSettings.scale) {
        if (
          (mx / (4 * this.fontSettings.scale) +
            my / (4 * this.fontSettings.scale)) %
            2 ===
          0
        ) {
          drawPixelRect(
            ctx,
            mapX + mx,
            mapY + my,
            2 * this.fontSettings.scale,
            2 * this.fontSettings.scale,
            texColor
          );
        }
      }
    }

    // Player Icon (small arrow or car shape)
    const playerIconSize = 3 * this.fontSettings.scale;
    const playerMapX = mapX + mapSize / 2 - playerIconSize / 2;
    const playerMapY = mapY + mapSize * 0.8 - playerIconSize / 2; // Player at bottom 80% of map
    drawPixelRect(
      ctx,
      playerMapX,
      playerMapY,
      playerIconSize,
      playerIconSize,
      Palettes.ui.MINIMAP_PLAYER
    );
    // Arrow shape for player
    drawPixelRect(
      ctx,
      playerMapX + playerIconSize / 3,
      playerMapY - playerIconSize / 3,
      playerIconSize / 3,
      playerIconSize / 3,
      Palettes.ui.MINIMAP_PLAYER
    );

    // Stop Icons
    const mapRangeWorldUnits = StopsManager.zoneEntryLeadDistance * 2.5; // How much world distance the map displays vertically
    StopsManager.stops.forEach((stop) => {
      const distanceToPlayer = stop.worldPositionX - this.game.world.worldX;
      // Normalize distance to map's vertical range (0 at player, 1 at top of map range)
      const normalizedDist = distanceToPlayer / mapRangeWorldUnits;

      if (normalizedDist < 1 && normalizedDist > -0.2) {
        // Only draw if within map's visual range + a bit below
        const stopDotSize = 2 * this.fontSettings.scale;
        // X position can be slightly varied based on stop index or type for less overlap
        const stopDotX =
          mapX +
          mapSize / 2 -
          stopDotSize / 2 +
          (StopsManager.stops.indexOf(stop) - 1) * (stopDotSize * 2);
        const stopDotY = playerMapY - normalizedDist * mapSize * 0.7; // Scale y based on normalized distance

        if (stopDotY > mapY && stopDotY < mapY + mapSize - stopDotSize) {
          // Cull to map bounds
          let stopColor = Palettes.ui.MINIMAP_STOP_DEFAULT;
          if (stop.theme === "gaming")
            stopColor = Palettes.ui.MINIMAP_STOP_GAMING;
          else if (stop.theme === "futuristic")
            stopColor = Palettes.ui.MINIMAP_STOP_FUTURISTIC;
          else if (stop.theme === "industrial")
            stopColor = Palettes.ui.MINIMAP_STOP_INDUSTRIAL;

          if (
            StopsManager.activeStop &&
            StopsManager.activeStop.id === stop.id
          ) {
            // Pulse active stop
            const pulse = (Math.sin(this.game.gameTime * 8) + 1) / 2;
            const s = stopDotSize + Math.floor(pulse * 2);
            drawPixelRect(
              ctx,
              Math.floor(stopDotX - (s - stopDotSize) / 2),
              Math.floor(stopDotY - (s - stopDotSize) / 2),
              s,
              s,
              lightenDarkenColor(stopColor, 30)
            );
          } else {
            drawPixelRect(
              ctx,
              Math.floor(stopDotX),
              Math.floor(stopDotY),
              stopDotSize,
              stopDotSize,
              stopColor
            );
          }
        }
      }
    });

    // Zone Boundaries (Simplified: show next zone boundary)
    // This is complex to do accurately for all zones. Showing next one is a start.
    let nextStopForBoundary = null;
    for (const stop of StopsManager.stops) {
      if (
        stop.worldPositionX - StopsManager.zoneEntryLeadDistance >
        this.game.world.worldX
      ) {
        nextStopForBoundary = stop;
        break;
      }
    }
    if (nextStopForBoundary) {
      const boundaryWorldX =
        nextStopForBoundary.worldPositionX - StopsManager.zoneEntryLeadDistance;
      const distanceToBoundary = boundaryWorldX - this.game.world.worldX;
      const normalizedBoundaryDist = distanceToBoundary / mapRangeWorldUnits;
      if (normalizedBoundaryDist < 1 && normalizedBoundaryDist > 0) {
        const boundaryY = playerMapY - normalizedBoundaryDist * mapSize * 0.7;
        if (boundaryY > mapY && boundaryY < mapY + mapSize - 1) {
          ctx.globalAlpha = 0.3;
          drawPixelRect(
            ctx,
            mapX,
            boundaryY,
            mapSize,
            1 * this.fontSettings.scale,
            Palettes.ui.FRAME_HIGHLIGHT
          );
          ctx.globalAlpha = 1.0;
        }
      }
    }
  }
}

function darkenColor(hex, percent) {
  return lightenDarkenColor(hex, -Math.abs(percent));
}
