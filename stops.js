// stops.js: Stop logic and data
const Stops = {
  stops: [
    {
      id: "ai-game",
      worldX: 350,
      theme: "gaming",
      linkURL: "https://your-ai-game-project-link.com",
      promptText: "Press [F] to Explore AI Game Project",
      marker: function (ctx, x, y) {
        drawArcadeCabinet(ctx, x, y);
      },
    },
    {
      id: "ai-ta",
      worldX: 1200,
      theme: "futuristic",
      linkURL: "https://your-english-ai-ta-link.com",
      promptText: "Press [F] to Explore English AI TA Project",
      marker: function (ctx, x, y) {
        drawHolographicTerminal(ctx, x, y);
      },
    },
    {
      id: "truck-parts",
      worldX: 2200,
      theme: "industrial",
      linkURL: "https://your-truck-parts-link.com",
      promptText: "Press [F] to Explore Truck Parts Project",
      marker: function (ctx, x, y) {
        drawWarehouse(ctx, x, y);
      },
    },
  ],
  activeStop: null,
  activationRadius: 60,
  update(dt, keys) {
    // Detect if player is near a stop
    this.activeStop = null;
    for (const stop of this.stops) {
      if (Math.abs(Player.x - stop.worldX) < this.activationRadius) {
        this.activeStop = stop;
        // Interaction
        if (keys["Enter"] || keys["Space"] || keys["KeyF"]) {
          window.open(stop.linkURL, "_blank");
          // Prevent repeated triggers
          keys["Enter"] = keys["Space"] = keys["KeyF"] = false;
        }
        break;
      }
    }
  },
  render(ctx) {
    // Draw stop markers in world
    for (const stop of this.stops) {
      // Convert worldX to screen X (relative to player)
      const screenX = CONFIG.CANVAS_WIDTH / 2 + (stop.worldX - Player.x);
      const markerY = CONFIG.CAR_START_Y - 40;
      if (screenX > -40 && screenX < CONFIG.CANVAS_WIDTH + 40) {
        stop.marker(ctx, screenX, markerY);
      }
    }
  },
};
