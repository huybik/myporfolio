// src/player/player.ts
import { Config } from "../config";
import { Input } from "../input";
import { PlayerRenderer } from "./playerRenderer";
import { EffectsManager } from "../effects/effectsManager";
import { Particle } from "../effects/particle";
import { Palettes } from "../palettes";
import { getRandomColor, getRandomFloat, getRandomInt } from "../utils";
import { IGame } from "../types";
import { StopsManager } from "../stops/stops.manager"; // Import StopsManager

export class Player {
  game: IGame;
  width: number;
  height: number;
  screenX: number;
  screenY: number;
  bobAngle: number;
  bobSpeed: number;
  bobAmplitude: number;
  wheelFrame: number;
  wheelAnimationSpeed: number;
  wheelRadius: number;
  currentSpeed: number;
  maxSpeed: number;
  acceleration: number;
  deceleration: number;
  brakingDeceleration: number;
  effectiveY: number;
  tiltAngle: number;
  maxTilt: number;
  tiltSpeed: number;
  headlightsOn: boolean;
  isBraking: boolean;

  constructor(game: IGame) {
    this.game = game;
    this.width = 72;
    this.height = 36;
    this.screenX = (Config.CANVAS_WIDTH - this.width) / 2;
    this.screenY = Config.CANVAS_HEIGHT - this.height - 70;

    this.bobAngle = 0;
    this.bobSpeed = 0.15;
    this.bobAmplitude = 1.5;

    this.wheelFrame = 0;
    this.wheelAnimationSpeed = 0.25;
    this.wheelRadius = 7;

    this.currentSpeed = 0;
    this.maxSpeed = 8;
    this.acceleration = 0.12;
    this.deceleration = 0.06;
    this.brakingDeceleration = 0.2;

    this.effectiveY = this.screenY;

    this.tiltAngle = 0;
    this.maxTilt = 0.05;
    this.tiltSpeed = 0.1;

    this.headlightsOn = false;
    this.isBraking = false;

    if (Config.DEBUG_MODE) console.log("Player initialized.");
  }

  update(deltaTime: number) {
    // --- START OF END STOP LOGIC ---
    const playerWorldX = this.game.world.worldX + this.screenX;
    const endStopBrakingFactor = (StopsManager as any).getEndStopBrakingFactor(
      playerWorldX
    );
    const atEndStop = (StopsManager as any).isPlayerAtEndStop(playerWorldX);
    // --- END OF END STOP LOGIC ---

    let movingIntent = 0;
    if (Input.isMoveRightPressed()) {
      movingIntent = 1;
    }
    if (Input.isMoveLeftPressed()) {
      movingIntent = -1;
    }

    this.isBraking = false;
    if (movingIntent !== 0) {
      this.currentSpeed += this.acceleration * movingIntent;
      this.currentSpeed = Math.max(
        -this.maxSpeed,
        Math.min(this.maxSpeed, this.currentSpeed)
      );
    } else {
      if (this.currentSpeed > 0) {
        if (Input.isMoveLeftPressed()) {
          this.currentSpeed -= this.brakingDeceleration;
          this.isBraking = true;
        } else {
          this.currentSpeed -= this.deceleration;
        }
        if (this.currentSpeed < 0) this.currentSpeed = 0;
      } else if (this.currentSpeed < 0) {
        if (Input.isMoveRightPressed()) {
          this.currentSpeed += this.brakingDeceleration;
          this.isBraking = true;
        } else {
          this.currentSpeed += this.deceleration;
        }
        if (this.currentSpeed > 0) this.currentSpeed = 0;
      }
    }

    // --- APPLY END STOP BRAKING ---
    if (endStopBrakingFactor > 0 && this.currentSpeed > 0) {
      // Apply a deceleration force that ramps up as the player gets closer.
      // This will counteract acceleration and natural deceleration.
      const endBrakingForce =
        endStopBrakingFactor * (this.brakingDeceleration + this.acceleration);
      this.currentSpeed -= endBrakingForce;
    }

    // --- APPLY HARD STOP ---
    if (atEndStop && this.currentSpeed > 0) {
      this.currentSpeed = 0;
    }

    // Final check to ensure speed doesn't become erroneously small
    if (Math.abs(this.currentSpeed) < 0.01) {
      this.currentSpeed = 0;
    }

    let targetTilt = 0;
    if (this.currentSpeed > 0.1 && movingIntent === 1)
      targetTilt = -this.maxTilt;
    else if (this.currentSpeed < -0.1 && movingIntent === -1)
      targetTilt = -this.maxTilt;
    else if (this.isBraking)
      targetTilt = this.maxTilt * Math.sign(this.currentSpeed) * 1.5;

    this.tiltAngle +=
      (targetTilt - this.tiltAngle) * this.tiltSpeed * (60 * deltaTime);

    this.bobAngle +=
      this.bobSpeed *
      (Math.abs(this.currentSpeed) / this.maxSpeed + 0.1) *
      (60 * deltaTime);
    const bobOffset =
      Math.sin(this.bobAngle) *
      this.bobAmplitude *
      (Math.abs(this.currentSpeed) > 0.1 ? 1 : 0.5);
    this.effectiveY = this.screenY + bobOffset;

    if (Math.abs(this.currentSpeed) > 0.1) {
      this.wheelFrame +=
        this.wheelAnimationSpeed *
        Math.sign(this.currentSpeed) *
        (60 * deltaTime);
      if (this.wheelFrame >= 8) this.wheelFrame = 0;
      if (this.wheelFrame < 0) this.wheelFrame = 7;
    }

    if (Input.isToggleHeadlightsJustPressed()) {
      this.headlightsOn = !this.headlightsOn;
    }

    this.emitDustParticles();
    this.emitExhaustParticles();
    this.emitSpeedLines();
  }

