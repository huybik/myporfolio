// src/input.ts
import { Config } from "./config";

export const Input = {
  keys: {} as Record<string, boolean>,
  lastPressed: {} as Record<string, boolean>,

  init() {
    window.addEventListener("keydown", (e) => this.handleKeyDown(e));
    window.addEventListener("keyup", (e) => this.handleKeyUp(e));
    if (Config.DEBUG_MODE) console.log("Input system initialized.");
  },

  handleKeyDown(e: KeyboardEvent) {
    if (!this.keys[e.key]) {
      this.lastPressed[e.key] = true;
    }
    this.keys[e.key] = true;
  },

  handleKeyUp(e: KeyboardEvent) {
    this.keys[e.key] = false;
    this.lastPressed[e.key] = false;
  },

  isPressed(action: keyof typeof Config.KeyBindings): boolean {
    const boundKeys = Config.KeyBindings[action];
    if (boundKeys) {
      return boundKeys.some((key) => this.keys[key]);
    }
    return false;
  },

  isJustPressed(action: keyof typeof Config.KeyBindings): boolean {
    const boundKeys = Config.KeyBindings[action];
    if (boundKeys) {
      for (const key of boundKeys) {
        if (this.keys[key] && this.lastPressed[key]) {
          this.lastPressed[key] = false;
          return true;
        }
      }
    }
    return false;
  },

  isMoveLeftPressed(): boolean {
    return this.isPressed("MOVE_LEFT");
  },

  isMoveRightPressed(): boolean {
    return this.isPressed("MOVE_RIGHT");
  },

  isInteractPressed(): boolean {
    return this.isPressed("INTERACT");
  },

  isInteractJustPressed(): boolean {
    return this.isJustPressed("INTERACT");
  },

  isToggleHeadlightsJustPressed(): boolean {
    return this.isJustPressed("TOGGLE_HEADLIGHTS");
  },
};
