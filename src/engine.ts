import { BLACK, Box2dObject, Color, EngineObject, engineObjectsCallback, Light, PI, rgb, tile, vec2, Vector2 } from "littlejsengine"
import { mod, loop, min } from "./util";
import { Chort } from "./chort";
import { Mortal } from "./mortal";

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

export class TimeoutObject extends Mortal {
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

export function fadeAndDie(o: EngineObject & { duration: number }) {
  let t = o.getAliveTime() / o.duration;
  o.color = rgb(1, 1, 1, 1 - t);
  if (t > 1)
    o.destroy()
}

export function findNearest(entities: Mortal[] | Set<Mortal>, pos: Vector2, angle?: number) {

  let nearest = min(Array.isArray ? entities : entities.entries, (e: Mortal) => {
    if (e.life <= 0)
      return 1e9;
    let a = e.pos.subtract(pos).angle();
    if (angle !== undefined && Math.abs(angleDiff(a, angle)) > .2)
      return 1e9;
    return e.pos.distance(pos)
  })

  return nearest;
}

export function ram(rammer: Box2dObject, otherObject: Box2dObject, impactSpeed?: number) {
  if ((otherObject instanceof Chort) && impactSpeed) {
    otherObject.hit(rammer.pos, impactSpeed * rammer.getMass() * .1)
  }
}
