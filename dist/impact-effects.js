import * as THREE from 'three';
import {ImpactField,IMPACT_LIMITS,cameraRecoil} from './impacts.js';

export class ImpactEffects{
 constructor(scene){
  this.field=new ImpactField();this.root=new THREE.Group();this.root.name='Contact sparks, fragments and dust';scene.add(this.root);this.offset=new THREE.Vector3();
  const sparkGeometry=new THREE.BufferGeometry();this.sparkPosition=new Float32Array(IMPACT_LIMITS.sparks*6);this.sparkColor=new Float32Array(IMPACT_LIMITS.sparks*6);sparkGeometry.setAttribute('position',new THREE.BufferAttribute(this.sparkPosition,3).setUsage(THREE.DynamicDrawUsage));sparkGeometry.setAttribute('color',new THREE.BufferAttribute(this.sparkColor,3).setUsage(THREE.DynamicDrawUsage));sparkGeometry.setDrawRange(0,0);
  this.sparks=new THREE.LineSegments(sparkGeometry,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));this.sparks.frustumCulled=false;this.root.add(this.sparks);
  this.fragments=new THREE.InstancedMesh(new THREE.TetrahedronGeometry(1,0),new THREE.MeshStandardMaterial({color:'#b5c3cb',metalness:.6,roughness:.44}),IMPACT_LIMITS.fragments);this.fragments.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.fragments.frustumCulled=false;this.fragments.count=0;this.root.add(this.fragments);this.object=new THREE.Object3D();
  const dustGeometry=new THREE.BufferGeometry();this.dustPosition=new Float32Array(IMPACT_LIMITS.dust*3);this.dustAlpha=new Float32Array(IMPACT_LIMITS.dust);this.dustSize=new Float32Array(IMPACT_LIMITS.dust);for(const [name,array,size] of [['position',this.dustPosition,3],['aAlpha',this.dustAlpha,1],['aSize',this.dustSize,1]])dustGeometry.setAttribute(name,new THREE.BufferAttribute(array,size).setUsage(THREE.DynamicDrawUsage));dustGeometry.setDrawRange(0,0);
  this.dust=new THREE.Points(dustGeometry,new THREE.ShaderMaterial({uniforms:{uScale:{value:500},uColor:{value:new THREE.Color('#c7c4bd')}},vertexShader:'attribute float aAlpha; attribute float aSize; uniform float uScale; varying float vAlpha; void main(){ vec4 p=modelViewMatrix*vec4(position,1.0); gl_Position=projectionMatrix*p; gl_PointSize=clamp(aSize*uScale/max(0.1,-p.z),1.0,96.0); vAlpha=aAlpha; }',fragmentShader:'uniform vec3 uColor; varying float vAlpha; void main(){ float r=length(gl_PointCoord-vec2(0.5)); float a=(1.0-smoothstep(0.08,0.5,r))*vAlpha; if(a<0.003)discard; gl_FragColor=vec4(uColor,a);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}',transparent:true,depthWrite:false}));this.dust.frustumCulled=false;this.root.add(this.dust);
  this.light=new THREE.PointLight('#ffc686',0,7,2);this.light.castShadow=false;this.root.add(this.light);
 }
 emit(events,cars,reduced=false,reducedMotion=false){const ordered=[...events].sort((a,b)=>Number(a.actors.includes(0))-Number(b.actors.includes(0)));for(const event of ordered)this.field.emit(event,cars,reduced,reducedMotion);}
 clear(){this.field.clear();this.sparks.geometry.setDrawRange(0,0);this.fragments.count=0;this.dust.geometry.setDrawRange(0,0);this.light.intensity=0;}
 restoreCamera(camera){camera.position.sub(this.offset);this.offset.set(0,0,0);if(this.cleanFov!==undefined)camera.fov=this.cleanFov;}
 update(dt,camera,height=globalThis.innerHeight??768){
  this.field.update(dt);let n=0;
  for(const p of this.field.pools.spark){if(!p.alive)continue;const i=n*6,fade=(1-p.age/p.life)**2,trail=.016+p.severity*.018;this.sparkPosition.set([p.x-p.vx*trail,p.y-p.vy*trail,p.z-p.vz*trail,p.x,p.y,p.z],i);this.sparkColor.set([fade*.35,fade*.14,fade*.018,fade*2.4,fade*(1.2-p.age/p.life*.7),fade*.25],i);n++;}
  this.sparks.geometry.setDrawRange(0,n*2);this.sparks.geometry.attributes.position.needsUpdate=true;this.sparks.geometry.attributes.color.needsUpdate=true;
  n=0;for(const p of this.field.pools.fragment){if(!p.alive)continue;const fade=Math.min(1,(p.life-p.age)/.15),o=this.object;o.position.set(p.x,p.y,p.z);o.rotation.set(p.angle,p.angle*.73,p.angle*.31);o.scale.set(p.size*1.8*fade,p.size*.4*fade,p.size*fade);o.updateMatrix();this.fragments.setMatrixAt(n++,o.matrix);}this.fragments.count=n;this.fragments.instanceMatrix.needsUpdate=true;
  n=0;for(const p of this.field.pools.dust){if(!p.alive)continue;const i=n*3,age=p.age/p.life;this.dustPosition.set([p.x,p.y,p.z],i);this.dustAlpha[n]=Math.sin(age*Math.PI)*.24;this.dustSize[n]=p.size*(1+age*3);n++;}this.dust.geometry.setDrawRange(0,n);for(const a of Object.values(this.dust.geometry.attributes))a.needsUpdate=true;this.dust.material.uniforms.uScale.value=height/(2*Math.tan(camera.fov*Math.PI/360));
  const flash=this.field.flash;this.light.intensity=flash?110*flash.strength*(1-flash.age/.09)**3:0;if(flash)this.light.position.set(flash.x,flash.y+.15,flash.z);
 }
 applyCamera(camera,inside=false,reducedMotion=false){
  const recoil=cameraRecoil(this.field.strength,this.field.age,inside,reducedMotion);this.cleanFov=camera.fov;this.offset.set(recoil.x,recoil.y,0).applyQuaternion(camera.quaternion);camera.position.add(this.offset);camera.rotateZ(recoil.roll);camera.rotateX(recoil.pitch);camera.fov+=recoil.fov;camera.updateProjectionMatrix();
 }
 dispose(){for(const object of [this.sparks,this.fragments,this.dust]){object.geometry.dispose();object.material.dispose();}this.light.dispose();this.root.removeFromParent();}
}
