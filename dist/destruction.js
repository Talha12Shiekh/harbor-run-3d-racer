import {getHandling} from './handling.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const DESTRUCTION=Object.freeze({damageEnergy:90000,steelEnergy:60000,masonryEnergy:80000,gravity:9.81,partLife:8,carParts:24,barrierParts:64});
export const bodyCentre=car=>(car.bodyHeight??1.3)*.5;
export function freshDamage(){return {front:0,rear:0,left:0,right:0,revision:0,parts:{},hits:{},wrecked:false};}
export function repairCar(car){car.damage=freshDamage();Object.assign(car,{kickX:0,kickZ:0,verticalSpeed:0,bodyRoll:0,bodyPitch:0,rollSpeed:0,pitchSpeed:0,airborne:false,offroad:false});}
export function motion(car){let x=Math.sin(car.heading+car.slip)*car.speed+(car.kickX??0),z=Math.cos(car.heading+car.slip)*car.speed+(car.kickZ??0);const speed=Math.hypot(x,z);if(speed>85){x*=85/speed;z*=85/speed;}return {x,z};}
export function applyImpulse(car,x,z){const dx=Math.sin(car.heading+car.slip),dz=Math.cos(car.heading+car.slip),forward=x*dx+z*dz;car.speed=clamp(car.speed+forward,-10,getHandling(car.vehicle).boostSpeed);car.kickX=clamp((car.kickX??0)+x-dx*forward,-45,45);car.kickZ=clamp((car.kickZ??0)+z-dz*forward,-45,45);}
export function damageCar(car,event,energy){
 if(!car.damage)repairCar(car);const d=car.damage,dx=event.x-car.x,dz=event.z-car.z,lx=dx*Math.cos(car.heading)-dz*Math.sin(car.heading),lz=dx*Math.sin(car.heading)+dz*Math.cos(car.heading),zone=Math.abs(lz)>1.05?(lz>0?'front':'rear'):(lx<0?'left':'right');
 const scrape=event.kind==='scrape';if(!scrape&&event.closing<3.5)return false;
 const increment=scrape?.003*event.severity:energy/DESTRUCTION.damageEnergy,previous=d[zone],next=clamp(previous+increment,0,scrape?Math.max(previous,.28):1);
 if(next-previous<.0001)return false;d[zone]=next;d.hits[zone]={x:clamp(lx,-1.1,1.1),z:clamp(lz,-2.3,2.3)};d.revision++;
 if(d.front>=.65)d.parts.frontBumper=true;if(d.rear>=.65)d.parts.rearBumper=true;if(d.front>=.85)d.parts.hood=true;if(d.left>=.85)d.parts.leftPanel=true;if(d.right>=.85)d.parts.rightPanel=true;
 if(!scrape&&((next>=.95&&event.closing>=15)||d.front+d.rear+d.left+d.right>2.5)){d.wrecked=true;car.boosting=false;car.breakingTime=false;}
 return true;
}
export function deformPoint(x,y,z,damage){
 let xx=x,yy=y,zz=z;
 for(const zone of ['front','rear','left','right']){
  const level=damage[zone]??0;if(!level||y<.22)continue;const hit=damage.hits?.[zone]??{x:0,z:0};let weight;
  if(zone==='front'||zone==='rear'){const sign=zone==='front'?1:-1;weight=clamp((z*sign-.65)/1.25,0,1)*Math.exp(-(((x-hit.x)/1.1)**2));zz-=sign*.45*level*weight;yy+=level*weight*(.065*Math.sin(x*10+z*7)+.075);xx+=.025*level*weight*Math.sin(z*17);}
  else{const sign=zone==='right'?1:-1;weight=clamp((x*sign-.45)/.55,0,1)*Math.exp(-(((z-hit.z)/1.25)**2));xx-=sign*.30*level*weight;yy+=.06*level*weight*Math.sin(z*9+y*11);}
 }
 return [xx,yy,zz];
}
export function heightSample(h,x,z){
 if(!h)return -.8;const n=h.size,u=clamp((x-h.origin[0])/h.extent*(n-1),0,n-1),v=clamp((z-h.origin[1])/h.extent*(n-1),0,n-1),i=Math.min(n-2,Math.floor(u)),j=Math.min(n-2,Math.floor(v)),a=u-i,b=v-j;return (h.heights[j*n+i]*(1-a)+h.heights[j*n+i+1]*a)*(1-b)+(h.heights[(j+1)*n+i]*(1-a)+h.heights[(j+1)*n+i+1]*a)*b;
}
export class DestructionWorld{
 constructor(track,placements=null,heightmap=null){this.track=track;this.configure(placements??this.defaultBarriers(),heightmap);}
 defaultBarriers(){const list=[];for(let s=0;s<this.track.length;s+=6)for(const side of [-1,1]){const p=this.track.at(s);list.push({name:'guardrail',x:p.x+p.tz*side*11.4,z:p.z-p.tx*side*11.4,y:p.y+.015,heading:p.heading,side,span:6});}return list;}
 configure(placements,heightmap){
  this.heightmap=heightmap;this.sections=placements.filter(p=>p.name==='guardrail'||p.name==='masonry-barrier').map((p,i)=>({...p,id:p.barrierId??i,side:p.side??Math.sign(this.track.project(p.x,p.z).offset),span:p.span??6}));this.cells=new Map();
  for(const p of this.sections){const key=Math.floor(p.x/16)+':'+Math.floor(p.z/16);if(!this.cells.has(key))this.cells.set(key,[]);this.cells.get(key).push(p);}this.reset();
 }
 reset(){this.states=new Map(this.sections.map(p=>[p.id,{damage:0,broken:false,revision:0}]));this.touches=new Map();this.revision=(this.revision??0)+1;}
 ground(x,z,hint){const p=this.track.project(x,z,hint),distance=Math.sqrt(p.dist),road=this.track.at(p.s).y+.015;if(distance<14)return road;if(distance<21)return road+( -.8-road)*(distance-14)/7;return heightSample(this.heightmap,x,z);}
 nearby(x,z){const list=[],cx=Math.floor(x/16),cz=Math.floor(z/16);for(let i=cx-1;i<=cx+1;i++)for(let j=cz-1;j<=cz+1;j++)list.push(...(this.cells.get(i+':'+j)??[]));return list;}
 resolve(car,previous,dt,time){
  const contacts=[];
  for(const section of this.nearby(car.x,car.z)){
   const state=this.states.get(section.id);if(state.broken||car.y>section.y+1.8||car.y+(car.bodyHeight??1.3)<section.y)continue;const sin=Math.sin(section.heading),cos=Math.cos(section.heading),baseX=-section.side*cos,baseZ=section.side*sin,prior=(previous.x-section.x)*baseX+(previous.z-section.z)*baseZ,sign=prior<0?-1:1,nx=baseX*sign,nz=baseZ*sign;
   const distance=(car.x-section.x)*nx+(car.z-section.z)*nz,support=.98+1.3*Math.abs(Math.sin(car.heading)*nx+Math.cos(car.heading)*nz),along=(car.x-section.x)*sin+(car.z-section.z)*cos,alongSupport=.98+1.3*Math.abs(Math.sin(car.heading)*sin+Math.cos(car.heading)*cos);
   if(distance>support+.025||Math.abs(along)>section.span*.5+alongSupport||prior*sign< -support)continue;
   const velocity=motion(car),closing=Math.max(0,-velocity.x*nx-velocity.z*nz),sliding=Math.abs(velocity.x*nz-velocity.z*nx);if(closing<.03&&distance>support-.03&&sliding<2.5)continue;
   const at=clamp(along,-section.span*.5,section.span*.5),contact={x:section.x+sin*at,y:section.y+.58,z:section.z+cos*at,ground:section.y+.04,nx,nz,closing,sliding,vx:velocity.x,vz:velocity.z,side:section.side,barrierId:section.id,surface:section.name==='masonry-barrier'?'masonry':'metal'};
   const key=car.name+':'+section.id,last=this.touches.get(key),fresh=last===undefined||time-last>.12,energy=.5*getHandling(car.vehicle).mass*closing**2,threshold=contact.surface==='masonry'?DESTRUCTION.masonryEnergy:DESTRUCTION.steelEnergy;
   if(fresh&&closing>=3.5){state.damage=clamp(state.damage+energy/threshold,0,1);state.revision++;this.revision++;if(state.damage>=1){state.broken=true;contact.broken=true;contact.section={...section};const remain=Math.sqrt(Math.max(0,closing**2-2*threshold*.55/getHandling(car.vehicle).mass));applyImpulse(car,nx*(closing-remain),nz*(closing-remain));if(closing>14){car.rollSpeed=clamp(car.rollSpeed+section.side*closing*.09,-4,4);car.pitchSpeed=clamp(car.pitchSpeed+.3,-4,4);car.verticalSpeed=Math.max(car.verticalSpeed,closing*.06);}}}
   if(!state.broken){const push=Math.max(0,support-distance);car.x+=nx*push;car.z+=nz*push;applyImpulse(car,nx*closing*1.12,nz*closing*1.12);}
   this.touches.set(key,time);contacts.push(contact);
  }
  const projected=this.track.project(car.x,car.z,car.index);car.s=projected.s;car.index=projected.index;car.offset=projected.offset;const landing=this.settle(car,dt);if(landing)contacts.push(landing);return contacts;
 }
 settle(car,dt){
  let landingContact=null;
  car.kickX*=Math.exp(-dt*(car.offroad?1.2:2.5));car.kickZ*=Math.exp(-dt*(car.offroad?1.2:2.5));car.bodyRoll+=car.rollSpeed*dt;car.bodyPitch+=car.pitchSpeed*dt;
  const centre=bodyCentre(car),support=centre*Math.abs(Math.cos(car.bodyRoll)*Math.cos(car.bodyPitch))+1.03*Math.abs(Math.sin(car.bodyRoll)*Math.cos(car.bodyPitch))+2.28*Math.abs(Math.sin(car.bodyPitch)),floor=this.ground(car.x,car.z,car.index)+Math.max(0,support-centre);car.offroad=Math.abs(car.offset)>this.track.width*.5;
  if(!car.damage.wrecked&&!car.airborne&&Math.abs(car.offset)<14&&Math.abs(car.verticalSpeed)<.05&&Math.abs(car.bodyRoll)<.1){car.y=floor;car.verticalSpeed=0;}
  else{car.verticalSpeed=clamp(car.verticalSpeed-DESTRUCTION.gravity*dt,-55,55);car.y+=car.verticalSpeed*dt;if(car.y<=floor){car.y=floor;if(car.verticalSpeed<0){const landing=-car.verticalSpeed;car.verticalSpeed=landing>1?landing*.18:0;if(landing>5){const v=motion(car);landingContact={x:car.x+Math.sin(car.heading)*2,y:car.y+.2,z:car.z+Math.cos(car.heading)*2,ground:floor,nx:0,nz:0,closing:landing,sliding:0,vx:v.x,vz:v.z,barrierId:'ground',surface:'earth'};car.rollSpeed=clamp(car.rollSpeed+Math.sign(car.bodyRoll||car.offset)*landing*.12,-4,4);}const drag=Math.exp(-dt*4);car.rollSpeed*=drag;car.pitchSpeed*=drag;car.speed*=Math.exp(-dt*(car.damage.wrecked?1.5:.5));}} }
  car.airborne=car.y>floor+.06||Math.abs(car.verticalSpeed)>.3;const angularDrag=Math.exp(-dt*(car.airborne?.12:3));car.rollSpeed*=angularDrag;car.pitchSpeed*=angularDrag;
  if(!car.airborne&&car.damage.wrecked&&Math.abs(car.speed)+Math.hypot(car.kickX,car.kickZ)<2){const target=Math.round(car.bodyRoll/Math.PI)*Math.PI;car.bodyRoll+=(target-car.bodyRoll)*Math.min(1,dt*2);car.bodyPitch*=Math.exp(-dt*2);}
  return landingContact;
 }
}
