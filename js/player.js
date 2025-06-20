// js/player.js
class Player {
  constructor(game) {
    this.game = game;
    this.width = 80;
    this.height = 40;
    this.screenX = (Config.CANVAS_WIDTH - this.width) / 2;
    this.screenY = Config.CANVAS_HEIGHT - this.height - 60;
    this.bobAngle = 0;
    this.bobSpeed = 0.1;
    this.bobAmplitude = 2;
    this.wheelFrame = 0;
    this.wheelAnimationSpeed = 0.2;
    this.wheelRadius = 8;
    this.currentSpeed = 0;
    this.maxSpeed = 7; // Changed from 5 to 7
    this.acceleration = 0.1;
    this.deceleration = 0.05;
    this.effectiveY = this.screenY;
    if (Config.DEBUG_MODE) console.log("Player initialized.");
  }

  update(deltaTime) {
    let moving = false;
    if (Input.isMoveRightPressed()) {
      this.currentSpeed += this.acceleration;
      if (this.currentSpeed > this.maxSpeed) this.currentSpeed = this.maxSpeed;
      moving = true;
    }
    if (Input.isMoveLeftPressed()) {
      this.currentSpeed -= this.acceleration;
      if (this.currentSpeed < -this.maxSpeed)
        this.currentSpeed = -this.maxSpeed;
      moving = true;
    }
    if (!moving) {
      if (this.currentSpeed > 0) {
        this.currentSpeed -= this.deceleration;
        if (this.currentSpeed < 0) this.currentSpeed = 0;
      } else if (this.currentSpeed < 0) {
        this.currentSpeed += this.deceleration;
        if (this.currentSpeed > 0) this.currentSpeed = 0;
      }
    }
    this.bobAngle += this.bobSpeed * (60 * deltaTime);
    const bobOffset = Math.sin(this.bobAngle) * this.bobAmplitude;
    this.effectiveY = this.screenY + bobOffset;
    if (Math.abs(this.currentSpeed) > 0.1) {
      this.wheelFrame +=
        this.wheelAnimationSpeed *
        Math.sign(this.currentSpeed) *
        (60 * deltaTime);
      if (this.wheelFrame >= 4) this.wheelFrame = 0;
      if (this.wheelFrame < 0) this.wheelFrame = 3;
    }
  }

  drawWheel(ctx, x, y, radius, frame) {
    ctx.fillStyle = "#333333";
    ctx.beginPath();
    ctx.arc(Math.floor(x), Math.floor(y), Math.floor(radius), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#777777";
    ctx.beginPath();
    ctx.arc(
      Math.floor(x),
      Math.floor(y),
      Math.floor(radius * 0.5),
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.strokeStyle = "#555555";
    ctx.lineWidth = 2;
    ctx.beginPath();
    const angleOffset = (Math.PI / 2) * Math.floor(frame);
    for (let i = 0; i < 2; i++) {
      const angle = angleOffset + (i * Math.PI) / 2;
      ctx.moveTo(
        Math.floor(x + Math.cos(angle) * radius * 0.2),
        Math.floor(y + Math.sin(angle) * radius * 0.2)
      );
      ctx.lineTo(
        Math.floor(x + Math.cos(angle) * radius * 0.9),
        Math.floor(y + Math.sin(angle) * radius * 0.9)
      );
    }
    ctx.stroke();
  }

  render(ctx) {
    const carX = this.screenX;
    const carY = this.effectiveY;
    drawPixelRect(
      ctx,
      carX,
      carY,
      this.width,
      this.height - this.wheelRadius,
      "#AA3333"
    );
    drawPixelRect(
      ctx,
      carX + this.width * 0.25,
      carY - this.height * 0.3,
      this.width * 0.5,
      this.height * 0.4,
      "#77AADD"
    );
    drawPixelRect(
      ctx,
      carX + this.width * 0.2,
      carY - this.height * 0.3 - 5,
      this.width * 0.6,
      5,
      "#882222"
    );
    drawPixelRect(
      ctx,
      carX + this.width - 5,
      carY + this.height * 0.2,
      5,
      6,
      "#FFFFDD"
    );
    drawPixelRect(ctx, carX, carY + this.height * 0.2, 5, 6, "#FF5555");
    const wheelY = carY + this.height - this.wheelRadius;
    const frontWheelX = carX + this.width * 0.2;
    const rearWheelX = carX + this.width * 0.8 - this.wheelRadius * 2;
    this.drawWheel(
      ctx,
      frontWheelX + this.wheelRadius,
      wheelY,
      this.wheelRadius,
      this.wheelFrame
    );
    this.drawWheel(
      ctx,
      rearWheelX + this.wheelRadius,
      wheelY,
      this.wheelRadius,
      this.wheelFrame
    );
    if (Config.DEBUG_MODE) {
      ctx.strokeStyle = "lime";
      ctx.lineWidth = 1;
      ctx.strokeRect(
        Math.floor(carX),
        Math.floor(carY),
        this.width,
        this.height
      );
      ctx.fillStyle = "white";
      ctx.font = "12px Courier New";
      ctx.fillText(`Speed: ${this.currentSpeed.toFixed(2)}`, carX, carY - 10);
    }
  }
}
