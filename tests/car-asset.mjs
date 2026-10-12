import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import {GLTFLoader} from '../dist/vendor/examples/jsm/loaders/GLTFLoader.js';
import {World,prepareCar,cloneCar} from '../dist/world.js';
import {Race,createTrack,aiInput,STEP,integrate} from '../dist/sim.js';
import {wheelSteering} from '../dist/handling.js';
import {VEHICLES} from '../dist/catalog.js';
import {DRIVING_VIEWS,SEATS,cameraPose} from '../dist/cameras.js';
import {prepareCockpit} from '../dist/cockpit.js';
import {ImpactEffects} from '../dist/impact-effects.js';
import {damageCar} from '../dist/destruction.js';
import {StructuralDebris} from '../dist/damage-visuals.js';
import {assetParts} from '../dist/wilderness.js';
globalThis.self=globalThis;
// Geometry validation uses an image metadata stub. It does not test GPU texture upload.
globalThis.createImageBitmap=async()=>({width:1024,height:1024,close(){}});
const catalog=JSON.parse(await readFile(new URL('../dist/assets/vehicles/manifest.json',import.meta.url),'utf8')),templates=new Map(),reports=[];
assert.equal(catalog.originalGeometry,true);assert.deepEqual(catalog.vehicles.map(c=>c.id),VEHICLES.map(v=>v.id));
for(const metadata of catalog.vehicles){
 const bytes=await readFile(new URL('../dist/assets/vehicles/'+metadata.id+'.glb',import.meta.url));const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const template=prepareCar(gltf,metadata);template.userData.vehicle=metadata.id;templates.set(metadata.id,template);const car=cloneCar(template,'#245f78');car.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(car),size=bounds.getSize(new THREE.Vector3());
 assert.equal(metadata.originalGeometry,true);assert.ok(size.z>4.4&&size.z<4.7);assert.ok(size.x>1.5&&size.x<2.35);assert.ok(size.y>1.05&&size.y<1.55);assert.equal(car.userData.wheelGroups.length,4);assert.ok(car.userData.paints.length);assert.ok(car.userData.brakes.length);
 let triangles=0,glazing=0,frontLampZ=-Infinity,rearLampZ=Infinity;
 car.traverse(o=>{if(!o.isMesh)return;triangles+=o.geometry.attributes.position.count/3;for(const value of o.geometry.attributes.position.array)assert.ok(Number.isFinite(value));const m=o.material,b=new THREE.Box3().setFromObject(o);if(m.name==='Glass glazing'){glazing++;assert.ok(m.transparent&&m.opacity>.1&&m.opacity<.7);assert.equal(m.depthWrite,false);}if(m.name==='Projector light')frontLampZ=Math.max(frontLampZ,b.max.z);if(m.name==='Brakelight red')rearLampZ=Math.min(rearLampZ,b.min.z);});
 assert.equal(glazing,metadata.id==='spyder'?1:4,'Glazing must remain separated by real window orientation');assert.equal(triangles,metadata.triangles);assert.ok(frontLampZ>1.9);assert.ok(rearLampZ< -1.9);
 for(const group of car.userData.wheelGroups){const b=new THREE.Box3().setFromObject(group);assert.ok(Math.abs(b.min.y)<.003,'Tires must meet the ground');assert.ok((group.name.includes('Front')?group.position.z:-group.position.z)>1.3);group.traverse(o=>{if(o.isMesh)assert.notEqual(o.material.name,'Fixed caliper','Brake calipers stay fixed');});for(const spin of [Math.PI/3,Math.PI,19]){group.rotation.x=spin;car.updateMatrixWorld(true);assert.ok(Math.abs(b.getCenter(new THREE.Vector3()).y-new THREE.Box3().setFromObject(group).getCenter(new THREE.Vector3()).y)<.015,'Wheel pivot is eccentric');}group.rotation.x=0;}
 const other=cloneCar(template,'#b72227');assert.notEqual(car.userData.paints[0],other.userData.paints[0]);assert.equal(other.userData.paints[0].color.getHexString(),'b72227');reports.push({id:metadata.id,dimensions:size.toArray().map(v=>+v.toFixed(3)),triangles,wheels:4});
}
console.log(JSON.stringify({originalVehicles:reports,groundedWheels:true,materialIsolation:true,gpuRendering:'not exercised'},null,2));
const template=templates.get('hypercar');
const cockpitBytes=await readFile(new URL('../dist/assets/vehicles/cockpit.glb',import.meta.url));
const cockpitTemplate=prepareCockpit(await new GLTFLoader().parseAsync(cockpitBytes.buffer.slice(cockpitBytes.byteOffset,cockpitBytes.byteOffset+cockpitBytes.byteLength),''));

