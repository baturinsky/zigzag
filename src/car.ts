import { Box2dObject, Light, EngineObject, ParticleEmitter, Vector2, vec2, rgb, PI, particleEffect, keyDirection, keyIsDown, setCameraScale, cameraPos, rand, Color, Box2dRevoluteJoint, TileInfo, tile, Sound, SoundInstance, drawRect, RED, BLACK, engineObjectsCallback, lerp } from "littlejsengine";
import { ram, TemporaryLight, tile1, tile2 } from "./engine";
import { Gun, WeaponParams, weapons, makeGun, FireTrap } from "./guns";
import { Mortal } from "./mortal";
import { TrailMaker } from "./trailMaker";
import { loop } from "./util";
import { Chort } from "./chort";
import { sounds } from "./sound";
import { config } from "./config";
import { car, scenario } from "./main";

let barrel: TailSegment | undefined;

export const carGear = {
  plough: (car: Car) => {
    let chain = new TailSegment(vec2(0, -1), car, tile2(22), vec2(1, 2), vec2(.3, 2), 3);
    let rake = new TailSegment(vec2(0, -2), chain, tile(vec2(0, 4), vec2(70, 16), 0, 1),
      vec2(8, 1), vec2(8, .2), 3)
    loop(16, i => {
      let trail = new TrailMaker(rake, .2, rgb(0, 0, 0, .2));
      trail.localPos = vec2(i * .5 - 3.6, .1);
    })
  },

  chain: (car: Car) => {
    let chainLink: Box2dObject = car;
    loop(5, i => {
      chainLink = new TailSegment(vec2(0, -.7 - 1.9 * i), chainLink, tile2(22), vec2(1, 2), vec2(.3, 2), 3)
      let trail = new TrailMaker(chainLink, .2, rgb(0, 0, 0, .2));
    })
  },

  barrel: (car: Car) => {
    let chain = new TailSegment(vec2(0, -.7), car, tile2(22), vec2(1, 2), vec2(.3, 2), .5, undefined, 1)
    chain = new TailSegment(vec2(0, -2.7), chain, tile2(22), vec2(1, 2), vec2(.3, 2), .5, undefined, 1)
    barrel = new TailSegment(vec2(0, -4), chain, tile1(42), vec2(2, 2), vec2(2, 2), 3)
    barrel.renderOrder = 1
  },

  spear: (car: Car) => {
    let l = 3;
    let connectTo: Box2dObject = car;
    loop(3, i => {
      connectTo = new TailSegment(vec2(0, .9 + 1.9 * i), connectTo, tile2(i == l - 1 ? 25 : 24), vec2(1, 2),
        i == l - 1 ? vec2(1, 2) : vec2(.3, 2), .1, vec2(0, 1), .2)
      connectTo.setMass(.1)
      connectTo.setLinearDamping(0);
      (connectTo as TailSegment).damageMultiplier = i == l - 1 ? 10000 : 1000;

      if (i == l - 1) {
        new TrailMaker(connectTo, .2, rgb(0, 0, 0, .2));
        let light = new Light(vec2(), 4, rgb(1, 1, 1), 4);
        light.glow = .5
        connectTo.addChild(light, vec2(0, 1));
      }
    })
  },

  ram: (car: Car) => {
    car.maxLife = config.carLife * 3;
    car.life = car.maxLife
    car.setAngularDamping(20)
  },


}

export class TailSegment extends Box2dObject {
  damageMultiplier = 1
  joint: Box2dRevoluteJoint
  constructor(mountPoint: Vector2, connectTo: Box2dObject, tile: TileInfo, spriteSize: Vector2, size: Vector2, density: number, partCenter = vec2(0, -1), limit = .3) {
    super(mountPoint.add(partCenter), spriteSize, tile);
    this.addBox(size, vec2(), 0, 10, density);
    this.setLinearDamping(2)
    let joint = new Box2dRevoluteJoint(connectTo, this, mountPoint);
    joint.enableLimit();
    joint.setLimits(-limit, limit);
    this.joint = joint
    this.castShadow = false;
    this.renderOrder = .5
    this.isBullet = true
    this.mass /= 10;
    car.tailSegments.push(this)
  }

  beginContact(otherObject: Box2dObject, fixture?: any, otherFixture?: any, impactSpeed?: number) {
    ram(this, otherObject, (impactSpeed ?? 0) * this.damageMultiplier)
  }

}

const gunMountPoints = [
  vec2(.5, .2),
  vec2(.5, -.2),
  vec2(-.5, -.2),
]


export class Car extends Box2dObject {

  lights: Light[];
  wheels: EngineObject[];
  wheelEffects: ParticleEmitter[] = []
  guns: Gun[] = []
  engineSound?: SoundInstance
  life = 100
  maxLife = 100
  tailSegments = [] as TailSegment[]

  detachGear() {
    this.tailSegments.forEach(element => {
      element.destroy()
    });
    this.tailSegments = []
  }

  render(): void {
    super.render();
    if (this.life < this.maxLife) {
      drawRect(this.pos.add(vec2(0, 1.5)), vec2(2.02, .12), BLACK)
      drawRect(this.pos.add(vec2(0, 1.5)), vec2(2 / this.maxLife * this.life, .1), RED)
    }
  }

  trails: TrailMaker[] = []

