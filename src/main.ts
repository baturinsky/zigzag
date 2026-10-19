import { engineInit, drawText, drawTile, tile, vec2, setTileDefaultPadding, box2dInit, Box2dObject, Box2dWheelJoint, cameraPos, clamp, keyDirection, mouseIsDown, Color, BLUE, rand, Box2dFrictionJoint, Box2dStaticObject, Box2dJoint, PI, cameraScale, setCameraScale, textureInfos, setCanvasClearColor, hsl, rgb, lightSystem, LightSystemPlugin, mainCanvasSize, getCanvasPixelRatio, drawRect, BLACK, ParallaxLayer, keyIsDown, PostProcessPlugin, postProcessTiltShift, particleEffect, ParticleEmitter, postProcessVignette, postProcessEffects, postProcessOutline, RED, UISystemPlugin, uiSystem, Sound, canvasClearColor, UIObject, UIText, CLEAR_BLACK, UIButton, drawCircle, randInCircle, CYAN, setScene, loadAtlas, loadSprite, Box2dPlugin, Scene, Timer, readSaveData, setSoundVolume, writeSaveData } from 'littlejsengine';

import { ram, tile1, tile2 } from './engine';
import { Car, carGear, TailSegment } from './car';
import { Chort, chorts } from './chort';
import { initUI, uiInfo, uiMenu, uiGameOver, updateMenu, gameOverText, buttonToggle } from './ui';
import { loop } from './util';
import { Militia, militias } from './militia';

const saveName = "chort crusher";

export let gameOver = true;

const defaultCareer = {
  levelsCompleted: {} as { [id: string]: number },
  latestLevel: -1
}

export let career: {
  levelsCompleted: { [id: string]: number },
  latestLevel: number
} = JSON.parse(JSON.stringify(defaultCareer));


export const levels = [
  { waves: 3, interval: 30, inWave: 10, ammo: 100, brutes: .03 },
  { waves: 5, interval: 30, inWave: 20, ammo: 300, growth: 4, brutes: .04 },
  { waves: 7, interval: 30, inWave: 20, ammo: 200, growth: 4, brutes: .06 },
  { waves: 7, interval: 20, inWave: 15, ammo: 200, growth: 3, brutes: .08 },
  { waves: 25, interval: 5, inWave: 5, ammo: 200, growth: 0, brutes: .1 },
  { waves: 7, interval: 30, inWave: 10, ammo: 200, growth: 3, brutes: .5 },
]

export let currentLevel: {
  waves: number;
  interval: number;
  inWave: number;
  ammo: number;
  growth?: number
  brutes?: number
};

// each tile in tiles.png has a 1 pixel border, which stops texture bleeding
setTileDefaultPadding(1);
export let car: Car, groundObject: Box2dStaticObject, wave = 0, level = 0, gear = "None";
export const villageCenter = vec2(0, 100);
const huts: Box2dStaticObject[] = []

export let gameFrame: number, shots: number, ammoUsed: number, timer: Timer;

export function useAmmo(n = 1) {
  ammoUsed += n;
}

export function startLevel(_level: number, _gear: string) {
  gameOver = false;
  level = _level
  gear = _gear;
  currentLevel = levels[level]
  setScene(gameScene);
}

function resetLevel() {
  gameFrame = 0;
  shots = 0;
  wave = 0;
  ammoUsed = 0;
  huts.length = 0
  chorts.clear();
  militias.clear()
  timer = new Timer;
  timer.set(0)
}

function loseLevel(reason: string) {
  gameOver = true;
  gameOverText.text = `You lost. ${reason}`;
  uiGameOver.visible = true;
}

function winLevel() {
  gameOver = true;
  for (let chort of [...chorts]) {
    chort.destroy()
  }
  gameOverText.text = "You have won.\nNew Nights or Gear may be unlocked";
  career.latestLevel = Math.max(career.latestLevel, level);
  career.levelsCompleted[level + gear] = 1;
  writeSaveData(saveName, career)
  let x = {}
  x = readSaveData(saveName, defaultCareer)
  uiGameOver.visible = true;
  updateMenu()
}

