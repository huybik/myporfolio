// js/effects/particle.js

class Particle {
  constructor(
    x,
    y,
    vx,
    vy,
    lifespan,
    size,
    color,
    alpha = 1.0,
    type = "generic",
    layer = "foreground" // e.g., 'behind_player', 'foreground', 'weather_background'
  ) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.lifespan = lifespan; // in seconds
    this.initialLifespan = lifespan;
    this.size = size;
    this.color = color;
    this.alpha = alpha;
    this.initialAlpha = alpha;
    this.type = type; // e.g., "dust", "exhaust", "speedline", "weather"
    this.layer = layer;
    this.gravity = 0; // Specific to particle type
    this.drag = 1.0; // Multiplicative drag
  }

  update(deltaTime) {
    this.vy += this.gravity * deltaTime;
    this.vx *= this.drag;
    this.vy *= this.drag; // Apply drag to vy as well if needed

    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.lifespan -= deltaTime;

    // Fade out based on lifespan
    if (this.initialLifespan > 0) {
      this.alpha = this.initialAlpha * (this.lifespan / this.initialLifespan);
    }
    this.alpha = Math.max(0, this.alpha);
  }

  render(ctx) {
    if (this.lifespan <= 0 || this.alpha <= 0) return;

    ctx.globalAlpha = this.alpha;
    if (this.type === "speedline") {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.size;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.vx * 0.1, this.y - this.vy * 0.1); // Length based on velocity
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
