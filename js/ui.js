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
        newTargetText = `${StopsManager.activeStop.promptText}`;
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

      ctx.drawImage(this.fKeyIcon, currentX, iconY);

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
  // ROTATED 90 DEGREES RIGHT
  drawMiniMap(ctx, panelY) {
    const mapDimension = this.height - 10 * this.fontSettings.scale; // Map will be square
    const mapWidth = mapDimension;
    const mapHeight = mapDimension;

    // Position on the right side of the UI panel
    const mapX = Config.CANVAS_WIDTH - mapWidth - 15 * this.fontSettings.scale;
    const mapY = panelY + (this.height - mapHeight) / 2;

    // Background and Border
    this.drawPixelArtFrame(
      ctx,
      mapX - 3,
      mapY - 3,
      mapWidth + 6,
      mapHeight + 6
    ); // Outer frame
    drawPixelRect(ctx, mapX, mapY, mapWidth, mapHeight, this.infoScreenColor); // Inner BG

    // Subtle Background Texture
    const texColor = Palettes.ui.MINIMAP_TEXTURE;
    for (let mx = 0; mx < mapWidth; mx += 4 * this.fontSettings.scale) {
      for (let my = 0; my < mapHeight; my += 4 * this.fontSettings.scale) {
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

    const playerIconSize = 3 * this.fontSettings.scale;
    // Player icon on the left part of the map, centered vertically, facing right
    const playerMapX = mapX + mapWidth * 0.2 - playerIconSize / 2;
    const playerMapY = mapY + mapHeight / 2 - playerIconSize / 2;

    // Draw Player Icon (base square)
    drawPixelRect(
      ctx,
      playerMapX,
      playerMapY,
      playerIconSize,
      playerIconSize,
      Palettes.ui.MINIMAP_PLAYER
    );
    // Arrow shape for player (points RIGHT)
    drawPixelRect(
      ctx,
      playerMapX + playerIconSize, // X: Start after the base square
      playerMapY + playerIconSize / 3, // Y: Vertically align with the middle third of the base
      playerIconSize / 3, // Width of the arrow point
      playerIconSize / 3, // Height of the arrow point
      Palettes.ui.MINIMAP_PLAYER
    );

    // Stop Icons
    // mapRangeWorldUnits defines how much world distance is shown "ahead" (now to the right)
    const mapRangeWorldUnits = StopsManager.zoneEntryLeadDistance * 2.5;
    // The portion of the map's width used to display this range (e.g., 70% of map width)
    const mapDisplayRangePixels = mapWidth * 0.7;

    StopsManager.stops.forEach((stop, stopIndex) => {
      const distanceToPlayer = stop.worldPositionX - this.game.world.worldX;
      // Normalize distance: 0 at player, 1 at mapRangeWorldUnits ahead
      const normalizedDist = distanceToPlayer / mapRangeWorldUnits;

      // Only draw if within map's conceptual range (slightly behind to full range ahead)
      if (normalizedDist < 1 && normalizedDist > -0.2) {
        const stopDotSize = 2 * this.fontSettings.scale;

        // X position based on normalized distance, relative to player's X position on map
        // Extends to the right for positive distances
        const stopDotX = playerMapX + normalizedDist * mapDisplayRangePixels;

        // Y position spread vertically, centered around map's horizontal midline
        // Calculate offset for centering the spread of stops
        const yOffset =
          (stopIndex - (StopsManager.stops.length - 1) / 2) *
          (stopDotSize * 2.5); // Spacing factor 2.5
        const stopDotY = mapY + mapHeight / 2 - stopDotSize / 2 + yOffset;

        // Cull to map bounds (both X and Y)
        if (
          stopDotX >= mapX &&
          stopDotX < mapX + mapWidth - stopDotSize &&
          stopDotY >= mapY &&
          stopDotY < mapY + mapHeight - stopDotSize
        ) {
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
            const pulse = (Math.sin(this.game.gameTime * 8) + 1) / 2; // 0 to 1
            const pulseSizeIncrease = Math.floor(
              pulse * 2 * this.fontSettings.scale
            ); // Scale pulse effect
            const s = stopDotSize + pulseSizeIncrease;
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

    // Zone Boundaries (Simplified: show next zone boundary as a vertical line)
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

      // Only draw if boundary is within the forward viewable range on map
      if (normalizedBoundaryDist < 1 && normalizedBoundaryDist >= 0) {
        // >=0 to include boundary at player pos
        const boundaryLineX =
          playerMapX + normalizedBoundaryDist * mapDisplayRangePixels;
        const boundaryLineWidth = 1 * this.fontSettings.scale;

        // Cull to map's X bounds (line is vertical)
        if (
          boundaryLineX >= mapX &&
          boundaryLineX < mapX + mapWidth - boundaryLineWidth
        ) {
          ctx.globalAlpha = 0.3;
          drawPixelRect(
            ctx,
            Math.floor(boundaryLineX), // Ensure integer coord for crisp line
            mapY, // Start at top of map
            boundaryLineWidth, // Width of the vertical line
            mapHeight, // Full height of map
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

// Assume lightenDarkenColor, drawPixelRect, Config, Palettes, PixelFontData, StopsManager are defined elsewhere
// For example:
// function lightenDarkenColor(col, amt) { ... }
// function drawPixelRect(ctx, x, y, w, h, color) { ... }
// const Config = { CANVAS_WIDTH: 800, CANVAS_HEIGHT: 600, UI_TYPEWRITER_SPEED: 2, UI_PANEL_INTRO_SPEED: 5, STOP_LINKS: {}, DEBUG_MODE: false };
// const Palettes = { ui: { FRAME_DARK: '#101010', FRAME_LIGHT: '#404040', FRAME_HIGHLIGHT: '#606060', BUTTON_F_KEY_BG: '#303030', BUTTON_F_KEY_FG: '#FFFFFF', MINIMAP_TEXTURE: '#203020', MINIMAP_PLAYER: '#00FF00', MINIMAP_STOP_DEFAULT: '#FF0000', MINIMAP_STOP_GAMING: '#FF00FF', MINIMAP_STOP_FUTURISTIC: '#00FFFF', MINIMAP_STOP_INDUSTRIAL: '#FFA500' } };
// const PixelFontData = { charHeight: 5, charSpacing: 1, lineHeight: 7, DEFAULT_CHAR_WIDTH: 3, 'F': [[1,1,1],[1,0,0],[1,1,0],[1,0,0],[1,0,0]], '?': [[1,1,0],[0,1,0],[0,1,0],[0,0,0],[0,1,0]] };
// const StopsManager = { getCurrentZone: () => null, activeStop: null, stops: [], zoneEntryLeadDistance: 1000 };
