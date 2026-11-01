import { BLACK, BLUE, Box2dObject, Box2dStaticObject, cameraPos, drawCircle, drawRect, EngineObject, hsl, Light, lightSystem, particleEffect, ParticleEmitter, PI, rand, randInCircle, randInt, readSaveData, rgb, tile, Timer, vec2, Vector2, writeSaveData } from "littlejsengine";
import { Chort } from "./chort";
import { ammoUsed, car, career, saveCareer, scenario, startSurvival, toRadarPos } from "./main";
import { Militia } from "./militia";
import { config, Level } from "./config";
import { cap1, loop } from "./util";
import { tile1, ram, findNearest } from "./engine";
import { TrailMaker } from "./trailMaker";
import { gameOverText, toggleMenu, uiGameOver, uiWarn, updateMenu } from "./ui";
import { BonusPickup } from "./pickup";

export class Scenario {
  gameFrame = 0;
  shots = 0;
  wave = 0;
  ammoUsed = 0;
  gameOver = false
  timer = new Timer;
  huts: Box2dStaticObject[] = []
  chorts = new Set<Chort>()
  militias = new Set<Militia>()
  pickups = new Set<BonusPickup>()

  constructor() {
    this.timer.set(0)
  }

  onGameOverExit(){
    toggleMenu()
  }

  update() {

  }

  info() {
    return ''
  }

  win() {
  }

  lose(reason: string) {
    this.gameOver = true;
    gameOverText.text = `You lost.\n${reason}`;
    uiGameOver.visible = true;
    car.engineSound?.stop()
  }

  renderRadar() {

  }

  findChortTarget(chort: Chort): EngineObject | undefined {
    return undefined;
  }

  updateChort(chort: Chort) {

  }

}

export class SurvivalScenario extends Scenario {

  nexus: ParticleEmitter;
  nexusLight: Light;
  nexusHealth = 100;
  lastNexusAttack = 0

  lose(reason: string) {    
    super.lose(`${reason}\n\nSurvived ${this.wave} waves.`)
  }

  findChortTarget(chort: Chort) {
    return this.nexus;
  }

  updateChort(chort: Chort) {
    if (!chort.dying && chort.pos.distance(this.nexus.pos) < 3) {
      chort.die()
      console.log("Nexus attacked");
      this.nexusHealth -= chort.rank ** 2 * .3;
      this.lastNexusAttack = Date.now()
    }
  }

  onGameOverExit(){
    uiGameOver.visible = false;    
    this.gameOver = false
    startSurvival()
  }


  constructor() {
    super()

    this.nexus = particleEffect("magic", vec2(0, 0), { hue: 220, scale: 5, emitRate: 200, fadeRate: .1 }) as ParticleEmitter;
    this.nexus.emissive = 1;

    this.nexusLight = new Light(vec2(), 16, rgb(.5, .8, 1), 32)

    //setTimeout(()=>this.lose("timeout"), 20000)

  }

  renderRadar() {
    drawCircle(toRadarPos(this.nexus.pos), 10, rgb(0, 0, 0, 0), 2, rgb(0, .5, 1), false, true)
    scenario.pickups.forEach(p => {
      drawCircle(toRadarPos(p.pos), 5, rgb(1, 1, 1, 0), 1, rgb(1, 1, 1), false, true)
    })
  }

  update(): void {
    this.nexusHealth = Math.min(100, this.nexusHealth + .003);
    if (this.chorts.size == 0 || this.timer.get() > 20)
      this.newWave()

    let sinceAttack = Date.now() - this.lastNexusAttack;
    if(sinceAttack < 5000){
      uiWarn.text = `Nexus is under attack!\n${Math.ceil(this.nexusHealth)}% remaining.`
      uiWarn.textHeight = (1-sinceAttack/5000)*40;
    } else {
      uiWarn.text = ""
    }

    if (car.life < 0) {
      this.lose("Car destroyed")
    }

    if (this.nexusHealth < 0) {
      this.lose("Nexus destroyed")
    }

  }

  info() {
    return `
Nexus: ${Math.ceil(this.nexusHealth)}%
Wave: ${this.wave}
Chorts: ${this.chorts.size}
  `
  }

