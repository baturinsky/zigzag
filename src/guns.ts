import { box2d, Box2dObject, Box2dRaycastResult, Color, drawLine, EngineObject, engineObjectsCallback, engineObjectsRaycast, gravity, hsl, Light, particleEffect, ParticleEmitter, PI, rand, randInCircle, RED, rgb, Sound, TileInfo, Timer, vec2, Vector2 } from "littlejsengine";
import { findNearest, TemporaryLight, tile1 } from "./engine";
import { damageLevelMultiplier, loop, min } from "./util";
import { Mortal } from "./mortal";
import { Chort } from "./chort";
import { sounds } from "./sound";
import { ammoLeft, ammoUsed, scenario, useAmmo } from "./main";
import { carGear } from "./car";

const bulletLights = false;
const chainRange = 8;

export const weapons: { [name: string]: WeaponParams } = {
  magnum: { rof: 2, damage: 100 },
  uzi: { rof: 20, damage: 6 },
  shotgun: { damage: 5, spread: 50, burst: 24, rof: 2 },
  grenade: { rof: 1, damage: 10, aoe: 7, missileDamping: 10, missileSprite: 44 },
  bomb: { rof: .2, damage: 10, aoe: 15, missileDamping: 10, missileSprite: 44, missileSize: 2 },
  laser: { rof: 10, damage: 4, beam: .2, spread: 0, shotColor: rgb(1, 0, 0), shootSound: sounds.laser },
  railgun: { rof: 1, damage: 100, beam: .2, spread: 0, shotColor: rgb(1, 1, 1), shootSound: sounds.laser },
  molotov: { rof: 2, damage: 1, aoe: 3, missileDamping: 10, missileSprite: 45, fire: 2 },
  shock: { rof: 2, damage: 4, beam: .2, spread: 0, targets: 4, shotColor: rgb(.5, .7, 1), shootSound: sounds.laser },
}

export function makeGun(name: keyof typeof weapons, level = 1) {
  let damageMultiplier = damageLevelMultiplier(level);
  if (name in carGear) {
    return { name: name as string, back: true, level, damage: damageMultiplier }
  }
  let gun = { ...weapons[name], name }
  gun.level = level
  gun.damage = Math.round(gun.damage * damageMultiplier)
  return gun as WeaponParams
}

export type WeaponParams = {

  damage: number

  back?: boolean
  fire?: number

  missileSize?: number
  name?: string
  rof?: number
  bulletSpeed?: number
  burst?: number
  spread?: number
  aoe?: number
  missileDamping?: number
  beam?: number
  targets?: number
  shotColor?: Color
  duration?: number
  range?: number
  piercing?: number
  shootSound?: Sound
  missileSprite?: number
  level?: number
};

export class Gun extends EngineObject implements WeaponParams {
  charge = 0

  maxAngle = .2
  level = 1

  fire?: number
  missileSize = 1
  name = "gun"
  rof = 1
  bulletSpeed = 240
  burst = 1
  spread = 0
  damage = 0
  missileDamping = 0
  aoe = 0
  beam = 0
  targets = 0
  duration = .1
  range = 30
  piercing = 0
  shotColor: Color = rgb(1, 1, 1)
  shootSound = sounds.shoot;
  missileSprite?: number

  constructor(public owner: EngineObject, stats: Partial<Gun> = {}) {
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
    if (!ammoLeft(this))
      return;

    let target = this.findTarget() as Chort;
    if (target) {
      useAmmo(1);

      if (this.shootSound) {
        this.shootSound.play(this.pos, 3)
      }

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
    let t = findNearest(scenario.chorts, this.pos, this.angle, this.maxAngle)
    if (t && t.pos.distance(this.pos) > this.range)
      return undefined
    return t;
  }
}

export class Beam extends EngineObject {

  points: Vector2[]

  constructor(public gun: Gun, public target: Chort) {
    super(gun.pos);
    this.emissive = 1

    muzzle(this.gun)

    let litPoints: Vector2[]
    let struck: Chort[]

    if (gun.targets) {
      struck = this.chainTargets(target, gun.targets)
      let from = gun.pos.copy()
      for (let t of struck) {
        t.hit(t.nearestPointTo(from), this.getDamage())
        from = t.pos.copy()
      }
      this.points = [gun.pos.copy(), ...struck.map(t => t.pos.copy())]
      litPoints = this.points
      this.points = jagged(this.points)
    } else {
      struck = [target]
      let delta = target.pos.subtract(this.pos);
      this.points = [gun.pos.copy(), gun.pos.add(delta.normalize(gun.range))]
      let raycast = box2d.raycastAll(this.points[0], this.points[1])
      for (let r of raycast) {
        let o = r.object;
        if (o instanceof Mortal) {
          o.hit(target.nearestPointTo(gun.pos), this.getDamage())
        }
      }
      litPoints = [gun.pos, target.pos]
    }

    for (let t of struck) {
      let e = particleEffect("explosion", t.pos, { scale: .3, emitTime: .5 }) as ParticleEmitter;
      e.emissive = 1;
    }

    let lightColor = gun.shotColor.lerp(rgb(1, 1, 1), .8);

    for (let p = 1; p < litPoints.length; p++) {
      let start = litPoints[p - 1]
      let delta = litPoints[p].subtract(start);
      for (let i = 0; i < delta.length(); i += .5) {
        let tl = new TemporaryLight(start.add(delta.normalize(i)), 2, .2)
        tl.castShadow = false
        tl.color = lightColor
      }
    }

    for (let side of litPoints) {
      let tl = new TemporaryLight(side, 3, .2)
      tl.fadeRange = 1
      tl.castShadow = false
      tl.color = lightColor
    }
  }

