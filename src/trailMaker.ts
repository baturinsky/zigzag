import { Color, drawLineList, EngineObject, PI, rgb, vec2, Vector2 } from "littlejsengine";
import { bloodLayer } from "./main";

export class LinesTrailMaker extends EngineObject {
  points: Vector2[] = []
  frame = 0;

  constructor(parent: EngineObject, public width: number = 1, public color: Color = rgb(0, 0, 0)) {
    super(vec2(), vec2())
    parent.addChild(this, vec2());
    this.castShadow = false
  }

  update(): void {
    this.points.push(this.pos.copy())
    if (this.points.length > 1000)
      this.points.shift()
  }

  render(): void {
    drawLineList(this.points, this.width, this.color)
  }
}

export class TrailMaker extends EngineObject {
  lastPos: Vector2 | undefined

  frame = 0;

  constructor(parent: EngineObject, public width: number = .2, public color: Color = rgb(0, 0, 0, .2)) {
    super(vec2(), vec2())
    parent.addChild(this, vec2());
    this.castShadow = false
  }

  update(): void {
  }

  render(): void {
    if (this.lastPos && this.lastPos.distance(this.pos)>0) {
      let d = this.pos.subtract(this.lastPos);
      bloodLayer.drawRect(this.pos.lerp(this.lastPos, .5), vec2(d.length(), this.width), this.color, d.angle()+PI/2)
    }
    this.lastPos = this.pos.copy()
  }
}