import { UIButton, vec2, UIObject, BLACK, CLEAR_BLACK, UISystemPlugin, uiSystem, Sound, setCanvasClearColor, hsl, UIText, drawCircle, RED, mainCanvasSize, WHITE, setPaused, setSoundEnable, GREEN, rgb, UILayout, UISlider, UITile, Vector2 } from "littlejsengine";
import { car, career, gameScene, scenario, settings, setVolume, startLevel, startSurvival, updateSoundVolume } from "./main";
import { cap1, loop } from "./util";
import { carGear, isCarGear } from "./car";
import { config } from "./config";
import { WeaponParams, makeGun } from "./guns";
import { tile1, tile2 } from "./engine";

export let uiRoot: UIObject, uiMainMenu: UIObject, uiInfo: UIText, uiGameOver: UIObject, buttonToggle: UIObject, uiPickup: UIObject | undefined;
let equipmentGuns: UIText[], equipmentGear: UIText, removeGearButton: UIButton;

function addMenuToggleButton() {
  buttonToggle = new UIButton(vec2(-20, 20), vec2(40, 40));
  buttonToggle.anchor = vec2(1, -1);
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
  if (uiPickup)
    return
  if(!uiMainMenu)
    updateMenu()
  uiMainMenu.visible = !uiMainMenu.visible
  if (uiMainMenu.visible)
    uiGameOver.visible = false;
  setPaused(uiMainMenu.visible)
  updateSoundVolume()
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

export function updateEquipmentUI() {
  equipmentGuns.forEach((text, slot) => text.text = gunTitle(car.guns[slot]))
  equipmentGear.text = car.gearName ? gunTitle({ name: car.gearName, level: car.gearLevel }) : "-"
  removeGearButton.visible = !!car.gearName
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
  if (uiPickup)
    uiPickup.destroy()
  uiPickup = new UIObject(vec2(), vec2(600, 400));
  updateSoundVolume()
  let gunText = new UIText(vec2(0, 30), vec2(500, 50), "You picked: " + gunTitle(gun))
  uiPickup.addChild(gunText)
  gunText.anchor = vec2(0, -1)
  let closePickup = () => {
    uiPickup?.destroy();
    uiPickup = undefined
    setPaused(false)
    updateSoundVolume()
  }
  if (gun.back && gun.name && isCarGear(gun.name)) {
    let gearName = gun.name
    let discard = new UIButton(vec2(0, -40), vec2(250, 70), "Discard")
    discard.textHeight = 32
    discard.onClick = closePickup
    uiPickup.addChild(discard)
    let equip = new UIButton(vec2(0, 40), vec2(250, 70), "Equip")
    equip.textHeight = 32
    equip.onClick = () => {
      car.mountGear(gearName, level)
      closePickup()
    }
    uiPickup.addChild(equip)
    return
  }
  loop(4, i => {
    let equipped = car.guns[i - 1]

    let weaponPos = [[0,0], [1,0], [1,1], [0,1]]

    let button = new UIButton(
      vec2(weaponPos[i][0] * 300 - 150, 
      weaponPos[i][1] * 80 - 40), vec2(250, 70), i == 0 ? "Discard" :
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
      closePickup()
    }
  })

}




export function updateMenu() {
  if (uiMainMenu) {
    uiMainMenu.destroy()
  }

  uiMainMenu = new UIObject(vec2(), vec2(800, 400));
  uiMainMenu.visible = false

  let close = new UIButton(vec2(-10, 10), vec2(30, 30), "x")
  close.anchor = vec2(1, -1)
  close.textHeight = 20
  close.onClick = toggleMenu
  uiMainMenu.addChild(close)

  let restart = new UIButton(vec2(0, -45), vec2(240, 60), "Restart")
  restart.textHeight = 28
  restart.onClick = () => {
    toggleMenu()
    uiGameOver.visible = false
    startSurvival()
  }
  uiMainMenu.addChild(restart)

  let volumeLabel = new UIText(vec2(0, 30), vec2(300, 35), "Volume")
  volumeLabel.textHeight = 26
  uiMainMenu.addChild(volumeLabel)
  let volumeSlider = new UISlider(vec2(0, 75), vec2(300, 30), settings.volume)
  volumeSlider.onChange = () => setVolume(volumeSlider.value)
  uiMainMenu.addChild(volumeSlider)
}


export function renderLevelsMenu(){
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

  //setTimeout(() => { showPickupText("ram", 1) }, 100);  

  //setTimeout(() => { showPickupText("plough", 10) }, 3000);



  initWarningText()
  initGameOverText()

  if (config.survivorMode) {
    addMenuToggleButton()
  } else {
    updateMenu()
    addMenuToggleButton()
  }

  uiInfo = new UIText(vec2(10, 10), vec2(200, 200),
    "", "left");
  uiInfo.anchor = vec2(-1, -1);
  uiInfo.textColor = WHITE;
  uiInfo.textLineWidth = 3;


    
  let uiEquipment = new UIObject(vec2(10, -10), vec2(250, 105))
  uiEquipment.anchor = vec2(-1, 1)
  uiEquipment.color = CLEAR_BLACK
  uiEquipment.gradientColor = undefined
  uiEquipment.lineWidth = 0
  uiEquipment.shadowColor = CLEAR_BLACK
  uiEquipment.canBeHover = false
  let carSprite = new UITile(vec2(0, -20), vec2(28, 56), tile2(23), rgb(1,1,1, .5))
  carSprite.canBeHover = false
  uiEquipment.addChild(carSprite)
  let equipmentText = (pos: Vector2, size: Vector2) => {
    let text = new UIText(pos, size, "-", "center")
    text.textColor = WHITE
    text.textHeight = 20
    text.textLineWidth = 3
    uiEquipment.addChild(text)
    return text
  }
  equipmentGuns = [
    equipmentText(vec2(70, -35), vec2(120, 30)),
    equipmentText(vec2(70, -5), vec2(120, 30)),
    equipmentText(vec2(-70, -5), vec2(120, 30)),
  ]
  equipmentGear = equipmentText(vec2(0, 30), vec2(180, 30))
  removeGearButton = new UIButton(vec2(105, 30), vec2(24, 24), "x")
  removeGearButton.textHeight = 18
  removeGearButton.visible = false
  removeGearButton.onClick = () => {
    car.detachGear()
    updateEquipmentUI()
  }
  uiEquipment.addChild(removeGearButton)

  addEventListener("keydown", e => {
    if (e.code == "KeyM")
      toggleMenu()
  })

  //new Radar()
}