// Run the real scene update with only the GPU render call replaced.
// This validates transforms and state integration, not browser visuals or FPS.
function makeWorld(){
 const track=createTrack();
 const world=Object.assign(Object.create(World.prototype),{
  track,race:new Race(track),template,templates,cockpitTemplate,vehicle:'hypercar',contactTexture:new THREE.Texture(),
  scene:new THREE.Scene(),camera:new THREE.PerspectiveCamera(61,1,.1,2400),
  sun:new THREE.DirectionalLight(),look:new THREE.Vector3(),time:0,carMeshes:[],
  renderCalls:0,
 });
 world.renderer={render(){world.renderCalls++;},getPixelRatio(){return 1;}};
 world.impactEffects=new ImpactEffects(world.scene);
 world.attachCars();
 return world;
}
test('AC-43 AC-44 actual scene fills three bounded particle draws, freezes on pause and reuses resources',()=>{
 const w=makeWorld(),e=w.impactEffects,root=e.root,p=w.race.player;
 const event={id:1,kind:'impact',actors:[0,1],x:p.x,y:p.y+.58,z:p.z+2,ground:p.y+.04,nx:0,nz:-1,closing:30,sliding:0,vx:0,vz:18,severity:.9};w.impact([event]);w.race.phase='racing';w.race.elapsed+=1/60;w.update(1/60);
 assert.ok(e.sparks.geometry.drawRange.count>0&&e.sparks.geometry.drawRange.count<=384);assert.ok(e.fragments.count>0&&e.fragments.count<=48);assert.ok(e.dust.geometry.drawRange.count>0&&e.dust.geometry.drawRange.count<=40);assert.ok(e.light.intensity>0);assert.equal(e.light.castShadow,false);
 for(const values of [e.sparkPosition,e.sparkColor,e.fragments.instanceMatrix.array,e.dustPosition])assert.ok(values.every(Number.isFinite));
 w.race.pause();const before=JSON.stringify(e.field);w.update(1/60);assert.equal(JSON.stringify(e.field),before);w.race.restart();w.attachCars();assert.equal(w.impactEffects,e);assert.equal(e.root,root);assert.equal(e.sparks.geometry.drawRange.count,0);assert.equal(e.fragments.count,0);assert.equal(e.light.intensity,0);
 const resources=[e.sparks.geometry,e.sparks.material,e.fragments.geometry,e.fragments.material,e.dust.geometry,e.dust.material];let disposed=0;for(const r of resources)r.addEventListener('dispose',()=>disposed++);e.dispose();assert.equal(disposed,6);assert.equal(root.parent,null);
});
test('AC-44 impact camera offsets remain bounded across every view and rear hold, with reduced motion disabled',()=>{
 const w=makeWorld(),p=w.race.player;w.race.phase='racing';
 for(const view of DRIVING_VIEWS)for(const rear of [false,true]){
  w.clearImpacts();w.setDrivingView(view.id);
  const event={id:2,kind:'impact',actors:[0,1],x:p.x,y:p.y+.58,z:p.z,ground:p.y+.04,nx:1,nz:0,closing:40,sliding:0,vx:0,vz:20,severity:1};
  w.impact([event]);w.race.elapsed+=.02;w.update(.02,rear);
  const pose=cameraPose(p,view.id,w.trackingYaw,rear,false),distance=w.camera.position.distanceTo(new THREE.Vector3(...pose.eye));
  assert.ok(distance<=(pose.inside?.03:.21));assert.ok(w.camera.fov<=pose.fov+2.01);
  w.clearImpacts();w.followInitialized=false;w.impact([event],true);w.race.elapsed+=.02;w.update(.02,rear,false,true);
  assert.equal(w.impactEffects.light.intensity,0);
  const quietEye=new THREE.Vector3(...cameraPose(p,view.id,w.trackingYaw,rear,true).eye);
  assert.ok(w.camera.position.distanceTo(quietEye)<1e-6);
 }
});

const near=(actual,expected,message)=>assert.ok(Math.abs(actual-expected)<1e-6,message??`${actual} != ${expected}`);

