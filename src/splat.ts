import { EngineObject, PI, rand, rgb, vec2, Vector2 } from "littlejsengine";
import { fadeAndDie, tile1 } from "./engine";

export class Splat extends EngineObject {
  duration = 10

  constructor(pos: Vector2, size = 1) {
    size *= rand(.5, 1.5);
    super(pos.copy(), vec2(size), tile1(25), rand(0, PI * 2))
  }

  update(): void {
    fadeAndDie(this);
  }
}