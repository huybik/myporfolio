// js/input.js
const Input = {
  keys: {},
  init() {
    window.addEventListener("keydown", (e) => this.handleKeyDown(e));
    window.addEventListener("keyup", (e) => this.handleKeyUp(e));
    if (Config.DEBUG_MODE) console.log("Input system initialized.");
  },
  handleKeyDown(e) {
    this.keys[e.key] = true;
  },
  handleKeyUp(e) {
    this.keys[e.key] = false;
  },
  isPressed(action) {
    const boundKeys = Config.KeyBindings[action];
    if (boundKeys) {
      return boundKeys.some((key) => this.keys[key]);
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
    return this.isPressed("INTERACT");
  },
};
Input.init();
