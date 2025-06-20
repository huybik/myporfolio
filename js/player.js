// js/player.js
class Player {
  constructor(game) {
    this.game = game;
    // I.1.A Player Vehicle Design (dimensions might change based on new sprite)
    this.width = 72; // Adjusted for a more detailed sprite
    this.height = 36; // Adjusted
    this.screenX = (Config.CANVAS_WIDTH - this.width) / 2;
    this.screenY = Config.CANVAS_HEIGHT - this.height - 70; // Adjusted for ground level

    this.bobAngle = 0;
    this.bobSpeed = 0.15; // Slightly faster bob
    this.bobAmplitude = 1.5; // Slightly smaller amplitude for more subtle suspension feel

    this.wheelFrame = 0;
    this.wheelAnimationSpeed = 0.25; // Slightly faster wheel animation
    this.wheelRadius = 7; // Adjusted wheel radius

    this.currentSpeed = 0;
    this.maxSpeed = 8;
    this.acceleration = 0.12;
    this.deceleration = 0.06; // Natural deceleration
    this.brakingDeceleration = 0.2; // Stronger deceleration when braking

    this.effectiveY = this.screenY;

    // I.1.B Particle System Basics
    this.dustParticles = [];
    this.exhaustParticles = [];
    this.speedLines = [];

    // I.1.C Suspension Bobbing
    // wheelBaseY will be calculated in render

    // I.1.C Slight Tilt
    this.tiltAngle = 0;
    this.maxTilt = 0.05; // Radians, small tilt
    this.tiltSpeed = 0.1;

    // I.1.D Headlights/Taillights
    this.headlightsOn = false;
    this.isBraking = false;

    if (Config.DEBUG_MODE) console.log("Player initialized.");
  }

  update(deltaTime) {
    let movingIntent = 0; // -1 for left, 1 for right, 0 for no input
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
      // Decelerate or brake
      if (this.currentSpeed > 0) {
        // Check if player is trying to move opposite to current direction (braking)
        if (Input.isMoveLeftPressed()) {
          // Braking while moving right
          this.currentSpeed -= this.brakingDeceleration;
          this.isBraking = true;
        } else {
          this.currentSpeed -= this.deceleration; // Natural deceleration
        }
        if (this.currentSpeed < 0) this.currentSpeed = 0;
      } else if (this.currentSpeed < 0) {
        if (Input.isMoveRightPressed()) {
          // Braking while moving left
          this.currentSpeed += this.brakingDeceleration;
          this.isBraking = true;
        } else {
          this.currentSpeed += this.deceleration; // Natural deceleration
        }
        if (this.currentSpeed > 0) this.currentSpeed = 0;
      }
    }

    // Tilt logic
    let targetTilt = 0;
    if (this.currentSpeed > 0.1 && movingIntent === 1)
      targetTilt = -this.maxTilt; // Accelerating forward
    else if (this.currentSpeed < -0.1 && movingIntent === -1)
      targetTilt = -this.maxTilt; // Accelerating backward (front up)
    else if (this.isBraking)
      targetTilt = this.maxTilt * Math.sign(this.currentSpeed) * 1.5; // Braking (front down)

    this.tiltAngle +=
      (targetTilt - this.tiltAngle) * this.tiltSpeed * (60 * deltaTime);

    // Bobbing
    this.bobAngle +=
      this.bobSpeed *
      (Math.abs(this.currentSpeed) / this.maxSpeed + 0.1) *
      (60 * deltaTime);
    const bobOffset =
      Math.sin(this.bobAngle) *
      this.bobAmplitude *
      (Math.abs(this.currentSpeed) > 0.1 ? 1 : 0.5);
    this.effectiveY = this.screenY + bobOffset;

    // Wheel animation
    if (Math.abs(this.currentSpeed) > 0.1) {
      this.wheelFrame +=
        this.wheelAnimationSpeed *
        Math.sign(this.currentSpeed) *
        (60 * deltaTime);
      if (this.wheelFrame >= 8) this.wheelFrame = 0; // Assuming 8 frames for new wheel
      if (this.wheelFrame < 0) this.wheelFrame = 7;
    }

    // Headlight toggle
    if (Input.isToggleHeadlightsJustPressed()) {
      this.headlightsOn = !this.headlightsOn;
    }

    // Particle Emission
    this.emitDustParticles(deltaTime);
    this.emitExhaustParticles(deltaTime);
    this.emitSpeedLines(deltaTime);

