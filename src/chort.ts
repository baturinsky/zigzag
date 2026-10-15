import { Box2dObject, EngineObject, Vector2, vec2, rand, PI, Light, RED } from 'littlejsengine';
import { tile1, angleDiff } from './engine';
import { car } from './main';
import { loop } from './util';
import { Mortal } from './mortal';


export let chorts = new Set<Chort>()

export class Chort extends Mortal {
  eyes: EngineObject[];
  claws: EngineObject[];
  circle

  constructor(pos: Vector2) {

    super(pos, vec2(1, 1), tile1(24));
    chorts.add(this)


    this.life = 10;

    this.circle = this.addCircle(.5, vec2(), 1, 0, .9);

    this.setAngularDamping(10);
    this.setLinearDamping(5);
    this.setAngle(rand(0, PI * 2));
    this.eyes = loop(2, i => {
      let p = vec2(.1 * (i ? 1 : -1), 0);
      let eye = new EngineObject(vec2(), vec2(.1, .1), undefined, 0, RED)
      eye.emissive = 1;
      this.addChild(eye, p)
      return eye
    });

    this.claws = loop(2, i => {
      let p = vec2(.4 * (i ? 1 : -1), 0);
      let claw = new EngineObject(vec2(), vec2(i ? 1 : -1, 1), tile1(23))
      this.addChild(claw, p)
      return claw
    })
  }

  frame = 0;
  update() {
    let toPlayer = car.pos.subtract(this.pos);
    this.frame++;

    let targetAngle = toPlayer.angle();
    let diff = angleDiff(targetAngle, this.angle);
    this.applyAngularAcceleration(diff * .5);

    //if (this.frame % 30 == 0)
    this.applyImpulse(toPlayer.normalize(.05));

    for (let i of [0, 1]) {
      (this.claws[i].localPos as Vector2).y = Math.sin(this.getAliveTime()*9 + PI * i)**3*.1      
    }
  }

  beginContact(other: any) {
    //debugger
  }

  destroy(immediate?: boolean): void {
    super.destroy(immediate)
    chorts.delete(this)
  }

  die() {
    this.setCollision(false, false, false)
    this.destroy()
  }

}

function glowingEye(e: EngineObject, p: Vector2) {
  let eye = new Light(vec2(), 3, RED);
  eye.coneAngle = .3;
  e.addChild(eye, p, .1);
  eye.glow = .2;
  return eye;
}