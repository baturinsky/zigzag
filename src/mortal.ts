import { Box2dObject, EngineObject, particleEffect, ParticleEmitter, PI, Timer, Vector2 } from "littlejsengine";
import { Beam, Missile } from "./guns";
import { scale } from "./util";
import { Car, TailSegment } from "./car";
import { FlyingText } from "./flyingText";
import { Splat } from "./splat";

export class Mortal extends Box2dObject {
  maxLife = 1
  life = 1
  radius = 1


  setLife(l: number) {
    this.life = l;
    this.maxLife = l;
  }

  hit(hitPos: Vector2, damage?: number) {

    let e = particleEffect("blood", hitPos, {
      gravity: 0, particleTime: .3, emitTime: .1
    }) as ParticleEmitter;
    e.angle = this.pos.subtract(hitPos).angle();
    e.emissive = 1;

    damage = Math.round(damage ?? 0)

    if (!damage)
      return 0

    if (this.life > 0)
      new FlyingText(this.pos, `${damage}`)

    this.life -= damage;

    if (this.life <= 0)
      this.die()

    new Splat(this.pos)

    return damage;
  }

  die() {
    this.destroy()
  }

  nearestPointTo(start: Vector2) {
    return start.subtract(this.pos).normalize(-this.radius).add(this.pos);
  }

}

