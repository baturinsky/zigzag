import { EngineObject, PI, rand, rgb, vec2, Vector2 } from "littlejsengine";
import { tile1 } from "./engine";

export class Splat extends EngineObject {
  duration = 10

  constructor(pos: Vector2) {
    let size = rand(.5, 1.5)
    super(pos, vec2(size), tile1(25), rand(0,PI*2))
  }

  update(): void {
    let t = this.getAliveTime() / this.duration;
    this.color = rgb(1, 1, 1, 1 - t);
    if (t > 1)
      this.destroy()
  }
}