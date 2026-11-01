import { engineInit, drawText, drawTile, tile, vec2, setTileDefaultPadding, box2dInit, Box2dObject, Box2dWheelJoint, cameraPos, clamp, keyDirection, mouseIsDown, Color, BLUE, rand, Box2dFrictionJoint, Box2dStaticObject, Box2dJoint, PI, cameraScale, setCameraScale, textureInfos, setCanvasClearColor, hsl, rgb, lightSystem, LightSystemPlugin, mainCanvasSize, getCanvasPixelRatio, drawRect, BLACK, ParallaxLayer, keyIsDown, PostProcessPlugin, postProcessTiltShift, particleEffect, ParticleEmitter, postProcessVignette, postProcessEffects, postProcessOutline, RED, UISystemPlugin, uiSystem, Sound, canvasClearColor, UIObject, UIText, CLEAR_BLACK, UIButton, drawCircle, randInCircle, CYAN, setScene, loadAtlas, loadSprite, Box2dPlugin, Scene, Timer, readSaveData, setSoundVolume, writeSaveData, TileLayer, randInt, Light, audioContext, setSoundEnable, soundVolume, Vector2 } from 'littlejsengine';


export let bloodLayer: DecalLayer

import { ram, tile1, tile2 } from './engine';
import { Car, carGear, TailSegment } from './car';
import { Chort } from './chort';
import { initUI, uiInfo, uiMainMenu, uiGameOver, updateMenu, gameOverText, buttonToggle } from './ui';
import { loop, scale } from './util';
import { DecalLayer } from '../decalLayer';
import { addSplat } from './splat';
import { config, Level } from './config';
import { TrailMaker } from './trailMaker';
import { Scenario, SurvivalScenario, UnchortedScenario } from './scenario';
import { Gun } from './guns';

//const saveName = "chort crusher";
export const saveName = "chort survivor";

export let scenario: Scenario;

export function saveCareer() {
  writeSaveData(saveName, career)
  let x = {}
  x = readSaveData(saveName, defaultCareer)
}

const defaultCareer = {
  levelsCompleted: {} as { [id: string]: number },
  latestLevel: -1
}



export let career: {
  levelsCompleted: { [id: string]: number },
  latestLevel: number
} = JSON.parse(JSON.stringify(defaultCareer));


// each tile in tiles.png has a 1 pixel border, which stops texture bleeding
setTileDefaultPadding(1);
export let car: Car, levelNumber = 0, gear = "None";

export let gameFrame: number, shots: number, ammoUsed: number;

export function useAmmo(n = 1) {
  ammoUsed += n;
}

export function ammoLeft(gun: Gun) {
  return true
}

export function startLevel(_level: number, _gear: string) {
  levelNumber = _level
  gear = _gear;
  //scenario = new UnchortedScenario(levelNumber, gear);
  setScene(gameScene);
  scenario = new SurvivalScenario();
  bloodLayer = new DecalLayer(vec2(config.decalLayerSize), 0)
  bloodLayer.castShadow = false
}

  
export function startSurvival() {
  setScene(gameScene);
  scenario = new SurvivalScenario();
  bloodLayer = new DecalLayer(vec2(config.decalLayerSize), 0)
  bloodLayer.castShadow = false
}

export const gameScene: Scene = {

  async enter() {

    //mainCanvasSize.scale(getCanvasPixelRatio())


    const image = textureInfos[0].image; // any texture given to engineIni  t

    const floor = new ParallaxLayer(vec2(), vec2(1, 1), 0, -10,
      (context, size) => context.drawImage(image, 253, 1, 16, 16, 0, 0, 16, 16),
      vec2(16, 16));
    floor.wrapY = true;

    car = new Car(vec2(0, 0));

    //groundObject = new Box2dStaticObject();
    //addChorts()

    //let foo = new EngineObject(vec2(), vec2(2,1), tile(0, vec2(36,18)))

    // called once after the engine starts up
    // setup the game
  },

  update() {

    if (scenario.gameOver)
      return;



    // called every frame at 60 frames per second
    // handle input and update the game state

    scenario.update()

    //if (timer.get() > 1 && !gameOver)      winLevel()


    gameFrame++;
    uiInfo.text = scenario.info();

  },


  renderPost() {
    if (scenario) {
      // called after objects are rendered
      // draw effects or hud that appear above all objects

      scenario.renderRadar()

      const radarSize = 200;
      const pos = vec2(mainCanvasSize.x - radarSize / 2 - 20, radarSize / 2 + 20);
      drawCircle(pos, radarSize, rgb(0, 0, 0, .1), 1, rgb(1, 1, 1, 1), false, true);
      drawCircle(pos, radarSize / 2, rgb(0, 0, 0, 0), 1, rgb(1, 1, 1, .5), false, true);
      drawRect(pos, vec2(radarSize, 1), rgb(1, 1, 1, .5), 0, false, true)
      drawRect(pos, vec2(1, radarSize), rgb(1, 1, 1, .5), 0, false, true)

      for (let c of [...scenario.chorts, ...scenario.militias]) {
        if (c.life > 0) {
          let color = (c instanceof Chort ? RED : CYAN).copy();
          color.setAlpha(.5)
          drawRect(toRadarPos(c.pos), vec2(4), color, 0, false, true)
        }
      }
    }


    //bloodLayer.follow(cameraPos)

    //bloodLayer.drawTile(car.pos, vec2(1), tile1(4))

    //addSplat(car.pos)

  }
}

export function toRadarPos(p: Vector2) {
  const radarSize = 200;
  const center = vec2(mainCanvasSize.x - radarSize / 2 - 20, radarSize / 2 + 20);
  p = p.subtract(cameraPos);
  p.y = -p.y;
  p = center.add(p.scale(.2))
  return p;
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

  if (!config.survivorMode)
    uiMainMenu.visible = true

  startSurvival()
  //startLevel(0, Object.keys(carGear)[0])
}


async function main() {
  await box2dInit();
  engineInit(gameInit, undefined, undefined, undefined, undefined, ['tiles.webp']);
}

main()

let savedVolume = soundVolume;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    savedVolume = soundVolume;
    setSoundVolume(0);
  }
  else
    setSoundVolume(savedVolume);
});