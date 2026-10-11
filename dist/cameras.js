// Original camera presets. Coordinates are metres in the car's +Z forward frame.
export const DRIVING_VIEWS=Object.freeze([
 {id:'chase',label:'Chase'}, {id:'wide',label:'Wide chase'},
 {id:'tracking',label:'Tracking'}, {id:'hood',label:'Hood'}, {id:'cockpit',label:'Cockpit'}
].map(Object.freeze));
export const hasDrivingView=id=>DRIVING_VIEWS.some(v=>v.id===id);
export const drivingView=id=>DRIVING_VIEWS.find(v=>v.id===id)??DRIVING_VIEWS[0];
export const nextDrivingView=(id,direction=1)=>DRIVING_VIEWS[(DRIVING_VIEWS.findIndex(v=>v.id===drivingView(id).id)+direction+DRIVING_VIEWS.length)%DRIVING_VIEWS.length].id;
export const wrapYaw=value=>Number.isFinite(value)?((value+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI:-.72;
export const SEATS=Object.freeze({
 hypercar:{eye:[-.35,1.015,-.24],lift:0,hood:.84},
 spyder:{eye:[-.35,1.015,-.20],lift:0,hood:.84},
 interceptor:{eye:[-.35,1.11,-.22],lift:.07,hood:.95},
 rally:{eye:[-.35,1.24,-.32],lift:.19,hood:1.04},
 muscle:{eye:[-.35,1.13,-.25],lift:.10,hood:1.01}
});
// Interior-only visibility regions for the accepted, merged exterior GLBs.
// The exterior triangle set remains intact in every outside camera.
export const DRIVER_ROOFS=Object.freeze({
 hypercar:[-.85,.85,.88,1.3,-.65,.42],
 interceptor:[-.88,.88,.88,1.4,-.78,.52],
 rally:[-.85,.85,1.15,1.6,-1.4,.40],
 muscle:[-.85,.85,1.10,1.5,-1.6,.15]
});
export function isDriverRoof(id,[x,y,z]){
 const b=DRIVER_ROOFS[id];return !!b&&x>=b[0]&&x<=b[1]&&y>=b[2]&&y<=b[3]&&z>=b[4]&&z<=b[5];
}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function cameraPose(car,view='chase',yaw=-.72,rear=false,reducedMotion=false){
 const seat=SEATS[car.vehicle]??SEATS.hypercar,mode=rear?'rear':drivingView(view).id,speed=clamp(Math.abs(car.speed)/67,0,1);
 const place=([x,y,z])=>[car.x+Math.cos(car.heading)*x+Math.sin(car.heading)*z,car.y+y+.03,car.z-Math.sin(car.heading)*x+Math.cos(car.heading)*z];
 let eye,look,fov,near=.1;
 if(mode==='rear'){eye=[0,2.4,8];look=[0,.9,-8];fov=61;}
 else if(mode==='tracking'){const a=wrapYaw(yaw);eye=[Math.sin(a)*7.5,1.45,Math.cos(a)*7.5];look=[0,.55,0];fov=50;}
 else if(mode==='cockpit'||mode==='hood'){
  eye=mode==='cockpit'?seat.eye:[0,seat.hood,1.05];
  const turn=reducedMotion?0:clamp(car.steer,-1,1)*.12;
  look=[eye[0]+Math.sin(turn)*28,eye[1]-.06,eye[2]+Math.cos(turn)*28];fov=mode==='cockpit'?76:67;near=mode==='cockpit'?.035:.08;
 }else{eye=[0,mode==='wide'?3.8:2.4,-(mode==='wide'?11.5+speed*1.5:7.1+speed)];look=[0,.9,mode==='wide'?13:9];fov=(mode==='wide'?65:57)+speed*8+(car.boosting?4:0);}
 return {eye:place(eye),look:place(look),fov,near,inside:mode==='cockpit',mode};
}
