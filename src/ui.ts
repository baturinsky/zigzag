import { UIButton, vec2, UIObject, BLACK, CLEAR_BLACK, UISystemPlugin, uiSystem, Sound, setCanvasClearColor, hsl, UIText, drawCircle, RED, mainCanvasSize, WHITE, setPaused, setSoundEnable, setSoundVolume, GREEN, rgb } from "littlejsengine";
import { career, gameScene, levels, startLevel } from "./main";
import { loop } from "./util";
import { carGear } from "./car";

export let uiRoot: UIObject, uiMenu: UIObject, uiInfo: UIText, uiGameOver: UIObject, buttonToggle:UIObject;

function addButtonToggle() {
  buttonToggle = new UIButton(vec2(20, 20), vec2(40, 40));
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
  buttonToggle.onClick = toggleMenu
}

function toggleMenu() {
  uiMenu.visible = !uiMenu.visible
  if (uiMenu.visible)
    uiGameOver.visible = false;
  setPaused(uiMenu.visible)
  setSoundVolume(uiMenu.visible ? 0 : .5)
}

export let gameOverText:UIText

export function initGameOverText() {
  uiGameOver = new UIObject(vec2(), vec2(600, 300));
  gameOverText = new UIText(vec2(), vec2(500, 100))
  uiGameOver.addChild(gameOverText)
  let button = new UIButton(vec2(0, 100), vec2(100, 50), "OK")
  button.onClick = () => {
    toggleMenu()
  }
  uiGameOver.addChild(button)
  uiGameOver.visible = false;
}


export function updateMenu() {
  if (uiMenu) {
    uiMenu.destroy()
  }

  uiMenu = new UIObject(vec2(), vec2(1000, 600));
  uiMenu.visible = false

  Object.keys(carGear).forEach((gear, i) => {
    let text = new UIText(vec2(180 + i * 140, 20), vec2(110, 35), gear);
    text.anchor = vec2(-1, -1);
    uiMenu.addChild(text)
  })

  loop(levels.length, level => {
    let text = new UIText(vec2(40, 80 + level * 60), vec2(110, 35), `Night ${level + 1}`, "center");
    text.anchor = vec2(-1, -1);
    uiMenu.addChild(text)

    Object.keys(carGear).forEach((gear, i) => {
      let available = i <= career.latestLevel + 1 && level <= career.latestLevel + 1;

      if (!available)
        return

      let done = career.levelsCompleted[level + gear]

      let text = new UIText(vec2(), vec2(110, 35), done ? `Done` : `Play`);

      if (done) {
        text.textColor = rgb(.2, .5, .2);
        text.color = rgb(.5, 1, .5);
      }

      let button = new UIButton(vec2(180 + i * 140, 75 + level * 60), vec2(120, 40));
      button.addChild(text)
      button.anchor = vec2(-1, -1);
      uiMenu.addChild(button)

      button.onClick = () => {
        startLevel(level, gear)
        toggleMenu()
      }
    })

  })

}

export function initUI() {
  uiSystem.defaultSoundPress = new Sound([.5, 0, 220]);
  uiSystem.defaultSoundClick = new Sound([.5, 0, 440]);
  uiSystem.defaultCornerRadius = 8;
  uiSystem.defaultShadowColor = BLACK;
  setCanvasClearColor(hsl(0, 0, .8))

  initGameOverText()

  updateMenu()
  //  uiMenu.visible = false;

  addButtonToggle()

  uiRoot = new UIObject;
  uiRoot.anchor = vec2(0, -1);

  uiInfo = new UIText(vec2(10, 100), vec2(200, 200),
    "", "left");
  uiInfo.anchor = vec2(-1, -1);
  uiInfo.textColor = WHITE;
  uiInfo.textLineWidth = 3;

  addEventListener("keydown", e => {
    if (e.code == "KeyM")
      toggleMenu()
  })

  //new Radar()
}
