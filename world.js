// world.js: Background, parallax, zones
const World = {
  parallaxLayers: [
    { speed: 0.2, color: "#7ec0ee" }, // sky
    { speed: 0.5, color: "#b0b0b0" }, // far
    { speed: 0.8, color: "#5c4033" }, // mid
  ],
  update(dt, keys) {
    // No-op for now; world scrolls based on Player.x
  },
  render(ctx) {
    // Determine current zone for visuals
    let zone =
      CONFIG.ZONES.find((z) => Player.x >= z.start && Player.x < z.end) ||
      CONFIG.ZONES[0];
    // Parallax background
    for (let i = 0; i < this.parallaxLayers.length; i++) {
      const layer = this.parallaxLayers[i];
      const scrollX = Player.x * layer.speed;
      ctx.save();
      // Sky layer (fill whole bg)
      if (i === 0) {
        ctx.fillStyle = layer.color;
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        // Clouds (all zones)
        for (let c = 0; c < 4; c++) {
          let cx =
            ((c * 320 - scrollX * 0.5) % (CONFIG.CANVAS_WIDTH + 320)) - 80;
          let cy = 60 + 30 * c;
          drawPixelCloud(ctx, cx, cy, 1 + 0.2 * (c % 2));
        }
      } else if (i === 1) {
        // Far background: zone-specific
        if (zone.name === "Gaming District") {
          // Blocky terrain, distant castle
          for (let x = -100; x < CONFIG.CANVAS_WIDTH + 100; x += 120) {
            let offset = (x - scrollX) % 240;
            drawPixelBlock(
              ctx,
              offset,
              CONFIG.CANVAS_HEIGHT - 120,
              100,
              40,
              "#7c5c2e"
            );
          }
          // Distant "castle"
          drawPixelBlock(
            ctx,
            200 - scrollX * 0.7,
            CONFIG.CANVAS_HEIGHT - 180,
            40,
            60,
            "#bcbcbc"
          );
        } else if (zone.name === "Neo-City Outskirts") {
          // Futuristic cityscape
          drawFuturisticCity(
            ctx,
            100 - scrollX * 0.7,
            CONFIG.CANVAS_HEIGHT - 120,
            300,
            80
          );
        } else {
          // Industrial: factories
          for (let x = -100; x < CONFIG.CANVAS_WIDTH + 100; x += 180) {
            let offset = (x - scrollX) % 360;
            drawFactory(ctx, offset, CONFIG.CANVAS_HEIGHT - 120, 80, 60);
          }
        }
      } else if (i === 2) {
        // Midground: zone-specific
        if (zone.name === "Gaming District") {
          // Trees
          for (let x = -60; x < CONFIG.CANVAS_WIDTH + 60; x += 90) {
            let offset = (x - scrollX) % 180;
            drawPixelTree(ctx, offset, CONFIG.CANVAS_HEIGHT - 80, 1);
          }
        } else if (zone.name === "Neo-City Outskirts") {
          // Glowing geometric shapes
          for (let x = -60; x < CONFIG.CANVAS_WIDTH + 60; x += 120) {
            let offset = (x - scrollX) % 240;
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = "#0ff";
            ctx.fillRect(offset, CONFIG.CANVAS_HEIGHT - 80, 40, 40);
            ctx.restore();
          }
        } else {
          // Industrial: trucks, warehouses
          for (let x = -60; x < CONFIG.CANVAS_WIDTH + 60; x += 160) {
            let offset = (x - scrollX) % 320;
            drawWarehouse(ctx, offset, CONFIG.CANVAS_HEIGHT - 64);
            drawTruck(ctx, offset + 40, CONFIG.CANVAS_HEIGHT - 44, 0.7);
          }
        }
      }
      ctx.restore();
    }
  },
};
