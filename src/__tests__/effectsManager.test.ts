import { describe, it, expect, beforeEach, vi } from "vitest";
import { EffectsManager } from "../effects/effectsManager";

describe("EffectsManager", () => {
  beforeEach(() => {
    EffectsManager.particles = [];
  });

  it("addParticle adds a particle", () => {
    const particle = { update: () => {}, lifespan: 1, alpha: 1 } as any;
    EffectsManager.addParticle(particle);
    expect(EffectsManager.particles.length).toBe(1);
  });

  it("update removes dead particles", () => {
    const alive = { update: () => {}, lifespan: 1, alpha: 1 } as any;
    const dead = { update: () => {}, lifespan: 0, alpha: 1 } as any;
    EffectsManager.particles.push(alive, dead);
    EffectsManager.update(0.016);
    expect(EffectsManager.particles.length).toBe(1);
    expect(EffectsManager.particles[0]).toBe(alive);
  });

  it("renderLayer only renders particles in the given layer", () => {
    const ctx = {
      fillStyle: "",
      fillRect: () => {},
      createRadialGradient: () => ({ addColorStop: () => {} }),
    } as any;
    const p1 = { layer: "foreground", render: vi.fn() } as any;
    const p2 = { layer: "behind_player", render: vi.fn() } as any;
    EffectsManager.particles.push(p1, p2);
    EffectsManager.renderLayer(ctx, "foreground");
    expect(p1.render).toHaveBeenCalled();
    expect(p2.render).not.toHaveBeenCalled();
  });
});
