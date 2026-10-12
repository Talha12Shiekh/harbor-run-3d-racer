const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const IMPACT_LIMITS=Object.freeze({sparks:192,fragments:48,dust:40,gravity:12});
function random(seed){let n=(seed>>>0)||1;return ()=>{n^=n<<13;n^=n>>>17;n^=n<<5;return (n>>>0)/4294967296;};}
export function cameraRecoil(strength,age,inside=false,reducedMotion=false){
 const s=reducedMotion?0:clamp(strength,0,1),amount=(inside?.025:.18)*s;
 return {x:Math.sin(age*83)*amount,y:Math.sin(age*97+.3)*amount*.55,roll:Math.sin(age*69)*s*(inside?.003:.009),pitch:Math.sin(age*77)*s*.005,fov:inside?0:s*2};
}
export class ImpactField{
 constructor(){this.pools={};this.cursor={};for(const [kind,count] of Object.entries({spark:IMPACT_LIMITS.sparks,fragment:IMPACT_LIMITS.fragments,dust:IMPACT_LIMITS.dust})){this.pools[kind]=Array.from({length:count},()=>({alive:false}));this.cursor[kind]=0;}this.clear();}
 clear(){for(const pool of Object.values(this.pools))for(const p of pool)p.alive=false;this.strength=0;this.age=0;this.flash=null;this.recoils=new Map();}
 emit(event,cars=[],reduced=false,reducedMotion=false){
  const s=clamp(event.severity,0,1),rand=random(event.id*7919+17),scrape=event.kind==='scrape',factor=reduced?.5:1;
  const counts={spark:Math.ceil((scrape?6+s*12:12+s*60)*factor),fragment:scrape?0:Math.ceil((2+s*10)*factor),dust:scrape?0:reduced?1:Math.ceil(1+s*2)};
  for(const [kind,count] of Object.entries(counts))for(let i=0;i<count;i++){
   const pool=this.pools[kind],p=pool[this.cursor[kind]++%pool.length],spread=kind==='dust'?1.5:3+s*7;
   Object.assign(p,{alive:true,kind,x:event.x+(rand()-.5)*.18,y:event.y+(rand()-.5)*.12,z:event.z+(rand()-.5)*.18,vx:event.vx*(scrape?.45:.24)+(rand()-.5)*spread*2,vz:event.vz*(scrape?.45:.24)+(rand()-.5)*spread*2,vy:kind==='dust'?.5+rand()*.7:1+rand()*(2+s*4),age:0,life:kind==='spark'?.18+rand()*.37:kind==='fragment'?.45+rand()*.60:.35+rand()*.50,size:kind==='dust'?.45+rand()*.35:kind==='fragment'?.035+rand()*.065:.04,ground:event.ground,bounces:0,angle:rand()*Math.PI*2,spin:(rand()-.5)*30,severity:s});
  }
  if(!scrape){
   for(const actor of event.actors){const car=cars[actor];if(!car)continue;const sign=actor===event.actors[0]?1:-1;this.recoils.set(actor,{roll:clamp(sign*(event.nx*Math.cos(car.heading)-event.nz*Math.sin(car.heading))*s*.07,-.07,.07),pitch:clamp(sign*(event.nx*Math.sin(car.heading)+event.nz*Math.cos(car.heading))*s*.045,-.045,.045)});}
   const playerHit=event.actors.includes(0),player=cars[0];if(playerHit){this.strength=Math.max(this.strength,s);this.age=0;}
   if(!reducedMotion&&s>.18&&(playerHit||(player&&(event.x-player.x)**2+(event.z-player.z)**2<400))&&(!this.flash||s>=this.flash.strength||this.flash.age>.05))this.flash={x:event.x,y:event.y,z:event.z,age:0,strength:s};
  }
 }
 update(dt){
  if(!(dt>0))return;
  this.age+=dt;this.strength=Math.max(0,this.strength-dt*3.2);if(this.flash){this.flash.age+=dt;if(this.flash.age>.09)this.flash=null;}
  for(const recoil of this.recoils.values()){const decay=Math.exp(-dt*14);recoil.roll*=decay;recoil.pitch*=decay;}
  for(const pool of Object.values(this.pools))for(const p of pool){if(!p.alive)continue;p.age+=dt;if(p.age>=p.life){p.alive=false;continue;}const drag=Math.exp(-dt*(p.kind==='dust'?1.8:1.1));p.vx*=drag;p.vz*=drag;p.vy-=p.kind==='dust'?-.3*dt:IMPACT_LIMITS.gravity*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.angle+=p.spin*dt;if(p.kind!=='dust'&&p.y<p.ground){p.y=p.ground;if(!p.bounces){p.vy=Math.abs(p.vy)*.28;p.vx*=.55;p.vz*=.55;p.bounces=1;}else{p.vy=0;p.life=Math.min(p.life,p.age+.06);}}}
 }
}