test('AC-30 all five actual cameras frame every body at every compass heading without changing the event',()=>{
 const w=makeWorld();
 for(const id of templates.keys())for(const heading of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
  w.setVehicle(id);Object.assign(w.race.player,{heading,speed:28,x:200,z:400,y:8});
  for(const view of DRIVING_VIEWS){const before=JSON.stringify(w.race);w.setDrivingView(view.id);w.update(1/60);assert.equal(JSON.stringify(w.race),before);assert.ok(w.camera.position.toArray().every(Number.isFinite));assert.ok(w.camera.fov>=45&&w.camera.fov<=80);w.camera.updateMatrixWorld(true);
   const pose=cameraPose(w.race.player,view.id,w.trackingYaw??-.72),projected=new THREE.Vector3(...pose.look).project(w.camera);near(projected.x,0);near(projected.y,0);
   if(view.id==='tracking'){const p=w.race.player;assert.ok((w.camera.position.x-p.x)*Math.sin(heading)+(w.camera.position.z-p.z)*Math.cos(heading)>0,'Tracking must expose the front three quarter view');}
  }
 }
});
test('AC-31 actual cockpit has a clear forward view and visible wheel and dials in all five bodies',()=>{
 const w=makeWorld();w.setDrivingView('cockpit');const ray=new THREE.Raycaster();
 for(const id of templates.keys()){
  w.setVehicle(id);w.update(1/60);w.scene.updateMatrixWorld(true);w.camera.updateMatrixWorld(true);
  const car=w.carMeshes[0],rig=car.userData.cockpit;assert.equal(rig.visible,true);assert.ok(car.userData.cabinMeshes.every(m=>m.visible===false));near(w.camera.near,.035);near(rig.position.y,SEATS[id].lift);
  for(const key of ['steering','speed','rpm']){const p=rig.userData[key].getWorldPosition(new THREE.Vector3()).project(w.camera);assert.ok(Math.abs(p.x)<1&&Math.abs(p.y)<1,'The '+key+' is outside the driver view for '+id);}
  for(const point of [[0,.1],[0,.6],[-.28,.25],[.28,.25]]){
   ray.setFromCamera(new THREE.Vector2(...point),w.camera);const meshes=[];car.traverse(o=>{if(!o.isMesh)return;for(let a=o;a;a=a.parent)if(!a.visible)return;meshes.push(o);});const hits=ray.intersectObjects(meshes,false);assert.equal(hits.length,0,'Opaque body/cabin obstructs forward view for '+id+' at '+point+': '+hits.map(h=>h.object.material.name+' @ '+h.distance.toFixed(3)).join(', '));
  }
 }
});
test('AC-31 rear hold restores body/glazing and returns to a moving animated driver rig',()=>{
 const projected=makeWorld();projected.setDrivingView('cockpit');
 for(const id of templates.keys())for(const heading of [0,Math.PI/2,Math.PI,Math.PI*1.5])for(const steer of [-.7,.7]){
  projected.setVehicle(id);Object.assign(projected.race.player,{heading,steer,speed:32});projected.update(1/60);projected.scene.updateMatrixWorld(true);projected.camera.updateMatrixWorld(true);
  const wheel=projected.carMeshes[0].userData.cockpit.userData.steering,marker=wheel.children.find(m=>m.material.name==='Cockpit amber needle');
  const center=wheel.getWorldPosition(new THREE.Vector3()).project(projected.camera),top=new THREE.Box3().setFromObject(marker).getCenter(new THREE.Vector3()).project(projected.camera);
  assert.equal(Math.sign(top.x-center.x),-Math.sign(steer),'The wheel must turn toward the same screen side as the steering input');
 }
 const w=makeWorld();w.setDrivingView('cockpit');w.race.player.steer=.7;w.race.player.speed=32;w.update(1/60);let rig=w.carMeshes[0].userData.cockpit;
 near(rig.userData.steering.rotation.z,-wheelSteering(w.race.player)*3.2);const speed=rig.userData.speed.rotation.z;w.race.player.speed=52;w.update(1/60);assert.ok(rig.userData.speed.rotation.z>speed);
 w.update(1/60,true);assert.equal(w.drivingView,'cockpit');assert.equal(rig.visible,false);assert.ok(w.carMeshes[0].userData.cabinMeshes.every(m=>m.visible));w.update(1/60,false);assert.equal(rig.visible,true);
 const car=w.race.player,normal=cameraPose(car,'cockpit',-.72,false,false),still=cameraPose(car,'cockpit',-.72,false,true);assert.notDeepEqual(normal.look,still.look);
 w.race.restart();w.attachCars();w.update(1/60);const next=w.carMeshes[0].userData.cockpit;assert.notEqual(next,rig);assert.equal(next.userData.steering.children[0].geometry,rig.userData.steering.children[0].geometry);assert.notEqual(next.userData.steering,rig.userData.steering);assert.equal(next.visible,true);
});

