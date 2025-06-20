// js/input.js
const Input = {
  keys: {},
  lastPressed: {}, // For detecting single presses
  init() {
    window.addEventListener("keydown", (e) => this.handleKeyDown(e));
    window.addEventListener("keyup", (e) => this.handleKeyUp(e));
    if (Config.DEBUG_MODE) console.log("Input system initialized.");
  },
  handleKeyDown(e) {
    if (!this.keys[e.key]) {
      // Only set lastPressed on initial press
      this.lastPressed[e.key] = true;
    }
    this.keys[e.key] = true;
  },
  handleKeyUp(e) {
    this.keys[e.key] = false;
    this.lastPressed[e.key] = false; // Clear lastPressed on key up
  },
  isPressed(action) {
    const boundKeys = Config.KeyBindings[action];
    if (boundKeys) {
      return boundKeys.some((key) => this.keys[key]);
    }
    return false;
  },
  isJustPressed(action) {
    const boundKeys = Config.KeyBindings[action];
    if (boundKeys) {
      for (const key of boundKeys) {
        if (this.keys[key] && this.lastPressed[key]) {
          this.lastPressed[key] = false; // Consume the "just pressed" state
          return true;
        }
      }
    }
    return false;
  },
  isMoveLeftPressed() {
    return this.isPressed("MOVE_LEFT");
  },
  isMoveRightPressed() {
    return this.isPressed("MOVE_RIGHT");
  },
  isInteractPressed() {
    // This will now be for continuous press if needed
    return this.isPressed("INTERACT");
  },
  isInteractJustPressed() {
    // For single action
    return this.isJustPressed("INTERACT");
  },
  isToggleHeadlightsJustPressed() {
    return this.isJustPressed("TOGGLE_HEADLIGHTS");
  },
};
Input.init();
