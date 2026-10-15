import { Box2dObject, Light, EngineObject, ParticleEmitter, Vector2, vec2, rgb, PI, particleEffect, keyDirection, keyIsDown, setCameraScale, cameraPos, rand, Color } from "littlejsengine";
import { TemporaryLight, tile2 } from "./engine";
import { Gun, GunParams } from "./guns";
import { Mortal } from "./mortal";

const guns: {[name: string]: GunParams} = {
  uzi: { rof: 10, damage: 6 },
  shotgun: { damage: 5, spread: 10, burst: 12, rof: 1 },
  grenade: { rof: 1, damage: 10, aoe: 5, damping: 5 },
  laser: { rof: 10, damage: 6, beam: .2, spread: 0, shotColor: rgb(1, 0, 0) },
}

export class Car extends Box2dObject {

  lights: Light[];
  wheels: EngineObject[];
  wheelEffects: ParticleEmitter[] = []
  guns: Gun[]

  constructor(pos: Vector2) {

    super(pos, vec2(1, 2), tile2(20));

    this.addBox(vec2(.6, 1.6), vec2(), 0, 1, 0, .9);

    this.setAngularDamping(5)

    let mainLight = new Light(vec2(), 32, rgb(.3, .3, .1));
    this.addChild(mainLight);

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
      other.hitBy(this, other.nearestPointTo(this.pos))
    }
  }

  getDamage(){
    return this.getLinearVelocity().length()
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

    this.applyImpulse(vec2().setAngle(this.angle).scale(forwardInput * (turbo ? 2 : 1)))

    let forwardAngle = vec2().setAngle(this.angle), rightAngle = vec2().setAngle(this.angle + PI / 2);

    let forwardComponent = forwardAngle.scale(vel.dot(forwardAngle));
    let sidewayComponent = rightAngle.scale(vel.dot(rightAngle));

    let directionalDampening = brakes ? [.04, .01] : [.01, .1]

    this.applyImpulse(forwardComponent.scale(-directionalDampening[0]))
    this.applyImpulse(sidewayComponent.scale(-directionalDampening[1]))

    //console.log(forwardComponent, sidewayComponent);

    //this.applyAngularImpulse(turnInput * vel.length() * .06)

    this.applyImpulse(rightAngle.scale(turnInput * (speed ** .5) * .05), this.localToWorld(vec2(0, .35)))

    //let camPos = this.pos.add(this.getLinearVelocity().scale(.4));
    let camPos = this.pos;
    setCameraScale(32)

    cameraPos.setFrom(this.pos)

  }
}

