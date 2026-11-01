import { Box2dObject, EngineObject, Vector2, vec2, rand, PI, Light, RED, cameraPos, particleEffect, ParticleEmitter, rgb } from 'littlejsengine';
import { tile1, angleDiff, findNearest } from './engine';
import { car, scenario } from './main';
import { loop } from './util';
import { Mortal } from './mortal';
import { Gore } from './gore';
import { sounds } from './sound';
import { Militia } from './militia';
import { BonusPickup } from './pickup';


export class Chort extends Mortal {
  dropsBonus = 0
  eyes: EngineObject[];
  claws: EngineObject[];
  frame = 0;
  carChase = 0;

  weight() {
    return this.scale ** 3;
  }

  constructor(pos: Vector2, public rank = 1) {
    super(pos.copy(), vec2(rank), tile1(24));
    this.scale = rank
    scenario.chorts.add(this)

    this.setLife(15 * this.weight())

    this.addCircle(1 * rank, vec2(), 1, 0, .9);
    
    this.mass = rank

    this.setAngularDamping(10);
    this.setLinearDamping(5);
    this.setAngle(rand(0, PI * 2));
    this.eyes = loop(2, i => {
      let p = vec2(rank * .1 * (i ? 1 : -1), 0);
      let eye = new EngineObject(vec2(), vec2(.1, .1), undefined, 0, RED)
      eye.emissive = 1;
      this.addChild(eye, p)
      return eye
    });

    this.claws = loop(2, i => {
      let p = vec2(rank * .4 * (i ? 1 : -1), 0);
      let claw = new EngineObject(vec2(), vec2(i ? 1 : -1, 1).scale(rank), tile1(23))
      this.addChild(claw, p)
      return claw
    })
  }

  update() {
    this.frame++;

    let target: EngineObject = scenario.findChortTarget(this) as EngineObject;

    let toCar = this.pos.distance(car.pos)

    if (this.life > 0 && toCar < 1.1) {
      car.life -= 1
      if (rand() < .3)
        sounds.metal.play(this.pos)
      //let pe = particleEffect('sparks', car.pos.lerp(this.pos, .5), {scale:2, emitTime: .1 }) as ParticleEmitter;
      //pe.emissive = 1;
    }


    if (target) {
      if (toCar < this.pos.distance(target.pos) && toCar < 50 && this.carChase < 1000) {
        target = car;

        this.carChase++;
        if (this.carChase == 1000)
          this.carChase = 3000;
      } else {
        this.carChase = Math.max(this.carChase - 1, 0);
        if (this.carChase == 1001)
          this.carChase = 0;
      }
    }

    target ??= car;

    if (target) {

      let toTarget = target?.pos.subtract(this.pos)

      if (target instanceof Militia && toTarget.length() < 1.2 && this.frame % 10 == 0) {
        target.hit(this.pos, 1)
      }

      let targetAngle = toTarget.angle();
      let diff = angleDiff(targetAngle, this.angle);
      this.applyAngularAcceleration(diff * .5);

      //if (this.frame % 30 == 0)
      this.applyAcceleration(toTarget.normalize(.3));

    }

    for (let i of [0, 1]) {
      let claw = this.claws[i]
      if (claw) {
        (claw.localPos as Vector2).y = Math.sin(this.getAliveTime() * 9 + PI * i) ** 3 * .1
      }
    }

    //if(rand()<.01 && this.pos.distance(cameraPos)<20)      sounds.beeBuzz.play(this.pos)    

    if (this.dying) {
      let color = rgb(1, 1, 1, this.dying / 60);
      [this, ...this.claws].forEach(o => { if (o) { o.color = color } });

    }

    super.update()

    scenario.updateChort(this)

  }

  beginContact(other: any) {
    //debugger
  }

  destroy(immediate?: boolean): void {
    super.destroy(immediate)
    scenario.chorts.delete(this)
  }

  die() {
    if (this.dying)
      return
    this.dying = 60
    scenario.chorts.delete(this)
    for (let eye of this.eyes)
      eye.destroy()
    if (this.dropsBonus) {
      this.dropsBonus = 0;
      new BonusPickup(this.pos);
    }

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