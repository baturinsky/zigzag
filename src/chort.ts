import { Box2dObject, EngineObject, Vector2, vec2, rand, PI, Light, RED, cameraPos, particleEffect, ParticleEmitter } from 'littlejsengine';
import { tile1, angleDiff, findNearest } from './engine';
import { car, villageCenter } from './main';
import { loop } from './util';
import { Mortal } from './mortal';
import { Gore } from './gore';
import { sounds } from './sound';
import { Militia, militias } from './militia';
import { Car } from './car';



export let chorts = new Set<Chort>()

export class Chort extends Mortal {
  eyes: EngineObject[];
  claws: EngineObject[];

  constructor(pos: Vector2, scale = 1) {
    super(pos.copy(), vec2(scale), tile1(24));
    this.scale = scale
    chorts.add(this)

    this.setLife(10 * scale ** 3)

    this.addCircle(.5, vec2(), 1, 0, .9);

    this.setAngularDamping(10);
    this.setLinearDamping(5);
    this.setAngle(rand(0, PI * 2));
    this.eyes = loop(2, i => {
      let p = vec2(scale * .1 * (i ? 1 : -1), 0);
      let eye = new EngineObject(vec2(), vec2(.1, .1), undefined, 0, RED)
      eye.emissive = 1;
      this.addChild(eye, p)
      return eye
    });

    this.claws = loop(2, i => {
      let p = vec2(scale * .4 * (i ? 1 : -1), 0);
      let claw = new EngineObject(vec2(), vec2(i ? 1 : -1, 1).scale(scale), tile1(23))
      this.addChild(claw, p)
      return claw
    })
  }

  frame = 0;

  update() {
    this.frame++;

    let target: EngineObject = findNearest(militias, this.pos) as EngineObject;

    let toCar = this.pos.distance(car.pos)

    if (this.life > 0 && toCar < 1.1)  {
      car.life -= 1
      if(rand()<.3)
        sounds.metal.play(this.pos)
      //let pe = particleEffect('sparks', car.pos.lerp(this.pos, .5), {scale:2, emitTime: .1 }) as ParticleEmitter;
      //pe.emissive = 1;
    }

    if (!target || (toCar < this.pos.distance(target.pos) && toCar < 50))
      target = car;

    let toHuman = (target?.pos ?? villageCenter).subtract(this.pos);

    if (target instanceof Militia && toHuman.length() < 1.2 && this.frame % 10 == 0) {
      target.hit(this.pos, 1)
    }


    let targetAngle = toHuman.angle();
    let diff = angleDiff(targetAngle, this.angle);
    this.applyAngularAcceleration(diff * .5);

    //if (this.frame % 30 == 0)
    this.applyImpulse(toHuman.normalize(.05));

    for (let i of [0, 1]) {
      let claw = this.claws[i]
      if (claw) {
        (claw.localPos as Vector2).y = Math.sin(this.getAliveTime() * 9 + PI * i) ** 3 * .1
      }
    }

    //if(rand()<.01 && this.pos.distance(cameraPos)<20)      sounds.beeBuzz.play(this.pos)

    super.update()

  }

  beginContact(other: any) {
    //debugger
  }

  destroy(immediate?: boolean): void {
    super.destroy(immediate)
    chorts.delete(this)
  }

  die() {
    this.dying = 60
    chorts.delete(this)
    for (let eye of this.eyes)
      eye.destroy()
  }


  hit(hitPos: Vector2, _damage?: number, noBlood = false) {

    let damage = super.hit(hitPos, _damage, noBlood);
    loop(2, i => {
      let claw = this.claws[i]
      if (claw && rand(0, this.maxLife) < damage) {

        setTimeout(() => {
          new Gore(claw.pos, claw.angle)
        }, 0);

        claw.destroy()
        delete this.claws[i];
        if (this.claws.every(v => v == undefined)) {
          this.die()
        }

      }
    })
    return damage
  }

}

function glowingEye(e: EngineObject, p: Vector2) {
  let eye = new Light(vec2(), 3, RED);
  eye.coneAngle = .3;
  e.addChild(eye, p, .1);
  eye.glow = .2;
  return eye;
}