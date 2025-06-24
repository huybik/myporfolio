// src/effects/particle.ts
import { drawPixelRect } from "../utils";

export type ParticleLayer =
  | "behind_player"
  | "foreground"
  | "weather_background"
  | "weather_foreground";
export type ParticleType =
  | "generic"
  | "dust"
  | "exhaust"
  | "speedline"
  | "weather";

export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  lifespan: number; // in seconds
  initialLifespan: number;
  size: number;
  color: string;
  alpha: number;
  initialAlpha: number;
  type: ParticleType;
  layer: ParticleLayer;
  gravity: number;
  drag: number;

  constructor(
    x: number,
    y: number,
    vx: number,
    vy: number,
    lifespan: number,
    size: number,
    color: string,
    alpha = 1.0,
    type: ParticleType = "generic",
    layer: ParticleLayer = "foreground"
  ) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.lifespan = lifespan;
    this.initialLifespan = lifespan;
    this.size = size;
    this.color = color;
    this.alpha = alpha;
    this.initialAlpha = alpha;
    this.type = type;
    this.layer = layer;
    this.gravity = 0;
    this.drag = 1.0;
  }

  update(deltaTime: number) {
    this.vy += this.gravity * deltaTime;
    this.vx *= this.drag;
    this.vy *= this.drag;

    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.lifespan -= deltaTime;

    if (this.initialLifespan > 0) {
      this.alpha = this.initialAlpha * (this.lifespan / this.initialLifespan);
    }
    this.alpha = Math.max(0, this.alpha);
  }

  render(ctx: CanvasRenderingContext2D) {
    if (this.lifespan <= 0 || this.alpha <= 0) return;

    ctx.globalAlpha = this.alpha;
    if (this.type === "speedline") {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.size;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.vx * 0.1, this.y - this.vy * 0.1);
      ctx.stroke();
    } else {
      drawPixelRect(
        ctx,
        this.x - this.size / 2,
        this.y - this.size / 2,
        this.size,
        this.size,
        this.color
      );
    }
    ctx.globalAlpha = 1.0;
  }
}
