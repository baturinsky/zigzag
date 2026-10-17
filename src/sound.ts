import { AudioDistortion, setAudioMasterEffect, Sound } from "littlejsengine";

export const soundEffects = {
  crunch: new AudioDistortion(.3)
}

export const sounds = {
  gore1: new Sound('sound/blade_hit_07.ogg'),
  gore2: new Sound('sound/blade_hit_08.ogg'),
  gore3: new Sound('face_hit_finisher_73.ogg')
}


//sounds.gore.output = soundEffects.crunch;

