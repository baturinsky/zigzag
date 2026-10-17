import { Box2dObject, rgb, TileInfo, vec2, Vector2 } from "littlejsengine";
import { fadeAndDie, tile1 } from "./engine";

export class Gore extends Box2dObject {
  duration = 10

  constructor(pos: Vector2, tile?: TileInfo) {
    super(pos, vec2(1, 1), tile  ?? tile1(24));
  }

  update(): void {
    fadeAndDie(this);
  }

}