test('AC-15 each selected vehicle uses its own geometry and diversifies rivals',()=>{
 const w=makeWorld();
 for(const id of templates.keys()){w.setVehicle(id);w.update(1/60);assert.equal(w.carMeshes[0].userData.vehicle,id);assert.equal(w.carMeshes[0].userData.wheelGroups.length,4);assert.equal(new Set(w.carMeshes.slice(1).map(c=>c.userData.vehicle)).size,5);}
 w.setVehicle('bad');assert.equal(w.vehicle,'muscle');
});

test('AC-12 front wheel axles stay level at every spin and steering angle',()=>{
 const w=makeWorld();
 for(const steer of [-1,0,.5,1])for(const spin of [0,Math.PI/6,Math.PI/2,Math.PI,19]){
  w.race.player.steer=steer;w.race.player.wheel=spin;w.update(1/60);
  for(const group of w.carMeshes[0].userData.wheelGroups){
   const axle=new THREE.Vector3(1,0,0).applyQuaternion(group.quaternion);
   const turn=group.name.includes('Front')?wheelSteering(w.race.player):0;
   near(axle.y,0,'Spinning a steered wheel must not tilt its axle');
   near(axle.x,Math.cos(turn));near(axle.z,-Math.sin(turn));
  }
 }
});

test('AC-11 changing player paint leaves rival paint unchanged',()=>{
 const w=makeWorld(),rival=w.carMeshes[1];
 const rivals=rival.userData.paints.map(m=>m.color.getHexString());
 w.setPaint('#1c6274');w.update(1/60);
 for(const m of w.carMeshes[0].userData.paints)assert.equal(m.color.getHexString(),'1c6274');
 assert.deepEqual(rival.userData.paints.map(m=>m.color.getHexString()),rivals);
});

test('AC-12 braking lights only that car and returns to normal when released',()=>{
 const w=makeWorld();w.race.player.braking=true;w.update(1/60);
 for(const m of w.carMeshes[0].userData.brakes){assert.equal(m.emissive.getHexString(),'ff2400');assert.equal(m.emissiveIntensity,1.7);}
 for(const car of w.carMeshes.slice(1))for(const m of car.userData.brakes){assert.equal(m.emissive.getHexString(),'330400');assert.equal(m.emissiveIntensity,.2);}
 w.race.player.braking=false;w.race.cars[2].braking=true;w.update(1/60);
 for(const m of w.carMeshes[0].userData.brakes)assert.equal(m.emissiveIntensity,.2);
 for(const m of w.carMeshes[2].userData.brakes)assert.equal(m.emissiveIntensity,1.7);
});

test('AC-12 every car and its shadow follow race positions and boost state',()=>{
 const w=makeWorld();w.race.player.boosting=true;w.update(1/60);
 w.race.cars.forEach((c,i)=>{
  const mesh=w.carMeshes[i],shadow=w.contactShadows[i];
  near(mesh.position.x,c.x);near(mesh.position.y,c.y+.03);near(mesh.position.z,c.z);
  near(shadow.position.x,c.x);near(shadow.position.y,c.y+.026);near(shadow.position.z,c.z);
  assert.equal(mesh.userData.flame.visible,i===0);
 });
 w.race.player.boosting=false;w.update(1/60);assert.equal(w.carMeshes[0].userData.flame.visible,false);
});

test('AC-12 repeated restarts release unique resources and preserve shared car assets',()=>{
 const w=makeWorld(),shared=new Set();
 template.traverse(o=>{if(o.isMesh){shared.add(o.geometry);shared.add(o.material);for(const value of Object.values(o.material))if(value?.isTexture)shared.add(value);}});
 shared.add(w.contactTexture);
 let sharedDisposals=0;const onSharedDispose=()=>sharedDisposals++;
 for(const resource of shared)resource.addEventListener('dispose',onSharedDispose);
 try{
  for(let n=0;n<4;n++){
   const oldCars=[...w.carMeshes],oldShadows=[...w.contactShadows],owned=new Set(),counts=new Map();
   for(const car of oldCars){for(const m of [...car.userData.paints,...car.userData.brakes,...car.userData.police,...car.userData.damageRig.owned])owned.add(m);owned.add(car.userData.flame.geometry);owned.add(car.userData.flame.material);}
   for(const shadow of oldShadows){owned.add(shadow.geometry);owned.add(shadow.material);}
   for(const resource of owned){counts.set(resource,0);resource.addEventListener('dispose',()=>counts.set(resource,counts.get(resource)+1));}
   w.race.restart('#dfd8c6');w.attachCars();w.update(1/60);
   for(const resource of owned)assert.equal(counts.get(resource),1,'An old car resource must be released exactly once');
   assert.equal(sharedDisposals,0,'Restart must preserve shared geometry, materials and textures');
   assert.equal(w.carMeshes.length,8);assert.equal(w.contactShadows.length,8);assert.equal(w.scene.children.length,18);assert.equal(w.scene.children.filter(o=>o===w.impactEffects.root).length,1);
   for(const old of [...oldCars,...oldShadows])assert.equal(old.parent,null);
   for(const m of w.carMeshes[0].userData.paints)assert.equal(m.color.getHexString(),'dfd8c6');
  }
 }finally{for(const resource of shared)resource.removeEventListener('dispose',onSharedDispose);}
});

