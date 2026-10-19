import { AudioDistortion, setAudioMasterEffect, Sound } from "littlejsengine";

export const soundEffects = {
  crunch: new AudioDistortion(.3)
}

export const sounds = {
  gore1: new Sound('sound/blade_hit_07.ogg'),
  gore2: new Sound('sound/blade_hit_08.ogg'),
  gore3: new Sound('sound/face_hit_finisher_73.ogg'),
  metal: new Sound('sound/metal_hit.ogg'),
  engineSound: new Sound([.5, 0, 91, , .5, .01, 2, , , , , , .14, 1, , , , , , , -150]),
  beeBuzz: new Sound([0.3, 0.05, 220, 0.1, 0.5, 0.2, 0, 1, 0, 0, 0, 0, 0, 0.2, 50]),
  cricketSound: new Sound([0.4, 0.1, 1200, 0.01, 0.05, 0.1, 0, 1, 0, 0, 0, 0, 0.2, 0.1]),
  shoot: new Sound([,,90,,.01,.03,4,,,,,,,9,50,.2,,.2,.01]),
  shoot2: new Sound([,,50,.01,,.1,1,2.5,,-2,,,0.1,1.2,,.1,,.5,.03]),
  shoot3: new Sound([1.5,,80,.16,.14,.55,4,2.58,,-1.9,,,.23,.8,62,.6,,.76,.01]),
  

}


//sounds.gore.output = soundEffects.crunch;

