import { engineInit, drawText, drawTile, tile, vec2, setTileDefaultPadding, box2dInit, Box2dObject, Box2dWheelJoint, cameraPos, clamp, keyDirection, mouseIsDown, RED, Vector2, Color, BLUE, rand, Box2dFrictionJoint, Box2dStaticObject, Box2dJoint, PI, EngineObject, cameraScale, setCameraScale, textureInfos, setCanvasClearColor, hsl, rgb, lightSystem, LightSystemPlugin, Light, mainCanvasSize, getCanvasPixelRatio, drawRect, BLACK, ParallaxLayer, keyIsDown, PostProcessPlugin, postProcessTiltShift, particleEffect, ParticleEmitter } from 'littlejsengine';

import { loop } from './util'

// each tile in tiles.png has a 1 pixel border, which stops texture bleeding
setTileDefaultPadding(1);
let car: CarObject, groundObject: Box2dStaticObject;

async function gameInit() {

  //mainCanvasSize.scale(getCanvasPixelRatio())
  new LightSystemPlugin(vec2(512, 512), rgb(.05, .05, .05))
  lightSystem.shadows = true;
  //new PostProcessPlugin(postProcessTiltShift(.5, .2, 8));

  setCameraScale(16)
  textureInfos[0].setWrap(true);
  setCanvasClearColor(rgb(.2, .4, .2))

  const image = textureInfos[0].image; // any texture given to engineInit

  const floor = new ParallaxLayer(vec2(), vec2(2, 2), 0, -10,
    (context, size) => context.drawImage(image, 253, 1, 16, 16, 0, 0, 16, 16),
    vec2(16, 16));
  floor.wrapY = true;

  await box2dInit();
  //groundObject = new Box2dStaticObject();
  car = new CarObject(vec2(0, 0));

  addWood()

  //let foo = new EngineObject(vec2(), vec2(2,1), tile(0, vec2(36,18)))

  // called once after the engine starts up
  // setup the game
}

function gameUpdate() {
  // called every frame at 60 frames per second
  // handle input and update the game state
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
  let wood = tile(12, vec2(16, 16), 0, 1);
  wood.textureInfo.setWrap(true)

  for (let i = 300; i--;) {
    let size = vec2(rand(1, 3), rand(1, 10)), angle = rand(6.3);
    let box = new Box2dObject(vec2(rand(-100, 100), rand(-100, 100)), size, wood, angle)
    box.addBox(size, vec2(), 0, .01, .5, .5);
    box.setAngularDamping(2)
    box.setLinearDamping(2)

    box.renderShadow = () => {
      drawRect(box.pos, vec2(size.x * .8, size.y * 1.1), BLACK, box.angle);
    }

  }
}

class TrailLight extends Light {
  constructor(pos: Vector2) {
    super(pos, 0, rgb(.3, .1, .1))
  }

  update(): void {
    let t = this.getAliveTime() / 1.5
    if (t > 1) {
      this.destroy();
    } else {
      this.radius = 6 * (1 - t);
      this.fadeRange = this.radius;
    }
  }
}

class CarObject extends Box2dObject {

  lights: Light[];
  wheels: EngineObject[];

  constructor(pos: Vector2) {

    super(pos, vec2(1, 2), tile(20, vec2(16, 34), 0, 1));

    this.addBox(vec2(1.4, .9), vec2(), 0, 1, 0, .9);
    this.setMass(1)
    this.setAngularDamping(5)

    this.lights = [
      vec2(.15, .62),
      vec2(-.15, .62),
      vec2(.15, -.62),
      vec2(-.15, -.62),
    ].map((v, i) => {
      let light = new Light(vec2(), i < 2 ? 64 : 32, i < 2 ? rgb(1, 1, .5) : rgb(1, 0, 0), 64);
      light.coneAngle = 1;
      light.coneSoftness = 1;
      this.addChild(light, v)
      light.localAngle = PI / 2 * (i < 2 ? 1 : -1);
      light.glow = 1
      return light
    })


    this.renderShadow = () => {
      return
      drawRect(this.pos.add(vec2(0, .7).rotate(this.angle)), vec2(this.size.x, this.size.y * .2), BLACK, this.angle);
      drawRect(this.pos.add(vec2(0, -.7).rotate(this.angle)), vec2(this.size.x, this.size.y * .2), BLACK, this.angle);
      drawRect(this.pos, vec2(this.size.x * .2, this.size.y * .5), BLACK, this.angle);
    }


    this.wheels = [
      vec2(.35, .35),
      vec2(-.35, .35),
      vec2(.35, -.35),
      vec2(-.35, -.35),
    ].map((p, i) => {
      let wheel = new EngineObject(vec2(), vec2());
      wheel.castShadow = false;
      this.addChild(wheel, p);
      if (i >= 2) {
        let effect = particleEffect('fire', wheel.pos, { scale: 2, hue: -.1, saturation: 2, speed: 0 }) as ParticleEmitter;
        effect.renderOrder = -1;
        effect.emissive = 1;
        wheel.addChild(effect)
      }
      return wheel
    })


    /*let joint = new Box2dFrictionJoint(groundObject, this)
    joint.setMaxForce(20);
    joint.setMaxTorque(20);*/

  }

  frame = 0

  update() {



    this.frame++;
    new TrailLight(this.pos)

    const forwardInput = keyDirection().y,
      turnInput = keyDirection().x,
      brakes = keyIsDown("Space"),
      turbo = keyIsDown("ShiftLeft");

    this.applyImpulse(vec2().setAngle(this.angle).scale(forwardInput * (turbo ? 5 : 2)))

    let vel = this.getLinearVelocity();
    let forwardAngle = vec2().setAngle(this.angle), rightAngle = vec2().setAngle(this.angle + PI / 2);

    let forwardComponent = forwardAngle.scale(vel.dot(forwardAngle));
    let sidewayComponent = rightAngle.scale(vel.dot(rightAngle));

    let directionalDampening = brakes ? [.04, .01] : [.01, .1]

    this.applyImpulse(forwardComponent.scale(-directionalDampening[0]))
    this.applyImpulse(sidewayComponent.scale(-directionalDampening[1]))

    //console.log(forwardComponent, sidewayComponent);

    //this.applyAngularImpulse(turnInput * vel.length() * .06)

    this.applyImpulse(rightAngle.scale(turnInput * vel.length() * .03), this.localToWorld(vec2(0, .35)))

    //let camPos = this.pos.add(this.getLinearVelocity().scale(.4));
    let camPos = this.pos;
    setCameraScale(32)

    cameraPos.setFrom(this.pos)

  }
}