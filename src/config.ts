export const config = {
  bloodyness: 2,
  monsterNumber: 2,
  ammoMult: 1.5,
  decalLayerSize: 1024,
  carLife: 50,

  levels: [
    { waves: 3, interval: 30, inWave: 10, ammo: 100, brutes: .03 },
    { waves: 5, interval: 30, inWave: 20, ammo: 300, growth: 4, brutes: .04 },
    { waves: 7, interval: 30, inWave: 20, ammo: 200, growth: 4, brutes: .06 },
    { waves: 7, interval: 20, inWave: 15, ammo: 200, growth: 3, brutes: .08 },
    { waves: 25, interval: 5, inWave: 5, ammo: 200, growth: 0, brutes: .1 },
    { waves: 7, interval: 30, inWave: 10, ammo: 200, growth: 3, brutes: .5 },
  ] as Level[]

}

export type Level = {
  waves: number;
  interval: number;
  inWave: number;
  ammo: number;
  growth?: number
  brutes?: number
};