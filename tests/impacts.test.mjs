import test from 'node:test';
import assert from 'node:assert/strict';
import {carContact,ContactFeedback,CONTACT} from '../dist/collisions.js';
import {ImpactField,IMPACT_LIMITS,cameraRecoil} from '../dist/impacts.js';
import {impactSamples} from '../dist/impact-audio.js';
import {Sound} from '../dist/audio.js';
import {createTrack,createCar,collideCars,Race,STEP} from '../dist/sim.js';
import {getHandling} from '../dist/handling.js';
const track=createTrack(),empty={throttle:0,brake:0,steer:0};
const car=(x,z,heading=0,speed=0,vehicle='hypercar')=>({...createCar(track,'contact',0,0,undefined,false,vehicle),x,z,heading,slip:0,speed,y:1});
const contact={x:0,y:1.58,z:0,ground:1.04,nx:1,nz:0,closing:25,sliding:0,vx:0,vz:20};
const event=(severity=1,kind='impact',id=1)=>({...contact,id,kind,severity,actors:[0,1]});
const count=(field,kind)=>field.pools[kind].filter(p=>p.alive).length;

test('AC-41 bumper contacts occur at the authored body ends from all compass headings',()=>{
 for(const heading of [0,Math.PI/2,Math.PI,3*Math.PI/2]){
  const a=car(0,0,heading,40),b=car(Math.sin(heading)*4.4,Math.cos(heading)*4.4,heading,10),c=carContact(a,b);assert.ok(c);assert.ok(Math.abs(c.closing-30)<1e-6);assert.ok(Math.abs(Math.hypot(c.x,c.z)-2.2)<.02,'Contact must be near a bumper');assert.ok(c.penetration>0&&c.penetration<.2);
  collideCars(a,b);assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>4.55);b.x+=Math.sin(heading);b.z+=Math.cos(heading);assert.equal(carContact(a,b),null);
 }
});
test('AC-41 side contact, crossing contact, overlap and separating cars remain finite',()=>{
 for(const [a,b] of [[car(0,0),car(1.9,0)],[car(0,0),car(0,0,Math.PI/2)],[car(0,0),car(0,0)],[car(0,0,0,10),car(0,4.4,0,30)]]){
  const c=collideCars(a,b);assert.ok(c);assert.ok(Object.values(c).filter(v=>typeof v==='number').every(Number.isFinite));assert.ok(Number.isFinite(a.x+a.z+b.x+b.z+a.speed+b.speed));assert.equal(c.closing,0);
 }
 const a=car(0,0,0,40),b=car(2.2,0,0,40);assert.equal(carContact(a,b),null,'Parallel cars must have space to pass');
});
test('AC-41 closing impact preserves weighted forward momentum and never penalizes equal speed contact',()=>{
 const a=car(0,0,0,50),b=car(0,4.4,0,20,'muscle'),ma=getHandling(a.vehicle).mass,mb=getHandling(b.vehicle).mass,before=a.speed*ma+b.speed*mb;collideCars(a,b);assert.ok(a.speed<50&&b.speed>20);assert.ok(Math.abs(a.speed*ma+b.speed*mb-before)<1e-6);
 const c=car(0,0,0,35),d=car(0,4.4,0,35);for(let i=0;i<120;i++)collideCars(c,d);assert.equal(c.speed,35);assert.equal(d.speed,35);
});
test('AC-42 one sustained hit, stronger blow, separation and sliding have distinct cadence',()=>{
 const f=new ContactFeedback();for(let i=0;i<120;i++)f.record('pair',contact,[0,1],i/120);assert.equal(f.drain().filter(e=>e.kind==='impact').length,1);assert.equal(f.drain().length,0);
 f.record('pair',{...contact,closing:38},[0,1],1);assert.equal(f.drain().filter(e=>e.kind==='impact').length,1);f.record('pair',contact,[0,1],1.2);assert.equal(f.drain()[0].kind,'impact','Separated contacts must rearm');
 const scrape=new ContactFeedback();for(let i=0;i<120;i++)scrape.record('slide',{...contact,closing:0,sliding:15},[0,1],i/120);const events=scrape.drain();assert.ok(events.length>=10&&events.length<=13);assert.ok(events.every(e=>e.kind==='scrape'));
});
test('AC-42 silent resting overlaps and capped queues cannot replay unbounded effects',()=>{
 const f=new ContactFeedback();for(let i=0;i<100;i++)f.record('rest',{...contact,closing:0,sliding:0},[0,1],i/120);assert.equal(f.drain().length,0);
 for(let i=0;i<200;i++)f.record('pair'+i,contact,[0,1],i/120);assert.equal(f.events.length,CONTACT.maxEvents);f.clear();assert.equal(f.drain().length,0);assert.equal(f.contacts.size,0);
});
test('AC-42 actual race emits a bumper event once and clears on pause, recovery and restart',()=>{
 const r=new Race(track);r.phase='racing';const p=track.at(50),q=track.at(54.3);Object.assign(r.player,{x:p.x,z:p.z,y:p.y,s:p.s,index:p.index,heading:p.heading,speed:40});const b=r.rivals[0];Object.assign(b,{x:q.x,z:q.z,y:q.y,s:q.s,index:q.index,heading:p.heading,speed:10});for(const c of r.cars)if(c!==r.player&&c!==b)c.active=false;
 r.step(empty,STEP);const events=r.drainImpacts();assert.ok(events.some(e=>e.kind==='impact'&&e.actors.includes(0)));assert.equal(r.drainImpacts().length,0);
 r.feedback.push(event());r.pause();assert.equal(r.drainImpacts().length,0);const before=JSON.stringify(r);r.step(empty);assert.equal(JSON.stringify(r),before);r.pause();r.feedback.push(event());r.resetPlayer();assert.equal(r.drainImpacts().length,0);r.feedback.push(event());r.restart();assert.equal(r.drainImpacts().length,0);
});
test('AC-43 particles scale with strength and quality while scrape remains smaller',()=>{
 const light=new ImpactField(),heavy=new ImpactField(),low=new ImpactField(),scrape=new ImpactField(),cars=[car(0,0),car(1,0)];light.emit(event(.1),cars);heavy.emit(event(1),cars);low.emit(event(1),cars,true);scrape.emit(event(.5,'scrape'),cars);
 assert.ok(count(light,'spark')<count(heavy,'spark'));assert.ok(count(low,'spark')<=count(heavy,'spark')*.51);assert.ok(count(scrape,'spark')<count(light,'spark'));assert.equal(count(scrape,'fragment'),0);assert.equal(scrape.flash,null);
 for(let i=0;i<300;i++)heavy.emit(event(1,'impact',i+2),cars);assert.equal(heavy.pools.spark.length,IMPACT_LIMITS.sparks);assert.equal(heavy.pools.fragment.length,IMPACT_LIMITS.fragments);assert.equal(heavy.pools.dust.length,IMPACT_LIMITS.dust);
});
test('AC-43 AC-44 gravity, road bounce, pause, expiry and reduced motion have bounded state',()=>{
 const f=new ImpactField();f.emit(event(),[car(0,0),car(1,0)]);const before=JSON.stringify(f);f.update(0);assert.equal(JSON.stringify(f),before);const p=f.pools.spark.find(p=>p.alive),vy=p.vy;f.update(.02);assert.ok(p.vy<vy);for(let i=0;i<60;i++)f.update(.02);assert.ok(Object.values(f.pools).every(pool=>pool.every(p=>!p.alive)));assert.equal(f.flash,null);assert.equal(f.strength,0);
 const quiet=new ImpactField();quiet.emit(event(),[car(0,0),car(1,0)],false,true);assert.equal(quiet.flash,null);
 for(let i=0;i<100;i++){const outside=cameraRecoil(1,i/100),inside=cameraRecoil(1,i/100,true);assert.ok(Math.abs(outside.x)<=.18&&Math.abs(outside.y)<=.1);assert.ok(Math.abs(inside.x)<=.025&&Math.abs(inside.y)<=.014);assert.ok(outside.fov<=2);assert.ok(Object.values(cameraRecoil(1,i/100,true,true)).every(v=>Math.abs(v)===0));}
 f.clear();assert.equal(f.recoils.size,0);
});
test('AC-45 original sound buffers are distinct, deterministic, finite and fade to silence',()=>{
 for(const rate of [22050,44100,48000])for(const kind of ['light','heavy','scrape']){const samples=impactSamples(rate,kind),same=impactSamples(rate,kind);assert.deepEqual(samples,same);assert.equal(Math.abs(samples[0]),0);assert.ok(samples.every(v=>Number.isFinite(v)&&Math.abs(v)<=.901));assert.ok(samples.some(v=>Math.abs(v)>.1));assert.ok(Math.abs(samples.at(-1))<.004);}
 assert.ok(impactSamples(48000,'heavy').length>impactSamples(48000,'light').length);
});