export const gameScene: Scene = {

  async enter() {
    resetLevel()

    //mainCanvasSize.scale(getCanvasPixelRatio())


    const image = textureInfos[0].image; // any texture given to engineIni  t

    const floor = new ParallaxLayer(vec2(), vec2(1, 1), 0, -10,
      (context, size) => context.drawImage(image, 253, 1, 16, 16, 0, 0, 16, 16),
      vec2(16, 16));
    floor.wrapY = true;

    //groundObject = new Box2dStaticObject();
    car = new Car(vec2(0, 0));

    loop(10, i => new Militia(villageCenter.add(randInCircle(50, 30))));

    addWood()
    addHuts()
    //addChorts()

    //let foo = new EngineObject(vec2(), vec2(2,1), tile(0, vec2(36,18)))

    // called once after the engine starts up
    // setup the game
  },

  update() {

    if (gameOver)
      return;

    if (rand() < currentLevel.ammo / 10000 && ammoUsed < currentLevel.ammo && ammoUsed > 0) {
      ammoUsed--;
    }

    let lightness = Math.max(0.1, Math.cos(
      Math.min(1, timer.get() / (currentLevel.waves * currentLevel.interval)) * PI * 2
    ));

    lightSystem.ambientColor = rgb(1 * lightness, .5 * lightness, .3 * (1 - lightness));

    // called every frame at 60 frames per second
    // handle input and update the game state

    let secondsPerWave = currentLevel.interval;

    if (timer.get() > wave * secondsPerWave && wave < currentLevel.waves) {
      newWave()
    }

    if (chorts.size <= 5 && wave == currentLevel.waves && !gameOver) {
      winLevel()
    }

    //if (timer.get() > 1 && !gameOver)      winLevel()

    if (militias.size == 0 && !gameOver) {
      loseLevel("All militia is dead.")
    }

    if (car.life < 0) {
      loseLevel("Car destroyed")
    }

    gameFrame++;
    uiInfo.text =
      `
Night: ${level + 1}
Gear: ${gear}
Wave: ${wave}/${currentLevel.waves}
Until next wave: ${wave < currentLevel.waves ? (secondsPerWave - ~~timer.get() % secondsPerWave) + "s" : "-"}
Chorts: ${chorts.size}
Militia: ${militias.size}
Ammo left: ${currentLevel.ammo - ammoUsed}/${currentLevel.ammo}
`;

  },


  renderPost() {
    // called after objects are rendered
    // draw effects or hud that appear above all objects
    const radarSize = 200;
    const pos = vec2(mainCanvasSize.x - radarSize / 2 - 20, radarSize / 2 + 20);
    drawCircle(pos, radarSize, rgb(0, 0, 0, .1), 1, rgb(1, 1, 1, 1), false, true);
    drawCircle(pos, radarSize / 2, rgb(0, 0, 0, 0), 1, rgb(1, 1, 1, .5), false, true);
    drawRect(pos, vec2(radarSize, 1), rgb(1, 1, 1, .5), 0, false, true)
    drawRect(pos, vec2(1, radarSize), rgb(1, 1, 1, .5), 0, false, true)
    for (let c of [...chorts, ...militias]) {
      if (c.life > 0) {
        let p = c.pos.subtract(cameraPos);
        p.y = -p.y;
        let color = (c instanceof Chort ? RED : CYAN).copy();
        color.setAlpha(.5)
        drawRect(pos.add(p.scale(.2)), vec2(4), color, 0, false, true)
      }
    }
  }
}

function gameInit() {
  new LightSystemPlugin(vec2(1024, 1024), rgb(1, .5, 0))
  lightSystem.shadows = true;
  new UISystemPlugin();
  career = readSaveData(saveName, defaultCareer);

  initUI()
  setCameraScale(16)
  textureInfos[0].setWrap(true);
  setCanvasClearColor(rgb(.2, .4, .2))
  setSoundVolume(.5);

  new PostProcessPlugin(postProcessEffects(postProcessOutline(RED)));

  uiMenu.visible = true

  //startLevel(0, Object.keys(carGear)[0])
}


async function main() {
  await box2dInit();
  engineInit(gameInit, undefined, undefined, undefined, undefined, ['tiles.webp']);
}

main()

function newWave() {
  wave++;
  let pos = villageCenter.add(randInCircle(200, 200))
  loop(currentLevel.inWave + wave * (currentLevel.growth ?? 0), i => {
    new Chort(pos.add(randInCircle(60)), (currentLevel.brutes ?? 0) > rand() ? 2 : 1)
  })
}

function addWood() {
  let wood = tile1(12);
  wood.textureInfo.setWrap(true)

  loop(100, i => {
    let size = vec2(rand(.5, 1), rand(.5, 5)), angle = rand(PI * 2);
    let box = new Box2dObject(randInCircle(200, 100), size, wood, angle)
    box.beginContact = (otherObject: Box2dObject, fixture?: any, otherFixture?: any, impactSpeed?: number) => {
      ram(box, otherObject, impactSpeed)
    }


    box.addBox(size, vec2(), 0, .01, .5, .5);
    box.setAngularDamping(2)
    box.setLinearDamping(2)

    box.renderShadow = () => {
      drawRect(box.pos, vec2(size.x * .8, size.y * 1.1), BLACK, box.angle);
    }
  })
}


function addHuts() {
  loop(50, i => {
    let size = vec2(rand(3, 5), rand(5, 10)).scale(1.5)
    let pos = randInCircle(250, 150);
    for (let h of huts) {
      if (h.pos.distance(pos) < 10)
        return
    }
    let hut = new Box2dStaticObject(pos, size, tile(vec2(0, 3), vec2(34), 0, 1))
    hut.color = hsl(rand(PI * 2), 1, .5)
    hut.setAngle(rand(0, PI * 2))
    hut.addBox(size);
    huts.push(hut)
  })
}

function add100Chorts() {
  for (let i = 100; i--;) {
    //new Chort(vec2(rand(-50, 50), rand(-50, 50)));
    addChort()
  }
}

function addChort() {
  if (chorts.size < 100 && rand(10) < 1)
    new Chort(vec2().setAngle(rand(PI * 2), 30).add(car.pos));
}

