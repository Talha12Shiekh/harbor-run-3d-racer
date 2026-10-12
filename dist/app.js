import {createTrack,Race,STEP,PAINTS,clamp,angleDiff,validateProfile,updateRecords,updatePursuitRecords,PURSUIT} from './sim.js';
import {World} from './world.js';
import {Sound} from './audio.js';
import {VEHICLES,SETTINGS,vehicleInfo,settingInfo,onboardingScreen} from './catalog.js';
import {getHandling} from './handling.js';
import {DRIVING_VIEWS,drivingView,nextDrivingView,wrapYaw} from './cameras.js';
import {focusMove} from './navigation.js';
const $=id=>document.getElementById(id),track=createTrack(),race=new Race(track),sound=new Sound();let profile;try{profile=validateProfile(JSON.parse(localStorage.getItem('harbor-run-v1')));}catch{profile=validateProfile(null);}let world,ready=false,last=performance.now(),accumulator=0,resultShown=false,padButtons=[],keys=new Set(),lastPad=null,screen='loading',menuFocus=null,padDirection=null,padDrivingArmed=true,detailsTrigger=null;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const format=t=>{if(!Number.isFinite(t))return '—';const ms=Math.floor(Math.max(0,t)*1000);return String(Math.floor(ms/60000)).padStart(2,'0')+':'+String(Math.floor(ms/1000)%60).padStart(2,'0')+'.'+String(ms%1000).padStart(3,'0');};
const save=()=>{try{localStorage.setItem('harbor-run-v1',JSON.stringify(profile));}catch{}};
const show=id=>{menuFocus?.classList?.remove('nav-focus');menuFocus=null;screen=id;for(const name of ['title','briefing','menu','loading','hud','pause','results','error'])$(name).hidden=name!==id;if(id==='pause')$('hud').hidden=false;};
const refreshBest=()=>{$('menuBest').textContent=profile.mode==='pursuit'?'BEST ESCAPE '+format(profile.records.escape):'BEST LAP '+format(profile.records.lap);$('bestLap').textContent=profile.mode==='pursuit'?'BEST ESCAPE '+format(profile.records.escape):'BEST '+format(profile.records.lap);};
for(const v of VEHICLES){const option=document.createElement('option');option.value=v.id;option.textContent=v.name+' · '+v.type;$('vehicle').append(option);const button=document.createElement('button');button.dataset.vehicle=v.id;button.setAttribute('aria-label','Choose '+v.name+', '+v.type);const img=document.createElement('img');img.src='./assets/ui/'+v.id+'.jpg';img.alt='';img.width=560;img.height=330;const name=document.createElement('span');name.textContent=v.name.split(' ')[0];button.append(img,name);button.onclick=()=>chooseVehicle(v.id);$('vehicleChoices').append(button);}
for(const setting of SETTINGS){const option=document.createElement('option');option.value=setting.id;option.textContent=setting.name;$('environment').append(option);const button=document.createElement('button');button.dataset.environment=setting.id;button.setAttribute('aria-label',setting.name+', '+setting.description);const img=document.createElement('img');img.src='./assets/ui/'+setting.image+'.jpg';img.alt='';img.width=960;img.height=540;const caption=document.createElement('span');caption.textContent=setting.name;const small=document.createElement('small');small.textContent=setting.tag;caption.append(small);button.append(img,caption);button.onclick=()=>chooseEnvironment(setting.id);$('sceneChoices').append(button);}
$('trackLength').textContent=(track.length/1000).toFixed(1);$('quality').value=profile.quality;$('volume').value=profile.volume;$('vehicle').value=profile.vehicle;$('environment').value=profile.environment;$('showPerformance').checked=profile.showPerformance;sound.volume=profile.volume;refreshBest();
PAINTS.forEach((color,i)=>{const btn=document.createElement('button');btn.style.setProperty('--paint',color);btn.setAttribute('aria-label',['Reference blue','Carmine red','Pearl ivory','Graphite','Harbor blue','Rally gold'][i]);btn.setAttribute('aria-pressed',color===profile.paint);btn.onclick=()=>{profile.paint=color;race.player.color=color;world?.setPaint(color);save();for(const child of $('paints').children)child.setAttribute('aria-pressed',child===btn);};$('paints').append(btn);});
const refreshGarage=()=>{
 const v=vehicleInfo(profile.vehicle),setting=settingInfo(profile.environment);
 $('routeLabel').textContent=setting.name.toUpperCase()+' / '+setting.tag;$('vehicleLabel').textContent='HARBOR / '+v.number+' / '+v.type.toUpperCase();$('carName').textContent=v.name;$('carDescription').textContent=v.detail;$('carLayout').textContent=v.layout;$('carRoof').textContent=v.roof;
 $('vehicle').value=v.id;$('environment').value=setting.id;
 for(const button of $('vehicleChoices').children)button.setAttribute('aria-pressed',button.dataset.vehicle===v.id);
 for(const button of $('sceneChoices').children)button.setAttribute('aria-pressed',button.dataset.environment===setting.id);
 const pursuit=profile.mode==='pursuit',h=getHandling(v.id);$('carHandling').textContent=h.character+' '+Math.round(h.topSpeed*3.6)+' km/h simulated limit.';
 $('circuitMode').setAttribute('aria-pressed',!pursuit);$('pursuitMode').setAttribute('aria-pressed',pursuit);$('circuitFacts').hidden=pursuit;$('pursuitFacts').hidden=!pursuit;$('eventRules').textContent=pursuit?'Break contact for 8 seconds beyond 120 m. Patrols reinforce at 20 and 45 seconds. Stay moving to avoid a bust.':'Two laps against three rivals. Pass every checkpoint in order.';$('start').textContent=pursuit?'START PURSUIT ↗':'START CIRCUIT ↗';refreshBest();
};refreshGarage();
function chooseVehicle(id){if(!ready||race.phase!=='menu')return;const v=vehicleInfo(id);profile.vehicle=v.id;profile.paint=v.paint;race.player.color=profile.paint;race.vehicle=race.player.vehicle=v.id;world.setVehicle(v.id);for(const b of $('paints').children)b.setAttribute('aria-pressed',b.style.getPropertyValue('--paint')===profile.paint);refreshGarage();save();}
function chooseMode(mode){if(!ready||race.phase!=='menu')return;profile.mode=mode==='pursuit'?'pursuit':'circuit';race.restart(profile.paint,profile.vehicle,profile.mode);race.phase='menu';world.attachCars();refreshGarage();save();}
$('circuitMode').onclick=()=>chooseMode('circuit');$('pursuitMode').onclick=()=>chooseMode('pursuit');
function chooseEnvironment(id){if(!ready||race.phase!=='menu')return;try{world.setEnvironment(id);profile.environment=id;refreshGarage();save();}catch(e){fail(e);}}
$('vehicle').onchange=()=>chooseVehicle($('vehicle').value);$('environment').onchange=()=>chooseEnvironment($('environment').value);
for(const button of $('cameraChoices').children)button.onclick=()=>{world?.setGarageView(button.dataset.view);for(const b of $('cameraChoices').children)b.setAttribute('aria-pressed',b===button);};
function enterGarage(){if(!ready)return;show(onboardingScreen(profile));if(screen==='briefing')$('continueBriefing').focus();else $('start').focus();}
function completeBriefing(){profile.onboardingVersion=1;save();garage();}
$('enterGarage').onclick=enterGarage;$('continueBriefing').onclick=completeBriefing;$('skipBriefing').onclick=completeBriefing;
$('briefingButton').onclick=()=>{show('briefing');$('continueBriefing').focus();};$('titleButton').onclick=()=>{show('title');$('enterGarage').focus();};
function advanceMenu(){if(screen==='title')enterGarage();else if(screen==='briefing')completeBriefing();else start();}
function openDetails(name){detailsTrigger=document.activeElement;for(const id of ['controls','settings','credits'])$(id+'Content').hidden=id!==name;$('details').showModal();$('closeDetails').focus();}
for(const name of ['controls','settings','credits'])$(name+'Button').onclick=()=>openDetails(name);$('closeDetails').onclick=()=>{$('details').close();detailsTrigger?.focus();};$('details').addEventListener('close',()=>detailsTrigger?.focus());
$('quality').onchange=()=>{profile.quality=$('quality').value;world?.setQuality(profile.quality);save();};$('volume').oninput=()=>{profile.volume=Number($('volume').value);sound.volume=profile.volume;save();};$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{}};
$('showPerformance').onchange=()=>{profile.showPerformance=$('showPerformance').checked;save();};
function start(){if(!ready||$('details').open)return;padDrivingArmed=false;padDirection=null;race.restart(profile.paint,profile.vehicle,profile.mode);world.attachCars();resultShown=false;accumulator=0;keys.clear();show('hud');sound.resume().catch(()=>{});}
function garage(){race.phase='menu';keys.clear();refreshBest();show('menu');world.followInitialized=false;$('start').focus();}
function pause(){if(!ready||!['countdown','racing','paused'].includes(race.phase))return;padDrivingArmed=false;race.pause();keys.clear();accumulator=0;if(race.phase==='paused'){show('pause');$('resume').focus();}else{show('hud');sound.resume().catch(()=>{});}}
$('start').onclick=start;$('resume').onclick=pause;$('pauseButton').onclick=pause;$('restartPause').onclick=start;$('raceAgain').onclick=start;$('exitPause').onclick=garage;$('exitResults').onclick=garage;$('retry').onclick=()=>location.reload();
for(const view of DRIVING_VIEWS){const option=document.createElement('option');option.value=view.id;option.textContent=view.label;$('drivingCamera').append(option);}
$('drivingCamera').value=profile.camera;
function setCamera(id){profile.camera=drivingView(id).id;world?.setDrivingView(profile.camera);$('drivingCamera').value=profile.camera;refreshCamera();save();}
function cycleCamera(){setCamera(nextDrivingView(profile.camera));}
function rotateTracking(delta){if(profile.camera!=='tracking')return;world?.rotateCamera(delta);profile.trackingYaw=wrapYaw(world?.trackingYaw??profile.trackingYaw+delta);save();}
function refreshCamera(){$('cameraButton').textContent=drivingView(profile.camera).label+' · V';$('angleControls').hidden=profile.camera!=='tracking';}
$('drivingCamera').onchange=()=>setCamera($('drivingCamera').value);$('cameraButton').onclick=cycleCamera;$('cameraLeft').onclick=()=>rotateTracking(-.18);$('cameraRight').onclick=()=>rotateTracking(.18);refreshCamera();
function menuGroups(){
 if(screen==='title')return [[$('enterGarage')]];
 if(screen==='briefing')return [[$('continueBriefing'),$('skipBriefing')]];
 if(screen==='menu')return [[$('circuitMode'),$('pursuitMode')],Array.from($('vehicleChoices').children),Array.from($('sceneChoices').children),Array.from($('paints').children),Array.from($('cameraChoices').children),[$('start')],['title','briefing','controls','settings','credits'].map(n=>$(n+'Button'))];
 if(screen==='pause')return [[$('resume'),$('restartPause'),$('exitPause')]];
 if(screen==='results')return [[$('raceAgain'),$('exitResults')]];
 return [];
}
function navigateMenu(code){const moved=focusMove(menuGroups(),document.activeElement??menuFocus,code);if(!moved)return false;menuFocus?.classList?.remove('nav-focus');menuFocus=moved.button;menuFocus.classList?.add('nav-focus');menuFocus.focus();if(moved.select)menuFocus.onclick?.();return true;}
function confirmMenu(){const groups=menuGroups(),active=document.activeElement??menuFocus;if(groups.some(row=>row.includes(active))){active.onclick?.();return;}if(screen==='pause')pause();else if(screen==='results')start();else advanceMenu();}
const inputKeys=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','ShiftLeft','ShiftRight','KeyQ','KeyC','KeyR','KeyV','BracketLeft','BracketRight','Escape'];
addEventListener('keydown',e=>{
 if($('details').open)return;
 const native=['SELECT','INPUT','TEXTAREA'].includes(e.target.tagName),menu=menuGroups().length>0;
 if(menu&&!native&&e.code.startsWith('Arrow')){if(navigateMenu(e.code))e.preventDefault();return;}
 if(menu&&!native&&e.code==='Enter'){if(!e.repeat){e.preventDefault();confirmMenu();}return;}
 if(inputKeys.includes(e.code)&&['racing','countdown','paused'].includes(race.phase))e.preventDefault();
 if(e.code==='Escape'&&!e.repeat){pause();return;}
 if(e.code==='KeyV'&&!e.repeat&&['racing','countdown'].includes(race.phase)){cycleCamera();return;}
 if(e.code==='KeyR'&&!e.repeat&&race.phase==='racing'){race.resetPlayer();world.followInitialized=false;return;}
 if(!menu)keys.add(e.code);
});
addEventListener('keyup',e=>{keys.delete(e.code);if(['BracketLeft','BracketRight'].includes(e.code)&&world){profile.trackingYaw=wrapYaw(world.trackingYaw);save();}});
addEventListener('pointerdown',()=>menuFocus?.classList?.remove('nav-focus'));
const blur=()=>{keys.clear();padDirection=null;padDrivingArmed=false;if(['racing','countdown'].includes(race.phase))pause();};addEventListener('blur',blur);document.addEventListener('visibilitychange',()=>{if(document.hidden)blur();});addEventListener('gamepaddisconnected',()=>{lastPad=null;padButtons=[];padDirection=null;blur();});addEventListener('resize',()=>world?.resize());
function readInput(){
 const pressed=(...codes)=>codes.some(c=>keys.has(c));
 const input={throttle:+pressed('KeyW','ArrowUp'),brake:+pressed('KeyS','ArrowDown'),steer:+pressed('KeyA','ArrowLeft')-+pressed('KeyD','ArrowRight'),handbrake:pressed('Space'),boost:pressed('ShiftLeft','ShiftRight'),breaker:pressed('KeyQ'),rear:pressed('KeyC'),orbit:+pressed('BracketRight')-+pressed('BracketLeft')};
 const pad=Array.from(navigator.getGamepads?.()??[]).find(p=>p&&p.mapping==='standard');
 if(pad){
  if(lastPad!==pad.index){lastPad=pad.index;padButtons=[];padDirection=null;}
  const b=i=>pad.buttons[i]?.value??0,edge=i=>b(i)>.5&&!padButtons[i],wasMenu=menuGroups().length>0;
  if(!$('details').open&&wasMenu){
   const x=(pad.axes[0]??0),y=(pad.axes[1]??0),direction=b(12)>.5||y<-.55?'ArrowUp':b(13)>.5||y>.55?'ArrowDown':b(14)>.5||x<-.55?'ArrowLeft':b(15)>.5||x>.55?'ArrowRight':null;
   if(direction&&direction!==padDirection)navigateMenu(direction);padDirection=direction;
   if(edge(0))confirmMenu();
  }else padDirection=null;
  if(!$('details').open&&edge(9)){if(wasMenu){if(!edge(0)){if(race.phase==='menu')advanceMenu();else if(screen==='results')start();else pause();}}else pause();}
  if(!padDrivingArmed&&Math.abs(pad.axes[0]??0)<=.1&&Math.abs(pad.axes[1]??0)<=.1&&[0,1,2,3,12,13,14,15].every(i=>b(i)<=.5))padDrivingArmed=true;
  if(!wasMenu&&padDrivingArmed&&['racing','countdown'].includes(race.phase)){
   if(edge(3)&&race.phase==='racing'){race.resetPlayer();world.followInitialized=false;}if(edge(4))cycleCamera();
   input.throttle=Math.max(input.throttle,b(7));input.brake=Math.max(input.brake,b(6));const axis=pad.axes[0]??0;if(Math.abs(axis)>.1)input.steer=-clamp((Math.abs(axis)-.1)/.9,0,1)*Math.sign(axis);const dpad=+(b(14)>.5)-+(b(15)>.5);if(dpad)input.steer=dpad;
   input.handbrake ||=b(0)>.5;input.boost ||=b(1)>.5;input.breaker ||=b(2)>.5;input.rear ||=b(5)>.5;
  }
  padButtons=pad.buttons.map(button=>button.value>.5);
 }
 return input;
}
const map=$('map').getContext('2d'),bounds=track.samples.reduce((b,p)=>({minX:Math.min(b.minX,p.x),minZ:Math.min(b.minZ,p.z),maxX:Math.max(b.maxX,p.x),maxZ:Math.max(b.maxZ,p.z)}),{minX:Infinity,minZ:Infinity,maxX:-Infinity,maxZ:-Infinity});const scale=Math.min(180/(bounds.maxX-bounds.minX),150/(bounds.maxZ-bounds.minZ));const mapPoint=p=>[20+(p.x-bounds.minX)*scale,170-(p.z-bounds.minZ)*scale];
for(let i=0;i<=24;i++){const angle=(-140+i/24*280)*Math.PI/180,x=125+Math.sin(angle)*93,y=125-Math.cos(angle)*93,inner=i%4===0?82:88;const line=document.createElementNS('http://www.w3.org/2000/svg','line');line.setAttribute('x1',x);line.setAttribute('y1',y);line.setAttribute('x2',125+Math.sin(angle)*inner);line.setAttribute('y2',125-Math.cos(angle)*inner);$('ticks').append(line);}
function drawMap(){map.clearRect(0,0,220,190);map.beginPath();track.samples.forEach((p,i)=>{const [x,y]=mapPoint(p);i?map.lineTo(x,y):map.moveTo(x,y);});map.strokeStyle='#06111bc2';map.lineWidth=8;map.stroke();map.strokeStyle='#eef6ffdf';map.lineWidth=3;map.stroke();const start=mapPoint(track.at(0));map.fillStyle='#ffd166';map.fillRect(start[0]-3,start[1]-3,6,6);for(const car of [...race.rivals,...race.police.filter(c=>c.active),race.player]){const [x,y]=mapPoint(car);map.beginPath();map.arc(x,y,car===race.player?4.2:3,0,Math.PI*2);map.fillStyle=car===race.player?'#ffd166':car.police?(car.unit%2?'#ff6679':'#71d6df'):'#e0e4e5';map.fill();}}
function finish(){
 resultShown=true;const pursuit=race.mode==='pursuit';$('standings').replaceChildren();$('standings').hidden=pursuit;
 if(pursuit){
  const old=profile.records.escape;updatePursuitRecords(profile,race);$('resultEyebrow').textContent=race.outcome==='escaped'?'PURSUIT ESCAPED':'BUSTED';$('resultHeadline').textContent=race.outcome==='escaped'?'Out of sight.':'The patrol closed in.';$('resultSummary').textContent=race.outcome==='escaped'?'You held more than 120 m of separation for eight seconds.':'A patrol held you at low speed for four seconds.';$('resultTimeLabel').textContent='PURSUIT TIME';$('resultLapLabel').textContent='PEAK HEAT';$('resultTime').textContent=format(race.elapsed);$('resultLap').textContent=race.pursuit.peakHeat+' / 3';$('recordMessage').textContent=race.outcome==='escaped'?(!old||race.elapsed<old?'NEW BEST ESCAPE':'Best escape '+format(profile.records.escape)):'Keep your momentum. Use the corners and traffic to break contact.';$('raceAgain').textContent='RUN AGAIN ↗';
 }else{
  const old=profile.records.race;updateRecords(profile,race.player);$('resultEyebrow').textContent='CIRCUIT COMPLETE';$('resultHeadline').textContent=race.position===1?'The road is yours.':'Across the line.';$('resultSummary').textContent='Finished '+['1st','2nd','3rd','4th'][race.position-1]+' of 4 racers.';$('resultTimeLabel').textContent='RACE TIME';$('resultLapLabel').textContent='BEST LAP';$('resultTime').textContent=format(race.player.finish);$('resultLap').textContent=format(Math.min(...race.player.lapTimes));$('recordMessage').textContent=(!old||race.player.finish<old)?'NEW PERSONAL BEST':'Best race '+format(profile.records.race);$('raceAgain').textContent='RACE AGAIN ↗';race.standings.forEach((car,i)=>{const li=document.createElement('li'),name=document.createElement('span'),time=document.createElement('span');name.textContent=(i+1)+'. '+car.name;time.textContent=car.finish!==null?format(car.finish):'On circuit';li.append(name,time);$('standings').append(li);});
 }
 save();refreshBest();show('results');$('raceAgain').focus();
}
function hud(){
 const c=race.player,kmh=Math.round(Math.abs(c.speed)*3.6),pursuit=race.mode==='pursuit';$('circuitStatus').hidden=pursuit;$('pursuitStatus').hidden=!pursuit;$('lapLine').hidden=pursuit;$('pauseEvent').textContent=pursuit?'POLICE PURSUIT':'HARBOR CIRCUIT';$('position').textContent=race.position;$('lap').textContent=c.lap;
 if(pursuit){const p=race.pursuit;$('heat').textContent=p.heat+' / 3';$('patrolCount').textContent=race.police.filter(c=>c.active).length;$('contactDistance').textContent=Number.isFinite(p.nearestDistance)?Math.round(p.nearestDistance)+' m':'—';$('pursuitState').textContent=p.bust>0?'BUST RISK':p.escape>0?'BREAKING CONTACT':'PURSUING';$('escapeProgress').value=p.escape;$('bustProgress').value=p.bust;$('escapeSeconds').textContent=p.escape.toFixed(1)+' / '+PURSUIT.escapeSeconds+' s';$('bustSeconds').textContent=p.bust.toFixed(1)+' / '+PURSUIT.bustSeconds+' s';}
 $('speed').textContent=kmh;$('gear').textContent=c.speed<-.5?'R':c.speed<1?'N':clamp(Math.floor(c.speed/12)+1,1,6);$('raceTime').textContent=format(race.elapsed);$('lapTime').textContent=format(race.elapsed-c.lapStart);$('nitro').value=c.nitrous;$('breaker').value=c.breaker;$('gaugeFill').style.strokeDasharray=clamp(kmh/300*100,0,100)+' 100';$('raceMessage').textContent=race.phase==='countdown'?Math.ceil(race.countdown):race.phase==='racing'&&race.elapsed<.75?'GO':'';$('wrongWay').hidden=race.phase!=='racing'||c.speed<3||Math.abs(angleDiff(c.heading,track.at(c.s).heading))<1.8;$('breakerTint').style.opacity=c.breakingTime&&race.phase==='racing'?1:0;drawMap();
}
function fail(error){ready=false;show('error');$('errorText').textContent=error?.message?.includes('WebGL')?'This browser could not initialize WebGL. Use a browser with hardware acceleration, then reload.':'The 3D assets could not load or the graphics context stopped. Reload to try again.';console.error('Harbor Run:',error);}
async function boot(){try{race.restart(profile.paint,profile.vehicle,profile.mode);race.phase='menu';world=new World($('world'),track,race);world.setQuality(profile.quality);world.setDrivingView(profile.camera);world.trackingYaw=profile.trackingYaw;world.vehicle=profile.vehicle;world.environment=profile.environment;await world.load(p=>{$('loadProgress').value=p;$('loadingText').textContent=p<.28?'Loading road textures and daylight…':p<.75?'Loading original forest and alpine scenery…':'Loading five original Blender vehicles…';});ready=true;show('title');$('enterGarage').focus();window.harborRun={race,track,world,profile,version:'1.7.2'};$('world').addEventListener('webglcontextlost',e=>{e.preventDefault();blur();fail(new Error('WebGL context lost'));});}catch(error){fail(error);}}
function frame(now){const frameMs=now-last,dt=Math.max(0,Math.min(.05,frameMs/1000));last=now;if(ready){const input=readInput();accumulator+=dt;let count=0;while(accumulator>=STEP&&count<8){race.step(input,STEP);accumulator-=STEP;count++;}if(race.phase==='finished'&&!resultShown)finish();if(['racing','countdown','paused'].includes(race.phase))hud();sound.update(race.player,race.phase==='racing',race.mode==='pursuit'?race.pursuit:null);try{if(['racing','countdown'].includes(race.phase)&&profile.camera==='tracking'&&input.orbit)world.rotateCamera(input.orbit*dt*.9);world.update(dt,input.rear,race.phase==='menu',reducedMotion);const stats=world.recordFrame?.(frameMs,race.phase==='racing');$('performanceOverlay').hidden=!profile.showPerformance||race.phase!=='racing';if(stats&&profile.showPerformance)$('performanceOverlay').textContent=(stats.fps||'…')+' FPS · '+stats.draws+' draws · '+Math.round(stats.triangles/1000)+'k triangles · '+stats.pixelRatio.toFixed(2)+'×';}catch(error){fail(error);}}requestAnimationFrame(frame);}boot();requestAnimationFrame(frame);
