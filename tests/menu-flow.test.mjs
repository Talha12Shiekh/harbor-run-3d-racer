// Exercise actual app event handlers in a small DOM fixture. No browser layout/GPU claim.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import * as sim from '../dist/sim.js';
import * as catalog from '../dist/catalog.js';
const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
const code=(await readFile(new URL('../dist/app.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'');
class Element{
 constructor(tag='DIV'){this.tagName=tag.toUpperCase();this.children=[];this.hidden=false;this.open=false;this.dataset={};this.attributes={};this.value='';this.textContent='';const css={};this.style={setProperty(k,v){css[k]=v;},getPropertyValue(k){return css[k];}};}
 append(...children){this.children.push(...children);}
 replaceChildren(...children){this.children=children;}
 setAttribute(k,v){this.attributes[k]=String(v);}
 getAttribute(k){return this.attributes[k];}
 addEventListener(){}
 focus(){this.focused=true;}
 showModal(){this.open=true;}
 close(){this.open=false;}
 getContext(){return new Proxy({},{get(){return ()=>{};},set(){return true;}});}
}
async function app(saved=null){
 const ids=new Map([...html.matchAll(/<([\w-]+)[^>]*id="([^"]+)"[^>]*>/g)].map(m=>{const e=new Element(m[1]);e.hidden=/\bhidden\b/.test(m[0]);return [m[2],e];}));
 for(const view of ['front','rear','left','right','angle','orbit']){const b=new Element('button');b.dataset.view=view;ids.get('cameraChoices').append(b);}
 let data=saved?JSON.stringify(saved):null;const listeners={},pad={index:0,mapping:'standard',axes:[0],buttons:Array.from({length:10},()=>({value:0}))};
 class World{constructor(){this.followInitialized=false;this.calls=[];}setQuality(){}async load(progress){progress(1);}setVehicle(id){this.calls.push(['car',id]);}setEnvironment(id){this.calls.push(['scene',id]);}setGarageView(id){this.calls.push(['camera',id]);}setPaint(){}attachCars(){this.calls.push(['attach']);}update(){}resize(){}}
 class Sound{resume(){return Promise.resolve();}update(){}}
 const context=vm.createContext({...sim,...catalog,World,Sound,console,performance:{now:()=>0},matchMedia:()=>({matches:false}),navigator:{getGamepads:()=>[pad]},localStorage:{getItem:()=>data,setItem(k,v){data=v;}},window:{},document:{getElementById:id=>ids.get(id),createElement:tag=>new Element(tag),createElementNS:(ns,tag)=>new Element(tag),addEventListener(){},documentElement:{requestFullscreen:async()=>{}}},addEventListener:(name,handler)=>listeners[name]=handler,requestAnimationFrame(){},location:{reload(){}},innerWidth:1366,innerHeight:768});
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
