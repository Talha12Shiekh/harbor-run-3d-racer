import * as THREE from 'three';
import {GLTFLoader} from './vendor/examples/jsm/loaders/GLTFLoader.js';
import {HDRLoader} from './vendor/examples/jsm/loaders/HDRLoader.js';
import {loadWilderness,installWilderness,releaseEnvironment} from './wilderness.js';
import {mergeGeometries} from './vendor/examples/jsm/utils/BufferGeometryUtils.js';
import {clamp,angleDiff} from './sim.js';
import {VEHICLES,hasVehicle,hasSetting,garageAngle} from './catalog.js';
import {wheelSteering} from './handling.js';
import {FrameStats} from './performance.js';
import {cameraPose,hasDrivingView,wrapYaw,isDriverRoof} from './cameras.js';
import {prepareCockpit,createCockpit,updateCockpit} from './cockpit.js';
import {ImpactEffects} from './impact-effects.js';
const V=THREE.Vector3;
function splitDriverRoof(geometry,id){
 const p=geometry.attributes.position,inside=[],outside=[];
 for(let i=0;i<p.count;i+=3){const c=[0,0,0];for(let j=0;j<3;j++){c[0]+=p.getX(i+j)/3;c[1]+=p.getY(i+j)/3;c[2]+=p.getZ(i+j)/3;}(isDriverRoof(id,c)?inside:outside).push(i,i+1,i+2);}
 if(!inside.length)return [{geometry,roof:false}];
 const parts=[outside,inside].map((indices,n)=>{const g=new THREE.BufferGeometry();for(const [name,a] of Object.entries(geometry.attributes)){const values=new a.array.constructor(indices.length*a.itemSize);for(let i=0;i<indices.length;i++)for(let j=0;j<a.itemSize;j++)values[i*a.itemSize+j]=a.array[indices[i]*a.itemSize+j];g.setAttribute(name,new THREE.BufferAttribute(values,a.itemSize,a.normalized));}return {geometry:g,roof:n===1};});geometry.dispose();return parts;
}
export function prepareCar(gltf,metadata){
 const scene=gltf.scene;scene.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(scene),size=box.getSize(new V()),center=box.getCenter(new V()),scale=4.6/size.z,authored=(()=>{let found=false;scene.traverse(o=>{if(o.isMesh&&o.material.name==='Paint Pearl')found=true;});return found;})();
 let ground=Infinity;const point=new V();scene.traverse(o=>{if(o.isMesh&&!Array.isArray(o.material)&&/Tire/.test(o.material.name)){const positions=o.geometry.attributes.position;for(let i=0;i<positions.count;i++){point.fromBufferAttribute(positions,i).applyMatrix4(o.matrixWorld);ground=Math.min(ground,point.y);}}});
 const normal=new THREE.Matrix4().makeScale(scale,scale,scale).multiply(new THREE.Matrix4().makeTranslation(-center.x,Number.isFinite(ground)?-ground:-box.min.y,-center.z));
 const body=new Map(),wheels=new Map();
 scene.traverse(o=>{if(!o.isMesh||/emblem/i.test(o.name))return;let ancestor=o,wheel=null;while(ancestor){if(/^Wheel(Front|Rear)[LR]$/.test(ancestor.name)){wheel=ancestor;break;}ancestor=ancestor.parent;}
 const material=o.material;if(Array.isArray(material))throw new Error('Unexpected multi material car primitive');
 let group=body;if(wheel){if(!wheels.has(wheel.name)){const pivot=new V().setFromMatrixPosition(wheel.matrixWorld).applyMatrix4(normal);wheels.set(wheel.name,{pivot,parts:new Map()});}group=wheels.get(wheel.name).parts;}
 let geom=o.geometry.clone();if(geom.index)geom=geom.toNonIndexed();for(const key of Object.keys(geom.attributes))if(!['position','normal','uv'].includes(key))geom.deleteAttribute(key);if(!geom.attributes.normal)geom.computeVertexNormals();if(!geom.attributes.uv)geom.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(geom.attributes.position.count*2),2));
 geom.applyMatrix4(new THREE.Matrix4().multiplyMatrices(normal,o.matrixWorld));if(wheel){const p=wheels.get(wheel.name).pivot;geom.translate(-p.x,-p.y,-p.z);}if(!group.has(material))group.set(material,[]);group.get(material).push(geom);
 });
 const root=new THREE.Group();root.name=authored?'Original Blender vehicle':'Detailed sports car';
 const assemble=(parts,parent)=>{for(const [source,geometries] of parts){const mat=source.clone();if(!authored&&/Glass/.test(mat.name)){mat.transmission=0;mat.transparent=true;mat.opacity=.9;mat.color.set('#29343c');mat.roughness=.12;mat.metalness=.4;}if(!mat.name||mat.name==='License'){mat.map=null;mat.color.set('#242a30');}if(!authored&&/Paint/.test(mat.name)){mat.roughness=.22;mat.metalness=.65;mat.clearcoat=1;}if(authored&&mat.transparent){mat.depthWrite=false;mat.side=THREE.FrontSide;}const g=mergeGeometries(geometries,false);if(!g)throw new Error('Cannot merge car geometry');const mesh=new THREE.Mesh(g,mat);mesh.castShadow=!mat.transparent;mesh.receiveShadow=true;parent.add(mesh);}}
 assemble(body,root);for(const mesh of [...root.children])if(mesh.material.name==='Paint Pearl'){const parts=splitDriverRoof(mesh.geometry,metadata?.id);if(parts.length===1)continue;root.remove(mesh);for(const part of parts){const m=new THREE.Mesh(part.geometry,mesh.material);m.castShadow=mesh.castShadow;m.receiveShadow=true;m.userData.hideInCockpit=part.roof;root.add(m);}}
 for(const [name,w] of wheels){const group=new THREE.Group();group.name=name;group.position.copy(w.pivot);assemble(w.parts,group);root.add(group);}root.userData.wheels=[...wheels.keys()];root.userData.headlightPositions=(metadata?.headlights??[[-.75,.7,1.97],[.75,.7,1.97]]).map(p=>new V(...p).applyMatrix4(normal).toArray());return root;
}
export function cloneCar(template,color){
 const car=template.clone(true);car.userData.paints=[];car.userData.brakes=[];car.userData.police=[];
 car.traverse(o=>{if(!o.isMesh)return;const name=o.material.name;
  if(/Paint/.test(name)){o.material=o.material.clone();o.material.color.set(color);car.userData.paints.push(o.material);}
  if(/Brakelight/.test(name)){o.material=o.material.clone();car.userData.brakes.push(o.material);}
  if(/^Police (blue|red)/.test(name)){o.material=o.material.clone();car.userData.police.push(o.material);}
 });car.userData.wheelGroups=template.userData.wheels.map(name=>car.getObjectByName(name));return car;
}
function labelTexture(text,bg='#214948',ink='#f2ead2'){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,512,128);ctx.strokeStyle=ink;ctx.lineWidth=5;ctx.strokeRect(8,8,496,112);ctx.fillStyle=ink;ctx.font='bold 42px sans-serif';ctx.textAlign='center';ctx.fillText(text,256,78);const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.userData.environmentOwned=true;return t;}
export class World{
 constructor(canvas,track,race){
 this.track=track;this.race=race;this.canvas=canvas;this.scene=new THREE.Scene();this.scene.fog=new THREE.FogExp2('#b0b9bb',.0008);this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.0;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 this.camera=new THREE.PerspectiveCamera(61,1,.1,2400);this.camera.position.set(-8,5,-10);this.look=new V();this.followInitialized=false;this.time=0;this.carMeshes=[];this.vehicle='hypercar';this.environment='forest';this.garageView='orbit';this.drivingView='chase';this.trackingYaw=-.72;
 this.hemi=new THREE.HemisphereLight('#d7e8f2','#756d58',.65);this.scene.add(this.hemi);this.sun=new THREE.DirectionalLight('#fff3df',2.6);this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);this.sun.shadow.camera.left=-100;this.sun.shadow.camera.right=100;this.sun.shadow.camera.top=100;this.sun.shadow.camera.bottom=-100;this.sun.shadow.camera.near=1;this.sun.shadow.camera.far=350;this.sun.shadow.bias=-.0002;this.sun.shadow.normalBias=.035;this.scene.add(this.sun,this.sun.target);
 this.scene.background=new THREE.Color('#83afcd');this.impactEffects=new ImpactEffects(this.scene);this.impactElapsed=this.race.elapsed;this.resize();
 }
 async load(onProgress){
 const loader=new THREE.TextureLoader(),names=['contact-shadow'];let completed=0;
 const textures=await Promise.all(names.map(async name=>{const extension=['paint-worn','debris','contact-shadow'].includes(name)?'.png':'.jpg',t=await loader.loadAsync('./assets/'+name+extension);if(!name.includes('normal')&&!name.includes('roughness'))t.colorSpace=THREE.SRGBColorSpace;if(!['debris','contact-shadow'].includes(name))t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy());onProgress(++completed/names.length*.2);return t;}));
 const hdr=await new HDRLoader().loadAsync('./assets/daylight.hdr');hdr.mapping=THREE.EquirectangularReflectionMapping;this.daySky=hdr;this.scene.background=hdr;this.scene.backgroundIntensity=.85;const pmrem=new THREE.PMREMGenerator(this.renderer);this.envTarget=pmrem.fromEquirectangular(hdr);this.scene.environment=this.envTarget.texture;this.scene.environmentIntensity=.7;const nightSky=await loader.loadAsync('./assets/night-sky.png');nightSky.colorSpace=THREE.SRGBColorSpace;nightSky.mapping=THREE.EquirectangularReflectionMapping;this.nightSky=nightSky;this.nightTarget=pmrem.fromEquirectangular(nightSky);pmrem.dispose();onProgress(.28);
 const {manifest,kit}=await loadWilderness(p=>onProgress(.28+p*.44));this.manifest=manifest;this.kit=kit;this.templates=new Map();
 const vehicleResponse=await fetch('./assets/vehicles/manifest.json');if(!vehicleResponse.ok)throw new Error('Vehicle catalog failed to load');const vehicleManifest=await vehicleResponse.json(),vehicles=VEHICLES.map(v=>v.id);let count=0;await Promise.all(vehicles.map(async id=>{const gltf=await new GLTFLoader().loadAsync('./assets/vehicles/'+id+'.glb'),car=prepareCar(gltf,vehicleManifest.vehicles.find(v=>v.id===id));car.userData.vehicle=id;this.templates.set(id,car);onProgress(.72+(++count/vehicles.length)*.25);}));this.cockpitTemplate=prepareCockpit(await new GLTFLoader().loadAsync('./assets/vehicles/cockpit.glb'));this.template=this.templates.get(this.vehicle);this.contactTexture=textures[0];this.setEnvironment(this.environment);this.createSkids();this.attachCars();onProgress(1);
 }
 setVehicle(value){if(!hasVehicle(value))return;this.vehicle=value;this.race.vehicle=value;this.race.player.vehicle=value;if(this.templates){this.template=this.templates.get(value);this.attachCars();}}
 setEnvironment(value){
  if(!hasSetting(value))return;this.environment=value;if(!this.kit)return;
  if(this.environmentRoot)releaseEnvironment(this.environmentRoot);
  this.environmentRoot=new THREE.Group();this.environmentRoot.name='Blender '+value+' world';this.scene.add(this.environmentRoot);
  this.addSigns();this.worldInfo=installWilderness(this.environmentRoot,this.track,this.manifest,this.kit,value);
  const night=value==='night',alpine=value==='alpine';
  this.scene.fog.color.set(night?'#111c31':alpine?'#b4c3cb':'#819490');this.scene.fog.density=night?.0021:alpine?.0009:.0012;
  this.scene.background=night?this.nightSky:this.daySky;this.scene.environment=night?this.nightTarget?.texture:this.envTarget?.texture;
  this.scene.backgroundIntensity=night?.8:alpine?.85:.65;this.scene.environmentIntensity=night?.8:alpine?.8:.65;
  this.sun.color.set(night?'#9db9ff':'#fff3df');this.sun.intensity=night?.9:alpine?2.5:2.1;
  this.hemi.color.set(night?'#7795ce':'#d7e8f2');this.hemi.intensity=night?.4:alpine?.9:.75;this.hemi.groundColor.set(night?'#182b3e':alpine?'#8c9ba1':'#42533e');
  if(!this.roadLights)this.roadLights=Array.from({length:4},()=>{const light=new THREE.SpotLight('#ffbe78',0,65,.80,.8,2);light.castShadow=false;this.scene.add(light,light.target);return light;});
  this.lampLocations=this.worldInfo.placements.filter(p=>p.name==='street-lamp').map(p=>{const x=p.x-2.95*Math.cos(p.heading),z=p.z+2.95*Math.sin(p.heading),q=this.track.project(p.x,p.z),target=this.track.at(q.s);return {position:new V(x,p.y+8.248,z),target:new V(target.x,target.y+.08,target.z)};});
  for(const light of this.roadLights){light.intensity=0;light.visible=night;}this.nextLightRefresh=0;this.followInitialized=false;

 }
 addSigns(){const t=this.track;for(let i=0;i<8;i++){const p=t.at(t.gates[i]+7),side=i%2?-1:1,group=new THREE.Group();group.position.set(p.x+p.tz*side*12,p.y,p.z-p.tx*side*12);group.rotation.y=p.heading+Math.PI;const pole=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,5,8),new THREE.MeshStandardMaterial({color:'#778085',metalness:.7,roughness:.4}));pole.position.y=2.5;group.add(pole);const board=new THREE.Mesh(new THREE.PlaneGeometry(5,1.25),new THREE.MeshBasicMaterial({map:labelTexture(i===0?'HARBOR CIRCUIT':this.environment==='alpine'?'SUMMIT PASS →':this.environment==='night'?'MIDNIGHT RUN →':'REDWOOD RIDGE →'),side:THREE.DoubleSide}));board.position.y=4.8;group.add(board);this.environmentRoot.add(group);}
 for(let s=0;s<t.length;s+=26){const p=t.at(s),q=t.at(s+25),bend=angleDiff(q.heading,p.heading);if(Math.abs(bend)<.13)continue;const sign=new THREE.Mesh(new THREE.PlaneGeometry(2,1.1),new THREE.MeshBasicMaterial({map:labelTexture(bend>0?'❯❯':'❮❮','#e6b22c','#242b2c'),side:THREE.DoubleSide}));const side=bend>0?-1:1;sign.position.set(p.x+p.tz*side*10.3,p.y+1.5,p.z-p.tx*side*10.3);sign.rotation.y=p.heading+Math.PI;this.environmentRoot.add(sign);}
 const p=t.at(0),start=new THREE.Mesh(new THREE.PlaneGeometry(19,1.5),new THREE.MeshStandardMaterial({map:labelTexture('START / FINISH','#dad6c7','#242a2a'),roughness:1}));start.rotation.x=-Math.PI/2;start.rotation.z=-p.heading;start.position.set(p.x,p.y+.045,p.z);this.environmentRoot.add(start);
 }
 createSkids(){this.skidIndex=0;this.skidAge=0;this.skids=new THREE.InstancedMesh(new THREE.PlaneGeometry(.18,1.1),new THREE.MeshBasicMaterial({color:'#111513',transparent:true,opacity:.45,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}),500);const m=new THREE.Matrix4().makeScale(0,0,0);for(let i=0;i<500;i++)this.skids.setMatrixAt(i,m);this.skids.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.skids.frustumCulled=false;this.scene.add(this.skids);}
 attachCars(){this.clearImpacts();for(const mesh of this.carMeshes){this.scene.remove(mesh);const flame=mesh.userData.flame;for(const resource of new Set([...mesh.userData.paints,...mesh.userData.brakes,...mesh.userData.police,flame.geometry,flame.material]))resource.dispose();for(const light of mesh.userData.headlights??[])light.dispose();}for(const shadow of this.contactShadows??[]){this.scene.remove(shadow);shadow.geometry.dispose();shadow.material.dispose();}this.contactShadows=[];this.carMeshes=this.race.cars.map((c,i)=>{const id=c.vehicle??(i===0?this.vehicle:VEHICLES[i%VEHICLES.length].id),source=this.templates?.get(id)??this.template,car=cloneCar(source,i>0&&id==='interceptor'?'#101820':c.color);car.userData.vehicle=id;car.userData.cabinMeshes=[];car.traverse(o=>{if(o.isMesh&&(o.userData.hideInCockpit||/^(Cabin leather|Glass glazing)$/.test(o.material.name)))car.userData.cabinMeshes.push(o);});if(i===0&&this.cockpitTemplate){car.userData.cockpit=createCockpit(this.cockpitTemplate,id);car.add(car.userData.cockpit);}car.visible=c.active!==false;car.userData.headlights=[];if(i===0)for(const p of source.userData.headlightPositions){const light=new THREE.SpotLight('#d9edff',0,85,.35,.65,2);light.position.fromArray(p);light.target.position.set(p[0],-.5,p[2]+22);car.add(light,light.target);car.userData.headlights.push(light);}const shadow=new THREE.Mesh(new THREE.PlaneGeometry(2.4,5.2),new THREE.MeshBasicMaterial({map:this.contactTexture,transparent:true,depthWrite:false,opacity:.8,polygonOffset:true,polygonOffsetFactor:-2}));shadow.rotation.x=-Math.PI/2;shadow.visible=c.active!==false;this.contactShadows.push(shadow);this.scene.add(shadow);const flame=new THREE.Mesh(new THREE.ConeGeometry(.1,.9,8),new THREE.MeshBasicMaterial({color:'#69d6ff',transparent:true,opacity:.85}));flame.rotation.x=-Math.PI/2;flame.position.set(.23,.30,-2.36);flame.visible=false;car.add(flame);car.userData.flame=flame;this.scene.add(car);return car;});this.followInitialized=false;}
 setPaint(color){for(const m of this.carMeshes[0]?.userData.paints??[])m.color.set(color);}
 setGarageView(value){this.garageView=garageAngle(value);this.followInitialized=false;}
 setDrivingView(value){if(!hasDrivingView(value))return;this.drivingView=value;this.followInitialized=false;}
 rotateCamera(delta){this.trackingYaw=wrapYaw((this.trackingYaw??-.72)+delta);}
 setQuality(value){this.quality=value;this.frameStats??=new FrameStats();this.frameStats.reset();this.maxPixelRatio=Math.max(.65,Math.min(devicePixelRatio||1,1.5));this.renderer.setPixelRatio(value==='low'?.8:this.maxPixelRatio);this.renderer.shadowMap.enabled=value!=='low';this.resize();}
 recordFrame(ms,active){
  this.frameStats??=new FrameStats();const next=this.frameStats.observe(ms,active,this.quality==='auto',this.renderer.getPixelRatio(),this.maxPixelRatio??1.5);
  if(next!==null){this.renderer.setPixelRatio(next);if(next<=.8)this.renderer.shadowMap.enabled=false;else if(next>=1)this.renderer.shadowMap.enabled=true;this.resize();}
  this.performanceInfo={fps:Math.round(this.frameStats.fps),draws:this.renderer.info?.render.calls??0,triangles:this.renderer.info?.render.triangles??0,pixelRatio:this.renderer.getPixelRatio()};return this.performanceInfo;
 }
 resize(){const w=innerWidth,h=innerHeight;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
 impact(events,reducedMotion=false){this.impactEffects.emit(events,this.race.cars,this.renderer.getPixelRatio()<=.8,reducedMotion);}
 clearImpacts(){this.impactEffects.restoreCamera(this.camera);this.impactEffects.clear();this.impactElapsed=this.race.elapsed;}
 audioListener(){this.camera.updateMatrixWorld();const m=this.camera.matrixWorld.elements;return {x:this.camera.position.x,z:this.camera.position.z,rightX:m[0],rightZ:m[2]};}
 update(dt,rear=false,menu=false,reducedMotion=false){
 this.impactEffects.restoreCamera(this.camera);const effectDt=Math.max(0,this.race.elapsed-this.impactElapsed);this.impactElapsed=this.race.elapsed;this.impactEffects.update(effectDt,this.camera,this.canvas?.height??globalThis.innerHeight??768);
 this.time+=dt;const player=this.race.player,pose=menu?null:cameraPose(player,this.drivingView,this.trackingYaw,rear,reducedMotion),effective=menu?'garage':pose.mode;if(this.lastCamera!==effective){this.followInitialized=false;this.lastCamera=effective;}
 this.carMeshes.forEach((mesh,i)=>{const c=this.race.cars[i],shadow=this.contactShadows[i];mesh.visible=shadow.visible=c.active!==false;if(!mesh.visible)return;for(const cabin of mesh.userData.cabinMeshes??[])cabin.visible=!(i===0&&pose?.inside);if(mesh.userData.cockpit)updateCockpit(mesh.userData.cockpit,c,i===0&&!!pose?.inside);shadow.position.set(c.x,c.y+.026,c.z);shadow.rotation.z=-c.heading;mesh.position.set(c.x,c.y+.03,c.z);const recoil=this.impactEffects.field.recoils.get(i);mesh.rotation.set(c.slip*.08+(recoil?.pitch??0),c.heading,-c.steer*clamp(c.speed/60,0,1)*.035+(recoil?.roll??0));for(const group of mesh.userData.wheelGroups){group.rotation.set(c.wheel,group.name.includes('Front')?wheelSteering(c):0,0,'YXZ');}for(const mat of mesh.userData.brakes){mat.emissive.set(c.braking?'#ff2400':'#330400');mat.emissiveIntensity=c.braking?1.7:this.environment==='night'?.85:.2;}for(const light of mesh.userData.headlights??[])light.intensity=this.environment==='night'?1800:0;for(const mat of mesh.userData.police)mat.emissiveIntensity=c.police||this.environment==='night'?(Math.sin(this.time*13+(mat.name.includes('blue')?0:Math.PI))>0?5:.3):1.2;mesh.userData.flame.visible=c.boosting;mesh.userData.flame.scale.y=.7+Math.sin(this.time*58)*.25;});
 if(this.skids&&Math.abs(player.slip)>.04&&this.race.phase==='racing'){this.skidAge+=dt;if(this.skidAge>.025){this.skidAge=0;for(const side of [-.72,.72]){const pos=new V(player.x+Math.cos(player.heading)*side-Math.sin(player.heading)*1.3,player.y+.045,player.z-Math.sin(player.heading)*side-Math.cos(player.heading)*1.3);const rot=new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI/2,0,-player.heading));this.skids.setMatrixAt(this.skidIndex++%500,new THREE.Matrix4().compose(pos,rot,new V(1,1,1)));}this.skids.instanceMatrix.needsUpdate=true;}}
 if(this.environment==='night'&&this.roadLights&&this.time>=(this.nextLightRefresh??0)){
  this.nextLightRefresh=this.time+.2;const nearest=[];
  for(const p of this.lampLocations??[]){const d=(p.position.x-player.x)**2+(p.position.z-player.z)**2;let i=0;while(i<nearest.length&&nearest[i].d<d)i++;if(i<this.roadLights.length){nearest.splice(i,0,{p,d});nearest.length=Math.min(nearest.length,this.roadLights.length);}}
  this.roadLights.forEach((light,i)=>{const p=nearest[i]?.p;light.visible=!!p;light.intensity=p?1400:0;if(p){light.position.copy(p.position);light.target.position.copy(p.target);}});
 }
 const eye=new V(),look=new V(player.x,player.y+.9,player.z);if(menu){const view=garageAngle(this.garageView),preset={front:[0,1.45],rear:[Math.PI,1.45],left:[Math.PI/2,1.2],right:[-Math.PI/2,1.2],angle:[-.7,2.15]};const a=view==='orbit'?(reducedMotion?-.7:-.7+Math.sin(this.time*.12)*.9):preset[view][0],height=view==='orbit'?2.15:preset[view][1];eye.set(player.x+Math.sin(player.heading+a)*7.9,player.y+height,player.z+Math.cos(player.heading+a)*7.9);look.y=player.y+.4;}
 else{eye.fromArray(pose.eye);look.fromArray(pose.look);}
 const fov=menu?48:pose.fov;if(!this.followInitialized||pose?.mode==='cockpit'||pose?.mode==='hood'){this.camera.position.copy(eye);this.look.copy(look);if(!this.followInitialized)this.camera.fov=fov;this.followInitialized=true;}else{this.camera.position.lerp(eye,1-Math.exp(-dt*(rear?14:7)));this.look.lerp(look,1-Math.exp(-dt*10));}this.camera.lookAt(this.look);this.camera.near=menu?.1:pose.near;this.camera.fov+=(fov-this.camera.fov)*Math.min(1,dt*4);this.camera.updateProjectionMatrix();this.sun.position.set(player.x-65,player.y+85,player.z-45);this.sun.target.position.set(player.x,player.y,player.z);if(!menu)this.impactEffects.applyCamera(this.camera,!!pose.inside,reducedMotion);this.renderer.render(this.scene,this.camera);
 }
}
