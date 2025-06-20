// js/player/player.renderer.js
const PlayerRenderer = {
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
  },

  render(ctx, player) {
    const carX = player.screenX;
    // I.1.C Suspension Bobbing: Body uses effectiveY, wheels use a non-bobbing Y.
    const bodyY = player.effectiveY;
    const wheelBaseY = player.screenY + player.height - player.wheelRadius; // Non-bobbing Y for wheels

    const carColors = Palettes.vehicle;

    // Apply tilt - this is a simplified approach.
    const frontTiltOffset = Math.sin(player.tiltAngle) * (player.width / 2);
    const rearTiltOffset = -Math.sin(player.tiltAngle) * (player.width / 2);

    // Player Shadow (I.2.B)
    drawPixelRect(
      ctx,
      carX + 5,
      wheelBaseY + player.wheelRadius - 3, // Positioned under the wheels
      player.width - 10,
      6, // Shadow height
      "rgba(0, 0, 0, 0.2)"
    );

    // Wheels (drawn first, at non-bobbing Y)
    const frontWheelX = carX + player.width * 0.2;
    const rearWheelX = carX + player.width * 0.8 - player.wheelRadius * 2;

    this.drawWheel(
      ctx,
      frontWheelX + player.wheelRadius,
      wheelBaseY,
      player.wheelRadius,
      player.wheelFrame
    );
    this.drawWheel(
      ctx,
      rearWheelX + player.wheelRadius,
      wheelBaseY,
      player.wheelRadius,
      player.wheelFrame
    );

    // Car Body - More detailed pixel art car (I.1.A)
    const mainBodyHeight = player.height * 0.65;
    drawPixelRect(
      ctx,
      carX,
      bodyY + player.height * 0.1 + rearTiltOffset / 2,
      player.width,
      mainBodyHeight,
      carColors.CAR_BODY_MAIN
    );
    // Highlight on body
    drawPixelRect(
      ctx,
      carX + player.width * 0.1,
      bodyY + player.height * 0.15 + rearTiltOffset / 2,
      player.width * 0.8,
      mainBodyHeight * 0.2,
      lightenDarkenColor(carColors.CAR_BODY_MAIN, 20)
    );

    // 3. Cabin/Windows
    const cabinHeight = player.height * 0.5;
    const cabinWidth = player.width * 0.6;
    const cabinX = carX + player.width * 0.2;
    const cabinY = bodyY - cabinHeight * 0.4 + frontTiltOffset / 2;

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
    ctx.moveTo(cabinX + windowInset + cabinWidth * 0.3, cabinY + windowInset);
    ctx.lineTo(cabinX + windowInset, cabinY + windowHeight);
    ctx.lineTo(cabinX + windowInset + cabinWidth * 0.35, cabinY + windowHeight);
    ctx.lineTo(cabinX + windowInset + cabinWidth * 0.45, cabinY + windowInset);
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
    const headlightY = bodyY + player.height * 0.25 + frontTiltOffset;
    if (player.headlightsOn) {
      drawPixelRect(
        ctx,
        carX + player.width - lightSize.w - 5,
        headlightY,
        lightSize.w,
        lightSize.h,
        carColors.CAR_HEADLIGHT_ON
      );
      // Optional light cone (very simple)
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = carColors.CAR_HEADLIGHT_ON;
      ctx.beginPath();
      ctx.moveTo(carX + player.width - 5, headlightY + lightSize.h / 2);
      ctx.lineTo(carX + player.width + 50, headlightY - 10);
      ctx.lineTo(carX + player.width + 50, headlightY + lightSize.h + 10);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1.0;
    } else {
      drawPixelRect(
        ctx,
        carX + player.width - lightSize.w - 5,
        headlightY,
        lightSize.w,
        lightSize.h,
        carColors.CAR_HEADLIGHT_OFF
      );
    }

    // Taillights
    const taillightY = bodyY + player.height * 0.25 + rearTiltOffset;
    let taillightColor = player.isBraking
      ? carColors.CAR_TAILLIGHT_BRAKE
      : carColors.CAR_TAILLIGHT_ON;
    if (!player.headlightsOn && !player.isBraking)
      taillightColor = carColors.CAR_TAILLIGHT_OFF;

    drawPixelRect(
      ctx,
      carX + 5,
      taillightY,
      lightSize.w,
      lightSize.h,
      taillightColor
    );
    if (
      (player.headlightsOn || player.isBraking) &&
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
        player.width,
        player.height
      );
      ctx.fillStyle = "white";
      ctx.font = "12px Courier New";
      ctx.fillText(
        `Speed: ${player.currentSpeed.toFixed(2)}`,
        carX,
        bodyY - 25
      );
      ctx.fillText(`Tilt: ${player.tiltAngle.toFixed(3)}`, carX, bodyY - 10);
    }
  },
};
