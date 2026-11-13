import { buildTreeLayout, sampleSpline, hash } from './tree-layout.js';
const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
const point=(x,y,z)=>({x,y,z});
const rgb=color=>{const h=color.replace('#','');return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];};
const rgba=(c,a)=>`rgba(${c.join(',')},${a})`;
const tint=(c,v)=>c.map(x=>Math.round(x+(255-x)*v));
const shade=(c,v)=>c.map(x=>Math.round(x*v));
/** CPU-projected 3D renderer for environments without a WebGL context. */
export class CanvasKnowledgeTree {
  constructor(container,options={}){
    this.container=container;this.options=options;this.domains=options.domains||[];
    this.theme='light';this.language='en';this.papers=[];this.entries=[];this.branches=[];
    this.yaw=.38;this.pitch=.15;this.scale=1;this.pan={x:0,y:0};this.selectedId=null;this.hoverId=null;this.activeDomain=null;
    this.autoRotate=false;this.disposed=false;this.reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.canvas=document.createElement('canvas');
    this.canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:grab';
    this.canvas.setAttribute('role','img');
    this.canvas.setAttribute('aria-label','Interactive three dimensional knowledge tree. Drag to rotate, shift-drag to pan, scroll to zoom.');
    this.container.appendChild(this.canvas);this.ctx=this.canvas.getContext('2d');
    this.showLabels=true;this.relationshipData=[];this.showRelations=false;this.mode='organic';this.entryMap=new Map();this.baseLayer=document.createElement('canvas');this.activeInView=true;this.listeners=[];this.screenNodes=[];this.labelHits=[];this.pointers=new Map();this.gestureUsed=false;
    this.listen('pointerdown',e=>{
      if(this.pointers.size===0)this.gestureUsed=false;
      this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      this.canvas.setPointerCapture(e.pointerId);this.canvas.style.cursor='grabbing';this.hover(null);
      if(this.pointers.size>=2){this.beginGesture();this.drag=null;}
      else this.drag={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,pan:e.button===2||e.shiftKey};
    });
    this.listen('pointermove',e=>{
      if(this.pointers.has(e.pointerId))this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(this.pointers.size>=2){
        if(!this.gesture)this.beginGesture();
        const current=this.pointerPair(),g=this.gesture,rect=this.canvas.getBoundingClientRect();
        this.scale=clamp(g.scale*current.distance/g.distance,.5,3.4);
        const ratio=this.scale/g.scale,cx=rect.left+this.width*.5,cy=rect.top+this.height*.56;
        // Preserve the world position beneath the initial pinch center while
        // its changing midpoint provides two-finger panning.
        this.pan.x=(g.pan.x+cx-g.center.x)*ratio+current.center.x-cx;
        this.pan.y=(g.pan.y+cy-g.center.y)*ratio+current.center.y-cy;
        this.tween=null;this.dirty=true;return;
      }
      if(this.drag){const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;
        if(this.drag.pan){this.pan.x+=dx;this.pan.y+=dy;}else{this.yaw+=dx*.007;this.pitch=clamp(this.pitch+dy*.004,-.55,.7);}
        this.drag.x=e.clientX;this.drag.y=e.clientY;this.tween=null;this.dirty=true;
      }else{const hit=this.hit(e);this.hover(hit,{x:e.clientX,y:e.clientY});}
    });
    this.listen('pointerup',e=>{
      const drag=this.drag;this.pointers.delete(e.pointerId);this.drag=null;this.gesture=null;this.canvas.style.cursor='grab';
      if(!this.gestureUsed&&drag&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<7){const hit=this.hit(e);if(hit?.paper)this.options.onSelect?.(hit.paper);else if(hit?.domain){this.focusDomain(hit.domain.id);this.options.onDomainSelect?.(hit.domain.id);}}
      if(this.pointers.size>=2)this.beginGesture();
      else if(this.pointers.size===1){const p=this.pointers.values().next().value;this.drag={x:p.x,y:p.y,startX:p.x,startY:p.y,pan:false};}
    });
    this.listen('pointercancel',e=>{this.pointers.delete(e.pointerId);this.drag=null;this.gesture=null;this.gestureUsed=true;this.canvas.style.cursor='grab';});
    this.listen('pointerleave',()=>{if(!this.drag)this.hover(null);});
    this.listen('wheel',e=>{e.preventDefault();this.zoom(-e.deltaY*.004);},{passive:false});
    this.listen('contextmenu',e=>e.preventDefault());
    this.intersectionObserver=typeof IntersectionObserver!=='undefined'?new IntersectionObserver(entries=>{this.activeInView=entries[0]?.isIntersecting??true;}):null;this.intersectionObserver?.observe(container);
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);this.resize();
    this.animate=this.animate.bind(this);this.frame=requestAnimationFrame(this.animate);
    options.onReady?.({webgl:false,fallback:'canvas3d'});
  }
  listen(type,fn,opts){this.canvas.addEventListener(type,fn,opts);this.listeners.push([type,fn,opts]);}
  pointerPair(){const [a,b]=[...this.pointers.values()];return{center:{x:(a.x+b.x)/2,y:(a.y+b.y)/2},distance:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y))};}
  beginGesture(){const pair=this.pointerPair();this.gesture={...pair,scale:this.scale,pan:{...this.pan}};this.gestureUsed=true;this.tween=null;}
  baseScale(){return Math.min(this.width/(this.width<520?16.4:15.5),this.height/(this.width<520?14.8:15.2));}
  resize(){
    const previousBase=this.width?this.baseScale():null;
    this.width=Math.max(1,this.container.clientWidth);this.height=Math.max(1,this.container.clientHeight);
    if(previousBase){const ratio=this.baseScale()/previousBase;this.pan.x*=ratio;this.pan.y*=ratio;}
    this.dpr=Math.min(devicePixelRatio||1,1.5);this.canvas.width=Math.round(this.width*this.dpr);this.canvas.height=Math.round(this.height*this.dpr);
    this.ctx.setTransform(this.dpr,0,0,this.dpr,0,0);this.baseLayer.width=this.canvas.width;this.baseLayer.height=this.canvas.height;this.dirty=true;
  }
  setData(papers){
    this.papers=papers||[];this.entries=[];this.branches=[];this.entryMap.clear();
    if(!this.papers.length){this.dirty=true;return;}
    const layout=buildTreeLayout(this.papers,this.domains,this.mode);this.layout=layout;
    this.minYear=layout.minYear;this.maxYear=layout.maxYear;this.prominenceMax=Math.max(3,...this.papers.map(p=>Number(p.prominence)||1));
    layout.branches.forEach(source=>{
      const b={...source,color:rgb(source.domain.color),lines:[],entries:[]};
      const add=(points,width,kind,entry=null)=>b.lines.push({points:sampleSpline(points,kind==='twig'?7:10),width,kind,entry});
      add(source.pathPoints,source.width||.12,'main');
      (source.fibers||[]).forEach((pts,i)=>add(pts,.018,'fiber'));
      (source.roots||[]).slice(0,2).forEach(pts=>add(pts,.055,'root'));
      (source.limbPaths||[]).forEach(l=>add(l.points,l.width||.04,'limb'));
      source.entries.forEach(raw=>{
        const entry={...raw,branch:b,color:b.color,visible:true};
        add(raw.twigPoints,.012,'twig',entry);b.entries.push(entry);this.entries.push(entry);this.entryMap.set(entry.paper.id,entry);
      });
      this.branches.push(b);
    });
    this.filter(this.visibleIds?[...this.visibleIds]:this.papers.map(p=>p.id),this.activeDomain);
    this.dirty=true;
  }
  setLayout(mode){if(!['organic','helix'].includes(mode)||mode===this.mode)return;this.mode=mode;this.setData(this.papers);this.transition({yaw:this.yaw+.2,pitch:this.pitch,scale:1,panX:0,panY:0});}
  project(p){
    const cy=Math.cos(this.yaw),sy=Math.sin(this.yaw),cp=Math.cos(this.pitch),sp=Math.sin(this.pitch);
    const x=p.x*cy+p.z*sy,z=-p.x*sy+p.z*cy,y=p.y*cp-z*sp,depth=p.y*sp+z*cp;
    const distance=27,factor=this.baseScale()*this.scale*distance/(distance-depth);
    return{x:this.width*.5+x*factor+this.pan.x,y:this.height*.56-y*factor+this.pan.y,z:depth,s:factor};
  }
  filter(ids,domainId=null){this.visibleIds=new Set(ids||this.papers.map(p=>p.id));this.activeDomain=domainId;this.entries.forEach(e=>e.visible=this.visibleIds.has(e.paper.id));if(this.hoverId&&!this.visibleIds.has(this.hoverId))this.hover(null);this.dirty=true;}
  select(id){
    this.selectedId=id||null;this.dirty=true;
    const e=this.entryMap.get(id);if(!e)return;
    const q=this.project(e.point),s=Math.max(1.1,this.scale),ratio=s/this.scale;
    this.transition({yaw:this.yaw,pitch:this.pitch,scale:s,panX:this.width*(.49-.5)-(q.x-this.width*.5-this.pan.x)*ratio,panY:this.height*(.47-.56)-(q.y-this.height*.56-this.pan.y)*ratio});
  }
  setLabels(value){this.showLabels=!!value;this.dirty=true;}
  setRelations(relationships,visible=true){this.relationshipData=Array.isArray(relationships)?relationships:[];this.showRelations=!!visible;this.dirty=true;}
  rotate(delta){this.tween=null;this.yaw+=Number(delta)||0;this.dirty=true;}
  setTheme(theme){this.theme=theme;this.dirty=true;}
  setLanguage(language){this.language=language;this.dirty=true;}
  setAutoRotate(value){this.autoRotate=!!value&&!this.reducedMotion;this.dirty=true;}
  zoom(delta){this.tween=null;this.scale=clamp(this.scale*Math.pow(1.13,delta),.5,3.4);this.dirty=true;}
  reset(){this.transition({yaw:.38,pitch:.15,scale:1,panX:0,panY:0});}
  focusDomain(id){
    const b=this.branches.find(b=>b.domain.id===id);if(!b)return;
    const entries=b.entries.filter(e=>e.visible),pts=entries.length?entries:b.entries;if(!pts.length)return;
    const p=pts.reduce((a,e)=>point(a.x+e.point.x/pts.length,a.y+e.point.y/pts.length,a.z+e.point.z/pts.length),point(0,0,0));
    const yaw=-b.angle+Math.PI*.18,pitch=.12,scale=1.35,cy=Math.cos(yaw),sy=Math.sin(yaw),base=this.baseScale()*scale;
    const x=p.x*cy+p.z*sy,z=-p.x*sy+p.z*cy,y=p.y*Math.cos(pitch)-z*Math.sin(pitch),f=27/(27-(p.y*Math.sin(pitch)+z*Math.cos(pitch)));
    this.transition({yaw,pitch,scale,panX:-x*base*f*.88,panY:y*base*f*.73});
  }
  transition(to){
    const from={yaw:this.yaw,pitch:this.pitch,scale:this.scale,panX:this.pan.x,panY:this.pan.y};
    while(to.yaw-from.yaw>Math.PI)to.yaw-=TAU;while(to.yaw-from.yaw<-Math.PI)to.yaw+=TAU;
    if(this.reducedMotion){this.yaw=to.yaw;this.pitch=to.pitch;this.scale=to.scale;this.pan={x:to.panX,y:to.panY};this.dirty=true;}else this.tween={from,to,start:performance.now()};
  }
  hover(hit,position){const id=hit?.paper?.id||null;if(id===this.hoverId)return;this.hoverId=id;this.canvas.style.cursor=hit?'pointer':'grab';this.options.onHover?.(hit?.paper||null,position||null);this.dirty=true;}
  hit(event){
    const rect=this.canvas.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;
    const label=this.labelHits.find(b=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h);if(label)return label.entry||{domain:label.domain};
    return [...this.screenNodes].reverse().find(n=>n.entry.visible&&Math.hypot(x-n.x,y-n.y)<Math.max(9,n.r+4))?.entry||null;
  }
  drawPath(points,color,alpha,width){const ctx=this.ctx;ctx.beginPath();points.forEach((p,i)=>{const q=this.project(p);if(i===0)ctx.moveTo(q.x,q.y);else ctx.lineTo(q.x,q.y);});ctx.strokeStyle=rgba(color,alpha);ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke();}
  drawGround(dark){
    const ctx=this.ctx,ink=dark?[124,169,167]:[110,133,128],base=this.project(point(0,-5.12,0));
    ctx.save();ctx.translate(base.x,base.y+2);ctx.scale(1,.23);const shadow=ctx.createRadialGradient(0,0,3,0,0,this.baseScale()*3.7*this.scale);
    shadow.addColorStop(0,dark?'rgba(0,0,0,.35)':'rgba(49,76,73,.15)');shadow.addColorStop(.45,dark?'rgba(0,0,0,.14)':'rgba(56,85,81,.05)');shadow.addColorStop(1,'rgba(40,70,65,0)');ctx.fillStyle=shadow;ctx.beginPath();ctx.arc(0,0,this.baseScale()*3.7*this.scale,0,TAU);ctx.fill();ctx.restore();
    for(const r of [1.0,1.18,3.6,6.9]){const circle=Array.from({length:97},(_,i)=>point(Math.cos(i/96*TAU)*r,-5.15,Math.sin(i/96*TAU)*r));this.drawPath(circle,ink,r<1.3?.3:.15,r<1.3?1:.6);}
    for(let i=0;i<64;i++){const a=i/64*TAU,r=i%8===0?6.64:6.78;this.drawPath([point(Math.cos(a)*r,-5.15,Math.sin(a)*r),point(Math.cos(a)*6.9,-5.15,Math.sin(a)*6.9)],ink,i%8===0?.35:.2,.7);}
    for(let i=0;i<8;i++){const a=i/8*TAU;this.drawPath([point(Math.cos(a)*1.23,-5.15,Math.sin(a)*1.23),point(Math.cos(a)*6.65,-5.15,Math.sin(a)*6.65)],ink,.07,.5);}
    const pedestal=this.project(point(0,-5.08,0));ctx.fillStyle=dark?'#6a8585':'#aebdb8';ctx.beginPath();ctx.ellipse(pedestal.x,pedestal.y,16*this.scale,3.5*this.scale,0,0,TAU);ctx.fill();ctx.strokeStyle=dark?'#a2bebe':'#e8efeb';ctx.lineWidth=1;ctx.stroke();
  }
  drawTube(item,dark){
    const {b,l,projected,depth}=item,ctx=this.ctx;
    const hover=this.entryMap.get(this.hoverId),selected=this.entryMap.get(this.selectedId),focus=hover?.paper.domain||this.activeDomain;
    const matches=!focus||b.domain.id===focus||(l.entry?.paper.secondaryDomains||[]).includes(focus);
    const valid=l.entry?l.entry.visible:b.entries.some(e=>e.visible),highlight=l.entry&&(l.entry.paper.id===this.selectedId||l.entry.paper.id===this.hoverId);
    const branchSelected=(hover||selected)?.branch===b;
    const alpha=(valid?1:.055)*(matches?1:.14)*(l.kind==='twig'?(highlight?1:.5):1);
    if(alpha<.02)return;
    const tone=dark?tint(b.color,.09):shade(b.color,.56),pearl=dark?tint(b.color,.16):tint(b.color,.19);
    const heft=l.kind==='main'?2.75:l.kind==='limb'?3.1:l.kind==='root'?2.1:1;
    const baseWidth=l.width*this.baseScale()*this.scale*heft;
    if(l.kind==='twig'||l.kind==='fiber'){
      ctx.beginPath();projected.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.lineWidth=Math.max(.45,baseWidth)*(highlight?2:1);ctx.strokeStyle=rgba(l.kind==='fiber'?tone:(dark?tint(b.color,.1):shade(b.color,.7)),alpha*(l.kind==='fiber'?.58:dark?.75:.68));ctx.stroke();return;
    }
    // Each branch is a tapered solid tube, with an off-axis specular seam.
    // Depth sorting of the segment batches lets near limbs occlude far limbs.
    for(let i=1;i<projected.length;i++){
      const a=projected[i-1],q=projected[i],v=i/(projected.length-1);
      const taper=l.kind==='main'?.075+1.3*Math.pow(1-v,.9):l.kind==='root'?.1+.78*v:.045+1.05*(1-v);
      const width=Math.max(.55,baseWidth*taper*(1+depth*.012));
      const dx=q.x-a.x,dy=q.y-a.y,mag=Math.hypot(dx,dy)||1,nx=-dy/mag,ny=dx/mag;
      const grad=ctx.createLinearGradient(a.x-nx*width*.5,a.y-ny*width*.5,a.x+nx*width*.5,a.y+ny*width*.5);
      grad.addColorStop(0,rgba(shade(tone,.7),alpha*.96));grad.addColorStop(.24,rgba(tone,alpha));grad.addColorStop(.4,rgba(pearl,alpha));grad.addColorStop(.49,rgba(dark?tint(b.color,.65):tint(b.color,.78),alpha));grad.addColorStop(.56,rgba(pearl,alpha));grad.addColorStop(.82,rgba(tone,alpha));grad.addColorStop(1,rgba(shade(tone,.7),alpha*.96));
      ctx.strokeStyle=grad;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(q.x,q.y);ctx.stroke();
      if(branchSelected&&l.kind==='main'){ctx.strokeStyle=rgba(dark?tint(b.color,.45):tone,alpha*.6);ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(a.x-nx*width*.35,a.y-ny*width*.35);ctx.lineTo(q.x-nx*width*.35,q.y-ny*width*.35);ctx.stroke();}
    }
  }
  drawNode(n,dark){
    const ctx=this.ctx,e=n.entry,selected=e.paper.id===this.selectedId||e.paper.id===this.hoverId;
    const hover=this.entryMap.get(this.hoverId),focus=hover?.paper.domain||this.activeDomain;
    const matches=!focus||e.paper.domain===focus||(e.paper.secondaryDomains||[]).includes(focus),alpha=(e.visible?1:.06)*(matches?1:.25);
    const r=Math.max(2.0,e.radius*n.s*(selected?1.28:1));n.r=r;
    if(n.x<-20||n.x>this.width+20||n.y<-20||n.y>this.height+20)return;
    const c=dark?tint(e.color,.16):shade(e.color,.72);ctx.globalAlpha=alpha;
    if(dark||selected){const halo=ctx.createRadialGradient(n.x,n.y,r,n.x,n.y,r*(selected?4.8:3.4));halo.addColorStop(0,rgba(c,selected?.18:.12));halo.addColorStop(1,rgba(c,0));ctx.fillStyle=halo;ctx.beginPath();ctx.arc(n.x,n.y,r*(selected?4.8:3.4),0,TAU);ctx.fill();}
    ctx.save();ctx.shadowColor=dark?rgba(c,.35):'rgba(31,58,52,.18)';ctx.shadowBlur=dark?4:3;ctx.shadowOffsetY=dark?0:1;
    const shell=ctx.createRadialGradient(n.x-r*.3,n.y-r*.38,r*.03,n.x,n.y,r);
    shell.addColorStop(0,dark?'#eefbf9':'#ffffff');shell.addColorStop(.19,rgba(tint(c,.63),1));shell.addColorStop(.48,rgba(c,1));shell.addColorStop(.84,rgba(shade(c,.73),1));shell.addColorStop(1,rgba(shade(c,.46),1));
    ctx.fillStyle=shell;ctx.beginPath();ctx.arc(n.x,n.y,r,0,TAU);ctx.fill();ctx.restore();
    // Etched rings distinguish anchor works without obscuring the data sphere.
    if(e.paper.prominence>=this.prominenceMax*.78||selected){ctx.strokeStyle=rgba(c,selected?.78:.28);ctx.lineWidth=selected?1.2:.65;ctx.beginPath();ctx.ellipse(n.x,n.y,r+3,r+3,0,selected?.15:0,selected?TAU-1.0:TAU);ctx.stroke();}
    if(selected){ctx.strokeStyle=rgba(c,.28);ctx.setLineDash([2,4]);ctx.beginPath();ctx.arc(n.x,n.y,r+8,0,TAU);ctx.stroke();ctx.setLineDash([]);}
    if(e.paper.prominence>=this.prominenceMax*.78&&r>3.3){ctx.fillStyle=rgba(dark?tint(c,.6):tint(c,.82),.9);ctx.beginPath();ctx.moveTo(n.x-r*.25,n.y-r*.6);ctx.lineTo(n.x+r*.13,n.y-r*.42);ctx.lineTo(n.x-r*.2,n.y-r*.1);ctx.closePath();ctx.fill();}
    ctx.globalAlpha=1;
  }
  drawScene(){
    const ctx=this.ctx,dark=this.theme==='dark';ctx.clearRect(0,0,this.width,this.height);this.screenNodes=[];this.labelHits=[];this.motePaths=[];
    if(!this.entries.length)return;
    this.drawGround(dark);
    const lines=this.branches.flatMap(b=>b.lines.map(l=>{const projected=l.points.map(p=>this.project(p));return{b,l,projected,depth:projected.reduce((a,p)=>a+p.z,0)/projected.length};})).sort((a,b)=>a.depth-b.depth);
    ctx.lineCap='round';ctx.lineJoin='round';
    // Integrate nodes and tubes into one ordered scene instead of placing every
    // sphere above every branch: the silhouette now has real occlusion depth.
    const objects=lines.map(l=>({...l,kind:'line'}));
    const nodes=this.entries.map(entry=>({entry,...this.project(entry.point),kind:'node'}));
    objects.push(...nodes);objects.sort((a,b)=>(a.depth??a.z)-(b.depth??b.z));
    objects.forEach(o=>{if(o.kind==='line'){this.drawTube(o,dark);if(o.l.kind==='main'&&o.b.entries.some(e=>e.visible))this.motePaths.push({path:o.projected,color:o.b.color,seed:o.b.index||0,domain:o.b.domain.id});}else this.drawNode(o,dark);});
    this.screenNodes=nodes.sort((a,b)=>a.z-b.z);this.drawRelations(dark);if(this.showLabels)this.drawLabels(nodes,dark);this.drawTimeGuide(dark);
    const cache=this.baseLayer.getContext('2d');cache.clearRect(0,0,this.baseLayer.width,this.baseLayer.height);cache.drawImage(this.canvas,0,0);
  }
  drawRelations(dark){
    if(!this.showRelations||!this.selectedId)return;
    const ctx=this.ctx;ctx.save();ctx.setLineDash([3,5]);
    this.relationshipData.filter(r=>r.source===this.selectedId||r.target===this.selectedId).forEach(r=>{
      const a=this.entryMap.get(r.source),b=this.entryMap.get(r.target);if(!a?.visible||!b?.visible)return;
      const middle=point((a.point.x+b.point.x)*.5,(a.point.y+b.point.y)*.5+.8,(a.point.z+b.point.z)*.5);
      this.drawPath(sampleSpline([a.point,middle,b.point],16),dark?[172,197,190]:[68,100,92],.48,.9);
    });ctx.restore();
  }
  drawTimeGuide(dark){
    if(this.width<580||this.activeDomain||this.scale>1.4)return;
    const ctx=this.ctx,ink=dark?'rgba(133,164,158,.58)':'rgba(84,112,105,.55)',span=this.maxYear-this.minYear||1;
    const years=[this.minYear,Math.round(this.minYear+span*.5),this.maxYear];
    ctx.font='500 8px Atlas,Arial,sans-serif';ctx.fillStyle=ink;ctx.textAlign='right';
    years.forEach(y=>{const p=this.project(point(-7.1,-4+10.5*(y-this.minYear)/span,0));if(p.y<25||p.y>this.height-25)return;ctx.fillText(String(y),Math.max(28,p.x-8),p.y);ctx.strokeStyle=ink;ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(Math.max(32,p.x-3),p.y-3);ctx.lineTo(Math.max(39,p.x+4),p.y-3);ctx.stroke();});ctx.textAlign='left';
  }
  drawMotes(time){
    const ctx=this.ctx,dark=this.theme==='dark';if(this.reducedMotion)return;
    (this.motePaths||[]).forEach(({path,color,seed,domain})=>{
      if(this.activeDomain&&this.activeDomain!==domain)return;
      const t=((time*.000045+seed*.113)%1),i=Math.floor(t*(path.length-1)),a=path[i],b=path[Math.min(i+1,path.length-1)],f=t*(path.length-1)-i,x=mix(a.x,b.x,f),y=mix(a.y,b.y,f);
      ctx.fillStyle=rgba(dark?tint(color,.55):shade(color,.62),.68);ctx.beginPath();ctx.arc(x,y,dark?1.9:1.5,0,TAU);ctx.fill();
      if(dark){ctx.strokeStyle=rgba(color,.16);ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,4.5,0,TAU);ctx.stroke();}
    });
  }
  name(domain){return typeof domain.label==='object'?(domain.label[this.language]||domain.label.en||domain.id):(domain.label||domain.name||domain.id);}
  drawLabels(nodes,dark){
    const ctx=this.ctx,occupied=[];let count=0;
    const collides=b=>occupied.some(a=>!(b.x>a.x+a.w+8||b.x+b.w+8<a.x||b.y>a.y+a.h+7||b.y+b.h+7<a.y));
    const topSafe=this.width>580?68:34,bottomSafe=this.width>580?64:34;
    const inBounds=b=>b.x>9&&b.x+b.w<this.width-9&&b.y>topSafe&&b.y+b.h<this.height-bottomSafe;
    ctx.textBaseline='top';
    const limit=this.activeDomain?10:this.width<500?4:this.papers.length>200?8:9;
    const order=[...nodes].sort((a,b)=>{const rank=n=>(n.entry.paper.id===this.selectedId?500:n.entry.paper.id===this.hoverId?499:0)+(/AlphaFold 2|GNoME|A-Lab|AlphaGeometry|GraphCast|RFdiffusion|ChemCrow/i.test(n.entry.paper.short)?16:0)+(n.entry.paper.prominence||1)*10+hash(n.entry.paper.id);return rank(b)-rank(a);});
    order.forEach(n=>{
      const e=n.entry,p=e.paper,selected=p.id===this.selectedId||p.id===this.hoverId;
      if(!e.visible||(this.activeDomain&&p.domain!==this.activeDomain&&!(p.secondaryDomains||[]).includes(this.activeDomain))||(count>=limit&&!selected))return;
      const text=p.short||p.title;ctx.font=`${selected?600:500} ${this.width<500?10:11}px Atlas,Arial,sans-serif`;const w=Math.min(ctx.measureText(text).width+20,194),left=n.x>this.width*.68;
      const choices=[{x:n.x+(left?-w-14:14),y:n.y-13},{x:n.x+(left?14:-w-14),y:n.y-13},{x:n.x-w*.5,y:n.y-42},{x:n.x-w*.5,y:n.y+15}];
      let box=choices.map(q=>({...q,w,h:32,entry:e})).find(q=>inBounds(q)&&!collides(q));
      if(!box&&selected)box=choices.map(q=>({...q,w,h:32,entry:e})).find(inBounds);if(!box)return;
      const color=dark?tint(e.color,.15):shade(e.color,.61);
      ctx.strokeStyle=rgba(color,.4);ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(n.x,n.y);ctx.lineTo(box.x+(box.x<n.x?box.w:0),box.y+12);ctx.stroke();
      ctx.fillStyle=dark?'rgba(12,22,25,.8)':'rgba(248,250,246,.9)';ctx.beginPath();ctx.roundRect(box.x,box.y,w,32,3);ctx.fill();
      if(selected){ctx.strokeStyle=rgba(color,.28);ctx.lineWidth=.7;ctx.stroke();}
      ctx.fillStyle=dark?'#dae8e0':'#29443c';ctx.fillText(text,box.x+8,box.y+4,w-16);ctx.font='400 8px Atlas,Arial,sans-serif';ctx.fillStyle=rgba(color,.7);ctx.fillText(String(p.year),box.x+8,box.y+19);occupied.push(box);this.labelHits.push(box);count++;
    });
    this.branches.forEach(b=>{
      if(this.activeDomain&&b.domain.id!==this.activeDomain||!b.entries.some(e=>e.visible))return;
      const p=this.project(b.labelPoint),name=this.name(b.domain).replace('AI for ','').toUpperCase();ctx.font='600 8px Atlas,Arial,sans-serif';
      const w=ctx.measureText(name).width+22,box={x:p.x-w/2,y:p.y-12,w,h:18,domain:b.domain};
      if(!inBounds(box)||collides(box))return;
      ctx.fillStyle=rgba(dark?b.color:shade(b.color,.56),.8);ctx.fillText(name,box.x+11,box.y+4);ctx.fillStyle=rgba(dark?b.color:shade(b.color,.56),.7);ctx.beginPath();ctx.arc(box.x+4,box.y+8,1.7,0,TAU);ctx.fill();occupied.push(box);this.labelHits.push(box);
    });
  }
  animate(time){
    if(this.disposed)return;this.frame=requestAnimationFrame(this.animate);
    const needsMotion=this.autoRotate||this.tween||this.drag;
    if(document.hidden||!this.activeInView||this.container.clientWidth===0||time-(this.lastFrame||0)<(needsMotion?32:90))return;this.lastFrame=time;
    if(this.autoRotate&&!this.drag){this.yaw+=.0022;this.dirty=true;}
    if(this.tween){const t=clamp((time-this.tween.start)/950,0,1),e=1-Math.pow(1-t,3);for(const k of ['yaw','pitch','scale'])this[k]=mix(this.tween.from[k],this.tween.to[k],e);this.pan.x=mix(this.tween.from.panX,this.tween.to.panX,e);this.pan.y=mix(this.tween.from.panY,this.tween.to.panY,e);if(t===1)this.tween=null;this.dirty=true;}
    if(this.dirty){this.drawScene();this.dirty=false;}else if(!this.reducedMotion){this.ctx.clearRect(0,0,this.width,this.height);this.ctx.drawImage(this.baseLayer,0,0,this.width,this.height);}
    if(!this.reducedMotion)this.drawMotes(time);
  }
  dispose(){this.disposed=true;cancelAnimationFrame(this.frame);this.resizeObserver.disconnect();this.intersectionObserver?.disconnect();this.listeners.forEach(([type,fn,opts])=>this.canvas.removeEventListener(type,fn,opts));this.canvas.remove();}
}
