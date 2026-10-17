import { Box2dObject, EngineObject, particleEffect, ParticleEmitter, PI, rand, randInCircle, randInt, Timer, Vector2 } from "littlejsengine";
import { Beam, Missile } from "./guns";
import { scale } from "./util";
import { Car, TailSegment } from "./car";
import { FlyingText } from "./flyingText";
import { Splat } from "./splat";
import { sounds } from "./sound";

export class Mortal extends Box2dObject {
  maxLife = 1
  life = 1
  radius = 1
  dying = 0

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

    if (damage > rand(3) && this.life > 0)
      (sounds as any)["gore" + randInt(1, 3)].play(this.pos, rand(.8, 1.2), .5)

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

  update() {
    if (this.dying) {

      new Splat(this.pos.add(randInCircle(.5)), rand(.5));

      if (--this.dying <= 0)
        this.bury();
      return
    }
  }

  bury() {
    //this.setCollision(false, false, false)
    this.destroy()
  }

}

