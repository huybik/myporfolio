// js/ui/ui.js
class UI {
  constructor(game) {
    this.game = game;
    this.height = 60;
    this.yPosition = Config.CANVAS_HEIGHT - this.height;
    this.backgroundColor = "rgba(10, 20, 10, 0.85)";
    this.borderColor = Palettes.ui.FRAME_DARK;
    this.textColor = "#B0E0B0";

    this.fontSettings = {
      ...PixelFontData.fontSettings,
      scale: 2,
    };

    this.infoScreenWidth = 350;
    this.infoScreenHeight = 28;
    this.infoScreenX = (Config.CANVAS_WIDTH - this.infoScreenWidth) / 2;
    this.infoScreenY =
      this.yPosition + (this.height - this.infoScreenHeight) / 2 - 5;
    this.infoScreenColor = "rgba(20, 40, 20, 0.9)";
    this.infoScreenBorderColor = Palettes.ui.FRAME_LIGHT;

    this.displayedText = "";
    this.targetText = "";
    this.typewriterIndex = 0;
    this.typewriterFrameCounter = 0;

    this.panelYOffset = this.height;
    this.panelIntroSpeed = Config.UI_PANEL_INTRO_SPEED;

    this.fKeyIcon = UIRenderer.createFKeyIcon(this.fontSettings);

    this.showDriveInstruction = true; // To control visibility of the initial instruction

    if (Config.DEBUG_MODE) console.log("UI initialized.");
  }

  update(deltaTime) {
    // Hide the initial drive instruction once the player moves right
    if (this.showDriveInstruction && Input.isMoveRightPressed()) {
      this.showDriveInstruction = false;
    }

    if (this.panelYOffset > 0) {
      this.panelYOffset -= this.panelIntroSpeed * (60 * deltaTime);
      if (this.panelYOffset < 0) this.panelYOffset = 0;
    }

    const currentZone = StopsManager.getCurrentZone(this.game.world.worldX);
    let newTargetText = "Portfolio Drive";
    if (currentZone) {
      if (
        StopsManager.activeStop &&
        Config.STOP_LINKS[StopsManager.activeStop.id]
      ) {
        newTargetText = `${StopsManager.activeStop.promptText}`;
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
        this.typewriterFrameCounter %= Config.UI_TYPEWRITER_SPEED;
        this.displayedText = this.targetText.substring(0, this.typewriterIndex);
      }
    } else {
      this.displayedText = this.targetText;
    }
  }

  renderDriveInstruction(ctx) {
    const animOffset = ((Math.sin(this.game.gameTime * 6) + 1) / 2) * 8;
    const alpha = 0.75 + ((Math.sin(this.game.gameTime * 6) + 1) / 2) * 0.25;
    ctx.globalAlpha = alpha;

    const text = "USE RIGHT ARROW TO DRIVE";
    const textScale = 3;

    // Accurate text width calculation
    let textWidth = 0;
    for (let char of text.toUpperCase()) {
      const charData = PixelFontData[char] || PixelFontData["?"];
      textWidth +=
        (charData[0] ? charData[0].length : PixelFontData.DEFAULT_CHAR_WIDTH) *
        textScale;
      textWidth += PixelFontData.fontSettings.charSpacing * textScale;
    }
    textWidth -= PixelFontData.fontSettings.charSpacing * textScale;

    const arrowSize = 30;
    const padding = 20;

    const totalWidth = textWidth + padding + arrowSize;
    const startX = Config.CANVAS_WIDTH - totalWidth - 60;
    const startY = Config.CANVAS_HEIGHT / 2 - 50;

    const textY =
      startY +
      (arrowSize - PixelFontData.fontSettings.charHeight * textScale) / 2;
    drawPixelText(ctx, text, startX, textY, "#FFFFFF", textScale);

    const arrowX = startX + textWidth + padding + animOffset;
    const arrowY = startY + arrowSize / 2;
    UIRenderer.drawRightArrow(ctx, arrowX, arrowY, arrowSize, "#FFFFFF");

    ctx.globalAlpha = 1.0;
  }

  render(ctx) {
    const actualYPosition = this.yPosition + this.panelYOffset;

    drawPixelRect(
      ctx,
      0,
      actualYPosition,
      Config.CANVAS_WIDTH,
      this.height,
      this.backgroundColor
    );
    UIRenderer.drawPixelArtFrame(
      ctx,
      0,
      actualYPosition,
      Config.CANVAS_WIDTH,
      this.height
    );

    UIRenderer.drawPixelArtFrame(
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

    const textY =
      actualYPosition +
      (this.height - this.infoScreenHeight) / 2 -
      5 +
      this.infoScreenHeight / 2 -
      (this.fontSettings.charHeight * this.fontSettings.scale) / 2;

    let textToRender = this.displayedText;
    let textWidth = 0;
    for (let char of textToRender.toUpperCase()) {
      const charData = PixelFontData[char] || PixelFontData["?"];
      textWidth +=
        (charData[0] ? charData[0].length : PixelFontData.DEFAULT_CHAR_WIDTH) *
        this.fontSettings.scale;
      textWidth += this.fontSettings.charSpacing * this.fontSettings.scale;
    }
    textWidth -= this.fontSettings.charSpacing * this.fontSettings.scale;

    const textStartX =
      this.infoScreenX + (this.infoScreenWidth - textWidth) / 2;

    let hasInteractivePromptThisFrame =
      StopsManager.activeStop &&
      Config.STOP_LINKS[StopsManager.activeStop.id] &&
      textToRender.includes("[F]");

    if (hasInteractivePromptThisFrame) {
      const fKeyIndex = textToRender.indexOf("[F]");
      const preText = textToRender.substring(0, fKeyIndex);
      const postText = textToRender.substring(fKeyIndex + 3);

      let currentX = drawPixelText(
        ctx,
        preText,
        textStartX,
        textY,
        this.textColor,
        this.fontSettings.scale,
        this.fontSettings
      );

      const iconY =
        textY -
        (this.fKeyIcon.height -
          this.fontSettings.charHeight * this.fontSettings.scale) /
          2;
      ctx.drawImage(this.fKeyIcon, currentX, iconY);
      currentX +=
        this.fKeyIcon.width +
        this.fontSettings.charSpacing * this.fontSettings.scale;

      drawPixelText(
        ctx,
        postText,
        currentX,
        textY,
        this.textColor,
        this.fontSettings.scale,
        this.fontSettings
      );
    } else {
      drawPixelText(
        ctx,
        textToRender,
        textStartX,
        textY,
        this.textColor,
        this.fontSettings.scale,
        this.fontSettings
      );
    }

    ctx.strokeStyle = "rgba(50, 100, 50, 0.1)";
    ctx.lineWidth = 1;
    const infoScreenActualY =
      actualYPosition + (this.height - this.infoScreenHeight) / 2 - 5;
    for (
      let i = 0;
      i < this.infoScreenHeight;
      i += 2 * this.fontSettings.scale
    ) {
      ctx.beginPath();
      ctx.moveTo(this.infoScreenX, infoScreenActualY + i + 0.5);
      ctx.lineTo(
        this.infoScreenX + this.infoScreenWidth,
        infoScreenActualY + i + 0.5
      );
      ctx.stroke();
    }

    UIRenderer.drawStatusLights(ctx, this, actualYPosition);
    UIRenderer.drawMiniMap(ctx, this, actualYPosition);

    // Render drive instruction if needed
    if (this.showDriveInstruction) {
      this.renderDriveInstruction(ctx);
    }
  }
}
