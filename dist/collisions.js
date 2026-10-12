const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const CONTACT=Object.freeze({radius:.98,halfLength:1.30,tolerance:.025,impactSpeed:1.2,scrapeSpeed:2.5,rearm:.12,impactInterval:.28,scrapeInterval:.08,maxEvents:48});

// Closest points of the two centre segments, then expand by the body radius.
export function carContact(a,b){
 if((a.x-b.x)**2+(a.z-b.z)**2>4.7**2)return null;
 const h=CONTACT.halfLength,ax=Math.sin(a.heading),az=Math.cos(a.heading),bx=Math.sin(b.heading),bz=Math.cos(b.heading);
 const px=a.x-ax*h,pz=a.z-az*h,qx=b.x-bx*h,qz=b.z-bz*h,ux=ax*h*2,uz=az*h*2,vx=bx*h*2,vz=bz*h*2,rx=px-qx,rz=pz-qz;
 const aa=ux*ux+uz*uz,bb=vx*vx+vz*vz,ab=ux*vx+uz*vz,ar=ux*rx+uz*rz,br=vx*rx+vz*rz,den=aa*bb-ab*ab;
 let s=den>1e-8?clamp((ab*br-ar*bb)/den,0,1):0,t=(ab*s+br)/bb;
 if(t<0){t=0;s=clamp(-ar/aa,0,1);}else if(t>1){t=1;s=clamp((ab-ar)/aa,0,1);}
 const apx=px+ux*s,apz=pz+uz*s,bpx=qx+vx*t,bpz=qz+vz*t,dx=apx-bpx,dz=apz-bpz,d=Math.hypot(dx,dz),r=CONTACT.radius*2;
 if(d>r+CONTACT.tolerance)return null;
 let nx,nz,penetration;
 if(d>1e-7){nx=dx/d;nz=dz/d;penetration=Math.max(0,r-d);}else{
  const cx=a.x-b.x,cz=a.z-b.z,cd=Math.hypot(cx,cz);nx=cd>1e-7?cx/cd:az;nz=cd>1e-7?cz/cd:-ax;
  penetration=Math.max(0,r+h*(Math.abs(ax*nx+az*nz)+Math.abs(bx*nx+bz*nz))-Math.abs(cx*nx+cz*nz));
 }
 const avx=Math.sin(a.heading+a.slip)*a.speed,avz=Math.cos(a.heading+a.slip)*a.speed,bvx=Math.sin(b.heading+b.slip)*b.speed,bvz=Math.cos(b.heading+b.slip)*b.speed,rvx=avx-bvx,rvz=avz-bvz;
 return {x:(apx+bpx)/2,y:(a.y+b.y)/2+.58,z:(apz+bpz)/2,ground:(a.y+b.y)/2+.04,nx,nz,penetration,closing:Math.max(0,-(rvx*nx+rvz*nz)),sliding:Math.abs(rvx*nz-rvz*nx),vx:(avx+bvx)*.5,vz:(avz+bvz)*.5,an:Math.sin(a.heading+a.slip)*nx+Math.cos(a.heading+a.slip)*nz,bn:Math.sin(b.heading+b.slip)*nx+Math.cos(b.heading+b.slip)*nz};
}

export class ContactFeedback{
 constructor(){this.contacts=new Map();this.events=[];this.sequence=0;}
 record(key,contact,actors,time){
  if(!contact||!Number.isFinite(contact.x+contact.y+contact.z+contact.closing+contact.sliding))return;
  let memory=this.contacts.get(key);const fresh=!memory||time-memory.touch>CONTACT.rearm;
  if(fresh)memory={touch:time,hit:0,impact:-Infinity,scrape:-Infinity};
  const impact=contact.closing>=CONTACT.impactSpeed&&(fresh||memory.hit===0||(contact.closing>=8&&contact.closing>=memory.hit*1.4&&time-memory.impact>=CONTACT.impactInterval));
  if(impact){this.push({...contact,id:++this.sequence,kind:'impact',actors,severity:1-Math.exp(-contact.closing/14)});memory.hit=contact.closing;memory.impact=time;}
  else if(contact.sliding>=CONTACT.scrapeSpeed&&time-memory.scrape>=CONTACT.scrapeInterval){this.push({...contact,id:++this.sequence,kind:'scrape',actors,severity:clamp(contact.sliding/35,.08,.7)});memory.scrape=time;}
  memory.touch=time;this.contacts.set(key,memory);
 }
 push(event){if(this.events.length===CONTACT.maxEvents)this.events.shift();this.events.push(event);}
 drain(){const events=this.events;this.events=[];return events;}
 clear(){this.contacts.clear();this.events=[];}
}
