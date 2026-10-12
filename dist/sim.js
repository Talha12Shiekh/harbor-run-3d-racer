import {hasVehicle,hasSetting,VEHICLES} from './catalog.js';
import {getHandling,wheelSteering} from './handling.js';
import {hasDrivingView,wrapYaw} from './cameras.js';
import {carContact,ContactFeedback} from './collisions.js';
import {DestructionWorld,repairCar,damageCar,motion} from './destruction.js';
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const wrap=(v,n)=>((v%n)+n)%n;
export const angleDiff=(a,b)=>wrap(a-b+Math.PI,Math.PI*2)-Math.PI;
export const STEP=1/120;
export const PAINTS=['#3446c7','#b72227','#dfd8c6','#28343d','#1c6274','#c59626'];
export function createTrack(){
 const points=[[0,0],[0,180],[80,300],[250,330],[380,270],[440,100],[380,-100],[210,-220],[0,-240],[-100,-170],[-80,-80],[-20,-70]];
 const samples=[],N=780;
 const cat=(a,b,c,d,t)=>.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);
 for(let i=0;i<=N;i++){const f=(i%N)/N*points.length,k=Math.floor(f),t=f-k;const p=[-1,0,1,2].map(j=>points[wrap(k+j,points.length)]);samples.push({x:cat(...p.map(v=>v[0]),t),z:cat(...p.map(v=>v[1]),t),y:1.4+1.3*Math.sin(i/N*Math.PI*4),s:0});}
 for(let i=1;i<=N;i++){const a=samples[i-1],b=samples[i];b.s=a.s+Math.hypot(a.x-b.x,a.z-b.z);}
 const length=samples[N].s;
 for(let i=0;i<N;i++){const a=samples[wrap(i-1,N)],b=samples[(i+1)%N],p=samples[i],d=Math.hypot(b.x-a.x,b.z-a.z);p.tx=(b.x-a.x)/d;p.tz=(b.z-a.z)/d;p.heading=Math.atan2(p.tx,p.tz);}
 Object.assign(samples[N],{tx:samples[0].tx,tz:samples[0].tz,heading:samples[0].heading});
 const at=s=>{s=wrap(s,length);let lo=0,hi=N;while(hi-lo>1){const m=(lo+hi)>>1;if(samples[m].s<=s)lo=m;else hi=m;}const a=samples[lo],b=samples[hi],t=(s-a.s)/(b.s-a.s);return {x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,y:a.y+(b.y-a.y)*t,tx:a.tx+(b.tx-a.tx)*t,tz:a.tz+(b.tz-a.tz)*t,heading:a.heading+angleDiff(b.heading,a.heading)*t,s,index:lo};};
 const project=(x,z,hint)=>{let best=null;const test=i=>{i=wrap(i,N);const a=samples[i],b=samples[i+1],dx=b.x-a.x,dz=b.z-a.z,t=clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz),0,1),px=a.x+dx*t,pz=a.z+dz*t,dist=(x-px)**2+(z-pz)**2;if(!best||dist<best.dist)best={dist,s:a.s+(b.s-a.s)*t,index:i,x:px,z:pz,offset:(x-px)*a.tz-(z-pz)*a.tx};};if(Number.isInteger(hint)){for(let i=hint-18;i<=hint+18;i++)test(i);}if(!best||best.dist>625){for(let i=0;i<N;i++)test(i);}return best;};
 return {samples,length,width:19,at,project,gates:Array.from({length:8},(_,i)=>length*i/8)};
}
export function createCar(track,name,s,lane=0,color=PAINTS[0],traffic=false,vehicle='hypercar'){const p=track.at(s);const car={name,vehicle:hasVehicle(vehicle)?vehicle:'hypercar',active:true,police:false,x:p.x+p.tz*lane,z:p.z-p.tx*lane,y:p.y,heading:p.heading,speed:0,steer:0,slip:0,nitrous:1,breaker:1,s:wrap(s,track.length),index:p.index,offset:lane,nextGate:1,gates:0,lap:1,lastCheckpoint:0,lapStart:0,lapTimes:[],finish:null,color,traffic,boosting:false,breakingTime:false,braking:false,impact:0,stuck:0,wheel:0};repairCar(car);return car;}
export function integrate(car,input,dt,track,destruction=null,time=0){
 if(!car.damage)repairCar(car);const previous={x:car.x,y:car.y,z:car.z};if(car.damage.wrecked||car.airborne)input={throttle:0,brake:0,steer:0,boost:false,breaker:false,handbrake:false};
 const h=getHandling(car.vehicle);
 const breaker=!!input.breaker&&car.breaker>0.005&&car.speed>2;car.breakingTime=breaker;
 const boost=!!input.boost&&car.nitrous>.005&&input.throttle>.1&&car.speed>2&&!breaker;car.boosting=boost;car.braking=input.brake>.1;
 car.nitrous=clamp(car.nitrous+(boost?-.24:car.speed>5?.07:0)*dt,0,1);car.breaker=clamp(car.breaker+(breaker?-.75:.08)*dt,0,1);
 let acceleration=(clamp(input.throttle||0,0,1)*h.acceleration*(1-.25*clamp(car.speed/h.topSpeed,0,1))+(boost?h.boostAcceleration:0))*(1-car.damage.front*.35);
 if(input.brake){acceleration-=car.speed>1?h.brakes*input.brake:7*input.brake;}
 acceleration-=Math.sign(car.speed)*(h.coast+h.drag*car.speed*car.speed);
 if(input.handbrake&&car.speed>0)acceleration-=7;
 car.speed=clamp(car.speed+acceleration*dt,-10,boost?h.boostSpeed:h.topSpeed);
 if(!input.throttle&&!input.brake&&Math.abs(car.speed)<.12)car.speed=0;
 car.steer+=(clamp(input.steer||0,-1,1)-car.steer)*Math.min(1,dt*h.steerRate);
 car.heading+=Math.tan(wheelSteering(car))*car.speed/h.wheelbase*dt;
 const targetSlip=input.handbrake&&car.speed>10?-car.steer*h.drift:car.speed>18&&input.throttle>.7?-car.steer*h.powerSlip*(car.speed/h.topSpeed)**2:0;car.slip+=(targetSlip-car.slip)*Math.min(1,dt*(input.handbrake?4:breaker?12:h.grip));
 const velocity=motion(car);car.x+=velocity.x*dt;car.z+=velocity.z*dt;car.wheel+=car.speed*dt/.34;
 const p=track.project(car.x,car.z,car.index);car.s=p.s;car.index=p.index;car.offset=p.offset;if(!destruction)car.y=track.at(p.s).y;
 car.impact=Math.max(0,car.impact-dt*3);
 if(destruction)return destruction.resolve(car,previous,dt,time);
 let contact=null;const edge=track.width/2-1.12;if(Math.abs(p.offset)>edge){const a=track.at(p.s),o=clamp(p.offset,-edge,edge),side=Math.sign(p.offset),vx=Math.sin(car.heading+car.slip)*car.speed,vz=Math.cos(car.heading+car.slip)*car.speed,nx=-side*a.tz,nz=side*a.tx;contact={x:p.x+a.tz*side*(track.width/2-.12),y:car.y+.58,z:p.z-a.tx*side*(track.width/2-.12),ground:car.y+.04,nx,nz,closing:Math.max(0,-(vx*nx+vz*nz)),sliding:Math.abs(vx*a.tx+vz*a.tz),vx,vz,side};car.x=p.x+a.tz*o;car.z=p.z-a.tx*o;car.offset=o;car.speed*=Math.max(.2,1-dt*3);car.heading+=angleDiff(a.heading,car.heading)*Math.min(1,dt*2);car.impact=Math.max(car.impact,1-Math.exp(-contact.closing/14));}
 return contact;
}
export function collideCars(a,b){
 if(a.active===false||b.active===false||Math.abs(a.y-b.y)>1.6)return null;const contact=carContact(a,b);if(!contact)return null;
 const {nx,nz,penetration:p,an,bn}=contact,ha=getHandling(a.vehicle),hb=getHandling(b.vehicle),ma=ha.mass,mb=hb.mass;a.x+=nx*p*mb/(ma+mb);a.z+=nz*p*mb/(ma+mb);b.x-=nx*p*ma/(ma+mb);b.z-=nz*p*ma/(ma+mb);contact.x+=nx*p*(mb-ma)/(ma+mb)*.5;contact.z+=nz*p*(mb-ma)/(ma+mb)*.5;
 if(contact.closing>0){const impulse=contact.closing*1.15;a.speed=clamp(a.speed+impulse*mb/(ma+mb)*an,-10,ha.boostSpeed);b.speed=clamp(b.speed-impulse*ma/(ma+mb)*bn,-10,hb.boostSpeed);if(contact.closing>6){const av=impulse*mb/(ma+mb),bv=impulse*ma/(ma+mb),adx=Math.sin(a.heading+a.slip),adz=Math.cos(a.heading+a.slip),bdx=Math.sin(b.heading+b.slip),bdz=Math.cos(b.heading+b.slip);a.kickX=clamp((a.kickX??0)+av*(nx-an*adx),-45,45);a.kickZ=clamp((a.kickZ??0)+av*(nz-an*adz),-45,45);b.kickX=clamp((b.kickX??0)-bv*(nx-bn*bdx),-45,45);b.kickZ=clamp((b.kickZ??0)-bv*(nz-bn*bdz),-45,45);}
 if(contact.closing>=20)for(const [car,sign,share] of [[a,1,mb/(ma+mb)],[b,-1,ma/(ma+mb)]]){const side=(nx*Math.cos(car.heading)-nz*Math.sin(car.heading))*sign,front=(nx*Math.sin(car.heading)+nz*Math.cos(car.heading))*sign;car.rollSpeed=clamp((car.rollSpeed??0)-side*contact.closing*.035*share,-4,4);car.pitchSpeed=clamp((car.pitchSpeed??0)+front*contact.closing*.02*share,-4,4);if(contact.closing>25&&Math.abs(side)>.7)car.verticalSpeed=Math.max(car.verticalSpeed??0,contact.closing*.025*share);}
 a.impact=b.impact=clamp(1-Math.exp(-contact.closing/14),0,1);}
 return contact;
}
export function progressCar(car,oldS,elapsed,track){
 if(car.traffic||car.police||car.finish!==null||car.damage?.wrecked||car.airborne||Math.abs(car.offset)>track.width/2)return;const delta=wrap(car.s-oldS+track.length/2,track.length)-track.length/2;
 if(delta<=0||delta>12||car.speed<0)return;const gate=track.gates[car.nextGate];const crossing=car.nextGate===0?oldS>track.length-15&&car.s<15:oldS<gate&&car.s>=gate;
 if(!crossing)return;car.gates++;car.lastCheckpoint=gate;car.nextGate=(car.nextGate+1)%8;
 if(gate===0){car.lapTimes.push(elapsed-car.lapStart);car.lapStart=elapsed;if(car.gates>=16)car.finish=elapsed;else car.lap=2;}
}
export function resetCar(car,track,current=false){const p=track.at(current||car.traffic?car.s:car.lastCheckpoint+2);car.x=p.x;car.z=p.z;car.y=p.y;car.heading=p.heading;car.s=p.s;car.index=p.index;car.offset=0;car.speed=0;car.slip=0;car.steer=0;car.stuck=0;car.impact=0;repairCar(car);}
export function aiInput(car,track,cars){
 const ahead=track.at(car.s+12+Math.max(0,car.speed)*.48),far=track.at(car.s+60),now=track.at(car.s);let lane=car.traffic?(car.name.endsWith('1')||car.name.endsWith('3')?-4.6:4.6):car.name==='SABLE'?-2.6:car.name==='RIFT'?2.6:0;
 for(const other of cars){if(other===car||other.active===false)continue;const diff=wrap(other.s-car.s,track.length);if(diff<22&&Math.abs(other.offset-lane)<2.7)lane=lane<0?3.5:-3.5;}
 const targetX=ahead.x+ahead.tz*lane,targetZ=ahead.z-ahead.tx*lane,angle=angleDiff(Math.atan2(targetX-car.x,targetZ-car.z),car.heading);
 const bend=Math.abs(angleDiff(far.heading,now.heading)),top=getHandling(car.vehicle).topSpeed*.86;const desired=car.traffic?23:clamp(top-bend*48,18,top);
 return {steer:clamp(angle*3,-1,1),throttle:car.speed<desired?1:.1,brake:car.speed>desired+2?.55:0,handbrake:false,boost:!car.traffic&&bend<.08&&car.speed>40&&car.nitrous>.5,breaker:false};
}
export const PURSUIT=Object.freeze({reinforcements:Object.freeze([0,20,45]),escapeDistance:120,escapeSeconds:8,minimumSeconds:20,bustDistance:10,bustSeconds:4,bustSpeed:5,escapeSpeed:6});
export function policeInput(car,player,track,heat=1){
 const h=getHandling(car.vehicle),gap=wrap(player.s-car.s+track.length/2,track.length)-track.length/2,near=track.at(car.s+12+Math.max(0,car.speed)*.46),far=track.at(car.s+60),now=track.at(car.s);
 const lane=clamp(player.offset+(car.unit%2?1.2:-1.2),-6.6,6.6),angle=angleDiff(Math.atan2(near.x+near.tz*lane-car.x,near.z-near.tx*lane-car.z),car.heading),bend=Math.abs(angleDiff(far.heading,now.heading));
 const closing=player.speed<5&&Math.abs(gap)<30?clamp(Math.max(0,player.speed)+(gap-5)*.35,0,6):clamp(player.speed+(gap>15?8:gap< -8?-8:4),24,h.topSpeed);
 const pace=h.topSpeed*[.76,.85,.93][clamp(heat-1,0,2)],desired=Math.min(closing,clamp(pace-bend*75,18,pace));
 return {steer:clamp(angle*3,-1,1),throttle:car.speed<desired?1:.12,brake:car.speed>desired+2?.65:0,handbrake:false,boost:heat>=3&&gap>70&&bend<.09&&car.speed>30&&car.nitrous>.3,breaker:false};
}
export class Race{
 constructor(track){this.track=track;this.destruction=new DestructionWorld(track);this.restart();this.phase='menu';}
 configureDestruction(placements,heightmap){this.destruction.configure(placements,heightmap);}
 restart(color=PAINTS[0],vehicle=this.vehicle??'hypercar',mode=this.mode??'circuit'){
  this.feedback=new ContactFeedback();this.destruction.reset();
  const t=this.track;this.vehicle=hasVehicle(vehicle)?vehicle:'hypercar';this.mode=mode==='pursuit'?'pursuit':'circuit';this.player=createCar(t,'YOU',2,-2.4,color,false,this.vehicle);
  this.rivals=this.mode==='circuit'?['SABLE','RIFT','ONYX'].map((name,i)=>createCar(t,name,9+i*7,i%2?-2.4:2.6,['#ddd7cc','#245f78','#28272b'][i],false,VEHICLES[i+1].id)):[];
  this.traffic=Array.from({length:4},(_,i)=>{const c=createCar(t,'TRAFFIC '+i,180+i*t.length/4,i%2?-4.5:4.5,['#56665a','#a89a80','#e0dcce','#344b64'][i],true,VEHICLES[(i+4)%VEHICLES.length].id);c.speed=22;return c;});
  this.police=this.mode==='pursuit'?Array.from({length:3},(_,i)=>{const c=createCar(t,'PATROL '+(i+1),this.player.s-35-i*25,i%2?2.4:-2.4,'#101820',false,'interceptor');c.police=true;c.unit=i;c.active=i===0;return c;}):[];
  this.cars=[this.player,...this.rivals,...this.traffic,...this.police];this.phase='countdown';this.countdown=3;this.elapsed=0;this.beforePause=null;this.outcome=null;this.pursuit={heat:1,peakHeat:1,nearestDistance:this.police.length?Math.hypot(this.police[0].x-this.player.x,this.police[0].z-this.player.z):Infinity,escape:0,bust:0};
 }
 resetPlayer(){resetCar(this.player,this.track,this.mode==='pursuit');this.pursuit.escape=0;this.feedback.clear();}
 drainImpacts(){return this.feedback.drain();}
 pause(){if(this.phase==='paused'){this.phase=this.beforePause;return;}if(['racing','countdown'].includes(this.phase)){this.beforePause=this.phase;this.phase='paused';this.feedback.drain();}}
 step(input,dt=STEP){if(!['countdown','racing'].includes(this.phase))return;if(this.phase==='countdown'){this.countdown-=dt;if(this.countdown<=0)this.phase='racing';return;}
 const slow=input.breaker&&!this.player.damage.wrecked&&!this.player.airborne&&this.player.breaker>.005&&this.player.speed>2;const simdt=dt*(slow?.4:1);this.elapsed+=simdt;
 if(this.mode==='pursuit')this.activatePolice();
 for(let i=0;i<this.cars.length;i++){const c=this.cars[i];if(!c.active)continue;const old=c.s,control=c===this.player?input:c.police?policeInput(c,this.player,this.track,this.pursuit.heat):aiInput(c,this.track,this.cars),contacts=integrate(c,control,simdt,this.track,this.destruction,this.elapsed);for(const contact of contacts){const event=this.feedback.record('barrier:'+i+':'+contact.barrierId,contact,[i],this.elapsed);if(event)damageCar(c,event,.5*getHandling(c.vehicle).mass*contact.closing**2);}if(this.mode==='circuit')progressCar(c,old,this.elapsed,this.track);if(c!==this.player){c.stuck=(c.damage.wrecked||Math.abs(c.speed)<2)?c.stuck+simdt:0;if(c.stuck>4)resetCar(c,this.track,c.police);}}
 for(let i=0;i<this.cars.length;i++)for(let j=i+1;j<this.cars.length;j++)if(this.cars[i].active&&this.cars[j].active){const a=this.cars[i],b=this.cars[j],contact=collideCars(a,b),event=this.feedback.record(i+':'+j,contact,[i,j],this.elapsed);if(event){const ma=getHandling(a.vehicle).mass,mb=getHandling(b.vehicle).mass,energy=.5*(ma*mb/(ma+mb))*contact.closing**2;damageCar(a,event,energy*mb/(ma+mb));damageCar(b,event,energy*ma/(ma+mb));}}
 if(this.mode==='pursuit')this.updatePursuit(simdt);else if(this.player.finish!==null)this.phase='finished';
 }
 activatePolice(){
  this.police.forEach((c,i)=>{if(c.active||this.elapsed<PURSUIT.reinforcements[i])return;const p=this.track.at(this.player.s-65-(i-1)*20),lane=i%2?2.4:-2.4;c.x=p.x+p.tz*lane;c.z=p.z-p.tx*lane;c.y=p.y;c.heading=p.heading;c.s=p.s;c.index=p.index;c.offset=lane;c.speed=clamp(this.player.speed-6,18,40);c.active=true;});
  this.pursuit.heat=this.police.filter(c=>c.active).length;this.pursuit.peakHeat=Math.max(this.pursuit.peakHeat,this.pursuit.heat);
 }
 updatePursuit(dt){
  const p=this.pursuit;p.nearestDistance=Math.min(...this.police.filter(c=>c.active).map(c=>Math.hypot(c.x-this.player.x,c.z-this.player.z)));
  const trapped=Math.abs(this.player.speed)<PURSUIT.bustSpeed&&p.nearestDistance<PURSUIT.bustDistance;p.bust=clamp(p.bust+(trapped?dt:-dt*2),0,PURSUIT.bustSeconds);
  p.escape=!this.player.damage.wrecked&&!this.player.airborne&&!this.player.offroad&&this.elapsed>=PURSUIT.minimumSeconds&&Math.abs(this.player.speed)>PURSUIT.escapeSpeed&&p.nearestDistance>PURSUIT.escapeDistance?Math.min(PURSUIT.escapeSeconds,p.escape+dt):0;
  if(p.bust>=PURSUIT.bustSeconds-1e-9||p.escape>=PURSUIT.escapeSeconds-1e-9){this.outcome=p.bust>=PURSUIT.bustSeconds-1e-9?'busted':'escaped';this.player.finish=this.elapsed;this.phase='finished';}
 }
 get standings(){const progress=c=>{const last=this.track.gates[wrap(c.nextGate-1,8)],distance=wrap(c.s-last,this.track.length);return c.gates+clamp(distance/(this.track.length/8),0,.999);};return [this.player,...this.rivals].sort((a,b)=>{if(a.finish!==null||b.finish!==null)return (a.finish??Infinity)-(b.finish??Infinity);return progress(b)-progress(a);});}
 get position(){return this.standings.indexOf(this.player)+1;}
}
export function validateProfile(raw){const p={version:1,paint:PAINTS[0],quality:'auto',volume:.55,vehicle:'hypercar',environment:'forest',mode:'circuit',camera:'chase',trackingYaw:-.72,showPerformance:false,onboardingVersion:0,records:{}};if(!raw||typeof raw!=='object')return p;if(PAINTS.includes(raw.paint))p.paint=raw.paint;if(hasVehicle(raw.vehicle))p.vehicle=raw.vehicle;if(hasSetting(raw.environment))p.environment=raw.environment;if(raw.mode==='pursuit')p.mode='pursuit';if(hasDrivingView(raw.camera))p.camera=raw.camera;if(Number.isFinite(raw.trackingYaw))p.trackingYaw=wrapYaw(raw.trackingYaw);if(typeof raw.showPerformance==='boolean')p.showPerformance=raw.showPerformance;if(raw.onboardingVersion===1)p.onboardingVersion=1;if(['auto','high','low'].includes(raw.quality))p.quality=raw.quality;if(Number.isFinite(raw.volume))p.volume=clamp(raw.volume,0,1);for(const key of ['lap','race','escape'])if(Number.isFinite(raw.records?.[key])&&raw.records[key]>0)p.records[key]=raw.records[key];return p;}
export function updateRecords(profile,car){if(car.finish===null||car.gates<16)return profile;const lap=Math.min(...car.lapTimes);if(Number.isFinite(lap)&&lap>0)profile.records.lap=Math.min(profile.records.lap??Infinity,lap);profile.records.race=Math.min(profile.records.race??Infinity,car.finish);return profile;}
export function updatePursuitRecords(profile,race){if(race.mode==='pursuit'&&race.phase==='finished'&&race.outcome==='escaped'&&race.elapsed>=PURSUIT.minimumSeconds+PURSUIT.escapeSeconds-1e-7)profile.records.escape=Math.min(profile.records.escape??Infinity,race.elapsed);return profile;}
