import { Box2dObject, EngineObject, particleEffect, ParticleEmitter, PI, Timer, Vector2 } from "littlejsengine";
import { Beam, Missile } from "./guns";
import { scale } from "./util";
import { Car } from "./car";

export class Mortal extends Box2dObject {
  life = 1
  radius = 1

  hitBy(bullet: Missile | Beam | Car, hitPos: Vector2) {

    let e = particleEffect("blood", hitPos, {
      gravity: 0, particleTime: .3, emitTime: .1
    }) as ParticleEmitter;
    e.angle = this.pos.subtract(hitPos).angle();
    e.emissive = 1;

    this.life -= bullet.getDamage();

    if (this.life <= 0)
      this.die()
  }

  die() {
    this.destroy()
  }

  nearestPointTo(start: Vector2) {
    return start.subtract(this.pos).normalize(-this.radius).add(this.pos);
  }

}