  constructor(pos: Vector2, gear?: string) {

    super(pos, vec2(1, 2), tile2(23));
    this.renderOrder = 1


    if (!document.hidden)

      this.addBox(vec2(.8, 2), vec2(), 0, 40, 0, .9);

    this.setAngularDamping(50)

    let mainLight = new Light(vec2(), 32, rgb(.3, .3, .1));
    this.addChild(mainLight);

    barrel = undefined;

    if (gear)
      (carGear as any)[gear](this)

    this.lights = [
      vec2(.27, .65),
      vec2(-.27, .65),
      vec2(.2, -.65),
      vec2(-.2, -.65),
    ].map((v, i) => {
      let front = i < 2;
      let light = new Light(vec2(), front ? 64 : 32, i < 2 ? rgb(.8, .8, .4) : rgb(1, 0, 0), 64);
      light.coneAngle = 1;
      light.coneSoftness = 1;
      this.addChild(light, v)
      light.localAngle = front ? 0 : PI;
      light.glow = front ? 1 : .8;
      return light
    })


    this.renderShadow = () => { }
    this.emissive = .3;

    this.wheels = [
      vec2(.4, .4),
      vec2(-.4, .4),
      vec2(.4, -.4),
      vec2(-.4, -.4),
    ].map((p, i) => {
      let wheel = new EngineObject(vec2(), vec2(.5, .5), tile1(2));
      wheel.castShadow = false;
      this.addChild(wheel, p);
      this.trails.push(new TrailMaker(wheel, .2, rgb(0, 0, 0, .2)));
      return wheel
    })


    this.mountGun(makeGun("shock"), 0);

  }

  unmountGun(slot: number) {
    if (this.guns[slot]) {
      this.removeChild(this.guns[slot])
      this.guns[slot].destroy()
      delete this.guns[slot];
    }
  }

  mountGun(gunParams: WeaponParams, slot: number) {
    if (gunParams.name && gunParams.name in carGear) {
      debugger
      car.detachGear();
      (carGear as any)[gunParams.name](car);
      return;
    }

    this.unmountGun(slot)
    
    let point = gunMountPoints[slot].copy();
    let q = { pos: point, ...gunParams } as any;
    let gun = new Gun(this, q);
    this.guns[slot] = gun;
    gun.maxAngle = .3
    this.addChild(gun, point, vec2(point.x, 0).angle());
    return gun
  }

  frame = 0
  travelLightCharge = 0


  beginContact(otherObject: Box2dObject, fixture?: any, otherFixture?: any, impactSpeed?: number) {
    ram(this, otherObject, impactSpeed)
  }


  update() {
    if (scenario?.gameOver)
      return

    this.frame++;

    if (this.life < this.maxLife) {
      this.life = Math.min(this.maxLife, this.life + this.maxLife / 1e4)
    }

    let forwardInput = keyDirection().y,
      turnInput = keyDirection().x,
      brakes = keyIsDown("Space"),
      turbo = keyIsDown("ShiftLeft");

    this.trails.forEach(tr => {
      tr.color = rgb(0, 0, 0, brakes ? .5 : .2)
    })

    const vel = this.getLinearVelocity(),
      speed = vel.length();

    for (let e of this.wheelEffects) {
      e.emitRate = speed * 10;
    }

    /*if ((this.travelLightCharge += speed) > 10) {
      new TemporaryLight(this.pos, 4)
      this.travelLightCharge = 0;
    }*/

    /*if (forwardInput < 0){
      forwardInput *= .5;
      turnInput *= -1;
    }*/

    if (barrel && rand() < .2) {
      new FireTrap(barrel.pos, 1, 3)
    }

    turbo = false;

    this.applyAcceleration(vec2().setAngle(this.angle).scale(1.5 * forwardInput * (turbo ? 2 : 1) * (forwardInput < 0 ? .5 : 1)))

    let forwardAngle = vec2().setAngle(this.angle), rightAngle = vec2().setAngle(this.angle + PI / 2);

    let forwardComponent = forwardAngle.scale(vel.dot(forwardAngle));
    let sidewayComponent = rightAngle.scale(vel.dot(rightAngle));

    this.wheels.slice(0, 2).forEach(w => {
      w.localAngle = lerp(w.localAngle, Math.sign(turnInput) * .5, .3);
    })

    let directionalDampening = brakes ? [.3, .1] : [.1, 1]
    //let directionalDampening = brakes ? [1, 1] : [.1, .5]

    this.applyAcceleration(forwardComponent.scale(-directionalDampening[0] * .2))
    this.applyAcceleration(sidewayComponent.scale(-directionalDampening[1] * .2))

    //console.log(forwardComponent, sidewayComponent);

    //this.applyAngularImpulse(turnInput * vel.length() * .06)

    this.applyAcceleration(
      rightAngle.scale(turnInput * (speed ** .5) * .4 * (forwardInput < 0 ? -1 : 1)),
      this.localToWorld(vec2(0, .5)))

    //this.applyAngularAcceleration(turnInput * (speed ** .5) * .5)

    //let camPos = this.pos.add(this.getLinearVelocity().scale(.4));
    //let camPos = this.pos;
    setCameraScale(32)

    cameraPos.setFrom(this.pos)

    if (!document.hidden && !this.engineSound)
      this.engineSound = sounds.engineSound.playMusic(0.5, true) as SoundInstance;

    this.engineSound?.setRate(this.getLinearVelocity().length() / 20)
  }

  destroy(immediate?: boolean): void {
    super.destroy(immediate)
    this.engineSound?.stop()
  }
}
