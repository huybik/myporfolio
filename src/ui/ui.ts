// src/ui/ui.ts
import { Config } from "../config";
import { Input } from "../input";
import { StopsManager } from "../stops/stops.manager";
import { UIRenderer } from "./ui.renderer";
import { drawPixelText, PixelFontData } from "../font";
import { drawPixelRect } from "../utils";
import { IGame } from "../types";

export class UI {
  game: IGame;
  height: number;
  yPosition: number;
  backgroundColor: string;
  textColor: string;
  fontSettings: {
    scale: number;
    charHeight: number;
    charSpacing: number;
    lineHeight: number;
  };
  infoScreenWidth: number;
  infoScreenHeight: number;
  infoScreenX: number;
  infoScreenY: number;
  infoScreenColor: string;
  displayedText: string;
  targetText: string;
  typewriterIndex: number;
  typewriterFrameCounter: number;
  panelYOffset: number;
  fKeyIcon: HTMLCanvasElement;
  showDriveInstruction: boolean;
  adjacentZones: { previous: any; next: any };
  currentZoneName: string;
  zoneTitleAlpha: number;
  zoneTitleDisplayTime: number;
  ZONE_TITLE_FADE_IN_TIME: number;
  ZONE_TITLE_STAY_TIME: number;
  ZONE_TITLE_FADE_OUT_TIME: number;

  constructor(game: IGame) {
    this.game = game;
    this.height = 60;
    this.yPosition = Config.CANVAS_HEIGHT - this.height;
    this.backgroundColor = "rgba(10, 20, 10, 0.85)";
    this.textColor = "#B0E0B0";
    this.fontSettings = { ...PixelFontData.fontSettings, scale: 2 };
    this.infoScreenWidth = 374;
    this.infoScreenHeight = 28;
    this.infoScreenX = (Config.CANVAS_WIDTH - this.infoScreenWidth) / 2;
    this.infoScreenY =
      this.yPosition + (this.height - this.infoScreenHeight) / 2 - 5;
    this.infoScreenColor = "rgba(20, 40, 20, 0.9)";
    this.displayedText = "";
    this.targetText = "";
    this.typewriterIndex = 0;
    this.typewriterFrameCounter = 0;
    this.panelYOffset = this.height;
    this.fKeyIcon = UIRenderer.createFKeyIcon(this.fontSettings);
    this.showDriveInstruction = true;
    this.adjacentZones = { previous: null, next: null };
    this.currentZoneName = "";
    this.zoneTitleAlpha = 0;
    this.zoneTitleDisplayTime = 0;
    this.ZONE_TITLE_FADE_IN_TIME = 0.5;
    this.ZONE_TITLE_STAY_TIME = 2.0;
    this.ZONE_TITLE_FADE_OUT_TIME = 1.0;

    if (Config.DEBUG_MODE) console.log("UI initialized.");
  }