  emitDustParticles() {
    if (Math.abs(this.currentSpeed) > Config.PLAYER_DUST_EMIT_THRESHOLD) {
      const wheelY = this.screenY + this.height - this.wheelRadius / 2;
      let particlesToEmit = Math.floor(
        Math.abs(this.currentSpeed / this.maxSpeed) *
          Config.MAX_DUST_PARTICLES_PER_FRAME
      );

      for (let i = 0; i < particlesToEmit; i++) {
        const wheelX =
          this.currentSpeed > 0
            ? this.screenX + this.width * 0.15 + this.wheelRadius
            : this.screenX + this.width * 0.75 + this.wheelRadius;

        const particle = new Particle(
          wheelX + getRandomFloat(-this.wheelRadius, this.wheelRadius),
          wheelY + getRandomFloat(0, this.wheelRadius / 2),
          -this.currentSpeed * getRandomFloat(0.1, 0.3),
          getRandomFloat(-10, -30),
          getRandomFloat(0.5, 1.2),
          getRandomInt(1, 3),
          getRandomColor(Palettes.vehicle.DUST_COLOR),
          getRandomFloat(0.3, 0.6),
          "dust",
          "behind_player"
        );
        particle.gravity = 20;
        EffectsManager.addParticle(particle);
      }
    }
  }

  emitExhaustParticles() {
    const isAccelerating =
      Math.abs(this.currentSpeed) > Config.PLAYER_EXHAUST_EMIT_THRESHOLD &&
      ((this.currentSpeed > 0 && Input.isMoveRightPressed()) ||
        (this.currentSpeed < 0 && Input.isMoveLeftPressed()));

    if (isAccelerating) {
      let particlesToEmit = Config.MAX_EXHAUST_PARTICLES_PER_FRAME;
      for (let i = 0; i < particlesToEmit; i++) {
        const exhaustOffsetX =
          this.currentSpeed >= 0 ? this.width * 0.05 : this.width * 0.95;
        const particle = new Particle(
          this.screenX + exhaustOffsetX,
          this.effectiveY + this.height * 0.6,
          this.currentSpeed * 0.3 + getRandomFloat(-5, 5),
          getRandomFloat(-15, -5),
          getRandomFloat(0.3, 0.8),
          getRandomInt(1, 3),
          getRandomColor(Palettes.vehicle.EXHAUST_SMOKE),
          getRandomFloat(0.2, 0.5),
          "exhaust",
          "behind_player"
        );
        particle.gravity = -5;
        particle.drag = 0.98;
        EffectsManager.addParticle(particle);
      }
    }
  }

  emitSpeedLines() {
    if (Math.abs(this.currentSpeed) > Config.PLAYER_SPEED_LINE_THRESHOLD) {
      let linesToEmit = Math.floor(
        Math.abs(this.currentSpeed / this.maxSpeed) *
          Config.MAX_SPEED_LINES_PER_FRAME
      );
      for (let i = 0; i < linesToEmit; i++) {
        const side = Math.random() < 0.5 ? -1 : 1;
        const particle = new Particle(
          this.screenX +
            this.width / 2 +
            side * Config.CANVAS_WIDTH * getRandomFloat(0.3, 0.6),
          this.screenY +
            this.height / 2 +
            getRandomFloat(-this.height * 0.5, this.height * 0.5),
          -this.currentSpeed * getRandomFloat(1.5, 2.5),
          0,
          getRandomFloat(0.1, 0.3),
          getRandomInt(1, 2),
          `rgba(200,200,220,${getRandomFloat(0.3, 0.7)})`,
          1.0,
          "speedline",
          "behind_player"
        );
        EffectsManager.addParticle(particle);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    PlayerRenderer.render(ctx, this);
  }
}
