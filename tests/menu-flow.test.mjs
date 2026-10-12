// Exercise actual app event handlers in a small DOM fixture. No browser layout/GPU claim.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import * as sim from '../dist/sim.js';
import * as catalog from '../dist/catalog.js';
import * as handling from '../dist/handling.js';
import * as cameras from '../dist/cameras.js';
import * as navigation from '../dist/navigation.js';
const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
const code=(await readFile(new URL('../dist/app.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'');
class Element{
 constructor(tag='DIV'){this.tagName=tag.toUpperCase();this.children=[];this.hidden=false;this.open=false;this.dataset={};this.attributes={};this.value='';this.textContent='';const css={};this.style={setProperty(k,v){css[k]=v;},getPropertyValue(k){return css[k];}};}
 append(...children){this.children.push(...children);}
 replaceChildren(...children){this.children=children;}
 setAttribute(k,v){this.attributes[k]=String(v);}
 getAttribute(k){return this.attributes[k]??null;}
 addEventListener(){}
 focus(){this.focused=true;this.onFocus?.(this);}
 showModal(){this.open=true;}
 close(){this.open=false;}
 getContext(){return new Proxy({},{get(){return ()=>{};},set(){return true;}});}
}
async function app(saved=null){
 const ids=new Map([...html.matchAll(/<([\w-]+)[^>]*id="([^"]+)"[^>]*>/g)].map(m=>{const e=new Element(m[1]);e.hidden=/\bhidden\b/.test(m[0]);return [m[2],e];}));
 for(const view of ['front','rear','left','right','angle','orbit']){const b=new Element('button');b.dataset.view=view;b.setAttribute('aria-pressed',view==='orbit');ids.get('cameraChoices').append(b);}
 let data=saved?JSON.stringify(saved):null;const listeners={},pad={index:0,mapping:'standard',axes:[0],buttons:Array.from({length:16},()=>({value:0}))};
 class World{constructor(){this.followInitialized=false;this.calls=[];}setQuality(){}setDrivingView(id){this.drivingView=id;this.calls.push(['drivingCamera',id]);}rotateCamera(delta){this.trackingYaw=cameras.wrapYaw((this.trackingYaw??-.72)+delta);}async load(progress){progress(1);}setVehicle(id){this.calls.push(['car',id]);}setEnvironment(id){this.calls.push(['scene',id]);}setGarageView(id){this.calls.push(['camera',id]);}setPaint(){}attachCars(){this.calls.push(['attach']);}impact(events){this.impacts=events;}clearImpacts(){this.impacts=[];this.clears=(this.clears??0)+1;}audioListener(){return {x:7,z:9,rightX:1,rightZ:0};}update(){}resize(){}}
 class Sound{constructor(){this.contactsSeen=[];this.clears=0;}resume(){return Promise.resolve();}update(car,active){this.active=active;}contacts(events,car,listener){this.contactsSeen.push({events,listener});}clearContacts(){this.clears++;}}
 const doc={activeElement:null};const create=tag=>{const e=new Element(tag);e.onFocus=element=>doc.activeElement=element;return e;};for(const e of ids.values())e.onFocus=element=>doc.activeElement=element;for(const e of ids.get('cameraChoices').children)e.onFocus=element=>doc.activeElement=element;
 const context=vm.createContext({...sim,...catalog,...handling,...cameras,...navigation,World,Sound,console,performance:{now:()=>0},matchMedia:()=>({matches:false}),navigator:{getGamepads:()=>[pad]},localStorage:{getItem:()=>data,setItem(k,v){data=v;}},window:{},document:Object.assign(doc,{getElementById:id=>ids.get(id),createElement:create,createElementNS:(ns,tag)=>create(tag),addEventListener:(name,handler)=>listeners[name]=handler,documentElement:{requestFullscreen:async()=>{}}}),addEventListener:(name,handler)=>listeners[name]=handler,requestAnimationFrame(){},location:{reload(){}},innerWidth:1366,innerHeight:768});
 vm.runInContext(code,context);await new Promise(resolve=>setImmediate(resolve));
 return {ids,context,game:context.window.harborRun,pad,listeners,saved:()=>JSON.parse(data)};
}
test('AC-22 title, optional briefing, car and scene choices lead into a real countdown',async()=>{
 const a=await app();assert.ok(a.game);assert.equal(a.ids.get('title').hidden,false);a.ids.get('enterGarage').onclick();assert.equal(a.ids.get('briefing').hidden,false);a.ids.get('skipBriefing').onclick();assert.equal(a.ids.get('menu').hidden,false);assert.equal(a.saved().onboardingVersion,1);
 a.ids.get('vehicleChoices').children.find(b=>b.dataset.vehicle==='rally').onclick();a.ids.get('sceneChoices').children.find(b=>b.dataset.environment==='night').onclick();assert.equal(a.saved().vehicle,'rally');assert.equal(a.saved().environment,'night');assert.equal(a.ids.get('vehicle').value,'rally');assert.equal(a.ids.get('environment').value,'night');assert.equal(a.ids.get('carName').textContent,'Kestrel R4');a.ids.get('start').onclick();assert.equal(a.game.race.phase,'countdown');assert.equal(a.ids.get('hud').hidden,false);
});
test('AC-22 returning drivers skip onboarding and can revisit briefing and title',async()=>{
 const a=await app({onboardingVersion:1,vehicle:'muscle',environment:'night'});a.ids.get('enterGarage').onclick();assert.equal(a.ids.get('menu').hidden,false);a.ids.get('briefingButton').onclick();assert.equal(a.ids.get('briefing').hidden,false);a.ids.get('continueBriefing').onclick();assert.equal(a.ids.get('menu').hidden,false);a.ids.get('cameraChoices').children[0].onclick();assert.equal(a.game.world.calls.at(-1)[0],'camera');assert.equal(a.ids.get('cameraChoices').children[0].getAttribute('aria-pressed'),'true');a.ids.get('titleButton').onclick();assert.equal(a.ids.get('title').hidden,false);assert.equal(a.game.race.phase,'menu');
});
test('AC-22 Enter and gamepad Start advance onboarding without racing behind it',async()=>{
 const a=await app();const enter=()=>a.listeners.keydown({code:'Enter',repeat:false,target:{tagName:'DIV'},preventDefault(){}});enter();assert.equal(a.ids.get('briefing').hidden,false);assert.equal(a.game.race.phase,'menu');enter();assert.equal(a.ids.get('menu').hidden,false);assert.equal(a.game.race.phase,'menu');enter();assert.equal(a.game.race.phase,'countdown');
 const b=await app();let time=16;const press=()=>{b.pad.buttons[9].value=1;b.context.frame(time);time+=16;b.pad.buttons[9].value=0;b.context.frame(time);time+=16;};press();assert.equal(b.ids.get('briefing').hidden,false);assert.equal(b.game.race.phase,'menu');press();assert.equal(b.ids.get('menu').hidden,false);press();assert.equal(b.game.race.phase,'countdown');
});

test('left and right keys steer toward the matching side of the chase view',async()=>{
 const a=await app({onboardingVersion:1});a.ids.get('enterGarage').onclick();a.ids.get('start').onclick();a.game.race.phase='racing';
 for(const [key,expected] of [['ArrowLeft',1],['KeyA',1],['ArrowRight',-1],['KeyD',-1]]){
  a.listeners.keydown({code:key,repeat:false,target:{tagName:'CANVAS'},preventDefault(){}});
  const input=vm.runInContext('readInput()',a.context);
  // The car faces +Z. From behind, +X appears on the left of the screen.
  assert.equal(input.steer,expected,key+' is reversed in the chase camera');
  const car=sim.createCar(a.game.track,'direction',60);car.speed=20;const heading=car.heading;
  for(let i=0;i<12;i++)sim.integrate(car,input,sim.STEP,a.game.track);
  assert.ok(sim.angleDiff(car.heading,heading)*expected>0,'The key must turn the car');
  a.listeners.keyup({code:key});
 }
 a.pad.axes[0]=-1;assert.equal(vm.runInContext('readInput()',a.context).steer,1,'Left stick is reversed');
 a.pad.axes[0]=1;assert.equal(vm.runInContext('readInput()',a.context).steer,-1,'Right stick is reversed');
});
test('AC-24 opposed keys, stick dead zone, D pad and focus loss cannot leave steering held',async()=>{
 const a=await app({onboardingVersion:1});a.ids.get('enterGarage').onclick();a.ids.get('start').onclick();a.game.race.phase='racing';
 const press=code=>a.listeners.keydown({code,repeat:false,target:{tagName:'CANVAS'},preventDefault(){}}),input=()=>vm.runInContext('readInput()',a.context);
 press('ArrowLeft');press('ArrowRight');assert.equal(input().steer,0);a.listeners.keyup({code:'ArrowRight'});assert.equal(input().steer,1);a.listeners.keyup({code:'ArrowLeft'});a.pad.axes[0]=.08;assert.equal(input().steer,0);a.pad.buttons[14].value=1;assert.equal(input().steer,1);a.pad.buttons[14].value=0;a.pad.buttons[15].value=1;assert.equal(input().steer,-1);a.pad.buttons[15].value=0;press('KeyW');press('KeyD');a.listeners.blur();assert.equal(a.game.race.phase,'paused');assert.equal(input().steer,0);assert.equal(input().throttle,0);
});
test('AC-25 AC-26 every car and setting selects correct physics before Pursuit countdown',async()=>{
 const a=await app({onboardingVersion:1});a.ids.get('enterGarage').onclick();a.ids.get('pursuitMode').onclick();
 for(const v of catalog.VEHICLES)for(const setting of catalog.SETTINGS){a.ids.get('vehicleChoices').children.find(b=>b.dataset.vehicle===v.id).onclick();a.ids.get('sceneChoices').children.find(b=>b.dataset.environment===setting.id).onclick();assert.equal(a.game.race.player.vehicle,v.id);assert.equal(a.saved().mode,'pursuit');assert.equal(a.saved().environment,setting.id);a.ids.get('start').onclick();assert.equal(a.game.race.mode,'pursuit');assert.equal(a.game.race.player.vehicle,v.id);assert.equal(a.game.race.rivals.length,0);assert.equal(a.game.race.police.length,3);assert.equal(a.game.race.phase,'countdown');vm.runInContext('garage()',a.context);}
 a.ids.get('circuitMode').onclick();assert.equal(a.game.race.mode,'circuit');assert.equal(a.saved().mode,'circuit');assert.equal(a.game.race.rivals.length,3);assert.equal(a.ids.get('pursuitFacts').hidden,true);
});
test('AC-27 actual pursuit HUD and escape/bust result handlers use separate real records',async()=>{
 const a=await app({onboardingVersion:1,mode:'pursuit',records:{lap:90,race:180}});a.ids.get('enterGarage').onclick();a.ids.get('start').onclick();a.game.race.phase='racing';a.game.race.elapsed=36;Object.assign(a.game.race.pursuit,{heat:2,peakHeat:2,nearestDistance:140,escape:3,bust:0});vm.runInContext('hud()',a.context);assert.equal(a.ids.get('circuitStatus').hidden,true);assert.equal(a.ids.get('pursuitStatus').hidden,false);assert.equal(a.ids.get('heat').textContent,'2 / 3');assert.equal(a.ids.get('contactDistance').textContent,'140 m');assert.equal(a.ids.get('escapeProgress').value,3);
 a.game.race.phase='finished';a.game.race.outcome='escaped';vm.runInContext('finish()',a.context);assert.equal(a.ids.get('resultEyebrow').textContent,'PURSUIT ESCAPED');assert.equal(a.ids.get('standings').hidden,true);assert.equal(a.ids.get('resultLap').textContent,'2 / 3');assert.equal(a.saved().records.escape,36);assert.equal(a.saved().records.lap,90);assert.equal(a.saved().records.race,180);
 a.ids.get('raceAgain').onclick();assert.equal(a.game.race.pursuit.heat,1);a.game.race.phase='finished';a.game.race.outcome='busted';a.game.race.elapsed=12;vm.runInContext('finish()',a.context);assert.equal(a.ids.get('resultEyebrow').textContent,'BUSTED');assert.equal(a.saved().records.escape,36);
 a.ids.get('showPerformance').checked=true;a.ids.get('showPerformance').onchange();assert.equal(a.saved().showPerformance,true);a.ids.get('quality').value='auto';a.ids.get('quality').onchange();assert.equal(a.saved().quality,'auto');
});

test('AC-34 arrows change every garage choice through real handlers without starting the event',async()=>{
 const a=await app({onboardingVersion:1});a.ids.get('enterGarage').onclick();
 const key=code=>a.listeners.keydown({code,repeat:false,target:{tagName:'BUTTON'},preventDefault(){}});
 key('ArrowUp');key('ArrowLeft');assert.equal(a.game.world.calls.at(-1)[1],'angle');
 key('ArrowUp');key('ArrowRight');assert.equal(a.saved().paint,sim.PAINTS[1]);
 key('ArrowUp');key('ArrowRight');assert.equal(a.saved().environment,'alpine');
 key('ArrowUp');key('ArrowRight');assert.equal(a.saved().vehicle,'spyder');
 key('ArrowUp');key('ArrowRight');assert.equal(a.saved().mode,'pursuit');
 key('Enter');assert.equal(a.game.race.phase,'menu');
 assert.equal(vm.runInContext('readInput()',a.context).steer,0);
 a.ids.get('start').focus();key('Enter');assert.equal(a.game.race.phase,'countdown');
 assert.equal(vm.runInContext('readInput()',a.context).throttle,0);
});
test('AC-34 gamepad menu direction is an edge and held menu controls must release before driving',async()=>{
 const a=await app({onboardingVersion:1});a.ids.get('enterGarage').onclick();
 const input=()=>vm.runInContext('readInput()',a.context);
 a.ids.get('vehicleChoices').children[0].focus();a.pad.axes[0]=1;input();assert.equal(a.saved().vehicle,'spyder');input();input();assert.equal(a.saved().vehicle,'spyder');
 a.pad.axes[0]=0;input();a.pad.axes[0]=1;input();assert.equal(a.saved().vehicle,'interceptor');
 a.ids.get('start').focus();a.pad.buttons[0].value=1;input();assert.equal(a.game.race.phase,'countdown');a.game.race.phase='racing';assert.equal(input().steer,0);assert.equal(input().handbrake,false);
 a.pad.buttons[0].value=0;a.pad.axes[0]=0;input();a.pad.axes[0]=-1;assert.equal(input().steer,1);
});
test('AC-30 V, LB and HUD cycle views while rear hold and angle adjustment preserve event state',async()=>{
 const a=await app({onboardingVersion:1});a.ids.get('enterGarage').onclick();a.ids.get('start').onclick();a.game.race.phase='racing';
 const press=(code,repeat=false)=>a.listeners.keydown({code,repeat,target:{tagName:'CANVAS'},preventDefault(){}}),input=()=>vm.runInContext('readInput()',a.context);
 input();const before=JSON.stringify(a.game.race);
 for(const view of ['wide','tracking','hood','cockpit','chase']){press('KeyV');assert.equal(a.saved().camera,view);assert.equal(a.game.world.drivingView,view);assert.ok(a.ids.get('cameraButton').textContent.includes(cameras.drivingView(view).label));}
 assert.equal(JSON.stringify(a.game.race),before);press('KeyV',true);assert.equal(a.saved().camera,'chase');
 a.pad.buttons[4].value=1;input();assert.equal(a.saved().camera,'wide');input();assert.equal(a.saved().camera,'wide');a.pad.buttons[4].value=0;input();
 a.ids.get('cameraButton').onclick();assert.equal(a.saved().camera,'tracking');assert.equal(a.ids.get('angleControls').hidden,false);
 const yaw=a.saved().trackingYaw;a.ids.get('cameraRight').onclick();assert.ok(Math.abs(a.saved().trackingYaw-yaw-.18)<1e-10);
 press('KeyC');assert.equal(input().rear,true);assert.equal(a.saved().camera,'tracking');a.listeners.keyup({code:'KeyC'});assert.equal(input().rear,false);
 press('BracketLeft');assert.equal(input().orbit,-1);a.listeners.keyup({code:'BracketLeft'});assert.equal(input().orbit,0);
});
test('AC-35 saved camera is restored and native dialog controls cannot drive or navigate behind it',async()=>{
 const a=await app({onboardingVersion:1,camera:'cockpit',trackingYaw:18,records:{lap:91,race:190,escape:46}});assert.equal(a.game.world.drivingView,'cockpit');assert.ok(Math.abs(a.game.world.trackingYaw)<=Math.PI);a.ids.get('enterGarage').onclick();
 a.ids.get('settingsButton').onclick();const mode=a.game.race.mode;
 a.listeners.keydown({code:'ArrowRight',repeat:false,target:{tagName:'SELECT'},preventDefault(){throw Error('Native field was intercepted');}});
 assert.equal(a.game.race.phase,'menu');assert.equal(a.game.race.mode,mode);a.ids.get('drivingCamera').value='hood';a.ids.get('drivingCamera').onchange();assert.equal(a.saved().camera,'hood');a.ids.get('closeDetails').onclick();a.ids.get('start').onclick();assert.equal(a.game.world.drivingView,'hood');assert.equal(a.saved().records.escape,46);
 const bad=sim.validateProfile({camera:'bad',trackingYaw:Infinity,records:{race:190}});assert.equal(bad.camera,'chase');assert.equal(bad.trackingYaw,-.72);assert.equal(bad.records.race,190);
});

test('AC-42 AC-45 real displayed frames drain contacts once and recovery clears both feedback channels',async()=>{
 const a=await app({onboardingVersion:1});a.ids.get('enterGarage').onclick();a.ids.get('start').onclick();a.game.race.phase='racing';for(const car of a.game.race.cars)car.active=false;
 const e={id:8,kind:'impact',actors:[0,1],x:0,y:1,z:0,ground:0,nx:1,nz:0,closing:20,sliding:0,vx:0,vz:15,severity:.8};a.game.race.feedback.push(e);a.context.frame(16);assert.equal(a.game.world.impacts.length,1);const sound=vm.runInContext('sound',a.context);assert.equal(sound.contactsSeen.at(-1).events.length,1);assert.equal(sound.contactsSeen.at(-1).listener.x,7);a.context.frame(32);assert.equal(a.game.world.impacts.length,0);assert.equal(sound.contactsSeen.at(-1).events.length,0);
 const cleared=sound.clears;a.game.race.feedback.push(e);a.listeners.keydown({code:'KeyR',repeat:false,target:{tagName:'CANVAS'},preventDefault(){}});assert.equal(a.game.race.drainImpacts().length,0);assert.equal(sound.clears,cleared+1);assert.ok(a.game.world.clears>0);a.listeners.blur();a.context.frame(48);assert.equal(sound.active,false);assert.equal(a.game.race.phase,'paused');
});
