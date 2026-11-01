import { EngineObject, hsl, Light, rand, randBool, randInCircle, Timer, UITile, vec2, Vector2, WHITE } from "littlejsengine";
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
  basePos: Vector2

  constructor(pos: Vector2) {
    super(pos, vec2(.3), tile1(0))
    this.castShadow = false;
    let l = new Light(vec2(), 4, WHITE)
    this.addChild(l, vec2())
    l.glow = 3;
    this.light = l
    scenario.pickups.add(this)
    this.addChild(new EngineObject(vec2(), vec2(1), tile1(0)), vec2())
    this.basePos = pos.copy()
  }

  update(): void {
    //this.pos = this.basePos.add(randInCircle(.1))
    let t = this.getAliveTime()
    let hue = t;
    let color = hsl(hue, 1, .8, Math.min(1.2 - t / lifeTime, t / 2))
    this.light.color = color;
    this.color = color;

    if (t > lifeTime)
      this.destroy()

    let toCar = this.pos.distance(car.pos);

    if (toCar <= 4) {
      this.pos = this.pos.lerp(car.pos, .2).lerp(this.basePos,.05);
    }

    if (toCar < 1 && this.getAliveTime() > 2) {
      let kind = rand() < .2 ? randomElement(Object.keys(carGear), rng) : randomElement(Object.keys(weapons), rng);
      this.destroy()
      showPickupText(kind, scenario.wave + 1)
    }



  }

  destroy(immediate?: boolean): void {
    super.destroy(immediate)
    scenario.pickups.delete(this)
  }
}