  newWave() {
    this.wave++;
    let mobs = 20 + this.wave * 5;
    let spawnPoint = randInCircle(100, 100)
    loop(mobs, i => {
      let titan = i == 0 && this.wave >= 10;
      let chortSize = titan ? 4 : this.bruteChance() > rand() ? 2 : 1
      let chort = new Chort(
        spawnPoint.add(randInCircle(20)),
        chortSize
      )
      chort.setLife(10 * chortSize ** 3)
      //chort.dropsBonus = rand() < chortSize ** 3 * 1e-4 ? 1 : 0
      chort.dropsBonus = i == 0 ? 1 : 0;
    })
    this.timer.set(0)
  }

  bruteChance() {
    return this.wave < 5 ? 0 : .2;
  }
}

export class UnchortedScenario extends Scenario {
  villageCenter = vec2(0, 100);
  level: Level

  constructor(public levelNumber: number, public gear: string) {
    super()
    let level = { ...config.levels[levelNumber] }
    level.ammo *= config.ammoMult;
    this.level = level

    loop(10, i => new Militia(this.villageCenter.add(randInCircle(50, 30))));

    addWood()
    addHuts(this.huts)
  }

  update() {
    if (rand() < this.level.ammo / 10000 && ammoUsed < this.level.ammo && ammoUsed > 0) {
      this.ammoUsed--;
    }

    let lightness = Math.max(0.1, Math.cos(
      Math.min(1, this.timer.get() / (this.level.waves * this.level.interval)) * PI * 2
    ));


    lightSystem.ambientColor = rgb(1 * lightness, .5 * lightness, .3 * (1 - lightness));


    if (this.timer.get() > this.wave * this.level.interval && this.wave < this.level.waves) {
      this.newWave()
    }

    if (scenario.chorts.size <= 5 && this.wave == this.level.waves && !this.gameOver) {
      this.win()
    }

    if (scenario.militias.size == 0 && !this.gameOver) {
      this.lose("All militia is dead.")
    }

    if (car.life < 0) {
      this.lose("Car destroyed")
    }

    if (car.life < 0) {
      this.lose("Car destroyed")
    }

  }

  info() {
    return `
    Night: ${this.levelNumber + 1}
    Wave: ${this.wave}/${this.level.waves}
Until next wave: ${this.wave < this.level.waves ? (this.level.interval - ~~this.timer.get() % this.level.interval) + "s" : "-"}
    Chorts: ${this.chorts.size}
    Militia: ${this.militias.size}
Ammo left: ${this.level.ammo - ammoUsed}/${this.level.ammo}
`
  }

  newWave() {
    this.wave++;
    let pos = this.villageCenter.add(randInCircle(200, 200))
    let mobs = (this.level.inWave + this.wave * (this.level.growth ?? 0)) * config.monsterNumber;
    loop(mobs, i => {
      new Chort(pos.add(randInCircle(60)), (this.level.brutes ?? 0) > rand() ? 2 : 1)
    })

  }

  findChortTarget(chort: Chort) {
    return findNearest(scenario.militias, chort.pos) as EngineObject;
  }

  win() {
    this.gameOver = true;
    for (let chort of [...chorts]) {
      chort.destroy()
    }
    gameOverText.text = "You have won.\nNew Nights or Gear may be unlocked";
    career.latestLevel = Math.max(career.latestLevel, this.levelNumber);
    career.levelsCompleted[this.levelNumber + this.gear] = 1;
    saveCareer()
    uiGameOver.visible = true;
    updateMenu()
  }

}


function addWood() {
  let wood = tile1(12);
  wood.textureInfo.setWrap(true)

  loop(100, i => {
    let size = vec2(rand(.5, 1), rand(.5, 5)), angle = rand(PI * 2);
    let box = new Box2dObject(randInCircle(200, 100), size, wood, angle)
    box.renderOrder = 1

    let trails = randInt(2, 5);
    loop(trails, i => {
      let tm = new TrailMaker(box, rand(.1, .5))
      tm.localPos = vec2(0, size.y * rand(-.5, .5));
    })

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


function addHuts(huts: EngineObject[]) {
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
