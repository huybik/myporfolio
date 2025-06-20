// js/effects.js

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
    type = "generic"
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

const EffectsManager = {
  particles: [],

  addParticle(particle) {
    this.particles.push(particle);
  },

  update(deltaTime) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update(deltaTime);
      if (this.particles[i].lifespan <= 0 || this.particles[i].alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  },

  render(ctx, layer = "behind_player") {
    // layer can be "behind_player", "overlay"
    // This simple manager renders all particles. More complex layering might be needed.
    // For now, assume particles are rendered at appropriate times by their emitters or a global call.
    // This render function could be used for global effects like weather.
    this.particles.forEach((particle) => {
      // Potentially filter by particle.renderLayer or type if needed
      particle.render(ctx);
    });
  },

  // --- Screen Effects ---
  drawVignette(ctx) {
    const midX = Config.CANVAS_WIDTH / 2;
    const midY = Config.CANVAS_HEIGHT / 2;
    const outerRadius = Config.CANVAS_WIDTH * 0.7;
    const innerRadius = Config.CANVAS_WIDTH * 0.35; // Adjusted for a more noticeable effect

    const vignetteGradient = ctx.createRadialGradient(
      midX,
      midY,
      innerRadius,
      midX,
      midY,
      outerRadius
    );
    vignetteGradient.addColorStop(0, "rgba(0,0,0,0)");
    vignetteGradient.addColorStop(1, "rgba(0,0,0,0.3)"); // Slightly darker
    ctx.fillStyle = vignetteGradient;
    ctx.fillRect(0, 0, Config.CANVAS_WIDTH, Config.CANVAS_HEIGHT);
  },

  drawScanlines(ctx, world) {
    // Example: only for gaming or futuristic themes
    if (
      world &&
      (world.currentTheme === "gaming" ||
        world.currentTheme === "futuristic" ||
        (world.isTransitioning &&
          (world.transitionTargetTheme === "gaming" ||
            world.transitionTargetTheme === "futuristic")))
    ) {
      ctx.fillStyle = "rgba(0,0,0,0.12)";
      for (let y = 0; y < Config.CANVAS_HEIGHT; y += 3) {
        ctx.fillRect(0, y, Config.CANVAS_WIDTH, 1);
      }
    }
  },
};