  chainTargets(first: Chort, count: number) {
    let struck = [first]
    let current: Chort | undefined = first
    while (struck.length < count && current) {
      let origin: Vector2 = current.pos
      current = min(scenario.chorts, c => {
        if (struck.includes(c) || c.life <= 0)
          return undefined
        let d = c.pos.distance(origin)
        return d <= chainRange ? d : undefined
      })
      if (current)
        struck.push(current)
    }
    return struck
  }

  render(): void {
    let color = this.gun.shotColor?.copy() ?? rgb(1, 1, 1);
    let a = 1 - this.getAliveTime() / this.gun.duration
    color.a = a;
    for (let p = 1; p < this.points.length; p++) {
      drawLine(this.points[p - 1], this.points[p], this.gun.beam, color)
      drawLine(this.points[p - 1], this.points[p], this.gun.beam / 2, rgb(1, 1, 1, a))
    }
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

function jagged(points: Vector2[], step = 1, offset = .3) {
  let result = [points[0]]
  for (let p = 1; p < points.length; p++) {
    let start = points[p - 1]
    let delta = points[p].subtract(start)
    let normal = delta.normalize().rotate(PI / 2)
    let segments = Math.max(2, Math.ceil(delta.length() / step))
    for (let s = 1; s < segments; s++)
      result.push(start.add(delta.scale(s / segments)).add(normal.scale(rand(-offset, offset))))
    result.push(points[p])
  }
  return result
}

export class Missile extends Box2dObject {

  constructor(public gun: Gun, target: Chort) {
    super(gun.pos, vec2(gun.missileSize ?? 1), tile1(gun.missileSprite ?? 43));
    this.color = rgb(1, 1, 1);
    this.emissive = 1;
    this.renderOrder = -1
    this.addCircle(.3, vec2(), 10)
    this.isBullet = true;
    this.castShadow = false;
    this.mass = 1
    if (gun.missileDamping) {
      this.setLinearDamping(gun.missileDamping)
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

    this.setLinearVelocity(vel.add(target.getLinearVelocity()));

    this.isBullet = true;
    this.isSolid = false;

    this.setFilterData(2, 2)

    if (bulletLights) {
      let l = new Light(vec2(), 2, rgb(.3, .1, .1), 2);
      l.castShadow = false;
      this.addChild(l)
    }

    //this.isSolid = false

    /*let effect = particleEffect('trail', vec2()) as ParticleEmitter;
    effect.trailScale = 10;
    effect.emissive = 1;
    this.addChild(effect)*/
  }

  update() {
    if (this.getAliveTime() > 1) {
      this.timeout()
      return
    }

    //new TemporaryLight(this.pos, 2, .2)
  }

  beginContact(other: Box2dObject) {
    if (other instanceof Mortal) {
      if (this.gun.fire) {
        new FireTrap(this.pos, this.gun.fire, this.gun.aoe)
        this.destroy()
      } else if (this.gun.aoe) {
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



export class FireTrap extends EngineObject {
  scale = 1
  effect: ParticleEmitter
  spot: EngineObject
  frame = 0
  constructor(pos: Vector2, public dps: number, public aoe: number) {
    super(pos, vec2())
    let e = particleEffect("fire", vec2(), { scale: 3, emitTime: 10, colorStartB: RED }) as ParticleEmitter;
    e.emissive = 1;
    this.effect = e;
    this.addChild(e)
    this.spot = new EngineObject(this.pos, vec2(1), tile1(27))
    this.addChild(this.spot)
    this.spot.castShadow = false;
    let light = new Light(vec2(), 4, rgb(1, 1, 1), 4);
    this.addChild(light)
  }
  update(): void {
    this.scale += .005
    this.effect.scale = this.scale * this.aoe;

    if (this.getAliveTime() > 5)
      this.destroy()
    if (this.frame++ % 5 == 0) {
      engineObjectsCallback(this.pos, this.aoe, (o: EngineObject) => {
        if (o instanceof Chort) {
          o.hit(this.pos, this.dps, true)
        }
      })
    }
  }
}