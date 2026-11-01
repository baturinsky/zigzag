import { EngineObject, hsl, Light, rand, randBool, Timer, vec2, Vector2, WHITE } from "littlejsengine";
import { tile1 } from "./engine";
import { car, scenario } from "./main";
import { showPickupText } from "./ui";
import { randomElement, rng } from "./util";
import { makeGun, weapons } from "./guns";
import { carGear } from "./car";

const lifeTime = 20;

export class BonusPickup extends EngineObject {
  timer = new Timer()
  light: Light;

  constructor(pos: Vector2) {
    super(pos, vec2(.3), tile1(0))
    this.timer.set();
    this.castShadow = false;
    let l = new Light(vec2(), 4, WHITE)
    this.addChild(l, vec2())
    l.glow = 2;
    this.light = l
    scenario.pickups.add(this)
  }

  update(): void {
    let t = this.timer.get()
    let hue = t;
    let color = hsl(hue, 1, .8, 1.2 - t / lifeTime)
    this.light.color = color;
    this.color = color;

    if (t > lifeTime)
      this.destroy()

    if (!car || this.pos.distance(car.pos) < 2) {
      let kind = rand()<1?randomElement(Object.keys(weapons), rng):randomElement(Object.keys(carGear), rng);
      this.destroy()
      showPickupText(kind, scenario.wave + 1)
    }
  }

  destroy(immediate?: boolean): void {
    super.destroy(immediate)
    scenario.pickups.delete(this)
  }
}