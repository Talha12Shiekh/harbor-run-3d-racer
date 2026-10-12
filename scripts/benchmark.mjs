// CPU and camera-frustum measurements only. This does not measure browser GPU FPS.
import {readFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import * as THREE from 'three';
import {GLTFLoader} from '../dist/vendor/examples/jsm/loaders/GLTFLoader.js';
import {assetParts,installWilderness,releaseEnvironment} from '../dist/wilderness.js';
import {createTrack,Race,aiInput,STEP} from '../dist/sim.js';
import {World,prepareCar} from '../dist/world.js';
import {VEHICLES} from '../dist/catalog.js';
globalThis.self=globalThis;
globalThis.createImageBitmap=async()=>({width:1024,height:1024,close(){}});
const read=async path=>JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'));
const parse=async path=>{const b=await readFile(new URL(path,import.meta.url));return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};
const track=createTrack(),manifest=await read('../dist/assets/wilderness/manifest.json'),kit=new Map();
await Promise.all(manifest.assets.map(async a=>kit.set(a.name,{...a,parts:assetParts((await parse('../dist/assets/wilderness/'+a.file)).scene)})));
const scenery=[];
for(const theme of ['forest','alpine','night']){
 const root=new THREE.Group(),info=installWilderness(root,track,manifest,kit,theme),camera=new THREE.PerspectiveCamera(61,16/9,.1,2400),frustum=new THREE.Frustum(),matrix=new THREE.Matrix4();root.updateMatrixWorld(true);let draws=0,triangles=0;
 for(let i=0;i<48;i++){
  const p=track.at(track.length*i/48);camera.position.set(p.x-Math.sin(p.heading)*8,p.y+2.4,p.z-Math.cos(p.heading)*8);camera.lookAt(p.x+Math.sin(p.heading)*9,p.y+.9,p.z+Math.cos(p.heading)*9);camera.updateMatrixWorld(true);matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(matrix);
  root.traverse(o=>{if(!o.isMesh||!o.visible||o.frustumCulled&&!frustum.intersectsObject(o))return;draws++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);});
 }
 scenery.push({theme,placements:info.placements.length,totalBatches:info.draws,totalTriangles:info.triangles,meanCameraBatches:+(draws/48).toFixed(1),meanCameraTriangles:Math.round(triangles/48)});releaseEnvironment(root);
}
const vm=await read('../dist/assets/vehicles/manifest.json'),templates=new Map();
await Promise.all(vm.vehicles.map(async m=>templates.set(m.id,prepareCar(await parse('../dist/assets/vehicles/'+m.id+'.glb'),m))));
const world=Object.assign(Object.create(World.prototype),{track,race:new Race(track),scene:new THREE.Scene(),camera:new THREE.PerspectiveCamera(),sun:new THREE.DirectionalLight(),look:new THREE.Vector3(),time:0,carMeshes:[],templates,template:templates.get('hypercar'),vehicle:'hypercar',contactTexture:new THREE.Texture(),renderer:{render(){}},environment:'night',roadLights:Array.from({length:4},()=>new THREE.SpotLight()),lampLocations:Array.from({length:32},(_,i)=>{const p=track.at(i*track.length/32);return {position:new THREE.Vector3(p.x,p.y+8,p.z),target:new THREE.Vector3(p.x,p.y,p.z)};})});world.attachCars();
for(let i=0;i<1000;i++)world.update(1/60);
const start=performance.now();for(let i=0;i<10000;i++)world.update(1/60);const sceneCpu=(performance.now()-start)/10000;
const simulation=[];
for(const v of VEHICLES){const race=new Race(track);race.restart(v.paint,v.id);race.phase='racing';const start=performance.now();for(let i=0;i<6000;i++)race.step(aiInput(race.player,track,race.cars),STEP);simulation.push({vehicle:v.id,microsecondsPerStep:+((performance.now()-start)/6000*1000).toFixed(2)});}
console.log(JSON.stringify({kind:'Node CPU and 48 geometric camera samples per theme',gpuFps:'unverified',scenery,nightSceneMicrosecondsPerUpdate:+(sceneCpu*1000).toFixed(2),simulation},null,2));
