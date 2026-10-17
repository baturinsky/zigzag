import { BLACK, drawText, engineImageFont, EngineObject, RED, rgb, vec2, Vector2, WHITE } from "littlejsengine";

export const font = engineImageFont;


export class FlyingText extends EngineObject {
  constructor(pos:Vector2, public text:string){
    super(pos, vec2())
    this.emissive = 1
  }

  render(): void {
    let alpha = 1 - this.getAliveTime();
    drawText(this.text, this.pos, .6, rgb(1,1,1,alpha), .1, rgb(0,0,0,alpha));
  }

  update(): void {
    this.pos = this.pos.add(vec2(0,.03));
    if(this.getAliveTime()>1)
      this.destroy()
  }

}