  update(deltaTime: number) {
    if (this.showDriveInstruction && Input.isMoveRightPressed()) {
      this.showDriveInstruction = false;
    }
    if (this.panelYOffset > 0) {
      this.panelYOffset -= Config.UI_PANEL_INTRO_SPEED * (60 * deltaTime);
      if (this.panelYOffset < 0) this.panelYOffset = 0;
    }

    this.adjacentZones = StopsManager.getAdjacentZones(this.game.world.worldX);
    const currentZone = StopsManager.getCurrentZone(this.game.world.worldX);

    if (currentZone && this.currentZoneName !== currentZone.name) {
      this.currentZoneName = currentZone.name;
      this.zoneTitleDisplayTime =
        this.ZONE_TITLE_FADE_IN_TIME +
        this.ZONE_TITLE_STAY_TIME +
        this.ZONE_TITLE_FADE_OUT_TIME;
    }

    if (this.zoneTitleDisplayTime > 0) {
      this.zoneTitleDisplayTime -= deltaTime;
      const totalDuration =
        this.ZONE_TITLE_FADE_IN_TIME +
        this.ZONE_TITLE_STAY_TIME +
        this.ZONE_TITLE_FADE_OUT_TIME;
      const timeSinceStart = totalDuration - this.zoneTitleDisplayTime;

      if (timeSinceStart < this.ZONE_TITLE_FADE_IN_TIME) {
        this.zoneTitleAlpha = timeSinceStart / this.ZONE_TITLE_FADE_IN_TIME;
      } else if (
        timeSinceStart <
        this.ZONE_TITLE_FADE_IN_TIME + this.ZONE_TITLE_STAY_TIME
      ) {
        this.zoneTitleAlpha = 1.0;
      } else {
        const fadeOutProgress =
          (timeSinceStart -
            (this.ZONE_TITLE_FADE_IN_TIME + this.ZONE_TITLE_STAY_TIME)) /
          this.ZONE_TITLE_FADE_OUT_TIME;
        this.zoneTitleAlpha = 1.0 - fadeOutProgress;
      }
      this.zoneTitleAlpha = Math.max(0, Math.min(1, this.zoneTitleAlpha));
    } else {
      this.zoneTitleAlpha = 0;
    }

    let newTargetText = "Portfolio Drive";
    if (currentZone) {
      if (
        StopsManager.activeStop &&
        Config.STOP_LINKS[
          StopsManager.activeStop.id as keyof typeof Config.STOP_LINKS
        ]
      ) {
        newTargetText = `${StopsManager.activeStop.promptText}`;
      } else if (currentZone.promptText) {
        newTargetText = currentZone.promptText;
      }
    }

    if (this.targetText !== newTargetText) {
      this.targetText = newTargetText;
      this.typewriterIndex = 0;
      this.typewriterFrameCounter = 0;
      this.displayedText = "";
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

  renderDriveInstruction(ctx: CanvasRenderingContext2D) {
    const animOffset = ((Math.sin(this.game.gameTime * 6) + 1) / 2) * 8;
    const alpha = 0.75 + ((Math.sin(this.game.gameTime * 6) + 1) / 2) * 0.25;
    ctx.globalAlpha = alpha;

    const text = "USE RIGHT ARROW TO DRIVE";
    const textScale = 3;

    let textWidth = 0;
    for (let char of text.toUpperCase()) {
      const charData = (PixelFontData as any)[char] || PixelFontData["?"];
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

  renderAdjacentZoneLabels(ctx: CanvasRenderingContext2D) {
    const textScale = 2.5;
    const yPos = Config.CANVAS_HEIGHT / 2 - 80;
    const animOffset = ((Math.sin(this.game.gameTime * 4) + 1) / 2) * 5;

    if (this.adjacentZones.next && this.adjacentZones.next.alpha > 0) {
      ctx.globalAlpha = this.adjacentZones.next.alpha * 0.8;
      const text = `${this.adjacentZones.next.name} -->`;
      let textWidth = 0;
      for (let char of text.toUpperCase()) {
        const charData = (PixelFontData as any)[char] || PixelFontData["?"];
        textWidth +=
          (charData[0]
            ? charData[0].length
            : PixelFontData.DEFAULT_CHAR_WIDTH) * textScale;
        textWidth += PixelFontData.fontSettings.charSpacing * textScale;
      }
      textWidth -= PixelFontData.fontSettings.charSpacing * textScale;
      const xPos = Config.CANVAS_WIDTH - textWidth - 30 + animOffset;
      drawPixelText(ctx, text, xPos, yPos, "#FFFFFF", textScale);
      ctx.globalAlpha = 1.0;
    }

    if (this.adjacentZones.previous && this.adjacentZones.previous.alpha > 0) {
      ctx.globalAlpha = this.adjacentZones.previous.alpha * 0.8;
      const text = `<-- ${this.adjacentZones.previous.name}`;
      const xPos = 30 - animOffset;
      drawPixelText(ctx, text, xPos, yPos, "#FFFFFF", textScale);
      ctx.globalAlpha = 1.0;
    }
  }

  renderZoneTitle(ctx: CanvasRenderingContext2D) {
    if (this.zoneTitleAlpha <= 0) return;
    ctx.globalAlpha = this.zoneTitleAlpha;
    const text = this.currentZoneName;
    const textScale = 5;
    const color = "#FFFFFF";
    const shadowColor = "rgba(0, 0, 0, 0.5)";
    let textWidth = 0;
    for (let char of text.toUpperCase()) {
      const charData = (PixelFontData as any)[char] || PixelFontData["?"];
      textWidth +=
        (charData[0] ? charData[0].length : PixelFontData.DEFAULT_CHAR_WIDTH) *
        textScale;
      textWidth += PixelFontData.fontSettings.charSpacing * textScale;
    }
    textWidth -= PixelFontData.fontSettings.charSpacing * textScale;
    const xPos = (Config.CANVAS_WIDTH - textWidth) / 2;
    const yPos = 40;
    const shadowOffset = 4;
    drawPixelText(
      ctx,
      text,
      xPos + shadowOffset,
      yPos + shadowOffset,
      shadowColor,
      textScale
    );
    drawPixelText(ctx, text, xPos, yPos, color, textScale);
    ctx.globalAlpha = 1.0;
  }

  render(ctx: CanvasRenderingContext2D) {
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
      const charData = (PixelFontData as any)[char] || PixelFontData["?"];
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
      Config.STOP_LINKS[
        StopsManager.activeStop.id as keyof typeof Config.STOP_LINKS
      ] &&
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
    this.renderAdjacentZoneLabels(ctx);
    this.renderZoneTitle(ctx);

    if (this.showDriveInstruction) {
      this.renderDriveInstruction(ctx);
    }
  }
}