    // Update Particles
    this.updateParticles(this.dustParticles, deltaTime);
    this.updateParticles(this.exhaustParticles, deltaTime);
    this.updateParticles(this.speedLines, deltaTime);
  }

  updateParticles(particleArray, deltaTime) {
    for (let i = particleArray.length - 1; i >= 0; i--) {
      particleArray[i].update(deltaTime);
      if (particleArray[i].lifespan <= 0 || particleArray[i].alpha <= 0) {
        particleArray.splice(i, 1);
      }
    }
  }

  emitDustParticles(deltaTime) {
    if (
      Math.abs(this.currentSpeed) > Config.PLAYER_DUST_EMIT_THRESHOLD &&
      this.dustParticles.length < 50
    ) {
      const wheelY = this.screenY + this.height - this.wheelRadius / 2; // Slightly above ground contact

      let particlesToEmit = Math.floor(
        Math.abs(this.currentSpeed / this.maxSpeed) *
          Config.MAX_DUST_PARTICLES_PER_FRAME
      );

      for (let i = 0; i < particlesToEmit; i++) {
        const wheelX =
          this.currentSpeed > 0
            ? this.screenX + this.width * 0.15 + this.wheelRadius // Rear wheel when moving forward
            : this.screenX + this.width * 0.75 + this.wheelRadius; // Front wheel when moving backward

        const particle = new Particle(
          wheelX + getRandomFloat(-this.wheelRadius, this.wheelRadius),
          wheelY + getRandomFloat(0, this.wheelRadius / 2),
          -this.currentSpeed * getRandomFloat(0.1, 0.3), // Opposite to car, but slower
          getRandomFloat(-10, -30), // Upwards initially
          getRandomFloat(0.5, 1.2),
          getRandomInt(1, 3),
          getRandomColor(Palettes.vehicle.DUST_COLOR),
          getRandomFloat(0.3, 0.6),
          "dust"
        );
        particle.gravity = 20; // Dust settles
        this.dustParticles.push(particle);
      }
    }
  }

  emitExhaustParticles(deltaTime) {
    const isAccelerating =
      Math.abs(this.currentSpeed) > Config.PLAYER_EXHAUST_EMIT_THRESHOLD &&
      ((this.currentSpeed > 0 && Input.isMoveRightPressed()) ||
        (this.currentSpeed < 0 && Input.isMoveLeftPressed()));

    if (isAccelerating && this.exhaustParticles.length < 30) {
      let particlesToEmit = Config.MAX_EXHAUST_PARTICLES_PER_FRAME;
      for (let i = 0; i < particlesToEmit; i++) {
        const exhaustOffsetX =
          this.currentSpeed >= 0 ? this.width * 0.05 : this.width * 0.95; // Rear or front based on direction
        const particle = new Particle(
          this.screenX + exhaustOffsetX,
          this.effectiveY + this.height * 0.6, // Exhaust pipe position
          this.currentSpeed * 0.3 + getRandomFloat(-5, 5), // Moves with car slightly
          getRandomFloat(-15, -5), // Upwards and slightly back
          getRandomFloat(0.3, 0.8),
          getRandomInt(1, 3),
          getRandomColor(Palettes.vehicle.EXHAUST_SMOKE),
          getRandomFloat(0.2, 0.5),
          "exhaust"
        );
        particle.gravity = -5; // Smoke rises slowly
        particle.drag = 0.98;
        this.exhaustParticles.push(particle);
      }
    }
  }

  emitSpeedLines(deltaTime) {
    if (
      Math.abs(this.currentSpeed) > Config.PLAYER_SPEED_LINE_THRESHOLD &&
      this.speedLines.length < 20
    ) {
      let linesToEmit = Math.floor(
        Math.abs(this.currentSpeed / this.maxSpeed) *
          Config.MAX_SPEED_LINES_PER_FRAME
      );
      for (let i = 0; i < linesToEmit; i++) {
        const side = Math.random() < 0.5 ? -1 : 1; // -1 for left, 1 for right
        const particle = new Particle(
          this.screenX +
            this.width / 2 +
            side * Config.CANVAS_WIDTH * getRandomFloat(0.3, 0.6),
          this.screenY +
            this.height / 2 +
            getRandomFloat(-this.height * 0.5, this.height * 0.5),
          -this.currentSpeed * getRandomFloat(1.5, 2.5), // Faster than car, opposite direction
          0, // Horizontal lines
          getRandomFloat(0.1, 0.3),
          getRandomInt(1, 2), // Thickness
          `rgba(200,200,220,${getRandomFloat(0.3, 0.7)})`,
          1.0, // Alpha handled by particle itself
          "speedline"
        );
        this.speedLines.push(particle);
      }
    }
  }

  // I.1.A Player Vehicle: Refined Pixel Art Assets
  // I.1.C Wheel Rotation (More Frames)
  drawWheel(ctx, x, y, radius, frame) {
    const wheelColors = Palettes.vehicle;
    // Simplified 8-frame rotation (4 unique designs, mirrored or slightly shifted for 8)
    const currentFrame = Math.floor(frame) % 8;

    // Tire
    drawPixelRect(
      ctx,
      x - radius,
      y - radius,
      radius * 2,
      radius * 2,
      wheelColors.CAR_TIRE_DARK
    );
    drawPixelRect(
      ctx,
      x - radius + 1,
      y - radius + 1,
      radius * 2 - 2,
      radius * 2 - 2,
      wheelColors.CAR_TIRE_LIGHT
    );

    // Hubcap
    const hubRadius = radius * 0.6;
    drawPixelRect(
      ctx,
      x - hubRadius,
      y - hubRadius,
      hubRadius * 2,
      hubRadius * 2,
      wheelColors.CAR_BODY_ACCENT
    );
    drawPixelRect(
      ctx,
      x - hubRadius + 1,
      y - hubRadius + 1,
      hubRadius * 2 - 2,
      hubRadius * 2 - 2,
      lightenDarkenColor(wheelColors.CAR_BODY_ACCENT, 20)
    );

    // Spokes (example for 8 frames)
    ctx.strokeStyle = wheelColors.CAR_TIRE_DARK;
    ctx.lineWidth = Math.max(1, Math.floor(radius / 4));

    const angleOffset = (Math.PI / 4) * currentFrame; // For 8 spokes/positions
    for (let i = 0; i < 2; i++) {
      // Two main spokes, 90 deg apart
      const angle = angleOffset + (i * Math.PI) / 2;
      const startX = x + Math.cos(angle) * hubRadius * 0.5;
      const startY = y + Math.sin(angle) * hubRadius * 0.5;
      const endX = x + Math.cos(angle) * radius * 0.9;
      const endY = y + Math.sin(angle) * radius * 0.9;
      ctx.beginPath();
      ctx.moveTo(Math.floor(startX), Math.floor(startY));
      ctx.lineTo(Math.floor(endX), Math.floor(endY));
      ctx.stroke();
    }
  }

  render(ctx) {
    // Render particles behind player
    this.dustParticles.forEach((p) => p.render(ctx));
    this.exhaustParticles.forEach((p) => p.render(ctx));
    // Speed lines are often better rendered over some background layers but behind player.
    // For simplicity, rendering them here. Could be moved to world rendering.
    this.speedLines.forEach((p) => p.render(ctx));

    const carX = this.screenX;
    // I.1.C Suspension Bobbing: Body uses effectiveY, wheels use a non-bobbing Y.
    const bodyY = this.effectiveY;
    const wheelBaseY = this.screenY + this.height - this.wheelRadius; // Non-bobbing Y for wheels

    const carColors = Palettes.vehicle;

    // Apply tilt - this is a simplified approach.
    // For a real pixel art tilt, you'd likely have pre-drawn tilted sprites or more complex pixel shifting.
    // This example will shift parts of the car vertically.
    const frontTiltOffset = Math.sin(this.tiltAngle) * (this.width / 2);
    const rearTiltOffset = -Math.sin(this.tiltAngle) * (this.width / 2);

    // Player Shadow (I.2.B)
    drawPixelRect(
      ctx,
      carX + 5,
      wheelBaseY + this.wheelRadius - 3, // Positioned under the wheels
      this.width - 10,
      6, // Shadow height
      "rgba(0, 0, 0, 0.2)"
    );

    // Wheels (drawn first, at non-bobbing Y)
    const frontWheelX = carX + this.width * 0.2;
    const rearWheelX = carX + this.width * 0.8 - this.wheelRadius * 2; // Adjusted for new width

    this.drawWheel(
      ctx,
      frontWheelX + this.wheelRadius,
      wheelBaseY,
      this.wheelRadius,
      this.wheelFrame
    );
    this.drawWheel(
      ctx,
      rearWheelX + this.wheelRadius,
      wheelBaseY,
      this.wheelRadius,
      this.wheelFrame
    );

    // Car Body - More detailed pixel art car (I.1.A)
    // Layered approach:
    // 1. Undercarriage
    // drawPixelRect(
    //   ctx,
    //   carX,
    //   bodyY + this.height * 0.75 + rearTiltOffset / 4,
    //   this.width,
    //   this.height * 0.25,
    //   carColors.CAR_UNDERCARRIAGE
    // );

    // 2. Main Body
    const mainBodyHeight = this.height * 0.65;
    drawPixelRect(
      ctx,
      carX,
      bodyY + this.height * 0.1 + rearTiltOffset / 2,
      this.width,
      mainBodyHeight,
      carColors.CAR_BODY_MAIN
    );
    // Highlight on body
    drawPixelRect(
      ctx,
      carX + this.width * 0.1,
      bodyY + this.height * 0.15 + rearTiltOffset / 2,
      this.width * 0.8,
      mainBodyHeight * 0.2,
      lightenDarkenColor(carColors.CAR_BODY_MAIN, 20)
    );

    // 3. Cabin/Windows
    const cabinHeight = this.height * 0.5;
    const cabinWidth = this.width * 0.6;
    const cabinX = carX + this.width * 0.2;
    const cabinY = bodyY - cabinHeight * 0.4 + frontTiltOffset / 2; // Position cabin relative to main body top

    drawPixelRect(
      ctx,
      cabinX,
      cabinY,
      cabinWidth,
      cabinHeight,
      carColors.CAR_ROOF
    ); // Cabin structure first

    // Windows (inset within cabin structure)
    const windowInset = 4;
    const windowHeight = cabinHeight - windowInset * 1.5;
    // Windshield (slanted)
    ctx.fillStyle = carColors.CAR_WINDOW;
    ctx.beginPath();
    ctx.moveTo(cabinX + windowInset + cabinWidth * 0.3, cabinY + windowInset); // Top-leftish
    ctx.lineTo(cabinX + windowInset, cabinY + windowHeight); // Bottom-left
    ctx.lineTo(cabinX + windowInset + cabinWidth * 0.35, cabinY + windowHeight); // Bottom-rightish
    ctx.lineTo(cabinX + windowInset + cabinWidth * 0.45, cabinY + windowInset); // Top-right
    ctx.closePath();
    ctx.fill();

    // Side Window
    drawPixelRect(
      ctx,
      cabinX + cabinWidth * 0.45,
      cabinY + windowInset,
      cabinWidth * 0.5 - windowInset,
      windowHeight,
      carColors.CAR_WINDOW
    );

    // Pillars (A, B)
    drawPixelRect(
      ctx,
      cabinX + cabinWidth * 0.35,
      cabinY + windowInset,
      5,
      windowHeight,
      carColors.CAR_ROOF
    ); // B-Pillar

    // 4. Roof
    drawPixelRect(ctx, cabinX, cabinY - 5, cabinWidth, 5, carColors.CAR_ROOF);
    drawPixelRect(
      ctx,
      cabinX + 2,
      cabinY - 7,
      cabinWidth - 4,
      2,
      lightenDarkenColor(carColors.CAR_ROOF, 15)
    );

    // Headlights & Taillights (I.1.D)
    const lightSize = { w: 6, h: 4 };
    // Headlights
    const headlightY = bodyY + this.height * 0.25 + frontTiltOffset;
    if (this.headlightsOn) {
      drawPixelRect(
        ctx,
        carX + this.width - lightSize.w - 5,
        headlightY,
        lightSize.w,
        lightSize.h,
        carColors.CAR_HEADLIGHT_ON
      );
      // Optional light cone (very simple)
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = carColors.CAR_HEADLIGHT_ON;
      ctx.beginPath();
      ctx.moveTo(carX + this.width - 5, headlightY + lightSize.h / 2);
      ctx.lineTo(carX + this.width + 50, headlightY - 10);
      ctx.lineTo(carX + this.width + 50, headlightY + lightSize.h + 10);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1.0;
    } else {
      drawPixelRect(
        ctx,
        carX + this.width - lightSize.w - 5,
        headlightY,
        lightSize.w,
        lightSize.h,
        carColors.CAR_HEADLIGHT_OFF
      );
    }

    // Taillights
    const taillightY = bodyY + this.height * 0.25 + rearTiltOffset;
    let taillightColor = this.isBraking
      ? carColors.CAR_TAILLIGHT_BRAKE
      : carColors.CAR_TAILLIGHT_ON;
    if (!this.headlightsOn && !this.isBraking)
      taillightColor = carColors.CAR_TAILLIGHT_OFF; // Off if headlights are off and not braking

    drawPixelRect(
      ctx,
      carX + 5,
      taillightY,
      lightSize.w,
      lightSize.h,
      taillightColor
    );
    if (
      (this.headlightsOn || this.isBraking) &&
      taillightColor !== carColors.CAR_TAILLIGHT_OFF
    ) {
      // Optional glow for taillights
      ctx.globalAlpha = 0.2;
      drawPixelRect(
        ctx,
        carX + 3,
        taillightY - 1,
        lightSize.w + 4,
        lightSize.h + 2,
        taillightColor
      );
      ctx.globalAlpha = 1.0;
    }

    if (Config.DEBUG_MODE) {
      ctx.strokeStyle = "lime";
      ctx.lineWidth = 1;
      ctx.strokeRect(
        Math.floor(carX),
        Math.floor(bodyY), // Use bodyY for debug rect
        this.width,
        this.height
      );
      ctx.fillStyle = "white";
      ctx.font = "12px Courier New"; // Will be replaced by pixel font later
      ctx.fillText(`Speed: ${this.currentSpeed.toFixed(2)}`, carX, bodyY - 25);
      ctx.fillText(`Tilt: ${this.tiltAngle.toFixed(3)}`, carX, bodyY - 10);
    }
  }
}
