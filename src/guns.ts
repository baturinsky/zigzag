import { box2d, Box2dObject, Box2dRaycastResult, Color, drawLine, EngineObject, engineObjectsCallback, engineObjectsRaycast, gravity, hsl, Light, particleEffect, ParticleEmitter, PI, rand, randInCircle, rgb, Timer, vec2, Vector2 } from "littlejsengine";
import { angleDiff, TemporaryLight, tile1 } from "./engine";
import { Car } from "./car";
import { loop, min } from "./util";
import { Mortal } from "./mortal";
import { Chort } from "./chort";

export type GunParams = {

  rof?: number
  bulletSpeed?: number
  burst?: number
  spread?: number
  damage?: number
  aoe?: number
  damping?: number
  beam?: number
  shotColor?: Color
  duration?: number
  range?: number
  piercing?: number
};

export class Gun extends EngineObject {
  charge = 0

  rof = 1
  bulletSpeed = 60
  burst = 1
  spread = 0
  damage = 0
  damping = 0
  aoe = 0
  beam = 0
  duration = .1
  range = 30
  piercing = 0
  shotColor: Color = rgb(1, 1, 1)

  constructor(public car: Car, stats: Partial<Gun> = {}) {
    super(vec2(), vec2());
    Object.assign(this, stats)
  }

  update() {
    this.charge += 1 / 60;
    while (this.charge > 0) {
      this.charge -= 1 / this.rof;
      this.shoot()
    }
  }

  shoot() {
    let target = this.findTarget();
    if (target) {

      loop(this.burst, i => {
        let shot: Beam | Missile
        if (this.beam)
          shot = new Beam(this, target)
        else
          shot = new Missile(this, target)
        if (this.shotColor)
          shot.color = this.shotColor
      })

    }
  }

  findTarget() {
    let chortsNearby = [] as Chort[]
    engineObjectsCallback(this.pos, this.range, (o) => {
      if (o instanceof Chort && o.pos) {
        let angle = o.pos.subtract(this.pos).angle();
        if (Math.abs(angleDiff(angle, this.angle)) < .5) {
          chortsNearby.push(o)
        }
      }
    })

    let nearest = chortsNearby.length ? min(chortsNearby, c => c.pos.subtract(this.pos).length()) : undefined;
    return nearest
  }
}

export class Beam extends EngineObject {

  targetPoint: Vector2

  constructor(public gun: Gun, public target: Chort) {
    super(gun.pos);
    this.emissive = 1

    muzzle(this.gun)

    let e = particleEffect("explosion", target.pos, { scale: .3, emitTime: .5 }) as ParticleEmitter;
    e.emissive = 1;

    let delta = target.pos.subtract(this.pos);

    this.targetPoint = this.gun.pos.add(delta.normalize(this.gun.range));

    let raycast = box2d.raycastAll(this.gun.pos, this.targetPoint)
    for (let r of raycast) {
      let o = r.object;
      if (o instanceof Mortal) {
        o.hit(target.nearestPointTo(gun.pos), this.getDamage())
      }
    }

    let lightColor = gun.shotColor.lerp(rgb(1, 1, 1), .8);

    for (let i = 0; i < delta.length(); i += .5) {
      let tl = new TemporaryLight(this.pos.add(delta.normalize(i)), 2, .2)
      tl.castShadow = false
      tl.color = lightColor
    }

    for (let side of [gun.pos, target.pos]) {
      let tl = new TemporaryLight(side, 3, .2)
      tl.fadeRange = 1
      tl.castShadow = false
      tl.color = lightColor
    }
  }

  render(): void {
    let color = this.gun.shotColor?.copy() ?? rgb(1, 1, 1);
    let a = 1 - this.getAliveTime() / this.gun.duration
    color.a = a;
    drawLine(this.pos, this.targetPoint, this.gun.beam, color)
    drawLine(this.pos, this.targetPoint, this.gun.beam / 2, rgb(1, 1, 1, a))
    //drawLine(this.pos, this.target.pos, 3, rgb(1, 1, 1, a / 2))
    if (this.getAliveTime() > this.gun.duration)
      this.destroy()
  }

  getDamage() {
    return this.gun.damage
  }

}

function muzzle(gun: Gun) {
  let e = particleEffect("muzzle", gun.pos, { scale: 2 }) as ParticleEmitter;
  e.emissive = 1;
  e.angle = gun.angle;
}

export class Missile extends Box2dObject {

  constructor(public gun: Gun, target: Chort) {
    super(gun.pos, vec2(.2, .5), tile1(0));
    this.color = rgb(1, 1, 1);
    this.emissive = 1;
    this.renderOrder = -1
    this.addCircle(.3)
    this.castShadow = false;
    this.mass = 1
    if (gun.damping) {
      this.setLinearDamping(gun.damping)
    }

    let tl = new TemporaryLight(this.gun.pos, 10, .05);
    tl.color = rgb(1, .5, .5);

    muzzle(this.gun)

    //let dir = gun.angle + rand(-.1, .1);

    let dir = target.pos.subtract(this.gun.pos).angle();
    this.setAngle(dir)

    let vel = vec2().setAngle(dir).scale(gun.bulletSpeed);//.add(gun.car.getLinearVelocity());

    if (this.gun.spread) {
      let delta = randInCircle(gun.spread)
      vel = vel.add(delta)
    }

    this.setLinearVelocity(vel);

    this.isBullet = true;
    this.isSolid = false;

    this.setFilterData(2, 2)

    let l = new Light(vec2(), 2, rgb(.3, .1, .1), 2);
    l.castShadow = false;
    this.addChild(l)

    //this.isSolid = false

    /*let effect = particleEffect('trail', vec2()) as ParticleEmitter;
    effect.trailScale = 10;
    effect.emissive = 1;
    this.addChild(effect)*/
  }

  update() {
    if (this.getAliveTime() > .5) {
      this.timeout()
      return
    }

    //new TemporaryLight(this.pos, 2, .2)
  }

  beginContact(other: Box2dObject) {
    if (other instanceof Mortal) {
      if (this.gun.aoe) {
        this.explode()
      } else {
        other.hit(other.nearestPointTo(this.gun.pos), this.getDamage())
        this.destroy()
      }

    }
  }

  timeout() {
    if (this.gun.aoe) {
      this.explode()
    } else {
      this.destroy()
    }
  }

  explode() {

    engineObjectsCallback(this.pos, this.gun.aoe, (other) => {
      let aoe = this.gun.aoe;
      if (other instanceof Mortal)
        other.hit(other.nearestPointTo(this.gun.pos), this.getDamage())
      let tl = new TemporaryLight(this.pos, aoe * 2, .2)
      tl.color = rgb(1, 1, 1);
      let e = particleEffect("explosion", this.pos, { scale: aoe / 2.5 }) as ParticleEmitter;
      e.emissive = 1;
    })
    this.destroy()
  }

  getDamage() {
    return this.gun.damage
  }


}

