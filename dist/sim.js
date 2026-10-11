import {hasVehicle,hasSetting} from './catalog.js';
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
export function createCar(track,name,s,lane=0,color=PAINTS[0],traffic=false){const p=track.at(s);return {name,x:p.x+p.tz*lane,z:p.z-p.tx*lane,y:p.y,heading:p.heading,speed:0,steer:0,slip:0,nitrous:1,breaker:1,s:wrap(s,track.length),index:p.index,offset:lane,nextGate:1,gates:0,lap:1,lastCheckpoint:0,lapStart:0,lapTimes:[],finish:null,color,traffic,boosting:false,breakingTime:false,braking:false,impact:0,stuck:0,wheel:0};}
export function integrate(car,input,dt,track){
 const breaker=!!input.breaker&&car.breaker>0.005&&car.speed>2;car.breakingTime=breaker;
 const boost=!!input.boost&&car.nitrous>.005&&input.throttle>.1&&car.speed>2&&!breaker;car.boosting=boost;car.braking=input.brake>.1;
 car.nitrous=clamp(car.nitrous+(boost?-.24:car.speed>5?.07:0)*dt,0,1);car.breaker=clamp(car.breaker+(breaker?-.75:.08)*dt,0,1);
 let acceleration=clamp(input.throttle||0,0,1)*16*(1-.35*clamp(car.speed/62,0,1))+(boost?22:0);
 if(input.brake){acceleration-=car.speed>1?26*input.brake:7*input.brake;}
 acceleration-=Math.sign(car.speed)*(.75+.0028*car.speed*car.speed);
 if(input.handbrake&&car.speed>0)acceleration-=7;
 car.speed=clamp(car.speed+acceleration*dt,-10,boost?78:62);
 if(!input.throttle&&!input.brake&&Math.abs(car.speed)<.12)car.speed=0;
 car.steer+=(clamp(input.steer||0,-1,1)-car.steer)*Math.min(1,dt*10);
 const steeringAngle=(.48-.34*clamp(Math.abs(car.speed)/65,0,1))*car.steer*(breaker?1.2:1);
 car.heading+=Math.tan(steeringAngle)*car.speed/2.65*dt;
 const targetSlip=input.handbrake&&car.speed>10?-car.steer*.3:0;car.slip+=(targetSlip-car.slip)*Math.min(1,dt*(input.handbrake?4:breaker?12:5));
 car.x+=Math.sin(car.heading+car.slip)*car.speed*dt;car.z+=Math.cos(car.heading+car.slip)*car.speed*dt;car.wheel+=car.speed*dt/.34;
 const p=track.project(car.x,car.z,car.index);car.s=p.s;car.index=p.index;car.offset=p.offset;car.y=track.at(p.s).y;
 const edge=track.width/2-1.12;if(Math.abs(p.offset)>edge){const a=track.at(p.s),o=clamp(p.offset,-edge,edge);car.x=p.x+a.tz*o;car.z=p.z-a.tx*o;car.offset=o;car.speed*=Math.max(.2,1-dt*3);car.heading+=angleDiff(a.heading,car.heading)*Math.min(1,dt*2);car.impact=1;}
 car.impact=Math.max(0,car.impact-dt*3);
}
export function collideCars(a,b){const dx=a.x-b.x,dz=a.z-b.z,d=Math.hypot(dx,dz),r=2.35;if(d>=r)return;const nx=d>1e-6?dx/d:1,nz=d>1e-6?dz/d:0,p=(r-d)/2;a.x+=nx*p;a.z+=nz*p;b.x-=nx*p;b.z-=nz*p;const loss=Math.min(6,Math.abs(a.speed-b.speed)*.2+.3);a.speed=Math.max(0,a.speed-loss);b.speed=Math.max(0,b.speed-loss*.4);a.impact=b.impact=1;}
export function progressCar(car,oldS,elapsed,track){
 if(car.traffic||car.finish!==null)return;const delta=wrap(car.s-oldS+track.length/2,track.length)-track.length/2;
 if(delta<=0||delta>12||car.speed<0)return;const gate=track.gates[car.nextGate];const crossing=car.nextGate===0?oldS>track.length-15&&car.s<15:oldS<gate&&car.s>=gate;
 if(!crossing)return;car.gates++;car.lastCheckpoint=gate;car.nextGate=(car.nextGate+1)%8;
 if(gate===0){car.lapTimes.push(elapsed-car.lapStart);car.lapStart=elapsed;if(car.gates>=16)car.finish=elapsed;else car.lap=2;}
}
export function resetCar(car,track){const p=track.at(car.traffic?car.s:car.lastCheckpoint+2);car.x=p.x;car.z=p.z;car.y=p.y;car.heading=p.heading;car.s=p.s;car.index=p.index;car.speed=0;car.slip=0;car.steer=0;car.stuck=0;}
export function aiInput(car,track,cars){
 const ahead=track.at(car.s+12+Math.max(0,car.speed)*.48),far=track.at(car.s+60),now=track.at(car.s);let lane=car.traffic?(car.name.endsWith('1')||car.name.endsWith('3')?-4.6:4.6):car.name==='SABLE'?-2.6:car.name==='RIFT'?2.6:0;
 for(const other of cars){if(other===car)continue;const diff=wrap(other.s-car.s,track.length);if(diff<22&&Math.abs(other.offset-lane)<2.7)lane=lane<0?3.5:-3.5;}
 const targetX=ahead.x+ahead.tz*lane,targetZ=ahead.z-ahead.tx*lane,angle=angleDiff(Math.atan2(targetX-car.x,targetZ-car.z),car.heading);
 const bend=Math.abs(angleDiff(far.heading,now.heading));const desired=car.traffic?23:clamp(56-bend*48,18,56);
 return {steer:clamp(angle*3,-1,1),throttle:car.speed<desired?1:.1,brake:car.speed>desired+2?.55:0,handbrake:false,boost:!car.traffic&&bend<.08&&car.speed>40&&car.nitrous>.5,breaker:false};
}
export class Race{
 constructor(track){this.track=track;this.restart();this.phase='menu';}
 restart(color=PAINTS[0]){const t=this.track;this.player=createCar(t,'YOU',2,-2.4,color);this.rivals=[createCar(t,'SABLE',9,2.6,'#ddd7cc'),createCar(t,'RIFT',16,-2.4,'#245f78'),createCar(t,'ONYX',23,2.6,'#28272b')];this.traffic=Array.from({length:4},(_,i)=>{const c=createCar(t,'TRAFFIC '+i,180+i*t.length/4,i%2?-4.5:4.5,['#56665a','#a89a80','#e0dcce','#344b64'][i],true);c.speed=22;return c;});this.cars=[this.player,...this.rivals,...this.traffic];this.phase='countdown';this.countdown=3;this.elapsed=0;this.beforePause=null;}
 pause(){if(this.phase==='paused'){this.phase=this.beforePause;return;}if(['racing','countdown'].includes(this.phase)){this.beforePause=this.phase;this.phase='paused';}}
 step(input,dt=STEP){if(!['countdown','racing'].includes(this.phase))return;if(this.phase==='countdown'){this.countdown-=dt;if(this.countdown<=0)this.phase='racing';return;}
 const slow=input.breaker&&this.player.breaker>.005&&this.player.speed>2;const simdt=dt*(slow?.4:1);this.elapsed+=simdt;
 for(const c of this.cars){const old=c.s,control=c===this.player?input:aiInput(c,this.track,this.cars);integrate(c,control,simdt,this.track);progressCar(c,old,this.elapsed,this.track);if(c!==this.player){c.stuck=c.speed<2?c.stuck+simdt:0;if(c.stuck>4)resetCar(c,this.track);}}
 for(let i=0;i<this.cars.length;i++)for(let j=i+1;j<this.cars.length;j++)collideCars(this.cars[i],this.cars[j]);
 if(this.player.finish!==null)this.phase='finished';
 }
 get standings(){const progress=c=>{const last=this.track.gates[wrap(c.nextGate-1,8)],distance=wrap(c.s-last,this.track.length);return c.gates+clamp(distance/(this.track.length/8),0,.999);};return [this.player,...this.rivals].sort((a,b)=>{if(a.finish!==null||b.finish!==null)return (a.finish??Infinity)-(b.finish??Infinity);return progress(b)-progress(a);});}
 get position(){return this.standings.indexOf(this.player)+1;}
}
export function validateProfile(raw){const p={version:1,paint:PAINTS[0],quality:'high',volume:.55,vehicle:'hypercar',environment:'forest',onboardingVersion:0,records:{}};if(!raw||typeof raw!=='object')return p;if(PAINTS.includes(raw.paint))p.paint=raw.paint;if(hasVehicle(raw.vehicle))p.vehicle=raw.vehicle;if(hasSetting(raw.environment))p.environment=raw.environment;if(raw.onboardingVersion===1)p.onboardingVersion=1;if(['high','low'].includes(raw.quality))p.quality=raw.quality;if(Number.isFinite(raw.volume))p.volume=clamp(raw.volume,0,1);for(const key of ['lap','race'])if(Number.isFinite(raw.records?.[key])&&raw.records[key]>0)p.records[key]=raw.records[key];return p;}
export function updateRecords(profile,car){if(car.finish===null||car.gates<16)return profile;const lap=Math.min(...car.lapTimes);if(Number.isFinite(lap)&&lap>0)profile.records.lap=Math.min(profile.records.lap??Infinity,lap);profile.records.race=Math.min(profile.records.race??Infinity,car.finish);return profile;}
