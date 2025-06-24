// src/config.ts
export const Config = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  TARGET_FPS: 60,
  KeyBindings: {
    MOVE_LEFT: ["ArrowLeft", "a", "A"],
    MOVE_RIGHT: ["ArrowRight", "d", "D"],
    INTERACT: ["Enter", " ", "f", "F"],
    TOGGLE_HEADLIGHTS: ["h", "H"], // Added for headlights
  },
  DEBUG_MODE: false, // Set to true for debug info
  STOP_LINKS: {
    project_ai_game: "https://simulafun.vercel.app/",
    project_ai_ta: "https://learnshouldfun.vercel.app/",
    project_truck_parts: "https://example.com/truck-parts-project",
  },
  PLAYER_DUST_EMIT_THRESHOLD: 1.0,
  PLAYER_EXHAUST_EMIT_THRESHOLD: 0.5,
  PLAYER_SPEED_LINE_THRESHOLD: 5.0,
  MAX_DUST_PARTICLES_PER_FRAME: 2,
  MAX_EXHAUST_PARTICLES_PER_FRAME: 1,
  MAX_SPEED_LINES_PER_FRAME: 3,
  UI_TYPEWRITER_SPEED: 3, // characters per second (approx, tied to frames)
  UI_PANEL_INTRO_SPEED: 15, // pixels per frame
};
