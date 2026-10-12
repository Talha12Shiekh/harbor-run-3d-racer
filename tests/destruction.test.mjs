import test from 'node:test';
import assert from 'node:assert/strict';
import {Race,createTrack,createCar,integrate,collideCars,STEP,progressCar} from '../dist/sim.js';
import {DestructionWorld,damageCar,repairCar,deformPoint,motion,heightSample,DESTRUCTION} from '../dist/destruction.js';
import {ContactFeedback} from '../dist/collisions.js';
import {getHandling} from '../dist/handling.js';
const idle={throttle:0,brake:0,steer:0};
const straight={length:1000,width:19,gates:Array.from({length:8},(_,i)=>i*125),at(s){return {x:0,y:6,z:s,heading:0,tx:0,tz:1,s,index:Math.floor(s)};},project(x,z){return {x:0,z,s:z,index:Math.floor(z),offset:x,dist:x*x};}};
const barrier={name:'masonry-barrier',barrierId:'wall',x:11.4,y:6.015,z:30,heading:0,side:1,span:6,scale:1};
function hit(c,zone,speed=20,energy=100000){const h=c.heading,local=zone==='front'?[0,2]:zone==='rear'?[0,-2]:zone==='left'?[-1,0]:[1,0];return damageCar(c,{x:c.x+local[0]*Math.cos(h)+local[1]*Math.sin(h),z:c.z-local[0]*Math.sin(h)+local[1]*Math.cos(h),closing:speed,severity:.8,kind:'impact'},energy);}

