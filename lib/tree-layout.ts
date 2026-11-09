import type {Domain,KnowledgeNode} from './atlas-types';
import {importance} from './atlas-types';
export type Vec={x:number;y:number;z:number};
export type TreePath={id:string;domain:string|null;nodeId?:string;kind:'trunk'|'branch'|'twig'|'root';points:Vec[];width:number;opacity:number;color:string};
export type TreeDot={node:KnowledgeNode;point:Vec;color:string;radius:number;branchIndex:number};
export type TreeBranch={domain:Domain;center:Vec;labelPoint:Vec;tip:Vec};
export type TreeLayout={minYear:number;maxYear:number;paths:TreePath[];nodes:TreeDot[];branches:TreeBranch[]};
export const mixPoint=(a:Vec,b:Vec,t:number):Vec=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
export const bezierPoints=(a:Vec,b:Vec,c:Vec,d:Vec,steps=36):Vec[]=>Array.from({length:steps+1},(_,i)=>{const t=i/steps,u=1-t;return {x:u*u*u*a.x+3*u*u*t*b.x+3*u*t*t*c.x+t*t*t*d.x,y:u*u*u*a.y+3*u*u*t*b.y+3*u*t*t*c.y+t*t*t*d.y,z:u*u*u*a.z+3*u*u*t*b.z+3*u*t*t*c.z+t*t*t*d.z}});
const hash=(id:string)=>{let value=2166136261;for(const c of id){value^=c.charCodeAt(0);value=Math.imul(value,16777619)}return (value>>>0)/4294967295};
/** Shared deterministic 3D geometry for both rendering paths. Height is strictly linear in publication year. */
export function createTreeLayout(nodes:KnowledgeNode[],domains:Domain[]):TreeLayout{
 const minYear=Math.min(...nodes.map(n=>n.year)),maxYear=Math.max(...nodes.map(n=>n.year));
 const span=Math.max(1,maxYear-minYear),y=(year:number)=>-5.2+10.4*(year-minYear)/span;
 const paths:TreePath[]=[],dots:TreeDot[]=[],branches:TreeBranch[]=[];
 const backbone=(di:number,t:number):Vec=>{const a=di/domains.length*Math.PI*2+.18;const radial=6.5*Math.pow(Math.sin(Math.max(0,t)*Math.PI*.5),1.6);const bend=Math.sin(t*Math.PI)*.45*Math.sin(di*1.5);return {x:Math.cos(a)*radial+Math.sin(a)*bend,y:-5.2+10.4*t,z:Math.sin(a)*radial*.87-Math.cos(a)*bend}};
 // These filaments are structural decoration, never paper-to-paper edges.
 for(let strand=0;strand<9;strand++){
  const angle=strand/9*Math.PI*2;const points=Array.from({length:48},(_,i)=>{const t=i/47;const r=(.07+.14*Math.sin(t*Math.PI))*(1-t*.7);return {x:Math.cos(angle+t*3.4)*r,y:-5.22+t*5.7,z:Math.sin(angle+t*3.4)*r}});
  paths.push({id:'trunk-'+strand,domain:null,kind:'trunk',points,color:strand%2?'#8fbbaa':'#aacbb7',width:strand%3===0?1.45:.65,opacity:strand%3===0?.55:.28});
 }
 for(let i=0;i<30;i++){
  const a=i/30*Math.PI*2,r=1.7+(i%6)*.28;
  paths.push({id:'root-'+i,domain:null,kind:'root',color:'#769c94',width:i%3===0?.9:.4,opacity:i%3===0?.28:.13,points:bezierPoints({x:0,y:-4.72,z:0},{x:Math.cos(a)*.16,y:-5.3,z:Math.sin(a)*.16},{x:Math.cos(a)*r*.35,y:-5.59,z:Math.sin(a)*r*.35},{x:Math.cos(a)*r,y:-5.6,z:Math.sin(a)*r})});
 }
 domains.forEach((domain,di)=>{
  const list=nodes.filter(n=>n.domain===domain.id).sort((a,b)=>a.year-b.year||importance(b)-importance(a)||a.id.localeCompare(b.id));
  for(const n of list){
   const same=list.filter(p=>p.year===n.year),rank=same.findIndex(p=>p.id===n.id),t=(n.year-minYear)/span,a=di/domains.length*Math.PI*2+.18;
   const base=backbone(di,t),h=hash(n.id),fan= same.length>1?(rank/(same.length-1)-.5)*1.6:Math.sin(h*19)*.55;
   const transverse=fan*(.85+.8*t),outward=.2+((rank%3)*.27)+(h-.5)*.32;
   const tip={x:base.x+Math.cos(a)*outward+Math.cos(a+Math.PI/2)*transverse,y:y(n.year),z:base.z+Math.sin(a)*outward*.87+Math.sin(a+Math.PI/2)*transverse};
   dots.push({node:n,point:tip,color:domain.color,radius:.07+.055*Math.sqrt(importance(n)),branchIndex:di});
  }
 });
 // Separate same-year papers in the horizontal plane; never jitter their encoded year.
 for(let pass=0;pass<18;pass++)for(let i=0;i<dots.length;i++)for(let j=i+1;j<dots.length;j++){
  const a=dots[i],b=dots[j];if(a.node.year!==b.node.year)continue;const dx=a.point.x-b.point.x,dz=a.point.z-b.point.z,d=Math.hypot(dx,dz),min=.47;
  if(d<min){const angle=d<.001?hash(a.node.id+b.node.id)*Math.PI*2:Math.atan2(dz,dx);const push=(min-d)*.26;a.point.x+=Math.cos(angle)*push;a.point.z+=Math.sin(angle)*push;b.point.x-=Math.cos(angle)*push;b.point.z-=Math.sin(angle)*push;}
 }
 domains.forEach((domain,di)=>{
  const list=dots.filter(n=>n.node.domain===domain.id);if(!list.length)return;
  const terminal=[...list].sort((a,b)=>b.node.year-a.node.year||importance(b.node)-importance(a.node))[0];
  const maxT=(terminal.node.year-minYear)/span;
  const main=Array.from({length:61},(_,i)=>{const t=maxT*i/60,p=backbone(di,t);return i>54?mixPoint(p,terminal.point,(i-54)/6):p});
  for(let strand=0;strand<4;strand++)paths.push({id:domain.id+'-main-'+strand,domain:domain.id,kind:'branch',points:main.map((p,i)=>{const u=i/60,offset=Math.sin(u*Math.PI)*.055;return {...p,x:p.x+Math.sin(u*7+strand*2)*offset,z:p.z+Math.cos(u*7+strand*2)*offset}}),color:domain.color,width:strand===0?1.45:.45,opacity:strand===0?.58:.2});
  for(const dot of list){const t=(dot.node.year-minYear)/span,a=backbone(di,Math.max(0,t-.19)),b=backbone(di,Math.max(0,t-.09));const c=mixPoint(backbone(di,t),dot.point,.65);c.y-=.22;
   paths.push({id:dot.node.id+'-twig',domain:domain.id,nodeId:dot.node.id,kind:'twig',points:bezierPoints(a,b,c,dot.point),color:domain.color,width:.85,opacity:.56});
   paths.push({id:dot.node.id+'-vein',domain:domain.id,nodeId:dot.node.id,kind:'twig',points:bezierPoints(a,{...b,x:b.x+.035},{...c,z:c.z+.04},dot.point),color:domain.color,width:.35,opacity:.16});
  }
  const a=di/domains.length*Math.PI*2+.18;
  const point=backbone(di,Math.min(maxT,.78));
  branches.push({domain,center:point,tip:terminal.point,labelPoint:{x:terminal.point.x+Math.cos(a)*.6,y:terminal.point.y+.28,z:terminal.point.z+Math.sin(a)*.6}});
 });
 return {minYear,maxYear,paths,nodes:dots,branches};
}
export const lightColor=(hex:string)=>{const value=parseInt(hex.slice(1),16);const r=(value>>16)&255,g=(value>>8)&255,b=value&255;return '#'+[r,g,b].map(v=>Math.round(v*.52).toString(16).padStart(2,'0')).join('')};
