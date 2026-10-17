import { Box2dObject, Light, EngineObject, ParticleEmitter, Vector2, vec2, rgb, PI, particleEffect, keyDirection, keyIsDown, setCameraScale, cameraPos, rand, Color, Box2dRevoluteJoint, TileInfo, tile, Sound, SoundInstance } from "littlejsengine";
import { TemporaryLight, tile2 } from "./engine";
import { Gun, GunParams } from "./guns";
import { Mortal } from "./mortal";
import { TrailMaker } from "./trailMaker";
import { loop } from "./util";
import { Chort } from "./chort";
import { sounds } from "./sound";

const guns: { [name: string]: GunParams } = {
  uzi: { rof: 10, damage: 6 },
  shotgun: { damage: 5, spread: 10, burst: 12, rof: 1 },
  grenade: { rof: 1, damage: 10, aoe: 5, damping: 5 },
  laser: { rof: 10, damage: 6, beam: .2, spread: 0, shotColor: rgb(1, 0, 0) },
}

export class TailSegment extends Box2dObject {
  constructor(top: Vector2, connectTo: Box2dObject, tile: TileInfo, spriteSize: Vector2, size: Vector2, density: number) {
    super(top.add(vec2(0, -1)), spriteSize, tile);
    this.addBox(size, vec2(), 0, 10, density);
    this.setLinearDamping(2)
    let joint = new Box2dRevoluteJoint(connectTo, this, top);
    joint.enableLimit();
    joint.setLimits(-.8, .8);
    this.castShadow = false;
  }

  beginContact(otherObject: Box2dObject, fixture?: any, otherFixture?: any, impactSpeed?: number) {
    if ((otherObject instanceof Chort) && impactSpeed) {
      otherObject.hit(this.pos, impactSpeed * this.getMass() * .1)
    }
  }
}

function connectChain(connectTo: Box2dObject) {
  loop(5, i => {
    connectTo = new TailSegment(vec2(0, -1 - 2 * i), connectTo, tile2(22), vec2(1, 2), vec2(.3, 2), 3)
  })
}

function connectRake(connectTo: Box2dObject) {
  connectTo = new TailSegment(vec2(0, -1), connectTo, tile2(22), vec2(1, 2), vec2(.3, 2), 3);
  let rake = new TailSegment(vec2(0, -2), connectTo, tile(vec2(0, 4), vec2(70, 16), 0, 1),
    vec2(8, 1), vec2(8, .2), 3)
  loop(16, i => {
    let trail = new TrailMaker(rake, .2, rgb(0, 0, 0, .2));
    trail.localPos = vec2(i * .5 - 3.6, .1);
  })
}

export class Car extends Box2dObject {

  lights: Light[];
  wheels: EngineObject[];
  wheelEffects: ParticleEmitter[] = []
  guns: Gun[] = []
  engineSound:SoundInstance

  constructor(pos: Vector2) {

    super(pos, vec2(1, 2), tile2(23));


    // Play engine sound (loop)
    this.engineSound = sounds.engineSound.playMusic(0.5, true) as SoundInstance;

    this.addBox(vec2(.6, 1.6), vec2(), 0, 40, 0, .9);

    this.setAngularDamping(50)

    let mainLight = new Light(vec2(), 32, rgb(.3, .3, .1));
    this.addChild(mainLight);

    connectRake(this)


    this.lights = [
      vec2(.27, .65),
      vec2(-.27, .65),
      vec2(.2, -.65),
      vec2(-.2, -.65),
    ].map((v, i) => {
      let front = i < 2;
      let light = new Light(vec2(), front ? 64 : 32, i < 2 ? rgb(1, 1, .5) : rgb(1, 0, 0), 64);
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
      vec2(.35, .35),
      vec2(-.35, .35),
      vec2(.35, -.35),
      vec2(-.35, -.35),
    ].map((p, i) => {
      let wheel = new EngineObject(vec2(), vec2());
      wheel.castShadow = false;
      this.addChild(wheel, p);
      new TrailMaker(wheel, .2, rgb(0, 0, 0, .2));
      if (i >= 2 && false) {
        let effect = particleEffect('trail', vec2(), {
          scale: 2,
          hue: -.1,
          saturation: 2,
          speed: 0,
          velocityInheritance: .2,
          trailScale: 1
        }) as ParticleEmitter;
        effect.renderOrder = -1;
        effect.emissive = 1;
        this.wheelEffects.push(effect);
        wheel.addChild(effect)
      }
      return wheel
    })

    if (false)
      this.guns = [
        { pos: vec2(-.5, -.2), ...guns.grenade },
        { pos: vec2(.5, .2), ...guns.laser },
        //{ pos: vec2(.5, -.2), ...guns.uzi },
      ].map((p, i) => {
        let q = { ...p } as any;
        delete q.pos;
        let gun = new Gun(this, q);
        this.addChild(gun, p.pos);
        gun.localAngle = vec2(p.pos.x, 0).angle();
        return gun
      })


    /*let joint = new Box2dFrictionJoint(groundObject, this)
    joint.setMaxForce(20);
    joint.setMaxTorque(20);*/

  }

  frame = 0
  travelLightCharge = 0

  beginContact(other: Box2dObject) {
    if (other instanceof Mortal) {
      other.hit(other.nearestPointTo(this.pos))
    }
  }

  update() {

    this.frame++;

    const forwardInput = keyDirection().y,
      turnInput = keyDirection().x,
      brakes = keyIsDown("Space"),
      turbo = keyIsDown("ShiftLeft");

    const vel = this.getLinearVelocity(),
      speed = vel.length();

    for (let e of this.wheelEffects) {
      e.emitRate = speed * 10;
    }

    /*if ((this.travelLightCharge += speed) > 10) {
      new TemporaryLight(this.pos, 4)
      this.travelLightCharge = 0;
    }*/

    this.applyAcceleration(vec2().setAngle(this.angle).scale(1.5 * forwardInput * (turbo ? 2 : 1)))

    let forwardAngle = vec2().setAngle(this.angle), rightAngle = vec2().setAngle(this.angle + PI / 2);

    let forwardComponent = forwardAngle.scale(vel.dot(forwardAngle));
    let sidewayComponent = rightAngle.scale(vel.dot(rightAngle));

    //let directionalDampening = brakes ? [.5, .05] : [.1, 1]
    let directionalDampening = brakes ? [1, 1] : [.1, 1]

    this.applyAcceleration(forwardComponent.scale(-directionalDampening[0] * .2))
    this.applyAcceleration(sidewayComponent.scale(-directionalDampening[1] * .2))

    //console.log(forwardComponent, sidewayComponent);

    //this.applyAngularImpulse(turnInput * vel.length() * .06)

    this.applyAcceleration(rightAngle.scale(turnInput * (speed ** .5) * .3), this.localToWorld(vec2(0, .35)))

    //let camPos = this.pos.add(this.getLinearVelocity().scale(.4));
    let camPos = this.pos;
    setCameraScale(32)

    cameraPos.setFrom(this.pos)

    this.engineSound.setRate(this.getLinearVelocity().length()/20)

  }
}