test('AC-4 chase rear and reduced motion garage cameras remain finite',()=>{
 const w=makeWorld(),p=w.race.player;
 for(const rear of [false,true]){
  w.followInitialized=false;w.update(1/60,rear);
  const dx=w.camera.position.x-p.x,dz=w.camera.position.z-p.z;
  assert.ok((dx*Math.sin(p.heading)+dz*Math.cos(p.heading))*(rear?1:-1)>7);
  assert.ok([...w.camera.position.toArray(),...w.camera.quaternion.toArray(),w.camera.fov].every(Number.isFinite));
 }
 w.followInitialized=false;w.update(1/60,false,true,true);const position=w.camera.position.clone();
 w.time+=100;w.followInitialized=false;w.update(1/60,false,true,true);
 near(w.camera.position.distanceTo(position),0,'Reduced motion garage camera must stay still');
});

test('AC-12 skid instances remain finite while the car slides',()=>{
 const w=makeWorld();w.createSkids();w.race.phase='racing';w.race.player.slip=.1;w.update(.03);
 assert.equal(w.skidIndex,2);const m=new THREE.Matrix4();
 for(let i=0;i<2;i++){w.skids.getMatrixAt(i,m);assert.ok(m.elements.every(Number.isFinite));near(m.elements[13],w.race.player.y+.045);}
});

test('AC-3 AC-12 actual scene updates follow a complete legal race',()=>{
 const w=makeWorld();w.race.restart();
 for(let i=0;i<120*300&&w.race.phase!=='finished';i++){
  w.race.step(aiInput(w.race.player,w.track,w.race.cars));
  if(i%2===0)w.update(STEP*2);
 }
 w.update(STEP);assert.equal(w.race.phase,'finished');assert.equal(w.race.player.gates,16);
 assert.ok(w.renderCalls>1000);
 for(const mesh of w.carMeshes)assert.ok([...mesh.position.toArray(),...mesh.quaternion.toArray()].every(Number.isFinite));
 near(w.carMeshes[0].position.x,w.race.player.x);near(w.carMeshes[0].position.z,w.race.player.z);
});

// Cast against the exported painted hood. This catches the actual previous hidden lamp defect.
test('AC-19 headlight housings remain above the hood after GLB preparation',()=>{
 for(const id of ['hypercar','spyder','interceptor']){
  const car=cloneCar(templates.get(id),'#3446c7');car.updateMatrixWorld(true);const paint=[],housings=[];
  car.traverse(o=>{if(o.isMesh&&o.material.name==='Paint Pearl')paint.push(o);if(o.isMesh&&o.material.name.startsWith('Headlamp housing'))housings.push(o);});
  assert.equal(new Set(housings.map(m=>m.material.name)).size,2,'Both original lamp housings remain');let tested=0,min=Infinity;const ray=new THREE.Raycaster(),p=new THREE.Vector3();
  for(const o of housings){const points=o.geometry.attributes.position;for(let i=0;i<points.count;i+=47){p.fromBufferAttribute(points,i).applyMatrix4(o.matrixWorld);ray.set(new THREE.Vector3(p.x,2,p.z),new THREE.Vector3(0,-1,0));const hit=ray.intersectObjects(paint,false)[0];if(hit){min=Math.min(min,p.y-hit.point.y);tested++;}}}
  assert.ok(tested>50,id+' lamp surfaces not sampled');assert.ok(min>.010,id+' headlight housing intersects hood: '+min);
 }
});

