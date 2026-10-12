import test from 'node:test';
import assert from 'node:assert/strict';
import {createTrack,createCar,integrate,collideCars,Race,STEP,aiInput,validateProfile,updatePursuitRecords,angleDiff,wrap,clamp} from '../dist/sim.js';
import {HANDLING,getHandling,wheelSteering} from '../dist/handling.js';
import {VEHICLES} from '../dist/catalog.js';
const track=createTrack(),straight={width:10000,at:s=>({x:0,y:0,z:s,s,tx:0,tz:1,index:0,heading:0}),project:(x,z)=>({x:0,z,offset:x,s:z,index:0,dist:x*x})},empty={throttle:0,brake:0,steer:0};
test('AC-25 five setups produce different launch, braking, turn and drift behavior',()=>{
 const results=[];
 for(const v of VEHICLES){
  const c=createCar(straight,v.id,0,0,v.paint,false,v.id);for(let i=0;i<360;i++)integrate(c,{...empty,throttle:1},STEP,straight);const launch=c.speed;
  c.speed=30;for(let i=0;i<60;i++)integrate(c,{...empty,brake:1},STEP,straight);const braking=c.speed;
  c.heading=0;c.speed=25;c.steer=0;for(let i=0;i<24;i++)integrate(c,{...empty,throttle:.1,steer:.5},STEP,straight);const turn=c.heading;
  c.speed=25;c.slip=0;c.steer=1;for(let i=0;i<60;i++)integrate(c,{...empty,throttle:.3,steer:1,handbrake:true},STEP,straight);
  results.push({id:v.id,launch,braking,turn,drift:Math.abs(c.slip)});assert.ok(Number.isFinite(wheelSteering(c)));
 }
 for(const key of ['launch','braking','turn','drift'])assert.equal(new Set(results.map(r=>r[key].toFixed(4))).size,5,key+' must differ for all bodies');
 const h=results.find(r=>r.id==='hypercar'),r=results.find(r=>r.id==='rally'),m=results.find(r=>r.id==='muscle');assert.ok(r.turn>h.turn&&m.turn<h.turn);assert.ok(r.drift<h.drift&&m.drift>h.drift);assert.ok(m.braking>h.braking);
});
test('AC-25 every setup remains bounded under throttle, boost, reverse and held steering',()=>{
 for(const v of VEHICLES){const c=createCar(track,v.id,60,0,v.paint,false,v.id),h=getHandling(v.id);for(let i=0;i<3000;i++){integrate(c,{throttle:1,steer:i%600<300?1:-1,boost:true,handbrake:i%400<60},STEP,track);assert.ok(c.speed<=h.boostSpeed&&c.speed>=-10);assert.ok(Math.abs(c.offset)<=track.width/2-1.1);assert.ok(Number.isFinite(c.heading+c.x+c.z));}c.speed=0;for(let i=0;i<240;i++)integrate(c,{...empty,brake:1},STEP,track);assert.ok(c.speed<0&&c.speed>=-10);}
 assert.equal(Object.keys(HANDLING).length,5);
});
test('AC-24 wheels turn forward and reverse with the same steering geometry',()=>{
 for(const v of VEHICLES){for(const steer of [-1,1]){const forward=createCar(straight,'forward',0,0,v.paint,false,v.id),reverse=createCar(straight,'reverse',0,0,v.paint,false,v.id);forward.speed=15;reverse.speed=-8;forward.steer=reverse.steer=steer;integrate(forward,empty,STEP,straight);integrate(reverse,empty,STEP,straight);assert.ok(forward.heading*steer>0);assert.ok(reverse.heading*steer<0);assert.ok(wheelSteering(forward)*steer>0&&wheelSteering(reverse)*steer>0);}}
});
test('AC-25 all five setups finish an actual Circuit with rivals and traffic',()=>{
 for(const v of VEHICLES){const r=new Race(track);r.restart(v.paint,v.id,'circuit');for(let i=0;i<120*300&&r.phase!=='finished';i++)r.step(aiInput(r.player,track,r.cars));assert.equal(r.phase,'finished',v.id+' cannot finish');assert.equal(r.player.vehicle,v.id);assert.equal(r.player.gates,16);assert.equal(r.cars.length,8);assert.ok(r.elapsed>40&&r.elapsed<300);}
});
test('AC-26 patrol pursues a moving player and its integration is physically bounded',()=>{
 const r=new Race(track);r.restart(undefined,'rally','pursuit');r.phase='racing';let travelled=0,initial=r.police[0].s;
 for(let i=0;i<120*18&&r.phase==='racing';i++){const old=r.police[0].s;r.step(aiInput(r.player,track,r.cars));travelled+=Math.abs(wrap(r.police[0].s-old+track.length/2,track.length)-track.length/2);for(const c of r.police){assert.ok(Number.isFinite(c.x+c.z+c.heading));if(c.active){assert.ok(Math.abs(c.offset)<=track.width/2-1.1);assert.ok(c.speed<=getHandling('interceptor').boostSpeed);}}}
 assert.ok(travelled>100);assert.notEqual(r.police[0].s,initial);assert.equal(r.player.gates,0);
 const c=r.police[0],oldX=c.x,oldZ=c.z,oldSpeed=c.speed;r.step(aiInput(r.player,track,r.cars));assert.ok(Math.hypot(c.x-oldX,c.z-oldZ)<oldSpeed*STEP+3,'Active patrol must not teleport');
});
test('AC-26 reinforcements activate once, at the agreed heat times',()=>{
 const r=new Race(track);r.restart(undefined,'hypercar','pursuit');assert.deepEqual(r.police.map(c=>c.active),[true,false,false]);r.elapsed=19.99;r.activatePolice();assert.equal(r.pursuit.heat,1);r.elapsed=20;r.activatePolice();assert.equal(r.pursuit.heat,2);const c=r.police[1],position=[c.x,c.z];r.player.s+=300;r.elapsed=30;r.activatePolice();assert.deepEqual([c.x,c.z],position,'Active police must never be repositioned');r.elapsed=45;r.activatePolice();assert.equal(r.pursuit.heat,3);assert.equal(r.pursuit.peakHeat,3);assert.ok(c.speed>=18&&c.speed<=40);
});
test('AC-27 actual stationary player is caught and busted by driving police',()=>{
 const r=new Race(track);r.restart(undefined,'muscle','pursuit');for(let i=0;i<120*30&&r.phase!=='finished';i++)r.step(empty);assert.equal(r.phase,'finished');assert.equal(r.outcome,'busted');assert.ok(r.elapsed>4&&r.elapsed<30);assert.equal(r.player.gates,0);
});
test('AC-26 AC-27 all five cars can physically escape without assigning positions or disabling patrols',()=>{
 for(const v of VEHICLES){const r=new Race(track);r.restart(v.paint,v.id,'pursuit');const h=getHandling(v.id);for(let i=0;i<120*200&&r.phase!=='finished';i++){
  const input=aiInput(r.player,track,r.cars),bend=Math.abs(angleDiff(track.at(r.player.s+60).heading,track.at(r.player.s).heading)),desired=clamp(h.topSpeed*.96-bend*45,18,h.topSpeed*.96);input.throttle=r.player.speed<desired?1:.1;input.brake=r.player.speed>desired+2?.6:0;input.boost=r.pursuit.nearestDistance>45;r.step(input);
 }assert.equal(r.outcome,'escaped',v.id+' pursuit is not escapable');assert.equal(r.phase,'finished');assert.ok(r.elapsed>=28&&r.elapsed<200);assert.equal(r.player.gates,0);assert.equal(r.pursuit.escape,8);}
});
test('AC-25 closing collisions exchange momentum while parallel contact cannot stick cars',()=>{
 const a=createCar(straight,'a',60,0,undefined,false,'hypercar'),b=createCar(straight,'b',60,2,undefined,false,'muscle');a.speed=b.speed=40;collideCars(a,b);assert.equal(a.speed,40);assert.equal(b.speed,40);
 a.x=b.x=0;a.z=60;b.z=57.9;a.speed=30;b.speed=50;const before=a.speed*getHandling(a.vehicle).mass+b.speed*getHandling(b.vehicle).mass;collideCars(a,b);assert.ok(a.speed>30&&b.speed<50);const after=a.speed*getHandling(a.vehicle).mass+b.speed*getHandling(b.vehicle).mass;assert.ok(Math.abs(after-before)<1e-6);
});
test('AC-27 escape needs eight uninterrupted seconds of real separation after grace period',()=>{
 const r=new Race(track);r.restart(undefined,'hypercar','pursuit');r.phase='racing';r.player.speed=30;r.elapsed=19;r.police[0].x=r.player.x+200;r.police[0].z=r.player.z;r.updatePursuit(1);assert.equal(r.pursuit.escape,0);r.elapsed=20;
 for(let i=0;i<7;i++)r.updatePursuit(1);assert.equal(r.phase,'racing');r.police[0].x=r.player.x+119;r.updatePursuit(1);assert.equal(r.pursuit.escape,0);
 r.police[0].x=r.player.x+200;for(let i=0;i<8;i++){r.elapsed++;r.updatePursuit(1);}assert.equal(r.outcome,'escaped');assert.equal(r.phase,'finished');
 const p=validateProfile({records:{lap:90,race:180}});updatePursuitRecords(p,r);assert.equal(p.records.escape,28);assert.equal(p.records.lap,90);assert.equal(p.records.race,180);r.outcome='busted';r.elapsed=25;updatePursuitRecords(p,r);assert.equal(p.records.escape,28);
});
test('AC-27 bust drains after leaving patrol and fast reverse is not stationary',()=>{
 const r=new Race(track);r.restart(undefined,'hypercar','pursuit');r.phase='racing';r.police[0].x=r.player.x+5;r.police[0].z=r.player.z;r.updatePursuit(1);assert.equal(r.pursuit.bust,1);r.player.speed=-8;r.updatePursuit(.25);assert.equal(r.pursuit.bust,.5);r.police[0].x=r.player.x+30;r.updatePursuit(.25);assert.equal(r.pursuit.bust,0);
});
test('AC-27 pause freezes every pursuit value, recovery keeps police, restart clears outcome',()=>{
 const r=new Race(track);r.restart(undefined,'spyder','pursuit');r.phase='racing';r.elapsed=21;r.activatePolice();r.pursuit.escape=2;r.pursuit.bust=1;r.pause();const before=JSON.stringify(r);for(let i=0;i<200;i++)r.step({throttle:1,boost:true});assert.equal(JSON.stringify(r),before);r.pause();const p=track.at(300);Object.assign(r.player,{x:p.x,z:p.z,s:p.s});const cops=JSON.stringify(r.police);r.resetPlayer();assert.equal(r.player.s,300);assert.equal(r.player.speed,0);assert.equal(r.pursuit.escape,0);assert.equal(r.pursuit.bust,1);assert.equal(JSON.stringify(r.police),cops);r.outcome='busted';r.restart();assert.equal(r.mode,'pursuit');assert.equal(r.player.vehicle,'spyder');assert.equal(r.outcome,null);assert.equal(r.elapsed,0);assert.equal(r.pursuit.bust,0);assert.equal(r.pursuit.heat,1);
});
test('AC-27 AC-28 validation preserves legacy records and rejects invalid pursuit state',()=>{
 const p=validateProfile({quality:'high',records:{lap:92,race:190},mode:'bad',showPerformance:'yes'});assert.equal(p.mode,'circuit');assert.equal(p.quality,'high');assert.equal(p.showPerformance,false);assert.deepEqual(p.records,{lap:92,race:190});const next=validateProfile({mode:'pursuit',quality:'auto',showPerformance:true,records:{escape:44,lap:92}});assert.equal(next.mode,'pursuit');assert.equal(next.showPerformance,true);assert.equal(next.quality,'auto');assert.equal(next.records.escape,44);assert.equal(validateProfile({records:{escape:-10}}).records.escape,undefined);
});
