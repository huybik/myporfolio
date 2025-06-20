// js/effects/effects.manager.js

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

  renderLayer(ctx, layer) {
    this.particles.forEach((particle) => {
      if (particle.layer === layer) {
        // For weather particles that are in world-space, we need to translate the context
        const isWorldSpace =
          layer === "weather_background" || layer === "weather_foreground";
        if (isWorldSpace) {
          ctx.save();
          // This assumes `game.world.worldX` is accessible. A better approach would be passing worldX.
          // For now, we rely on the Game loop to handle this translation before calling.
          // Let's assume the context is already translated for world-space particles.
        }

        particle.render(ctx);

        if (isWorldSpace) {
          ctx.restore();
        }
      }
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