test('AC-20 headlights illuminate ahead of the moving car and turn off in daylight',()=>{
 const w=makeWorld();w.environment='night';w.race.player.heading=.9;w.update(1/60);w.scene.updateMatrixWorld(true);const car=w.carMeshes[0];
 assert.equal(car.userData.headlights.length,2);
 for(const light of car.userData.headlights){const origin=light.getWorldPosition(new THREE.Vector3()),target=light.target.getWorldPosition(new THREE.Vector3()),dir=target.sub(origin).normalize();assert.equal(light.intensity,1800);assert.ok(dir.x*Math.sin(.9)+dir.z*Math.cos(.9)>.95);assert.ok(dir.y<0);assert.ok(origin.y>w.race.player.y+.4);}
 for(const m of car.userData.brakes)assert.equal(m.emissiveIntensity,.85);
 w.environment='forest';w.update(1/60);for(const light of car.userData.headlights)assert.equal(light.intensity,0);
});

test('AC-22 six garage angles expose front, rear and both sides',()=>{
 const w=makeWorld(),p=w.race.player;const positions=new Set();
 for(const view of ['front','rear','left','right','angle','orbit']){w.setGarageView(view);w.update(1/60,false,true,true);positions.add(w.camera.position.toArray().map(v=>v.toFixed(2)).join(','));assert.ok(w.camera.position.toArray().every(Number.isFinite));}
 assert.equal(positions.size,5); // Reduced motion orbit intentionally uses the same angled pose.
 w.setGarageView('front');w.update(1/60,false,true);assert.ok((w.camera.position.x-p.x)*Math.sin(p.heading)+(w.camera.position.z-p.z)*Math.cos(p.heading)>7);
 w.setGarageView('rear');w.update(1/60,false,true);assert.ok((w.camera.position.x-p.x)*Math.sin(p.heading)+(w.camera.position.z-p.z)*Math.cos(p.heading)<-7);
 w.setGarageView('invalid');assert.equal(w.garageView,'orbit');
});

test('AC-24 actual chase projection shows left and right turns correctly at every compass heading',()=>{
 for(const heading of [0,Math.PI/2,Math.PI,Math.PI*1.5])for(const steer of [-1,1]){
  const w=makeWorld(),c=w.race.player,p=w.track.at(60);Object.assign(c,{x:p.x,z:p.z,y:p.y,s:p.s,index:p.index,heading,speed:15,steer:0});w.followInitialized=false;w.update(1/60);w.camera.updateMatrixWorld(true);const initialCamera=w.camera.clone();
  for(let i=0;i<12;i++)integrate(c,{throttle:.2,brake:0,steer},STEP,w.track);
  w.update(1/60);w.scene.updateMatrixWorld(true);const front=new THREE.Vector3(0,.6,2).applyMatrix4(w.carMeshes[0].matrixWorld).project(initialCamera);
  assert.ok(front.x*steer<0,'A positive world heading turn must appear left in the chase camera');
 }
});
test('AC-26 pursuit scene shows only active interceptor patrols with isolated flashing lights',()=>{
 const w=makeWorld();w.race.restart(undefined,'muscle','pursuit');w.attachCars();w.update(1/60);assert.equal(w.carMeshes[0].userData.vehicle,'muscle');
 const indices=w.race.cars.map((c,i)=>c.police?i:-1).filter(i=>i>=0);assert.equal(indices.length,3);
 for(const [unit,index] of indices.entries()){assert.equal(w.carMeshes[index].userData.vehicle,'interceptor');assert.equal(w.carMeshes[index].visible,unit===0);assert.equal(w.contactShadows[index].visible,unit===0);assert.ok(w.carMeshes[index].userData.police.length>0);}
 const first=w.carMeshes[indices[0]],values=first.userData.police.map(m=>m.emissiveIntensity);w.update(.3);assert.notDeepEqual(first.userData.police.map(m=>m.emissiveIntensity),values);
 w.race.elapsed=45;w.race.activatePolice();w.update(1/60);for(const i of indices){assert.equal(w.carMeshes[i].visible,true);assert.equal(w.contactShadows[i].visible,true);}assert.notEqual(first.userData.police[0],w.carMeshes[indices[1]].userData.police[0]);
});
test('AC-28 real World applies Auto resolution and shadows without changing fixed High/Reduced',()=>{
 const w=makeWorld();globalThis.devicePixelRatio=1.5;globalThis.innerWidth=1280;globalThis.innerHeight=720;let ratio=1;
 w.renderer={render(){},setPixelRatio(v){ratio=v;},getPixelRatio(){return ratio;},setSize(){},shadowMap:{enabled:true},info:{render:{calls:90,triangles:900000}}};
 w.setQuality('auto');for(let i=0;i<25*3*5;i++)w.recordFrame(40,true);assert.equal(ratio,.75);assert.equal(w.renderer.shadowMap.enabled,false);assert.equal(w.performanceInfo.fps,25);assert.equal(w.performanceInfo.draws,90);assert.equal(w.performanceInfo.triangles,900000);
 for(let i=0;i<63*8*3;i++)w.recordFrame(16,true);assert.ok(ratio>=1);assert.equal(w.renderer.shadowMap.enabled,true);
 w.setQuality('high');for(let i=0;i<200;i++)w.recordFrame(40,true);assert.equal(ratio,1.5);assert.equal(w.renderer.shadowMap.enabled,true);
 w.setQuality('low');for(let i=0;i<1000;i++)w.recordFrame(16,true);assert.equal(ratio,.8);assert.equal(w.renderer.shadowMap.enabled,false);
});

