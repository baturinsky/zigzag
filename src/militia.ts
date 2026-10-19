import { Light, PI, Vector2, rand, rgb, vec2 } from "littlejsengine";
import { angleDiff, findNearest, tile1 } from "./engine";
import { Mortal } from "./mortal";
import { Gun, guns } from "./guns";
import { Chort, chorts } from "./chort";
import { randomElement } from "./util";


export let militias = new Set<Militia>()

export class Militia extends Mortal {

  gun: Gun

  constructor(pos: Vector2) {
    super(pos.copy(), vec2(1, 1), tile1(26));
    militias.add(this)

    this.setLife(100)

    this.addCircle(.5, vec2(), 1, 0, .9);

    this.setAngularDamping(10);
    this.setLinearDamping(200);
    this.setMass(200)
    this.setAngle(rand(0, PI * 2));

    let gun = new Gun(this, /*randomElement(Object.entries(guns))*/ guns.revolver);
    this.addChild(gun, vec2(0, .5));

    this.gun = gun

    let light = new Light(vec2(), 20, rgb(1, 1, .5));
    light.coneAngle = .2;
    this.addChild(light, vec2(0, .6))
    light.localAngle = 0;
    light.glow = .6;

  }

  update() {
    let chort = findNearest(chorts, this.pos)
    if (chort) {
      let toChort = chort.pos.subtract(this.pos);
      let targetAngle = toChort.angle();
      //this.setAngle(targetAngle)
      let diff = angleDiff(targetAngle, this.angle);
      this.applyAngularAcceleration(diff * .5);
    }
    if(this.life<=0)
      debugger
  }

  destroy(immediate?: boolean): void {
    super.destroy(immediate)
    militias.delete(this)
  }

}