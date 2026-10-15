import { engineInit, drawText, drawTile, tile, vec2, setTileDefaultPadding, box2dInit, Box2dObject, Box2dWheelJoint, cameraPos, clamp, keyDirection, mouseIsDown, Color, BLUE, rand, Box2dFrictionJoint, Box2dStaticObject, Box2dJoint, PI, cameraScale, setCameraScale, textureInfos, setCanvasClearColor, hsl, rgb, lightSystem, LightSystemPlugin, mainCanvasSize, getCanvasPixelRatio, drawRect, BLACK, ParallaxLayer, keyIsDown, PostProcessPlugin, postProcessTiltShift, particleEffect, ParticleEmitter, postProcessVignette, postProcessEffects, postProcessOutline, RED } from 'littlejsengine';

import { tile1, tile2 } from './engine';
import { Car } from './car';
import { Chort, chorts } from './chort';

// each tile in tiles.png has a 1 pixel border, which stops texture bleeding
setTileDefaultPadding(1);
export let car: Car, groundObject: Box2dStaticObject;


async function gameInit() {

  //mainCanvasSize.scale(getCanvasPixelRatio())
  new LightSystemPlugin(vec2(1024, 1024), rgb(.05, .05, .05))
  lightSystem.shadows = true;

  setCameraScale(16)
  textureInfos[0].setWrap(true);
  setCanvasClearColor(rgb(.2, .4, .2))

  new PostProcessPlugin(postProcessEffects(postProcessOutline(RED)));

  const image = textureInfos[0].image; // any texture given to engineInit

  const floor = new ParallaxLayer(vec2(), vec2(1, 1), 0, -10,
    (context, size) => context.drawImage(image, 253, 1, 16, 16, 0, 0, 16, 16),
    vec2(16, 16));
  floor.wrapY = true;

  await box2dInit();
  //groundObject = new Box2dStaticObject();
  car = new Car(vec2(0, 0));

  addWood()
  //addChorts()

  //let foo = new EngineObject(vec2(), vec2(2,1), tile(0, vec2(36,18)))

  // called once after the engine starts up
  // setup the game
}

function gameUpdate() {
  // called every frame at 60 frames per second
  // handle input and update the game state
  addChort()
}

function gameUpdatePost() {
  // called after physics and objects are updated
  // setup camera and prepare for render
}

function gameRender() {
  // called before objects are rendered
  // draw any background effects that appear behind objects
}

function gameRenderPost() {
  // called after objects are rendered
  // draw effects or hud that appear above all objects
}

engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, ['tiles.webp']);

function addWood() {
  let wood = tile1(12);
  wood.textureInfo.setWrap(true)

  for (let i = 300; i--;) {
    let size = vec2(rand(.5, 1), rand(.5, 5)), angle = rand(PI * 2);
    let box = new Box2dObject(vec2(rand(-200, 200), rand(-200, 200)), size, wood, angle)
    box.addBox(size, vec2(), 0, .01, .5, .5);
    box.setAngularDamping(2)
    box.setLinearDamping(2)

    box.renderShadow = () => {
      drawRect(box.pos, vec2(size.x * .8, size.y * 1.1), BLACK, box.angle);
    }

  }
}

function addChorts() {
  for (let i = 100; i--;) {
    //new Chort(vec2(rand(-50, 50), rand(-50, 50)));
    addChort()
  }
}

function addChort() {
  if (chorts.size < 100 && rand(10)<1)
    new Chort(vec2().setAngle(rand(PI * 2), 30).add(car.pos));
}