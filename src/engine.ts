import { BLACK, Color, EngineObject, Light, PI, rgb, tile, vec2, Vector2 } from "littlejsengine"
import { mod } from "./util";

export const
  tile1 = (slot: number) => tile(slot, vec2(16, 16), 0, 1),
  tile2 = (slot: number) => tile(slot, vec2(16, 34), 0, 1),
  angleDiff = (a: number, b: number) => mod(a - b + PI, PI * 2) - PI;


export class TemporaryLight extends Light {

  constructor(pos: Vector2, public scaled = 1, public duration = 1.5, public col = rgb(1, .5, .5)) {
    super(pos, 0, rgb(.1, .05, .05))
    this.radius = this.scaled;
    this.fadeRange = this.radius;
  }

  update(): void {
    let t = this.getAliveTime() / this.duration;
    if (t > 1) {
      this.destroy();
    } else {
      this.color = this.col.lerp(BLACK, t);
    }
  }
}

export class TimeoutObject extends EngineObject {
  constructor(public delay: number, public callback: () => void) {
    super(vec2(), vec2())
  }
  update() {
    if (this.getAliveTime() >= this.delay) {
      this.callback();
      this.destroy()
    }
  }
}

