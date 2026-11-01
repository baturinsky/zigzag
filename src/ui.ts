import { UIButton, vec2, UIObject, BLACK, CLEAR_BLACK, UISystemPlugin, uiSystem, Sound, setCanvasClearColor, hsl, UIText, drawCircle, RED, mainCanvasSize, WHITE, setPaused, setSoundEnable, setSoundVolume, GREEN, rgb, UILayout, UITile } from "littlejsengine";
import { car, career, gameScene, scenario, startLevel } from "./main";
import { cap1, loop } from "./util";
import { carGear } from "./car";
import { config } from "./config";
import { WeaponParams, makeGun } from "./guns";
import { tile1 } from "./engine";

export let uiRoot: UIObject, uiMainMenu: UIObject, uiInfo: UIText, uiGameOver: UIObject, buttonToggle: UIObject, uiPickup: UIObject | undefined;

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

export function toggleMenu() {
  uiMainMenu.visible = !uiMainMenu.visible
  if (uiMainMenu.visible)
    uiGameOver.visible = false;
  setPaused(uiMainMenu.visible)
  setSoundVolume(uiMainMenu.visible ? 0 : config.defaultVolume)
}

export let gameOverText: UIText

export function initGameOverText() {
  uiGameOver = new UIObject(vec2(), vec2(600, 300));
  gameOverText = new UIText(vec2(), vec2(500, 100))
  uiGameOver.addChild(gameOverText)
  let button = new UIButton(vec2(0, 100), vec2(100, 50), "OK")
  button.onClick = () => {
    scenario.onGameOverExit()    
  }
  uiGameOver.addChild(button)
  uiGameOver.visible = false;
}

export function gunTitle(gun?: {name?:string, level?:number}) {
  return gun ? `${cap1(gun.name ?? "?")} ${gun.level}` : "-"
}

export let uiWarn:UIText;

export function initWarningText(){
  if(uiWarn)
    return
  uiWarn = new UIText(vec2(0,50), vec2(300,30), "")
  uiWarn.anchor = vec2(0,-1);
  uiWarn.textColor = WHITE;
  uiWarn.textHeight = 40;
}

export function showPickupText(name: string, level: number) {
  let gun = makeGun(name, level);
  setPaused(true)
  setSoundVolume(0)
  if (uiPickup)
    uiPickup.destroy()
  uiPickup = new UIObject(vec2(), vec2(600, 400));
  let gunText = new UIText(vec2(0, 30), vec2(500, 50), "You picked: " + gunTitle(gun))
  uiPickup.addChild(gunText)
  gunText.anchor = vec2(0, -1)
  loop(5, i => {
    if (((i == 4) != !!gun.back) && i > 0)
      return;
    let equipped = car.guns[i - 1]

    let weaponPos = [[0,0], [1,0], [1,1], [0,1]]

    let button = new UIButton(
      vec2(weaponPos[i][0] * 300 - 150 + (i == 4 ? 150 : 0), 
      weaponPos[i][1] * 80 - 40 + (i == 4 ? 25 : 0)), vec2(i == 4 ? 400 : 250, 70), i == 0 ? "Discard" :
      equipped ? "Replace\n" + gunTitle(equipped) : "Equip")
    button.textHeight = 32
    uiPickup?.addChild(button)
    let icon = new UITile(vec2(10), vec2(48), tile1(68+i))
    icon.canBeHover = false;
    icon.anchor = vec2(-1,-1);
    button.addChild(icon)
    
    button.onClick = () => {
      if (gun && (i > 0)) {
        car.mountGun(gun, i - 1)
      }
      uiPickup?.destroy();
      uiPickup = undefined
      setPaused(false)
      setSoundVolume(config.defaultVolume)
    }
  })

}




export function updateMenu() {
  if (uiMainMenu) {
    uiMainMenu.destroy()
  }

  uiMainMenu = new UIObject(vec2(), vec2(1000, 600));
  uiMainMenu.visible = false

  let layout = new UILayout(vec2(300, 100), Object.keys(carGear).length + 1, 20, 10, true);
  uiMainMenu.addChild(layout)
  layout.anchor = vec2(0, 0)


  layout.addChild(new UIObject())

  Object.keys(carGear).forEach((gear, i) => {
    let text = new UIText(vec2(), vec2(110, 35), gear);
    text.anchor = vec2(-1, -1);
    layout.addChild(text)
  })

  loop(config.levels.length, level => {
    let text = new UIText(vec2(), vec2(110, 35), `Night ${level + 1}`, "center");
    text.anchor = vec2(-1, -1);
    layout.addChild(text)

    Object.keys(carGear).forEach((gear, i) => {
      let available = i <= career.latestLevel + 1 && level <= career.latestLevel + 1;

      if (!available) {
        layout.addChild(new UIObject())
        return
      }

      let done = career.levelsCompleted[level + gear]

      let text = new UIText(vec2(), vec2(110, 35), done ? `Done` : `Play`);

      if (done) {
        text.textColor = rgb(.2, .5, .2);
        text.color = rgb(.5, 1, .5);
      }

      let button = new UIButton(vec2(180 + i * 140, 75 + level * 60), vec2(120, 40));
      button.addChild(text)
      button.anchor = vec2(-1, -1);
      layout.addChild(button)

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

  //setTimeout(() => { showPickupText("bomb", 5) }, 100);



  initWarningText()
  initGameOverText()

  if (config.survivorMode) {

  } else {
    updateMenu()
    addButtonToggle()
  }

  uiInfo = new UIText(vec2(10, 100), vec2(200, 200),
    "", "center");
  uiInfo.anchor = vec2(-1, -1);
  uiInfo.textColor = WHITE;
  uiInfo.textLineWidth = 3;

  addEventListener("keydown", e => {
    if (e.code == "KeyM")
      toggleMenu()
  })

  //new Radar()
}
