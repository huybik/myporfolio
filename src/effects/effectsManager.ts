// src/effects/effectsManager.ts
import { Particle, ParticleLayer } from "./particle";
import { Config } from "../config";
import { World } from "../world/world";

export const EffectsManager = {
  particles: [] as Particle[],

  addParticle(particle: Particle) {
    this.particles.push(particle);
  },

  update(deltaTime: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update(deltaTime);
      if (this.particles[i].lifespan <= 0 || this.particles[i].alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  },

  renderLayer(ctx: CanvasRenderingContext2D, layer: ParticleLayer) {
    this.particles.forEach((particle) => {
      if (particle.layer === layer) {
        particle.render(ctx);
      }
    });
  },

  drawVignette(ctx: CanvasRenderingContext2D) {
    const midX = Config.CANVAS_WIDTH / 2;
    const midY = Config.CANVAS_HEIGHT / 2;
    const outerRadius = Config.CANVAS_WIDTH * 0.7;
    const innerRadius = Config.CANVAS_WIDTH * 0.35;

    const vignetteGradient = ctx.createRadialGradient(
      midX,
      midY,
      innerRadius,
      midX,
      midY,
      outerRadius
    );
    vignetteGradient.addColorStop(0, "rgba(0,0,0,0)");
    vignetteGradient.addColorStop(1, "rgba(0,0,0,0.3)");
    ctx.fillStyle = vignetteGradient;
    ctx.fillRect(0, 0, Config.CANVAS_WIDTH, Config.CANVAS_HEIGHT);
  },

  drawScanlines(ctx: CanvasRenderingContext2D, world: World) {
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
