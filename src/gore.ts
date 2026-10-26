import { Box2dObject, rand, rgb, TileInfo, vec2, Vector2 } from "littlejsengine";
import { fadeAndDie, tile1 } from "./engine";
import { addSplat, Splat } from "./splat";
import { config } from "./config";

export class Gore extends Box2dObject {
  duration = 10

  constructor(pos: Vector2, angle:number, tile?: TileInfo) {
    super(pos, vec2(1, 1), tile ?? tile1(23));
    this.addBox(vec2(.2,.8), vec2(), angle, 1)
    this.setAngularDamping(5);
    this.setLinearDamping(1);
  }

  update(): void {
    fadeAndDie(this);
    if(rand()<.3 * config.bloodyness)
      addSplat(this.pos, .3)
  }

}