test('AC-47 damage is local, persistent and proportional to impact energy; scrapes never detach',()=>{
 for(const heading of [0,Math.PI/2,Math.PI,Math.PI*1.5])for(const zone of ['front','rear','left','right']){const c=createCar(straight,'CAR',30);c.heading=heading;assert.equal(hit(c,zone,0,1e7),false);assert.equal(c.damage.revision,0);hit(c,zone,10,18000);assert.equal(c.damage[zone],.2);for(const other of ['front','rear','left','right'].filter(z=>z!==zone))assert.equal(c.damage[other],0);hit(c,zone,20,60000);assert.ok(c.damage[zone]>.85);assert.equal(c.damage.wrecked,false);hit(c,zone,30,1e6);assert.equal(c.damage[zone],1);assert.equal(c.damage.wrecked,true);}
 const c=createCar(straight,'SCRAPE',30);for(let i=0;i<1000;i++)damageCar(c,{x:1,z:30,closing:0,severity:1,kind:'scrape'},1e8);assert.equal(c.damage.right,.28);assert.deepEqual(c.damage.parts,{});assert.equal(c.damage.wrecked,false);
});
test('AC-47 deformation preserves the undamaged body and confines a hit to its panel region',()=>{
 const c=createCar(straight,'CAR',30);assert.deepEqual(deformPoint(1,.8,2,c.damage),[1,.8,2]);hit(c,'front',20,60000);assert.ok(deformPoint(0,.7,2,c.damage)[2]<1.8);assert.deepEqual(deformPoint(0,.7,-2,c.damage),[0,.7,-2]);assert.deepEqual(deformPoint(1,.1,2,c.damage),[1,.1,2]);hit(c,'left',20,40000);assert.ok(deformPoint(-1,.7,0,c.damage)[0]>-.9);assert.deepEqual(deformPoint(1,.7,0,c.damage),[1,.7,0]);
});
test('AC-48 an intact physical wall deflects a light impact; distinct hits accumulate damage',()=>{
 const field=new DestructionWorld(straight,[barrier]),c=createCar(straight,'CAR',30);c.heading=Math.PI/2;c.x=9.1;c.speed=5;
 let events=integrate(c,idle,STEP,straight,field,1);assert.equal(events.length,1);assert.equal(events[0].broken,undefined);assert.ok(field.states.get('wall').damage>0);assert.ok(c.x<=11.4-2.28+.03);assert.ok(c.speed<=0);
 const first=field.states.get('wall').damage;c.x=9.1;c.speed=5;integrate(c,idle,STEP,straight,field,1.02);assert.equal(field.states.get('wall').damage,first);c.x=9.1;c.speed=5;integrate(c,idle,STEP,straight,field,1.3);assert.ok(field.states.get('wall').damage>first);
});
test('AC-48 a severe impact breaches the actual section, preserves outward travel and cannot hit it again',()=>{
 const field=new DestructionWorld(straight,[barrier]),c=createCar(straight,'CAR',30);c.heading=Math.PI/2;c.x=8.9;c.speed=35;
 const events=integrate(c,idle,STEP,straight,field,1);assert.equal(events.length,1);assert.equal(events[0].broken,true);assert.equal(events[0].section.barrierId,'wall');assert.equal(field.states.get('wall').broken,true);assert.ok(c.speed>30);assert.ok(c.rollSpeed>2&&c.verticalSpeed>1);assert.ok(c.x>8.9);
 c.x=11.4;c.speed=10;assert.deepEqual(integrate(c,idle,STEP,straight,field,2),[]);assert.ok(c.x>11.4);
 const feedback=new ContactFeedback(),e={...events[0],broken:false};feedback.record('wall',e,[0],1);assert.ok(feedback.record('wall',events[0],[0],1.02)?.broken,'A newly broken wall always emits its destruction event');
});
test('AC-48 a hard side collision pushes the recipient through roadside masonry',()=>{
 const field=new DestructionWorld(straight,[barrier]),a=createCar(straight,'A',30),b=createCar(straight,'B',30);Object.assign(a,{x:6.8,heading:Math.PI/2,speed:38});b.x=8.6;
 const contact=collideCars(a,b);assert.ok(contact.closing>30);assert.ok(b.kickX>17);assert.ok(Math.abs(b.rollSpeed)>.4);hit(b,'left',contact.closing,.5*getHandling(a.vehicle).mass*contact.closing**2);assert.equal(b.damage.wrecked,true);
 let breached=false;for(let i=0;i<60;i++)if(integrate(b,idle,STEP,straight,field,i*STEP).some(e=>e.broken))breached=true;
 assert.equal(breached,true);assert.equal(field.states.get('wall').broken,true);assert.ok(b.x>11.4);assert.ok(Math.abs(b.bodyRoll)>.2);
});
test('AC-49 car continues beyond the verge, falls onto actual terrain and tumbles without nonfinite state',()=>{
 const field=new DestructionWorld(straight,[],{size:2,origin:[-100,-100],extent:400,heights:[-7,-7,-7,-7]}),c=createCar(straight,'CAR',30);Object.assign(c,{x:20,y:5,heading:Math.PI/2,speed:28,verticalSpeed:2,rollSpeed:3,airborne:true});hit(c,'front',30,1e6);
 let lowest=c.y,roll=0;for(let i=0;i<1200;i++){integrate(c,idle,STEP,straight,field,i*STEP);lowest=Math.min(lowest,c.y);roll=Math.max(roll,Math.abs(c.bodyRoll));for(const key of ['x','y','z','speed','kickX','kickZ','verticalSpeed','bodyRoll','bodyPitch'])assert.ok(Number.isFinite(c[key]),key);assert.ok(c.y>=field.ground(c.x,c.z)-.001);assert.ok(Math.hypot(...Object.values(motion(c)))<=85.001);}
 assert.ok(c.x>25);assert.ok(lowest< -5);assert.ok(roll>Math.PI);assert.equal(c.offroad,true);assert.equal(c.damage.wrecked,true);assert.ok(Math.abs(c.verticalSpeed)<.3);
});
test('AC-49 ground interpolation matches the road, bank ribbon and exported height map',()=>{
 const h={size:2,origin:[0,0],extent:100,heights:[-2,-4,-6,-8]},field=new DestructionWorld(straight,[],h);assert.equal(field.ground(0,30),6.015);assert.equal(field.ground(14,30),6.015);assert.equal(field.ground(21,30),heightSample(h,21,30));assert.equal(field.ground(17.5,30),(6.015-.8)/2);assert.equal(heightSample(h,50,50),-5);
});
test('AC-50 pause freezes damage and wreck motion; R repairs without restoring barriers or granting progress',()=>{
 const race=new Race(createTrack()),p=race.player;race.phase='racing';const id=race.destruction.sections[0].id;race.destruction.states.get(id).broken=true;hit(p,'front',30,1e6);Object.assign(p,{bodyRoll:2,verticalSpeed:-7,airborne:true,kickX:10,gates:3,nextGate:4,lastCheckpoint:race.track.gates[3]});race.pause();const before=JSON.stringify(p),wall=race.destruction.states.get(id);race.step({throttle:1,steer:1});assert.equal(JSON.stringify(p),before);race.resetPlayer();assert.equal(p.damage.wrecked,false);assert.equal(p.damage.front,0);assert.equal(p.gates,3);assert.equal(p.nextGate,4);for(const key of ['bodyRoll','bodyPitch','verticalSpeed','kickX','kickZ'])assert.equal(p[key],0);assert.equal(wall.broken,true);race.restart();assert.equal(race.destruction.states.get(id).broken,false);
 const other=createCar(straight,'OTHER',30);hit(race.player,'right');assert.equal(other.damage.right,0);repairCar(race.player);assert.equal(race.player.damage.right,0);
});
test('AC-50 damaged, airborne and offroad shortcuts cannot score gates or escape a pursuit',()=>{
 for(const state of [{damage:{wrecked:true}},{airborne:true},{offset:15}]){const c=createCar(straight,'CAR',124);Object.assign(c,state,{s:126,speed:20});progressCar(c,124,20,straight);assert.equal(c.gates,0);}
 const race=new Race(createTrack());race.restart(undefined,'hypercar','pursuit');race.phase='racing';race.elapsed=40;race.police.forEach(c=>{c.active=true;c.x=10000;c.z=10000;});race.player.speed=20;
 for(const flag of ['wrecked','airborne','offroad']){race.player.damage.wrecked=flag==='wrecked';race.player.airborne=flag==='airborne';race.player.offroad=flag==='offroad';race.pursuit.escape=7.99;race.updatePursuit(.1);assert.equal(race.pursuit.escape,0);assert.equal(race.phase,'racing');}
});
test('AC-51 wrecked engine and boost controls cannot accelerate or activate Speedbreaker',()=>{
 const race=new Race(createTrack());race.phase='racing';hit(race.player,'front',30,1e6);race.player.speed=25;const before=race.elapsed;race.step({throttle:1,boost:true,breaker:true,steer:1});assert.ok(race.player.speed<25);assert.equal(race.player.boosting,false);assert.equal(race.player.breakingTime,false);assert.ok(Math.abs(race.elapsed-before-STEP)<1e-8);
});
