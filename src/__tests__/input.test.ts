import { describe, it, expect, beforeEach } from "vitest";
import { Input } from "../input";
import { Config } from "../config";

describe("Input", () => {
  beforeEach(() => {
    // Reset state before each test
    for (const key in Input.keys) delete Input.keys[key];
    for (const key in Input.lastPressed) delete Input.lastPressed[key];
  });

  it("isPressed returns true if any bound key is pressed", () => {
    Input.keys["a"] = true;
    expect(Input.isPressed("MOVE_LEFT")).toBe(true);
    Input.keys["a"] = false;
    Input.keys["ArrowLeft"] = true;
    expect(Input.isPressed("MOVE_LEFT")).toBe(true);
  });

  it("isPressed returns false if no bound key is pressed", () => {
    expect(Input.isPressed("MOVE_LEFT")).toBe(false);
  });

  it("isJustPressed returns true only once per press", () => {
    Input.keys["Enter"] = true;
    Input.lastPressed["Enter"] = true;
    expect(Input.isJustPressed("INTERACT")).toBe(true);
    // Should consume just pressed
    expect(Input.isJustPressed("INTERACT")).toBe(false);
  });

  it("isMoveLeftPressed and isMoveRightPressed work", () => {
    Input.keys["a"] = true;
    expect(Input.isMoveLeftPressed()).toBe(true);
    Input.keys["a"] = false;
    Input.keys["d"] = true;
    expect(Input.isMoveRightPressed()).toBe(true);
  });

  it("isInteractPressed and isInteractJustPressed work", () => {
    Input.keys["f"] = true;
    Input.lastPressed["f"] = true;
    expect(Input.isInteractPressed()).toBe(true);
    expect(Input.isInteractJustPressed()).toBe(true);
    expect(Input.isInteractJustPressed()).toBe(false);
  });

  it("isToggleHeadlightsJustPressed works", () => {
    Input.keys["h"] = true;
    Input.lastPressed["h"] = true;
    expect(Input.isToggleHeadlightsJustPressed()).toBe(true);
    expect(Input.isToggleHeadlightsJustPressed()).toBe(false);
  });
});
