import { Player } from "./player/player";
import { World } from "./world/world";
import { UI } from "./ui/ui";

// We can define the shape of the main Game class
export interface IGame {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  deltaTime: number;
  gameTime: number;
  player: Player;
  world: World;
  ui: UI;
}
