import { UIButton, vec2, UIObject, BLACK, CLEAR_BLACK, UISystemPlugin, uiSystem, Sound, setCanvasClearColor, hsl, UIText, drawCircle, RED, mainCanvasSize } from "littlejsengine";

let uiRoot: UIObject, uiMenu: UIObject;

function addButtonToggle() {
  const buttonToggle = new UIButton(vec2(20, 20), vec2(40, 40));
  buttonToggle.anchor = vec2(-1, -1);
  for (let i = -1; i <= 1; ++i) {
    const line = new UIObject(vec2(0, i * 10), vec2(26, 5));
    line.color = BLACK;
    line.gradientColor = undefined;
    line.lineWidth = 0;
    line.shadowColor = CLEAR_BLACK;
    line.canBeHover = false;
    buttonToggle.addChild(line);
  }
  buttonToggle.onClick = () => {
    uiMenu.visible = !uiMenu.visible
  }
}

class Radar extends UIObject {
  constructor() {
    super(vec2(0,0), vec2(100,100))
    this.anchor = vec2(1, -1);
  }

  
  render(): void {
    const radarSize = 3;
    const pos = vec2(mainCanvasSize.x - radarSize/2 - 10, radarSize/2 + 10);
    drawCircle(vec2(10,10), radarSize, RED)
  }
}

export function initUI() {
  new UISystemPlugin();
  uiSystem.defaultSoundPress = new Sound([.5, 0, 220]);
  uiSystem.defaultSoundClick = new Sound([.5, 0, 440]);
  uiSystem.defaultCornerRadius = 8;
  uiSystem.defaultShadowColor = BLACK;

  uiMenu = new UIObject(vec2(), vec2(700, 450));
  setCanvasClearColor(hsl(0, 0, .8))
  uiMenu.addChild(new UIText(vec2(-100, -120), vec2(450, 160),
    'LittleJS UI\nSystem Demo'));

  uiMenu.visible = false;

  addButtonToggle()
  //new Radar()
}
