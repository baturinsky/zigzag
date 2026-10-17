import { Color, drawLineList, EngineObject, rgb, vec2, Vector2 } from "littlejsengine";

export class TrailMaker extends EngineObject {
  points: Vector2[] = []
  frame = 0;

  constructor(parent: EngineObject, public width: number = 1, public color: Color = rgb(0, 0, 0)) {
    super(vec2(), vec2())
    parent.addChild(this, vec2());
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