class Parameter{constructor(){this.value=0;}setTargetAtTime(v){assert.ok(Number.isFinite(v));this.value=v;}}
class Node{constructor(){for(const p of ['gain','frequency','pan','playbackRate','threshold','knee','ratio','attack','release'])this[p]=new Parameter();this.starts=0;this.stops=0;this.disconnected=false;}connect(){}start(){this.starts++;}stop(){this.stops++;this.onended?.();}disconnect(){this.disconnected=true;}}
class Context{constructor(){this.currentTime=0;this.sampleRate=22050;this.destination={};this.nodes=[];this.state='running';}node(){const n=new Node();this.nodes.push(n);return n;}createGain(){return this.node();}createOscillator(){return this.node();}createBiquadFilter(){return this.node();}createBufferSource(){return this.node();}createStereoPanner(){return this.node();}createDynamicsCompressor(){return this.node();}createBuffer(n,size,rate){const data=new Float32Array(size);return {duration:size/rate,getChannelData:()=>data};}async resume(){}}
test('AC-45 impact audio follows severity, camera stereo position, distance and real node lifecycle',async()=>{
 globalThis.window={AudioContext:Context};const s=new Sound(),p=car(0,0);await s.resume();s.update(p,true);const ear={x:0,z:0,rightX:1,rightZ:0};s.contacts([{...event(.1),x:-4}],p,ear);const light=[...s.voices].at(-1);s.contacts([{...event(1),x:4,id:2}],p,ear);const heavy=[...s.voices].at(-1);assert.ok(heavy.gain.gain.value>light.gain.gain.value);assert.ok(light.panner.pan.value<0&&heavy.panner.pan.value>0);assert.notEqual(light.source.buffer,heavy.source.buffer);
 const n=s.voices.size;s.contacts([{...event(),x:100,actors:[1,2]}],p,ear);assert.equal(s.voices.size,n);heavy.source.onended();assert.equal(s.voices.size,n-1);assert.ok(heavy.source.disconnected&&heavy.gain.disconnected&&heavy.panner.disconnected);
 for(let i=0;i<50;i++)s.contacts([event(1,'impact',i)],p,ear);assert.equal(s.voices.size,10);assert.ok(s.context.nodes.filter(n=>n.stops>0).length>20);const playing=[...s.voices];s.update(p,false);assert.equal(s.voices.size,0);assert.ok(playing.every(v=>v.source.stops===1&&v.source.disconnected));
 const count=s.context.nodes.length;await s.resume();assert.equal(s.context.nodes.length,count,'Resume must reuse buffers and loop nodes');s.update(p,true);s.volume=0;s.contacts([event()],p);assert.equal(s.voices.size,0);
});
test('AC-45 scraping sustains one loop, fades without contact and cannot play while inactive',async()=>{
 globalThis.window={AudioContext:Context};const s=new Sound(),p=car(0,0);await s.resume();s.contacts([event(.6,'scrape')],p);assert.equal(s.scrape.level,0);s.update(p,true);s.contacts([event(.6,'scrape')],p);s.update(p,true);assert.ok(s.scrapeGain.gain.value>0);assert.equal(s.voices.size,0);const nodes=s.context.nodes.length;for(let i=0;i<20;i++)s.contacts([event(.6,'scrape')],p);assert.equal(s.context.nodes.length,nodes);s.context.currentTime=.2;s.update(p,true);assert.equal(s.scrapeGain.gain.value,0);s.clearContacts();assert.equal(s.scrape.level,0);
});
