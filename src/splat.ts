import { cameraPos, Color, EngineObject, hsl, PI, rand, randInCircle, rgb, vec2, Vector2 } from "littlejsengine";
import { fadeAndDie, tile1 } from "./engine";
import { bloodLayer } from "./main";

export function addSplat(pos: Vector2, size = 1) {
  bloodLayer.drawTile(
    pos.add(randInCircle(size)), 
    vec2(size), 
    tile1(25),
    hsl(rand(), rand(.5, 1), rand(.8,1.3)), 
    rand(0, PI * 2)
  )
}

export class Splat extends EngineObject {
  duration = 6

  constructor(pos: Vector2, size = 1) {
    size *= rand(.5, 1.5);
    super(pos.copy(), vec2(size), tile1(25), rand(0, PI * 2))
    this.castShadow = false
    if (this.pos.distance(cameraPos) > 40)
      this.destroy()
  }

  update(): void {
    fadeAndDie(this);
  }
}