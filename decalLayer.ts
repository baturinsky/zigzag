import { TileLayer, vec2, tile, cameraPos, abs, Vector2, glContext, TileInfo, Color } from "littlejsengine";

export class DecalLayer extends TileLayer {

  buffer: TileLayer;

  constructor(size: Vector2, renderOrder = -1, tileInfo = tile(0, 16)) {
    super(vec2(), size, tileInfo, renderOrder);
    this.pos = this.snapPos(cameraPos);

    this.buffer = new TileLayer(vec2(), size, tileInfo, renderOrder, true);
    this.buffer.render = () => { };
    
    //this.drawSize = this.size.scale(2)
  }

  snapPos(cam: Vector2) {
    return cam.subtract(this.size.scale(.5)).round()
  }

  // call once per frame after the camera has moved
  follow(cam: Vector2) {
    const c = this.pos.add(this.size.scale(.5));
    if (abs(cam.x - c.x) > this.size.x * .25 ||
      abs(cam.y - c.y) > this.size.y * .25)
      this.recenter(cam);
  }

  recenter(cam: Vector2) {
    const newPos = this.snapPos(cam);
    const shift = this.pos.subtract(newPos);
    const center = this.size.scale(.5);

    // this -> buffer, shifted
    this.buffer.redrawStart(true);
    this.buffer.drawTile(center.add(shift), this.size, new TileInfo().setFullImage(this.textureInfo));
    this.buffer.redrawEnd();

    // buffer -> this, 1:1
    this.redrawStart(true);
    this.drawTile(center, this.size, new TileInfo().setFullImage(this.buffer.textureInfo));
    this.redrawEnd();

    this.pos = newPos;
  }

}