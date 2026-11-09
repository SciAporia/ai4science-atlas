import React,{useEffect,useRef} from 'react';
import type {KnowledgeNode,Domain,Language,Theme,Relation} from '../lib/atlas-types';
import {importance} from '../lib/atlas-types';
import {createTreeLayout,lightColor,bezierPoints,mixPoint} from '../lib/tree-layout';
import type {Vec} from '../lib/tree-layout';

type Props={nodes:KnowledgeNode[];domains:Domain[];activeDomain:string|null;selectedId:string|null;visibleIds:string[];onSelect:(id:string)=>void;onHover?:(id:string|null)=>void;onDomainSelect?:(id:string)=>void;resetKey:number;lang:Language;theme?:Theme;autoRotate?:boolean;showLabels?:boolean;showRelations?:boolean;relationships?:Relation[]};
type Projected={x:number;y:number;z:number;s:number};
type Box={x:number;y:number;w:number;h:number};
const rgba=(hex:string,a:number)=>{const h=hex.replace('#','');return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${Math.max(0,Math.min(1,a))})`};
const overlaps=(a:Box,b:Box,pad=6)=>a.x<b.x+b.w+pad&&a.x+a.w>b.x-pad&&a.y<b.y+b.h+pad&&a.y+a.h>b.y-pad;
/** The WebGL-independent renderer shares exactly the same 3D graph geometry. */
export default function SoftwareTree(props:Props){
 const canvas=useRef<HTMLCanvasElement>(null),latest=useRef(props),commands=useRef<((action:string)=>void)|null>(null);latest.current=props;
 useEffect(()=>{commands.current?.('reset')},[props.resetKey]);
 useEffect(()=>{
  const surface=canvas.current;if(!surface)return;const context=surface.getContext('2d');if(!context)return;const ctx=context;
  const layout=createTreeLayout(props.nodes,props.domains),reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width=1,height=1,scale=1,frame=0,lastFrame=0,inView=true;
  let yaw=-.34,pitch=.12,zoom=1,panX=0,panY=0,targetYaw=yaw,targetPitch=pitch,targetZoom=zoom,targetPanX=0,targetPanY=0;
  let dragging=false,dragMode='orbit',pointerX=0,pointerY=0,downX=0,downY=0,hoverId:string|null=null,focusKey='';
  let manualUntil=0,pinchDistance=0,pinchZoom=1;
  const pointers=new Map<number,{x:number;y:number}>();
  let hitPoints:Array<{x:number;y:number;r:number;id:string;z:number}>=[],branchHits:Array<Box&{id:string}>=[],paperHits:Array<Box&{id:string}>=[];
  const idMap=new Map(layout.nodes.map(n=>[n.node.id,n]));
  const project=(p:Vec):Projected=>{const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);const x=p.x*cy+p.z*sy,z=-p.x*sy+p.z*cy,y=p.y*cp-z*sp,depth=p.y*sp+z*cp;const perspective=29/(29+depth);return {x:width*.5+(x*scale*zoom+panX)*perspective,y:height*.53-(y*scale*zoom-panY)*perspective,z:depth,s:scale*zoom*perspective}};
  const resize=()=>{const box=surface.getBoundingClientRect();width=Math.max(1,box.width);height=Math.max(1,box.height);const ratio=Math.min(window.devicePixelRatio||1,1.75);surface.width=Math.round(width*ratio);surface.height=Math.round(height*ratio);scale=Math.max(1,Math.min((width-76)/16.4,(height-70)/11.8));ctx.setTransform(ratio,0,0,ratio,0,0)};
  const observer=new ResizeObserver(resize);observer.observe(surface);resize();
  const intersection=new IntersectionObserver(e=>{inView=e[0]?.isIntersecting??true});intersection.observe(surface);
  const reset=()=>{targetYaw=-.34;targetPitch=.12;targetZoom=1;targetPanX=0;targetPanY=0;focusKey=latest.current.selectedId||latest.current.activeDomain||'';manualUntil=performance.now()+900};
  const cameraAction=(action:string)=>{manualUntil=performance.now()+1800;if(action==='in')targetZoom=Math.min(3,targetZoom*1.18);else if(action==='out')targetZoom=Math.max(.55,targetZoom/1.18);else if(action==='left')targetYaw-=.3;else if(action==='right')targetYaw+=.3;else if(action==='reset'||action==='fit')reset()};commands.current=cameraAction;
  const cameraEvent=(event:Event)=>cameraAction((event as CustomEvent<{action:string}>).detail?.action);window.addEventListener('arbor-camera',cameraEvent);
  const hit=(x:number,y:number)=>paperHits.find(b=>x>=b.x-3&&x<=b.x+b.w+3&&y>=b.y-3&&y<=b.y+b.h+3)?.id||hitPoints.filter(p=>Math.hypot(p.x-x,p.y-y)<Math.max(9,p.r+4)).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y)||a.z-b.z)[0]?.id||null;
  const domainHit=(x:number,y:number)=>branchHits.find(b=>x>=b.x-5&&x<=b.x+b.w+5&&y>=b.y-4&&y<=b.y+b.h+4)?.id||null;
  const local=(e:PointerEvent)=>{const r=surface.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top}};
  const down=(e:PointerEvent)=>{const p=local(e);pointers.set(e.pointerId,p);dragging=true;dragMode=e.button===2||e.shiftKey?'pan':'orbit';pointerX=downX=p.x;pointerY=downY=p.y;manualUntil=performance.now()+3000;surface.setPointerCapture(e.pointerId);surface.style.cursor='grabbing';if(pointers.size===2){const [a,b]=[...pointers.values()];pinchDistance=Math.hypot(a.x-b.x,a.y-b.y);pinchZoom=targetZoom}};
  const move=(e:PointerEvent)=>{const p=local(e);if(pointers.has(e.pointerId))pointers.set(e.pointerId,p);if(dragging){manualUntil=performance.now()+3000;if(pointers.size>=2){const [a,b]=[...pointers.values()];if(pinchDistance>0)targetZoom=Math.max(.55,Math.min(3,pinchZoom*Math.hypot(a.x-b.x,a.y-b.y)/pinchDistance));return;}const dx=p.x-pointerX,dy=p.y-pointerY;if(dragMode==='pan'){targetPanX+=dx;targetPanY+=dy}else{targetYaw+=dx*.006;targetPitch=Math.max(-.65,Math.min(.65,targetPitch+dy*.004))}pointerX=p.x;pointerY=p.y;return;}const id=hit(p.x,p.y),branch=domainHit(p.x,p.y);if(id!==hoverId){hoverId=id;latest.current.onHover?.(id)}surface.style.cursor=id||branch?'pointer':'grab'};
  const up=(e:PointerEvent)=>{const p=local(e),wasPinch=pinchDistance>0;pointers.delete(e.pointerId);dragging=pointers.size>0;surface.style.cursor='grab';if(surface.hasPointerCapture(e.pointerId))surface.releasePointerCapture(e.pointerId);if(pointers.size===0)pinchDistance=0;if(!wasPinch&&Math.hypot(p.x-downX,p.y-downY)<5&&e.button!==2&&e.type!=='pointercancel'){const branch=domainHit(p.x,p.y),id=hit(p.x,p.y);if(branch)latest.current.onDomainSelect?.(branch);else if(id)latest.current.onSelect(id)}};
  const leave=()=>{if(!dragging){hoverId=null;latest.current.onHover?.(null)}};
  const wheel=(e:WheelEvent)=>{e.preventDefault();manualUntil=performance.now()+3000;targetZoom=Math.max(.55,Math.min(3,targetZoom*Math.exp(-e.deltaY*.0013)))};
  const prevent=(e:Event)=>e.preventDefault();
  const key=(e:KeyboardEvent)=>{const actions:Record<string,string>={'+':'in','=':'in','-':'out',ArrowLeft:'left',ArrowRight:'right',Home:'reset'};if(actions[e.key]){e.preventDefault();cameraAction(actions[e.key])}if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();targetPitch=Math.max(-.65,Math.min(.65,targetPitch+(e.key==='ArrowUp'?-.08:.08)))}};
  surface.addEventListener('pointerdown',down);surface.addEventListener('pointermove',move);surface.addEventListener('pointerup',up);surface.addEventListener('pointerleave',leave);surface.addEventListener('pointercancel',up);surface.addEventListener('wheel',wheel,{passive:false});surface.addEventListener('contextmenu',prevent);surface.addEventListener('keydown',key);
  const trace=(points:Projected[])=>{ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y))};
  const draw=(time:number)=>{frame=requestAnimationFrame(draw);if(!inView||document.hidden||time-lastFrame<32)return;const delta=Math.min(.08,(time-lastFrame)/1000);lastFrame=time;
   const p=latest.current,light=p.theme==='light',visible=new Set(p.visibleIds),bg=light?'#f3f2ec':'#080e14';
   const ink=light?'#50665b':'#8aafa0',text=light?'#314840':'#c4d5cc';
   const nextFocus=p.selectedId||p.activeDomain||'';
   if(nextFocus!==focusKey){focusKey=nextFocus;const point=p.selectedId?idMap.get(p.selectedId)?.point:p.activeDomain?layout.branches.find(d=>d.domain.id===p.activeDomain)?.center:undefined;
    if(point){const di=p.selectedId?idMap.get(p.selectedId)?.branchIndex:props.domains.findIndex(d=>d.id===p.activeDomain);targetYaw=-(di??0)/props.domains.length*Math.PI*2-.18+.75;targetPitch=.1;targetZoom=p.selectedId?1.13:1.08;const a=targetYaw;targetPanX=-(point.x*Math.cos(a)+point.z*Math.sin(a))*scale*targetZoom*.72;targetPanY=point.y*scale*targetZoom*.58;manualUntil=time+1000}else{targetYaw=-.34;targetPitch=.12;targetZoom=1;targetPanX=0;targetPanY=0}}
   if(p.autoRotate&&!reduced&&!dragging&&time>manualUntil&&!p.selectedId&&!p.activeDomain)targetYaw+=delta*.045;
   const lerp=reduced?1:1-Math.exp(-delta*7);yaw+=(targetYaw-yaw)*lerp;pitch+=(targetPitch-pitch)*lerp;zoom+=(targetZoom-zoom)*lerp;panX+=(targetPanX-panX)*lerp;panY+=(targetPanY-panY)*lerp;
   ctx.clearRect(0,0,width,height);ctx.lineCap='round';ctx.lineJoin='round';
   const haze=ctx.createRadialGradient(width*.52,height*.42,0,width*.52,height*.42,Math.max(width,height)*.48);haze.addColorStop(0,light?'rgba(120,155,123,.075)':'rgba(65,119,102,.10)');haze.addColorStop(.55,light?'rgba(145,156,131,.035)':'rgba(45,82,89,.035)');haze.addColorStop(1,rgba(bg,0));ctx.fillStyle=haze;ctx.fillRect(0,0,width,height);
   for(let i=0;i<95;i++){const a=i*2.39996,r=4.5+(i*67%101)/101*5,point=project({x:Math.cos(a)*r,y:-5.4+(i*31%97)/97*11.3,z:Math.sin(a)*r});if(point.x<15||point.x>width-15||point.y<45||point.y>height-30)continue;ctx.fillStyle=rgba(ink,light?.12:.09+(i%3)*.02);ctx.beginPath();ctx.arc(point.x,point.y,i%7===0?1:.55,0,Math.PI*2);ctx.fill()}
   const root=project({x:0,y:-5.58,z:0});const ground=ctx.createRadialGradient(root.x,root.y,1,root.x,root.y,Math.max(1,scale*3.1));ground.addColorStop(0,rgba(ink,light?.055:.055));ground.addColorStop(1,rgba(ink,0));ctx.save();ctx.translate(root.x,root.y);ctx.scale(1,.22);ctx.translate(-root.x,-root.y);ctx.fillStyle=ground;ctx.beginPath();ctx.arc(root.x,root.y,Math.max(1,scale*3.1),0,Math.PI*2);ctx.fill();ctx.restore();
   for(const r of [1.2,2.5,4.2,6.1]){trace(Array.from({length:97},(_,i)=>{const a=i/96*Math.PI*2;return project({x:Math.cos(a)*r,y:-5.65,z:Math.sin(a)*r})}));ctx.strokeStyle=rgba(ink,r>4?.07:.14);ctx.lineWidth=.6;ctx.stroke()}
   const highlighted=hoverId||p.selectedId;
   const related=(p.showRelations&&highlighted?(p.relationships||[]).filter(r=>r.source===highlighted||r.target===highlighted):[]);
   const linkedIds=new Set(related.flatMap(r=>[r.source,r.target]));
   if(related.length){ctx.setLineDash([3,6]);for(const edge of related){const a=idMap.get(edge.source),b=idMap.get(edge.target);if(!a||!b||!visible.has(a.node.id)||!visible.has(b.node.id))continue;const mid=mixPoint(a.point,b.point,.5);mid.z+=1;mid.y+=.4;trace(bezierPoints(a.point,mixPoint(a.point,mid,.65),mixPoint(b.point,mid,.65),b.point).map(project));ctx.strokeStyle=light?'rgba(112,93,56,.55)':'rgba(219,195,143,.52)';ctx.lineWidth=1;ctx.stroke()}ctx.setLineDash([])}
   const visibleDomains=new Set(layout.nodes.filter(d=>visible.has(d.node.id)).map(d=>d.node.domain));
   const sorted=layout.paths.map(b=>({b,pts:b.points.map(project)})).sort((a,b)=>b.pts[Math.floor(b.pts.length/2)].z-a.pts[Math.floor(a.pts.length/2)].z);
   for(const {b,pts} of sorted){if(b.nodeId&&!visible.has(b.nodeId))continue;const selected=!p.activeDomain||!b.domain||b.domain===p.activeDomain;const any=!b.domain||visibleDomains.has(b.domain);const pathSelected=!!highlighted&&b.nodeId===highlighted;const opacity=b.opacity*(selected?1:.2)*(any?1:.13)*(pathSelected?1.7:1);const color=light?lightColor(b.color):b.color;trace(pts);if(!light){ctx.lineWidth=b.width*zoom+4;ctx.strokeStyle=rgba(color,opacity*.07);ctx.stroke()}ctx.lineWidth=(b.width+(pathSelected?.75:0))*zoom*(light?.88:1);ctx.strokeStyle=rgba(color,opacity*(light?1.14:1));ctx.stroke()}
   const projectedDots=layout.nodes.filter(d=>visible.has(d.node.id)).map(d=>({d,p:project(d.point)})).sort((a,b)=>b.p.z-a.p.z);hitPoints=[];branchHits=[];paperHits=[];
   for(const {d,p:point} of projectedDots){if(point.x<0||point.x>width||point.y<0||point.y>height)continue;const selected=d.node.id===p.selectedId||d.node.id===hoverId,linked=linkedIds.has(d.node.id);const r=Math.max(2.5,d.radius*point.s)*(selected?1.15:1),alpha=Math.max(.55,Math.min(1,.88-point.z*.028));hitPoints.push({x:point.x,y:point.y,r,id:d.node.id,z:point.z});
    if(!light){const glow=ctx.createRadialGradient(point.x,point.y,0,point.x,point.y,r*4.3);glow.addColorStop(0,rgba(d.color,.22*alpha));glow.addColorStop(.25,rgba(d.color,.10*alpha));glow.addColorStop(1,rgba(d.color,0));ctx.fillStyle=glow;ctx.beginPath();ctx.arc(point.x,point.y,r*4.3,0,Math.PI*2);ctx.fill()}
    else{ctx.fillStyle='rgba(35,64,49,.06)';ctx.beginPath();ctx.ellipse(point.x+1,point.y+2,r+1,r*.9,0,0,Math.PI*2);ctx.fill()}
    const ball=ctx.createRadialGradient(point.x-r*.32,point.y-r*.38,0,point.x,point.y,r);ball.addColorStop(0,light?'#fffef9':'#f0fff5');ball.addColorStop(.24,d.color);ball.addColorStop(.72,light?rgba(d.color,.9):rgba(d.color,.8*alpha));ball.addColorStop(1,light?lightColor(d.color):rgba(d.color,.3*alpha));ctx.fillStyle=ball;ctx.beginPath();ctx.arc(point.x,point.y,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle=rgba(light?lightColor(d.color):d.color,light?.4:.52);ctx.lineWidth=.55;ctx.stroke();
    if(selected||linked){ctx.strokeStyle=rgba(light?lightColor(d.color):d.color,selected?.9:.6);ctx.lineWidth=selected?1:.7;ctx.beginPath();ctx.arc(point.x,point.y,r+4.5,0,Math.PI*2);ctx.stroke();if(selected){ctx.strokeStyle=rgba(light?lightColor(d.color):d.color,.17);ctx.beginPath();ctx.arc(point.x,point.y,r+9,0,Math.PI*2);ctx.stroke()}}
   }
   const occupied:Box[]=[];const size=width<480?9:11;ctx.font=`${size}px "DM Sans",system-ui,sans-serif`;ctx.textBaseline='middle';
   // Name branches independently of the paper-label switch; these labels also focus a branch.
   for(const branch of [...layout.branches].sort((a,b)=>(b.domain.id===p.activeDomain?1:0)-(a.domain.id===p.activeDomain?1:0))){if(p.activeDomain&&branch.domain.id!==p.activeDomain)continue;if(!visibleDomains.has(branch.domain.id))continue;
    const point=project(branch.labelPoint),label=p.lang==='zh'?branch.domain.name:branch.domain.en;ctx.font=`500 ${size-1}px "DM Sans","Noto Sans SC",system-ui,sans-serif`;const tw=ctx.measureText(label).width;
    const candidates=[{x:point.x-tw*.5,y:point.y-18},{x:point.x+11,y:point.y},{x:point.x-tw-11,y:point.y},{x:point.x-tw*.5,y:point.y+18}];
    const loc=candidates.find(q=>q.x>32&&q.x+tw<width-34&&q.y>52&&q.y<height-55&&!occupied.some(b=>overlaps({x:q.x,y:q.y-8,w:tw,h:16},b,10)));if(!loc)continue;
    const box={x:loc.x-5,y:loc.y-9,w:tw+10,h:18};occupied.push(box);branchHits.push({...box,id:branch.domain.id});ctx.lineWidth=4;ctx.strokeStyle=rgba(bg,.95);ctx.strokeText(label,loc.x,loc.y);ctx.fillStyle=rgba(light?lightColor(branch.domain.color):branch.domain.color,p.activeDomain?.95:.74);ctx.fillText(label,loc.x,loc.y);
   }
   ctx.font=`${size}px "DM Sans",system-ui,sans-serif`;
   const ranked=[...projectedDots].sort((a,b)=>(b.d.node.id===p.selectedId?100:0)+(b.d.node.id===hoverId?90:0)+(linkedIds.has(b.d.node.id)?20:0)+importance(b.d.node)-(a.d.node.id===p.selectedId?100:0)-(a.d.node.id===hoverId?90:0)-(linkedIds.has(a.d.node.id)?20:0)-importance(a.d.node));let labeled=0;
   for(const {d,p:point} of ranked){const selected=d.node.id===p.selectedId||d.node.id===hoverId,linked=linkedIds.has(d.node.id);if(p.showLabels===false&&!selected&&!linked)continue;if(labeled>=(width<480?5:p.activeDomain?14:10)&&!selected)continue;const tw=ctx.measureText(d.node.short).width,rr=d.radius*point.s;const places=[{x:point.x+rr+7,y:point.y-1},{x:point.x-tw/2,y:point.y-rr-13},{x:point.x-rr-7-tw,y:point.y},{x:point.x-tw/2,y:point.y+rr+13}];const pos=places.find(q=>q.x>22&&q.x+tw<width-30&&q.y>60&&q.y<height-37&&!occupied.some(b=>overlaps({x:q.x,y:q.y-7,w:tw,h:14},b,6)));if(!pos)continue;
    const labelBox={x:pos.x,y:pos.y-7,w:tw,h:14};occupied.push(labelBox);paperHits.push({...labelBox,id:d.node.id});ctx.lineWidth=4;ctx.strokeStyle=rgba(bg,.96);ctx.strokeText(d.node.short,pos.x,pos.y);ctx.fillStyle=selected?text:rgba(light?lightColor(d.color):d.color,light?.9:.82);ctx.fillText(d.node.short,pos.x,pos.y);labeled++;
   }
  };frame=requestAnimationFrame(draw);
  return()=>{cancelAnimationFrame(frame);observer.disconnect();intersection.disconnect();commands.current=null;window.removeEventListener('arbor-camera',cameraEvent);surface.removeEventListener('pointerdown',down);surface.removeEventListener('pointermove',move);surface.removeEventListener('pointerup',up);surface.removeEventListener('pointerleave',leave);surface.removeEventListener('pointercancel',up);surface.removeEventListener('wheel',wheel);surface.removeEventListener('contextmenu',prevent);surface.removeEventListener('keydown',key)};
 },[props.nodes,props.domains]);
 return <div style={{position:'absolute',inset:0}}><canvas ref={canvas} tabIndex={0} role="img" aria-label={props.lang==='zh'?'可旋转的三维科学知识树。方向键旋转，加减键缩放；点击领域标签可聚焦。':'Interactive 3D science knowledge tree. Arrow keys orbit, plus/minus zoom; click a discipline label to focus.'} style={{display:'block',width:'100%',height:'100%',touchAction:'none',cursor:'grab'}}/><span style={{position:'absolute',right:17,bottom:15,color:props.theme==='light'?'#789080':'#405964',fontSize:7,letterSpacing:'.4px',pointerEvents:'none'}}>{props.lang==='zh'?'兼容三维视图':'3D compatibility view'}</span></div>;
}
