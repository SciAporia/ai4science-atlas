import * as THREE from './vendor/three.module.js';
import { OrbitControls } from './vendor/OrbitControls.js';
import { CanvasKnowledgeTree } from './tree-canvas.js';
import { buildTreeLayout, sampleSpline, hash, clamp } from './tree-layout.js';

const TAU=Math.PI*2,V=p=>new THREE.Vector3(p.x,p.y,p.z),v3=(x,y,z)=>new THREE.Vector3(x,y,z);
const ease=t=>1-Math.pow(1-t,3);
const instanceMatrix=new THREE.Matrix4(),instanceQuaternion=new THREE.Quaternion(),instanceScale=new THREE.Vector3();

/** Hardware renderer for the ARBOR sculpture. The shared layout keeps both
 * renderers scientifically identical: year is the only source of node Y. */
export class KnowledgeTree {
 constructor(container,options={}){
  this.container=container;this.options=options;this.domains=options.domains||[];this.language='en';this.theme='light';this.layoutMode='organic';
  this.papers=[];this.entries=[];this.yearLabels=[];this.branches=new Map();this.selectedId=null;this.hoverId=null;this.activeDomain=null;
  this.autoRotate=false;this.labelsVisible=true;this.relationships=[];this.relationsVisible=false;this.disposed=false;this.listeners=[];this.reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;this.lastFrame=0;
  this.pointer=new THREE.Vector2();this.raycaster=new THREE.Raycaster();
  if(getComputedStyle(container).position==='static')container.style.position='relative';
  try{this.renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});}catch{return new CanvasKnowledgeTree(container,options);}
  this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));this.renderer.setClearColor(0,0);this.renderer.outputColorSpace=THREE.SRGBColorSpace;
  this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.15;
  this.canvas=this.renderer.domElement;this.canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:grab';
  this.canvas.setAttribute('role','img');this.canvas.setAttribute('aria-label','Interactive three-dimensional scientific knowledge sculpture. Drag to orbit; scroll or pinch to zoom.');container.appendChild(this.canvas);
  this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(37,1,.1,150);this.camera.position.set(11,7.2,22);
  this.controls=new OrbitControls(this.camera,this.canvas);this.controls.target.set(0,.8,0);this.controls.enableDamping=true;this.controls.dampingFactor=.08;
  this.controls.rotateSpeed=.38;this.controls.zoomSpeed=.62;this.controls.panSpeed=.6;this.controls.minDistance=5;this.controls.maxDistance=55;
  this.controls.minPolarAngle=.3;this.controls.maxPolarAngle=Math.PI*.72;this.controls.autoRotateSpeed=.24;
  this.controls.addEventListener('start',()=>{this.tween=null;});
  this.ambient=new THREE.HemisphereLight(0xf6fcff,0x84978c,2.3);this.scene.add(this.ambient);
  this.key=new THREE.DirectionalLight(0xfff5e9,4);this.key.position.set(-6,10,7);this.scene.add(this.key);
  this.fill=new THREE.DirectionalLight(0xc8e3fb,2.2);this.fill.position.set(8,5,-7);this.scene.add(this.fill);
  const rim=new THREE.DirectionalLight(0xffffff,2.7);rim.position.set(0,7,-10);this.scene.add(rim);try{this.makeStudioEnvironment();}catch(error){console.warn('Studio reflections unavailable; using direct illumination.',error);}
  this.treeGroup=new THREE.Group();this.groundGroup=new THREE.Group();this.scene.add(this.treeGroup,this.groundGroup);
  this.overlay=document.createElement('div');this.overlay.className='arbor-tree-labels';this.overlay.style.cssText='position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:2';container.appendChild(this.overlay);
  this.sphereGeometry=new THREE.SphereGeometry(1,22,14);this.glowTexture=this.makeGlow();this.makeGround();
  this.listen(this.canvas,'pointerdown',e=>{this.down={x:e.clientX,y:e.clientY};});
  this.listen(this.canvas,'pointermove',e=>{if(e.buttons){this.setHover(null);return;}this.setHover(this.hitTest(e),{x:e.clientX,y:e.clientY});});
  this.listen(this.canvas,'pointerleave',()=>this.setHover(null));
  this.listen(this.canvas,'click',e=>{if(!this.down||Math.hypot(e.clientX-this.down.x,e.clientY-this.down.y)>6)return;const entry=this.hitTest(e);if(entry)this.options.onSelect?.(entry.paper);});
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);this.resize();
  this.animate=this.animate.bind(this);this.frame=requestAnimationFrame(this.animate);options.onReady?.({webgl:true,renderer:'three'});
 }
 listen(target,event,fn){target.addEventListener(event,fn);this.listeners.push([target,event,fn]);}
 makeGlow(){const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'#ffffff');g.addColorStop(.08,'rgba(255,255,255,.8)');g.addColorStop(.3,'rgba(255,255,255,.12)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);}
 curve(points){return new THREE.CatmullRomCurve3(points.map(V));}
 tube(points,r0,r1,material,segments=48,sides=9){
  const curve=this.curve(points),frames=curve.computeFrenetFrames(segments,false),positions=[],normals=[],uv=[],indices=[];
  for(let i=0;i<=segments;i++){const u=i/segments,p=curve.getPointAt(u),r=r1+(r0-r1)*Math.pow(1-u,.83);for(let j=0;j<=sides;j++){const a=j/sides*TAU,n=frames.normals[i].clone().multiplyScalar(Math.cos(a)).addScaledVector(frames.binormals[i],Math.sin(a));positions.push(p.x+n.x*r,p.y+n.y*r,p.z+n.z*r);normals.push(n.x,n.y,n.z);uv.push(u,j/sides);}}
  for(let i=0;i<segments;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j,b=a+sides+1;indices.push(a,a+1,b,b,a+1,b+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);return new THREE.Mesh(g,material);
 }
 makeLines(paths,color,opacity=.4){const positions=[];for(const points of paths){const dense=sampleSpline(points,10);for(let i=1;i<dense.length;i++)positions.push(dense[i-1].x,dense[i-1].y,dense[i-1].z,dense[i].x,dense[i].y,dense[i].z);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));return new THREE.LineSegments(g,new THREE.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false}));}
 makeStudioEnvironment(){
  const room=new THREE.Scene();room.background=new THREE.Color(0xb8c9c6);
  const panels=[{p:[-7,7,5],s:[8,12],c:[3.5,3.3,3.1]},{p:[8,6,-2],s:[5,12],c:[1.7,2.3,3]},{p:[0,12,0],s:[14,14],c:[2.4,2.7,2.6]},{p:[0,1,-10],s:[11,8],c:[1.5,1.8,1.7]}];
  for(const panel of panels){const mesh=new THREE.Mesh(new THREE.PlaneGeometry(...panel.s),new THREE.MeshBasicMaterial({color:new THREE.Color(...panel.c),side:THREE.DoubleSide}));mesh.position.set(...panel.p);mesh.lookAt(0,0,0);room.add(mesh);}
  const generator=new THREE.PMREMGenerator(this.renderer);try{this.environmentTarget=generator.fromScene(room,.055,.1,100);this.scene.environment=this.environmentTarget.texture;this.scene.environmentIntensity=.55;}finally{generator.dispose();room.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}
 }
 makeGround(){
  this.groundLines=[];const y=-5.14;
  const rings=[];for(const radius of [.75,1.05,1.65,3.5,5.4,7.15])rings.push(Array.from({length:161},(_,i)=>({x:Math.cos(i/160*TAU)*radius,y,z:Math.sin(i/160*TAU)*radius})));
  const ringLines=this.makeLines(rings,0x7c9692,.25);this.groundGroup.add(ringLines);this.groundLines.push(ringLines);
  const ticks=[];for(let i=0;i<96;i++){const a=i/96*TAU,r=i%8===0?6.88:7.03;ticks.push([{x:Math.cos(a)*r,y,z:Math.sin(a)*r},{x:Math.cos(a)*7.15,y,z:Math.sin(a)*7.15}]);}
  const tickLines=this.makeLines(ticks,0x687f79,.30);this.groundGroup.add(tickLines);this.groundLines.push(tickLines);
  this.plinth=new THREE.Mesh(new THREE.CylinderGeometry(.8,.98,.13,72),new THREE.MeshPhysicalMaterial({color:0xd3ded7,metalness:.5,roughness:.24,clearcoat:1}));this.plinth.position.y=-5.08;this.groundGroup.add(this.plinth);
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=256;const ctx=shadowCanvas.getContext('2d'),g=ctx.createRadialGradient(128,128,2,128,128,128);g.addColorStop(0,'rgba(15,39,28,.22)');g.addColorStop(.3,'rgba(15,39,28,.08)');g.addColorStop(1,'rgba(15,39,28,0)');ctx.fillStyle=g;ctx.fillRect(0,0,256,256);this.shadowTexture=new THREE.CanvasTexture(shadowCanvas);
  this.contactShadow=new THREE.Mesh(new THREE.PlaneGeometry(16,16),new THREE.MeshBasicMaterial({map:this.shadowTexture,transparent:true,depthWrite:false}));this.contactShadow.rotation.x=-Math.PI/2;this.contactShadow.position.y=-5.16;this.groundGroup.add(this.contactShadow);
  const positions=[];for(let i=0;i<150;i++)positions.push((hash(i+'px')-.5)*21,hash(i+'py')*15-5,(hash(i+'pz')-.5)*16);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));this.dust=new THREE.Points(geometry,new THREE.PointsMaterial({color:0x95aaa2,size:.018,transparent:true,opacity:.28,depthWrite:false}));this.groundGroup.add(this.dust);
 }
 clearTree(){
  const geometries=new Set(),materials=new Set();this.treeGroup.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.geometry&&o.geometry!==this.sphereGeometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
  this.treeGroup.clear();this.overlay.replaceChildren();this.entries=[];this.branches.clear();this.yearLabels=[];this.glows=null;this.motes=null;this.moteCurves=[];this.selectionRing=null;this.selectionRing2=null;this.highlightPath=null;this.relationsGroup=null;
 }
 setData(papers){
  this.papers=papers||[];this.clearTree();if(!this.papers.length)return;
  this.layout=buildTreeLayout(this.papers,this.domains,this.layoutMode);this.minYear=this.layout.minYear;this.maxYear=this.layout.maxYear;this.timeY=this.layout.timeY;
  this.moteCurves=[];const glowPositions=[],glowColors=[],glowSizes=[],glowAlphas=[];
  for(const b of this.layout.branches){
   const color=new THREE.Color(b.domain.color),pearl=color.clone().lerp(new THREE.Color(0xdde7e3),.68);
   const branch={...b,color,entries:[],meshes:[],nodeMaterial:null};this.branches.set(b.domain.id,branch);
   const mainMaterial=new THREE.MeshPhysicalMaterial({color:pearl,metalness:.48,roughness:.24,clearcoat:1,clearcoatRoughness:.16,iridescence:.16,iridescenceIOR:1.35,transparent:true,opacity:.94});
   const main=this.tube(b.pathPoints,.16,.024,mainMaterial,80,10);this.treeGroup.add(main);branch.meshes.push({object:main,opacity:.94,role:'main'});
   const fiber=this.makeLines(b.fibers,b.domain.color,.76);this.treeGroup.add(fiber);branch.meshes.push({object:fiber,opacity:.76,role:'fiber'});
   for(const limb of b.limbPaths){const mat=mainMaterial.clone();const mesh=this.tube(limb.points,.065,.009,mat,36,7);this.treeGroup.add(mesh);branch.meshes.push({object:mesh,opacity:.86,role:'limb'});}
   for(const root of b.roots.slice(0,2)){const mat=mainMaterial.clone();const mesh=this.tube(root,.018,.1,mat,40,7);this.treeGroup.add(mesh);branch.meshes.push({object:mesh,opacity:.78,role:'root'});}
   const twigs=this.makeLines(b.entries.map(e=>e.twigPoints),color,.44);this.treeGroup.add(twigs);branch.twigs=twigs;
   const material=new THREE.MeshPhysicalMaterial({color:0xffffff,metalness:.34,roughness:.19,clearcoat:1,clearcoatRoughness:.12,iridescence:.1,transparent:true,opacity:1});
   const nodes=new THREE.InstancedMesh(this.sphereGeometry,material,b.entries.length);nodes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);nodes.userData.branch=branch;nodes.frustumCulled=false;branch.nodes=nodes;branch.nodeMaterial=material;this.treeGroup.add(nodes);
   b.entries.forEach((entry,index)=>{
    const e={...entry,point:V(entry.point),index,branch,visible:true,color:color.clone(),glowIndex:this.entries.length};this.entries.push(e);branch.entries.push(e);
    instanceMatrix.compose(e.point,instanceQuaternion,instanceScale.setScalar(e.radius));nodes.setMatrixAt(index,instanceMatrix);nodes.setColorAt(index,color);
    glowPositions.push(e.point.x,e.point.y,e.point.z);glowColors.push(color.r,color.g,color.b);glowSizes.push(e.radius*9);glowAlphas.push(.2);
    const label=document.createElement('button');label.type='button';label.className='arbor-node-label';label.tabIndex=-1;
    label.style.cssText='position:absolute;left:0;top:0;pointer-events:auto;border:0;background:transparent;text-align:left;padding:4px 7px;color:#344b48;white-space:nowrap;font-family:inherit;line-height:1.45;cursor:pointer;opacity:0;transform:translate(-999px,-999px);transition:color .2s,opacity .2s;max-width:190px;text-shadow:0 1px 7px #f5f7f2';
    const title=document.createElement('span');title.style.cssText='display:block;font-size:10px;letter-spacing:.01em;font-weight:600';title.textContent=entry.paper.short||entry.paper.title;
    const year=document.createElement('span');year.style.cssText='display:block;font-size:8px;letter-spacing:.14em;opacity:.6;margin-top:1px';year.textContent=entry.paper.year;label.append(title,year);label.title=entry.paper.title;
    label.setAttribute('aria-label',`${title.textContent}, ${entry.paper.year}. Open paper details`);label.onclick=ev=>{ev.stopPropagation();this.options.onSelect?.(entry.paper);};label.onmouseenter=ev=>this.setHover(e,{x:ev.clientX,y:ev.clientY});label.onmouseleave=()=>this.setHover(null);this.overlay.appendChild(label);e.label=label;
   });
   const label=document.createElement('button');label.type='button';label.className='arbor-domain-label';label.tabIndex=-1;label.style.cssText='position:absolute;left:0;top:0;pointer-events:auto;border:0;background:transparent;text-transform:uppercase;letter-spacing:.13em;font-family:inherit;font-size:8px;font-weight:600;line-height:1.4;padding:6px;white-space:nowrap;opacity:0;cursor:pointer';label.textContent=this.domainName(b.domain);label.style.color=b.domain.color;label.onclick=()=>this.options.onDomainSelect?.(b.domain.id);this.overlay.appendChild(label);branch.label=label;branch.labelPoint=V(b.labelPoint);
   this.moteCurves.push({curve:this.curve(b.pathPoints),color,domainId:b.domain.id});
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(glowPositions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(glowColors,3));geometry.setAttribute('size',new THREE.Float32BufferAttribute(glowSizes,1));geometry.setAttribute('alpha',new THREE.Float32BufferAttribute(glowAlphas,1));
  this.glows=new THREE.Points(geometry,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,uniforms:{pointScale:{value:500}},vertexShader:'attribute float size; attribute float alpha; varying vec3 vColor; varying float vAlpha; uniform float pointScale; void main(){vColor=color;vAlpha=alpha;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=size*pointScale/max(1.0,-mv.z);gl_Position=projectionMatrix*mv;}',fragmentShader:'varying vec3 vColor; varying float vAlpha; void main(){float d=length(gl_PointCoord-vec2(.5))*2.;float a=pow(max(0.,1.-d),3.)*vAlpha;gl_FragColor=vec4(vColor,a);}'}));this.treeGroup.add(this.glows);
  const motePositions=new Float32Array(this.moteCurves.length*3*3),moteColors=new Float32Array(motePositions.length);this.moteCurves.forEach((m,i)=>{for(let j=0;j<3;j++)moteColors.set([m.color.r,m.color.g,m.color.b],(i*3+j)*3);});const mg=new THREE.BufferGeometry();mg.setAttribute('position',new THREE.BufferAttribute(motePositions,3));mg.setAttribute('color',new THREE.BufferAttribute(moteColors,3));this.motes=new THREE.Points(mg,new THREE.PointsMaterial({size:.08,vertexColors:true,transparent:true,opacity:.8,depthWrite:false,map:this.glowTexture}));this.treeGroup.add(this.motes);
  this.selectionRing=new THREE.Mesh(new THREE.RingGeometry(.22,.234,64),new THREE.MeshBasicMaterial({color:0x386e70,side:THREE.DoubleSide,transparent:true,opacity:.9,depthWrite:false}));this.selectionRing.visible=false;this.treeGroup.add(this.selectionRing);
  this.selectionRing2=new THREE.Mesh(new THREE.RingGeometry(.29,.294,64),new THREE.MeshBasicMaterial({color:0x386e70,side:THREE.DoubleSide,transparent:true,opacity:.45,depthWrite:false}));this.selectionRing2.visible=false;this.treeGroup.add(this.selectionRing2);
  this.highlightPath=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0x456b67,transparent:true,opacity:.95,depthWrite:false}));this.highlightPath.visible=false;this.treeGroup.add(this.highlightPath);
  const years=[this.minYear,...[2000,2010,2020].filter(y=>y>this.minYear&&y<this.maxYear),this.maxYear];
  for(const year of years){const label=document.createElement('span');label.textContent=year;label.style.cssText='position:absolute;left:0;top:0;font-family:inherit;font-size:9px;line-height:1.2;letter-spacing:.12em;pointer-events:none;color:#657e73;opacity:.88';this.overlay.appendChild(label);this.yearLabels.push({label,point:v3(-7.1,this.timeY(year),0)});}
  this.relationsGroup=new THREE.Group();this.treeGroup.add(this.relationsGroup);this.setTheme(this.theme);this.filter(this.visibleIds?[...this.visibleIds]:this.papers.map(p=>p.id),this.activeDomain);this.resize();this.reset();
 }
 domainName(d){return typeof d.label==='object'?(d.label[this.language]||d.label.en||d.id):(d.label||d.id);}
 filter(ids,domainId=null){this.visibleIds=new Set(ids||this.papers.map(p=>p.id));this.activeDomain=domainId;this.entries.forEach(e=>{e.visible=this.visibleIds.has(e.paper.id);});if(this.hoverId&&!this.visibleIds.has(this.hoverId)){this.hoverId=null;this.options.onHover?.(null,null);}this.updateMaterials();}
 updateMaterials(){
  const focused=this.entries.find(e=>e.paper.id===this.hoverId)?.paper.domain||this.activeDomain,dark=this.theme==='dark',activeEntry=this.entries.find(e=>e.paper.id===(this.hoverId||this.selectedId)&&e.visible);
  this.branches.forEach(b=>{
   const active=!focused||focused===b.domain.id,any=b.entries.some(e=>e.visible);b.meshes.forEach(({object,opacity,role})=>{object.material.opacity=opacity*(active&&any?1:.12);if(role==='main'||role==='limb'||role==='root')object.material.emissiveIntensity=dark?.08:0;});
   b.twigs.material.opacity=(dark?.5:.35)*(active&&any?1:.11);
   b.entries.forEach(e=>{const selected=e.paper.id===this.selectedId||e.paper.id===this.hoverId,cross=focused&&(e.paper.secondaryDomains||[]).includes(focused),shown=e.visible&&(active||cross);const scale=e.radius*(selected?1.25:1)*(e.visible?1:.46);
    instanceMatrix.compose(e.point,instanceQuaternion,instanceScale.setScalar(scale));b.nodes.setMatrixAt(e.index,instanceMatrix);
    const color=e.color.clone();if(!shown)color.lerp(new THREE.Color(dark?0x152126:0xe2e8e3),e.visible?.70:.93);else if(!dark)color.multiplyScalar(.85);if(selected)color.lerp(new THREE.Color(dark?0xffffff:0x65d8c9),.25);b.nodes.setColorAt(e.index,color);
    if(this.glows){this.glows.geometry.attributes.alpha.setX(e.glowIndex,shown?(dark?(selected?.8:.32):(selected?.2:.065)):.005);this.glows.geometry.attributes.size.setX(e.glowIndex,e.radius*(selected?13:8));}
   });b.nodes.instanceMatrix.needsUpdate=true;if(b.nodes.instanceColor)b.nodes.instanceColor.needsUpdate=true;
  });
  if(this.glows){this.glows.geometry.attributes.alpha.needsUpdate=true;this.glows.geometry.attributes.size.needsUpdate=true;}
  for(const ring of [this.selectionRing,this.selectionRing2])if(ring){ring.visible=!!activeEntry;if(activeEntry){ring.position.copy(activeEntry.point);ring.material.color.copy(activeEntry.color);}}
  if(this.highlightPath){this.highlightPath.visible=!!activeEntry;if(activeEntry){const pts=[...sampleSpline(activeEntry.branch.pathPoints,10).filter(p=>p.y<=activeEntry.attachPoint.y),...sampleSpline(activeEntry.twigPoints,16)];this.highlightPath.geometry.dispose();this.highlightPath.geometry=new THREE.BufferGeometry().setFromPoints(pts.map(V));this.highlightPath.material.color.copy(activeEntry.color);}}
  this.updateRelations();
 }
 select(id){const previous=this.selectedId;this.selectedId=id||null;this.updateMaterials();if(id&&id!==previous){const e=this.entries.find(e=>e.paper.id===id);if(e){const target=e.point.clone();target.x-=this.camera.aspect>1?.7:0;const direction=this.camera.position.clone().sub(this.controls.target).normalize();const distance=this.camera.aspect<.85?18:15;this.moveCamera(target.clone().addScaledVector(direction,distance),target);}}}
 setHover(entry,pos){const id=entry?.paper.id||null;if(id===this.hoverId)return;this.hoverId=id;this.canvas.style.cursor=id?'pointer':'grab';this.updateMaterials();this.options.onHover?.(entry?.paper||null,pos||null);}
 hitTest(event){const rect=this.canvas.getBoundingClientRect();this.pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);this.raycaster.setFromCamera(this.pointer,this.camera);const hits=this.raycaster.intersectObjects([...this.branches.values()].map(b=>b.nodes),false);for(const h of hits){const e=h.object.userData.branch.entries[h.instanceId];if(e?.visible)return e;}return null;}
 setTheme(theme){this.theme=theme;const dark=theme==='dark';this.renderer.toneMappingExposure=dark?1.25:1.08;this.scene.environmentIntensity=dark?.37:.55;this.ambient.intensity=dark?1.6:2.3;this.key.intensity=dark?3.2:4;this.fill.intensity=dark?2.7:2.2;
  this.yearLabels.forEach(({label})=>{label.style.color=dark?'#a9c0b7':'#657e73';label.style.opacity=dark?'.78':'.88';});
  this.entries.forEach(e=>{e.label.style.color=dark?'#d9e9e1':'#294a43';e.label.style.textShadow=dark?'0 1px 8px #071416':'0 1px 6px #f4f6f0';});
  this.branches.forEach(b=>{if(b.label){b.label.style.filter=dark?'brightness(1.25)':'brightness(.65)';b.label.style.textShadow=dark?'0 1px 7px #071416':'0 1px 7px #f4f6f0';}b.meshes.forEach(({object,role})=>{if(role!=='fiber'){object.material.color.copy(b.color).lerp(new THREE.Color(dark?0x7a9993:0xdde7e3),dark?.38:.68);object.material.metalness=dark?.5:.48;}});});
  this.groundLines.forEach(o=>{o.material.opacity=dark?.2:.24;o.material.color.set(dark?0x729e96:0x80948d);});this.plinth.material.color.set(dark?0x2e4944:0xd3ded7);this.contactShadow.visible=!dark;this.dust.material.opacity=dark?.5:.2;this.updateMaterials();
 }
 setLanguage(lang){this.language=lang;this.branches.forEach(b=>{b.label.textContent=this.domainName(b.domain);});}
 setLabels(value){this.labelsVisible=!!value;this.updateLabels();}
 setRelations(relationships,visible=true){this.relationships=relationships||[];this.relationsVisible=!!visible;this.updateRelations();}
 updateRelations(){
  if(!this.relationsGroup)return;this.relationsGroup.children.forEach(o=>{o.geometry?.dispose();o.material?.dispose();});this.relationsGroup.clear();
  if(!this.relationsVisible||!this.selectedId)return;const selected=this.entries.find(e=>e.paper.id===this.selectedId&&e.visible);if(!selected)return;
  const getId=value=>typeof value==='object'?(value?.id||value?.paperId):value;
  for(const relation of this.relationships){const source=getId(relation.source??relation.from??relation.sourceId),target=getId(relation.target??relation.to??relation.targetId);if(source!==this.selectedId&&target!==this.selectedId)continue;const other=this.entries.find(e=>e.paper.id===(source===this.selectedId?target:source)&&e.visible);if(!other)continue;const mid=selected.point.clone().add(other.point).multiplyScalar(.5);mid.y+=.4;mid.z+=.6;const curve=new THREE.QuadraticBezierCurve3(selected.point,mid,other.point);const geometry=new THREE.BufferGeometry().setFromPoints(curve.getPoints(36));const material=new THREE.LineDashedMaterial({color:this.theme==='dark'?0x96c7c1:0x537d78,dashSize:.11,gapSize:.07,transparent:true,opacity:.68,depthWrite:false});const line=new THREE.Line(geometry,material);line.computeLineDistances();this.relationsGroup.add(line);}
 }
 rotate(delta){this.tween=null;const direction=this.camera.position.clone().sub(this.controls.target);direction.applyAxisAngle(v3(0,1,0),delta);this.camera.position.copy(this.controls.target).add(direction);this.controls.update();}
 cameraRotate(delta){this.rotate(delta);}
 setLayout(mode){if(!['organic','helix'].includes(mode)||mode===this.layoutMode)return;this.layoutMode=mode;this.setData(this.papers);}
 moveCamera(position,target){if(this.reducedMotion){this.camera.position.copy(position);this.controls.target.copy(target);this.controls.update();return;}this.tween={start:performance.now(),fromPosition:this.camera.position.clone(),toPosition:position,fromTarget:this.controls.target.clone(),toTarget:target};}
 focusDomain(id){const b=this.branches.get(id);if(!b?.entries.length)return;const matches=b.entries.filter(e=>e.visible),entries=matches.length?matches:b.entries;const center=entries.reduce((v,e)=>v.add(e.point),new THREE.Vector3()).divideScalar(entries.length);center.y-=.3;const angle=b.angle+.25;const direction=v3(Math.cos(angle)*.9,.3,Math.sin(angle)*.9).normalize();const extent=new THREE.Box3().setFromPoints(entries.map(e=>e.point)).getSize(new THREE.Vector3()).length();const distance=clamp(extent*1.5,11,21)*(this.camera.aspect<.85?1.3:1);this.moveCamera(center.clone().addScaledVector(direction,distance),center);}
 reset(){const d=this.camera.aspect<1?1.25:1;this.moveCamera(v3(10*d,6.8*d,21.5*d),v3(0,.65,0));}
 zoom(delta){this.tween=null;const direction=this.camera.position.clone().sub(this.controls.target);direction.setLength(clamp(direction.length()*Math.pow(.84,delta),this.controls.minDistance,this.controls.maxDistance));this.camera.position.copy(this.controls.target).add(direction);this.controls.update();}
 setAutoRotate(value){this.autoRotate=!!value;this.controls.autoRotate=!!value&&!this.reducedMotion;}
 resize(){if(this.disposed)return;const width=Math.max(1,this.container.clientWidth),height=Math.max(1,this.container.clientHeight),old=this.camera.aspect;this.camera.aspect=width/height;this.camera.updateProjectionMatrix();this.renderer.setSize(width,height,false);if(this.glows)this.glows.material.uniforms.pointScale.value=height/(2*Math.tan(this.camera.fov*Math.PI/360))*this.renderer.getPixelRatio();if(!this.hasSized||(old>=1&&this.camera.aspect<1)){this.hasSized=true;this.reset();}}
 updateLabels(){
  if(!this.labelsVisible){this.entries.forEach(e=>{e.label.style.opacity='0';e.label.style.pointerEvents='none';});this.branches.forEach(b=>{b.label.style.opacity='0';b.label.style.pointerEvents='none';});this.yearLabels.forEach(e=>{e.label.style.display='none';});return;}
  const w=this.container.clientWidth,h=this.container.clientHeight,boxes=[];const project=point=>{const p=point.clone().project(this.camera);return{x:(p.x*.5+.5)*w,y:(-.5*p.y+.5)*h,z:p.z};};
  const collision=b=>boxes.some(a=>!(b.x>a.x+a.w+9||b.x+b.w+9<a.x||b.y>a.y+a.h+7||b.y+b.h+7<a.y));
  this.branches.forEach(b=>{const p=project(b.labelPoint),bw=Math.min(175,b.label.textContent.length*5+15),box={x:p.x-bw/2,y:p.y-13,w:bw,h:20},show=(!this.activeDomain||this.activeDomain===b.domain.id)&&b.entries.some(e=>e.visible)&&p.z>-1&&p.z<1&&box.x>12&&box.x+bw<w-12&&box.y>18&&box.y<h-35&&!collision(box);b.label.style.opacity=show?'.78':'0';b.label.style.pointerEvents=show?'auto':'none';if(show){b.label.style.transform=`translate(${box.x}px,${box.y}px)`;boxes.push(box);}});
  const ordered=[...this.entries].sort((a,b)=>{const score=e=>(e.paper.id===this.selectedId?1000:e.paper.id===this.hoverId?999:0)+e.paper.prominence*10+(/AlphaFold|GNoME|A-Lab|AlphaGeometry|GraphCast|RFdiffusion|ChemCrow|NeRF|SchNet/i.test(e.paper.short)?8:0)+hash(e.paper.id);return score(b)-score(a);});let count=0,limit=this.activeDomain?16:w<600?7:13;
  ordered.forEach(e=>{const p=project(e.point),selected=e.paper.id===this.selectedId||e.paper.id===this.hoverId,valid=e.visible&&(!this.activeDomain||e.paper.domain===this.activeDomain||(e.paper.secondaryDomains||[]).includes(this.activeDomain))&&p.z>-1&&p.z<1&&p.y>35&&p.y<h-40&&(count<limit||selected);const bw=Math.min(184,(e.paper.short||e.paper.title).length*5.9+12),left=p.x>w*.72,box={x:p.x+(left?-bw-9:9),y:p.y-9,w:bw,h:29},show=valid&&(selected||!collision(box))&&box.x>6&&box.x+bw<w-6;e.label.style.opacity=show?(selected?'1':'.83'):'0';e.label.style.pointerEvents=show?'auto':'none';if(show){e.label.style.transform=`translate(${box.x}px,${box.y}px)`;boxes.push(box);count++;}});
  this.yearLabels.forEach(({point,label})=>{const p=project(point);const show=!this.activeDomain&&p.z>-1&&p.z<1&&p.x>5&&p.x<w-40&&p.y>30&&p.y<h-20;label.style.display=show?'block':'none';if(show)label.style.transform=`translate(${p.x}px,${p.y}px)`;});
 }
 animate(time){if(this.disposed)return;this.frame=requestAnimationFrame(this.animate);if(time-this.lastFrame<30||document.hidden||!this.container.isConnected||!this.container.clientWidth||!this.container.clientHeight)return;this.lastFrame=time;
  if(this.tween){const t=clamp((time-this.tween.start)/1000,0,1),e=ease(t);this.camera.position.lerpVectors(this.tween.fromPosition,this.tween.toPosition,e);this.controls.target.lerpVectors(this.tween.fromTarget,this.tween.toTarget,e);if(t===1)this.tween=null;}this.controls.update();
  if(this.motes){const positions=this.motes.geometry.attributes.position;this.moteCurves.forEach((m,i)=>{for(let j=0;j<3;j++){const t=this.reducedMotion?.28+j*.22:(time*.000032+j/3+i*.11)%1,p=m.curve.getPointAt(t);positions.setXYZ(i*3+j,p.x,p.y,p.z);}});positions.needsUpdate=true;this.motes.visible=!this.reducedMotion;}
  for(const ring of [this.selectionRing,this.selectionRing2])if(ring?.visible){ring.quaternion.copy(this.camera.quaternion);ring.scale.setScalar(this.reducedMotion?1:1+Math.sin(time*.002)*.05);}
  this.updateLabels();this.renderer.render(this.scene,this.camera);
 }
 dispose(){this.disposed=true;cancelAnimationFrame(this.frame);this.resizeObserver?.disconnect();this.listeners.forEach(([target,event,fn])=>target.removeEventListener(event,fn));this.controls.dispose();this.clearTree();this.groundGroup.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});this.glowTexture.dispose();this.shadowTexture.dispose();this.sphereGeometry.dispose();this.environmentTarget?.dispose();this.renderer.dispose();this.canvas.remove();this.overlay.remove();}
}
