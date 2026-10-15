import { ASSERT, drawTile, EngineObject, engineObjectsCallback, hsl, Particle, ParticleEmitter, percent, Sound, tile, vec2, Vector2 } from "littlejsengine";
import { tile1 } from "./engine";

export const sound_shoot =        new Sound([,,90,,.01,.03,4,,,,,,,9,50,.2,,.2,.01]);
export const sound_destroyObject =new Sound([.5,,1e3,.02,,.2,1,3,.1,,,,,1,-30,.5,,.5]);
export const sound_die =          new Sound([.5,.4,126,.05,,.2,1,2.09,,-4,,,1,1,1,.4,.03]);
export const sound_jump =         new Sound([.4,.2,250,.04,,.04,,,1,,,,,3]);
export const sound_dodge =        new Sound([.4,.2,150,.05,,.05,,,-1,,,,,4,,,,,.02]);
export const sound_walk =         new Sound([.3,.1,50,.005,,.01,4,,,,,,,,10,,,.5]);
export const sound_explosion =    new Sound([2,.2,72,.01,.01,.2,4,,,,,,,1,,.5,.1,.5,.02]);
export const sound_grenade =      new Sound([.5,.01,300,,,.02,3,.22,,,-9,.2,,,,,,.5]);
export const sound_score =        new Sound([,,783,,.03,.02,1,2,,,940,.03,,,,,.2,.6,,.06]);


export const persistentParticleDestroyCallback = (particle:Particle)=>
{
    // draw particle to tile layer on death
    ASSERT(!particle.tileInfo, 'quick draw to tile layer uses canvas 2d so must be untextured');
    if (particle.groundObject)
    {
        drawTile(particle.pos, particle.size, particle.tileInfo, particle.color, particle.angle, particle.mirror);
    }
}


export function makeBlood(pos:Vector2, amount:number) { makeDebris(pos, hsl(0,1,.5), amount, .1, 0); }
export function makeDebris(pos:Vector2, color = hsl(), amount = 50, size=.2, restitution = .3)
{
    const color2 = color.lerp(hsl(), .5);
    const emitter = new ParticleEmitter(
        pos, 0, .5, .1, amount/.1, 3.14, // pos, angle, size, time, rate, cone
        tile(12, vec2(16, 16), 0, 1) ,                     // tileInfo
        color, color2,         // colorStartA, colorStartB
        color, color2,         // colorEndA, colorEndB
        3, size,size, .1, .05, // time, sizeStart, sizeEnd, speed, angleSpeed
        1, .95, .4, 3.14, 0,   // damp, angleDamp, gravity, particleCone, fade
        .5, true                  // randomness, collide
    );
    emitter.restitution = restitution;
    emitter.particleDestroyCallback = persistentParticleDestroyCallback;
    return emitter;
}

export function explosion(pos:Vector2, radius=3)
{
    ASSERT(radius > 0);

    sound_explosion.play(pos);
    // kill/push objects
    engineObjectsCallback(pos, radius*6, (o:EngineObject|any)=> 
    {
        const damage = radius*2;
        const d = o.pos.distance(pos);
        if (o.isGameObject && o.damage)
        {
            // do damage
            d < radius && o.damage(damage);
        }

        // push
        const p = percent(d, 2*radius, radius);
        const force = o.pos.subtract(pos).normalize(p*radius*.2);
        o.applyForce(force);
    });

    // smoke
    new ParticleEmitter(
        pos, 0,                       // pos, angle
        radius/2, .2, 50*radius, 3.14,// emitSize, emitTime, rate, cone
        tile1(0),                            // tileInfo
        hsl(0,0,0), hsl(0,0,0),       // colorStartA, colorStartB
        hsl(0,0,0,0), hsl(0,0,0,0),   // colorEndA, colorEndB
        1, .5, 2, .2, .05,    // time, sizeStart, sizeEnd, speed, angleSpeed
        .9, 1, -.3, 3.14, .1, // damp, angleDamp, gravity, particleCone, fade
        .5, false, false, false, 1e8      // randomness, collide, additive, colorLinear, renderOrder
    );

    // fire
    new ParticleEmitter(
        pos, 0,                         // pos, angle
        radius/2, .1, 100*radius, 3.14, // emitSize, emitTime, rate, cone
        tile1(0),                              // tileInfo
        hsl(.07,1,.55),   hsl(0,1,.55),   // colorStartA, colorStartB
        hsl(.07,1,.55,0), hsl(0,1,.55,0), // colorEndA, colorEndB
        .7, .8, .2, .2, .05,   // time, sizeStart, sizeEnd, speed, angleSpeed
        .9, 1, -.2, 3.14, .05, // damp, angleDamp, gravity, particleCone, fade
        .5, false, true, false, 1e9       // randomness, collide, additive, colorLinear, renderOrder
    );
}
