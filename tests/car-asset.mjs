import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import {GLTFLoader} from '../dist/vendor/examples/jsm/loaders/GLTFLoader.js';
import {World,prepareCar,cloneCar} from '../dist/world.js';
import {Race,createTrack,aiInput,STEP} from '../dist/sim.js';
globalThis.self=globalThis;
// Geometry validation uses an image metadata stub. It does not test GPU texture upload.
globalThis.createImageBitmap=async()=>({width:1024,height:1024,close(){}});
const catalog=JSON.parse(await readFile(new URL('../dist/assets/vehicles/manifest.json',import.meta.url),'utf8')),templates=new Map(),reports=[];
assert.equal(catalog.originalGeometry,true);assert.deepEqual(catalog.vehicles.map(c=>c.id),['hypercar','spyder','interceptor']);
for(const metadata of catalog.vehicles){
 const bytes=await readFile(new URL('../dist/assets/vehicles/'+metadata.id+'.glb',import.meta.url));const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const template=prepareCar(gltf);template.userData.vehicle=metadata.id;templates.set(metadata.id,template);const car=cloneCar(template,'#245f78');car.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(car),size=bounds.getSize(new THREE.Vector3());
 assert.equal(metadata.originalGeometry,true);assert.ok(size.z>4.4&&size.z<4.7);assert.ok(size.x>1.5&&size.x<2.3);assert.ok(size.y>1.05&&size.y<1.5);assert.equal(car.userData.wheelGroups.length,4);assert.ok(car.userData.paints.length);assert.ok(car.userData.brakes.length);
 let triangles=0,glazing=0,frontLampZ=-Infinity,rearLampZ=Infinity;
 car.traverse(o=>{if(!o.isMesh)return;triangles+=o.geometry.attributes.position.count/3;for(const value of o.geometry.attributes.position.array)assert.ok(Number.isFinite(value));const m=o.material,b=new THREE.Box3().setFromObject(o);if(m.name==='Glass glazing'){glazing++;assert.ok(m.transparent&&m.opacity>.1&&m.opacity<.7);assert.equal(m.depthWrite,false);}if(m.name==='Projector light')frontLampZ=Math.max(frontLampZ,b.max.z);if(m.name==='Brakelight red')rearLampZ=Math.min(rearLampZ,b.min.z);});
 assert.equal(glazing,1);assert.ok(frontLampZ>1.9);assert.ok(rearLampZ< -1.9);
 for(const group of car.userData.wheelGroups){const b=new THREE.Box3().setFromObject(group);assert.ok(Math.abs(b.min.y)<.003,'Tires must meet the ground');assert.ok((group.name.includes('Front')?group.position.z:-group.position.z)>1.3);group.traverse(o=>{if(o.isMesh)assert.notEqual(o.material.name,'Fixed caliper','Brake calipers stay fixed');});for(const spin of [Math.PI/3,Math.PI,19]){group.rotation.x=spin;car.updateMatrixWorld(true);assert.ok(Math.abs(b.getCenter(new THREE.Vector3()).y-new THREE.Box3().setFromObject(group).getCenter(new THREE.Vector3()).y)<.015,'Wheel pivot is eccentric');}group.rotation.x=0;}
 const other=cloneCar(template,'#b72227');assert.notEqual(car.userData.paints[0],other.userData.paints[0]);assert.equal(other.userData.paints[0].color.getHexString(),'b72227');reports.push({id:metadata.id,dimensions:size.toArray().map(v=>+v.toFixed(3)),triangles,wheels:4});
}
console.log(JSON.stringify({originalVehicles:reports,groundedWheels:true,materialIsolation:true,gpuRendering:'not exercised'},null,2));
const template=templates.get('hypercar');

// Run the real scene update with only the GPU render call replaced.
// This validates transforms and state integration, not browser visuals or FPS.
function makeWorld(){
 const track=createTrack();
 const world=Object.assign(Object.create(World.prototype),{
  track,race:new Race(track),template,templates,vehicle:'hypercar',contactTexture:new THREE.Texture(),
  scene:new THREE.Scene(),camera:new THREE.PerspectiveCamera(61,1,.1,2400),
  sun:new THREE.DirectionalLight(),look:new THREE.Vector3(),time:0,carMeshes:[],
  renderCalls:0,
 });
 world.renderer={render(){world.renderCalls++;}};
 world.attachCars();
 return world;
}
const near=(actual,expected,message)=>assert.ok(Math.abs(actual-expected)<1e-6,message??`${actual} != ${expected}`);

test('AC-15 each selected vehicle uses its own geometry and diversifies rivals',()=>{
 const w=makeWorld();
 for(const id of templates.keys()){w.setVehicle(id);w.update(1/60);assert.equal(w.carMeshes[0].userData.vehicle,id);assert.equal(w.carMeshes[0].userData.wheelGroups.length,4);assert.equal(new Set(w.carMeshes.slice(1).map(c=>c.userData.vehicle)).size,3);}
 w.setVehicle('bad');assert.equal(w.vehicle,'interceptor');
});

test('AC-12 front wheel axles stay level at every spin and steering angle',()=>{
 const w=makeWorld();
 for(const steer of [-1,0,.5,1])for(const spin of [0,Math.PI/6,Math.PI/2,Math.PI,19]){
  w.race.player.steer=steer;w.race.player.wheel=spin;w.update(1/60);
  for(const group of w.carMeshes[0].userData.wheelGroups){
   const axle=new THREE.Vector3(1,0,0).applyQuaternion(group.quaternion);
   const turn=group.name.includes('Front')?steer*.2:0;
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
   for(const car of oldCars){for(const m of [...car.userData.paints,...car.userData.brakes])owned.add(m);owned.add(car.userData.flame.geometry);owned.add(car.userData.flame.material);}
   for(const shadow of oldShadows){owned.add(shadow.geometry);owned.add(shadow.material);}
   for(const resource of owned){counts.set(resource,0);resource.addEventListener('dispose',()=>counts.set(resource,counts.get(resource)+1));}
   w.race.restart('#dfd8c6');w.attachCars();w.update(1/60);
   for(const resource of owned)assert.equal(counts.get(resource),1,'An old car resource must be released exactly once');
   assert.equal(sharedDisposals,0,'Restart must preserve shared geometry, materials and textures');
   assert.equal(w.carMeshes.length,8);assert.equal(w.contactShadows.length,8);assert.equal(w.scene.children.length,16);
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