const destructionKit=new Map();
for(const name of ['masonry-chunk','guardrail','crash-frame']){const b=await readFile(new URL('../dist/assets/wilderness/'+name+'.glb',import.meta.url));destructionKit.set(name,{parts:assetParts((await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'')).scene)});}
function visualHit(w,zone,energy,closing=25){const c=w.race.player,local=zone==='front'?[0,2]:zone==='left'?[-1,0]:[1,0];damageCar(c,{x:c.x+local[0]*Math.cos(c.heading)+local[1]*Math.sin(c.heading),z:c.z-local[0]*Math.sin(c.heading)+local[1]*Math.cos(c.heading),closing,severity:.8,kind:'impact'},energy);}
test('AC-47 every body crumples real vertices while undamaged rivals and shared templates remain unchanged',()=>{
 const w=makeWorld();
 for(const id of templates.keys()){w.race.resetPlayer();w.setVehicle(id);w.update(0);const car=w.carMeshes[0],other=w.carMeshes[1],rig=car.userData.damageRig,shared=templates.get(id).children.filter(m=>m.isMesh).map(m=>m.geometry.attributes.position.array.slice()),rival=other.userData.damageRig.parts.map(p=>p.mesh.geometry.attributes.position.array.slice());visualHit(w,'front',40000);w.update(0);let changed=0;
  for(const part of rig.parts){const a=part.mesh.geometry.attributes.position.array;for(let i=0;i<a.length;i++){if(a[i]!==part.original[i])changed++;assert.ok(Number.isFinite(a[i]));}for(const v of part.mesh.geometry.attributes.normal.array)assert.ok(Number.isFinite(v));assert.equal(part.mesh.visible,true);}
  assert.ok(changed>500,id+' must visibly deform');for(const [i,p] of other.userData.damageRig.parts.entries())assert.deepEqual(p.mesh.geometry.attributes.position.array,rival[i]);for(const [i,m] of templates.get(id).children.filter(m=>m.isMesh).entries())assert.deepEqual(m.geometry.attributes.position.array,shared[i]);assert.equal(w.structuralDebris.parts.length,0);
 }
});
test('AC-47 severe front damage exposes the chassis, detaches original panels and repairs exactly once on R',()=>{
 const w=makeWorld();w.kit=destructionKit;w.attachCars();w.update(0);const car=w.carMeshes[0],rig=car.userData.damageRig;visualHit(w,'front',100000);w.update(0);const detached=rig.parts.filter(p=>p.detached);assert.ok(detached.some(p=>p.name==='hood'));assert.ok(detached.some(p=>p.name==='frontBumper'));assert.ok(detached.some(p=>p.name==='glassFront'));assert.ok(detached.every(p=>p.mesh.visible===false));assert.equal(car.userData.damageFrame.visible,true);assert.ok(w.structuralDebris.parts.length>detached.length);const shards=w.structuralDebris.parts.filter(p=>p.mesh.material.name==='Glass glazing');assert.ok(shards.length>1);assert.ok(shards.every(p=>p.mesh.geometry.attributes.position.count<detached.find(p=>p.name==='glassFront').mesh.geometry.attributes.position.count),'A windshield must split into smaller pieces');assert.equal(car.userData.headlights[0].intensity,0);
 for(const p of w.structuralDebris.parts){assert.ok(p.mesh.geometry.attributes.position.count>3);assert.ok(p.mesh.position.toArray().every(Number.isFinite));assert.notEqual(p.mesh.geometry,detached[0].mesh.geometry);}
 const count=w.structuralDebris.parts.length;w.update(0);assert.equal(w.structuralDebris.parts.length,count);w.race.resetPlayer();w.update(0);for(const p of rig.parts){assert.deepEqual(p.mesh.geometry.attributes.position.array,p.original);assert.deepEqual(p.mesh.geometry.attributes.normal.array,p.normal);assert.equal(p.mesh.visible,true);assert.equal(p.detached,false);}assert.equal(car.userData.damageFrame.visible,false);assert.equal(w.structuralDebris.parts.length,count,'Recovery does not replay or duplicate detached parts');
});
test('AC-47 glazing cracks before breaking and only the affected side loses its door panel',()=>{
 const w=makeWorld();w.kit=destructionKit;w.attachCars();w.update(0);visualHit(w,'left',40000);w.update(0);const rig=w.carMeshes[0].userData.damageRig,left=rig.parts.filter(p=>p.name==='glassLeft'),right=rig.parts.filter(p=>p.name==='glassRight');assert.ok(left.length&&right.length);for(const p of left){assert.ok(p.mesh.material.map?.isDataTexture);assert.equal(p.mesh.material.roughness,.75);assert.equal(p.mesh.visible,true);}for(const p of right)assert.equal(p.mesh.material.map,p.map);visualHit(w,'left',60000);w.update(0);assert.equal(w.carMeshes[0].userData.damageFrame.visible,false,'A side hit must not expose the radiator through an intact hood');assert.ok(rig.parts.filter(p=>p.name==='leftPanel').every(p=>!p.mesh.visible));assert.ok(rig.parts.filter(p=>p.name==='rightPanel').every(p=>p.mesh.visible));
 w.setDrivingView('cockpit');w.update(0);w.setDrivingView('chase');w.update(0);for(const p of left)assert.equal(p.mesh.visible,false,'Camera switching cannot restore broken glass');for(const p of right)assert.equal(p.mesh.visible,true);
});
test('AC-49 actual body and attached cameras rotate around one centre during a wreck',()=>{
 const w=makeWorld();for(const id of templates.keys()){w.setVehicle(id);const c=w.race.player;Object.assign(c,{bodyRoll:1.2,bodyPitch:.4,heading:1.1,airborne:true,steer:0,slip:0,speed:0,y:9});for(const view of ['cockpit','hood']){w.setDrivingView(view);w.update(0);w.scene.updateMatrixWorld(true);const seat=view==='cockpit'?SEATS[id].eye:[0,SEATS[id].hood,1.05],expected=new THREE.Vector3(...seat).applyMatrix4(w.carMeshes[0].matrixWorld);assert.ok(w.camera.position.distanceTo(expected)<1e-6);const up=new THREE.Vector3(0,1,0).applyQuaternion(w.carMeshes[0].quaternion);assert.ok(w.camera.up.distanceTo(up)<1e-6);assert.equal(w.drivingView,view);assert.ok(w.camera.quaternion.toArray().every(Number.isFinite));}w.setDrivingView('chase');w.update(0);assert.deepEqual(w.camera.up.toArray(),[0,1,0]);}
});
test('AC-51 debris pauses, stays capped and releases every owned resource on expiry and restart',()=>{
 const w=makeWorld(),pool=w.structuralDebris,source=w.carMeshes[0].userData.damageRig.parts.find(p=>p.name==='frontBumper').mesh,c=w.race.player;for(let i=0;i<30;i++)pool.carPart(source,w.carMeshes[0],c);assert.equal(pool.parts.filter(p=>p.kind==='car').length,24);
 const event={broken:true,surface:'masonry',section:{x:c.x,y:c.y,z:c.z,heading:c.heading},nx:1,nz:0,vx:20,vz:2};for(let i=0;i<10;i++)pool.barrier(event,destructionKit);assert.equal(pool.parts.filter(p=>p.kind==='barrier').length,64);const owned=pool.parts.flatMap(p=>[p.mesh.geometry,p.mesh.material]),counts=new Map(owned.map(r=>[r,0]));for(const r of owned)r.addEventListener('dispose',()=>counts.set(r,counts.get(r)+1));
 const before=pool.parts.map(p=>p.mesh.position.toArray());pool.update(0);assert.deepEqual(pool.parts.map(p=>p.mesh.position.toArray()),before);for(let i=0;i<1000;i++)pool.update(1/120);assert.equal(pool.parts.length,0);assert.equal(pool.root.children.length,0);for(const n of counts.values())assert.equal(n,1);pool.carPart(source,w.carMeshes[0],c);w.race.restart();w.attachCars();assert.equal(pool.parts.length,0);assert.equal(w.structuralDebris,pool);
});
