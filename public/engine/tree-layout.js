// Shared scientific sculpture geometry. Branches are editorial grouping,
// never evidence of citation or causal descent. Only X/Z may be dispersed.
const TAU=Math.PI*2;
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function hash(s){let n=2166136261;for(let i=0;i<String(s).length;i++)n=Math.imul(n^String(s).charCodeAt(i),16777619);return(n>>>0)/4294967295;}
const P=(x,y,z)=>({x,y,z});
export function sampleSpline(points,steps=12){
 const out=[];if(points.length<2)return points.slice();
 for(let i=0;i<points.length-1;i++){
  const a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],d=points[Math.min(points.length-1,i+2)];
  for(let j=0;j<steps;j++){const t=j/steps,t2=t*t,t3=t2*t,p={};for(const k of ['x','y','z'])p[k]=.5*(2*b[k]+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t2+(-a[k]+3*b[k]-3*c[k]+d[k])*t3);out.push(p);}
 }out.push({...points[points.length-1]});return out;
}
export function buildTreeLayout(papers,domains,mode='organic'){
 const minYear=papers.length?Math.min(...papers.map(p=>p.year)):1990,maxYear=papers.length?Math.max(...papers.map(p=>p.year)):2026;
 const span=maxYear-minYear||1,timeY=year=>-4+10.5*(year-minYear)/span;
 const entries=[],branches=[];
 domains.forEach((domain,index)=>{
  const angle=index/domains.length*TAU+.15;
  const path=t=>{
   const r=.24+5.35*Math.pow(Math.max(0,t),1.95);
   const a=angle+(mode==='helix'?(1-t)*1.9:Math.sin(t*Math.PI)*.22+(1-t)*.6);
   return P(Math.cos(a)*r,-4+10.5*t,Math.sin(a)*r);
  };
  const members=papers.filter(p=>p.domain===domain.id).sort((a,b)=>a.year-b.year||a.id.localeCompare(b.id));
  const maxT=members.length?clamp((Math.max(...members.map(p=>p.year))-minYear)/span,.2,1):1;
  const pathPoints=[P(Math.cos(angle+.8)*.28,-5.08,Math.sin(angle+.8)*.28),...Array.from({length:9},(_,j)=>path(j/8*maxT))];
  const branch={domain,index,angle,pathPoints,width:.145,roots:[],fibers:[],limbPaths:[],entries:[],labelPoint:path(maxT)};
  branch.labelPoint=P(branch.labelPoint.x*1.15,branch.labelPoint.y+.55,branch.labelPoint.z*1.15);
  for(let i=0;i<3;i++){
   const off=(i-1)*.085;
   branch.fibers.push(pathPoints.map((p,j)=>{const a=angle+(1-j/(pathPoints.length-1))*.9;return P(p.x+Math.sin(a)*off,p.y,p.z-Math.cos(a)*off);}));
   const a=angle+(i-1)*.22,r=1.85+i*.7;
   branch.roots.push([P(Math.cos(a)*r,-5.1,Math.sin(a)*r),P(Math.cos(a+.12)*r*.6,-4.98,Math.sin(a+.12)*r*.6),P(Math.cos(angle+.5)*.38,-4.7,Math.sin(angle+.5)*.38),path(.16)]);
  }
  const types=['model','method','experiment','agent'];
  members.forEach((paper,k)=>{
   const type=({'模型':'model','智能体':'agent','闭环系统':'experiment','方法':'method','基准':'method'})[paper.type]||String(paper.type).toLowerCase();
   const t=(paper.year-minYear)/span,cluster=types.indexOf(type),lane=(cluster<0?k%4:cluster);
   // Dense modern years fill a broad sector instead of a single peripheral ring.
   const sector=(lane-1.5)*.145+(hash(paper.id+'az')-.5)*.23;
   const a=angle+sector+(mode==='helix'?(1-t)*1.9:Math.sin(t*Math.PI)*.22);
   const r=(.24+6.6*Math.pow(Math.max(0,t),1.55))*(.45+.55*hash(paper.id+'radius'));
   const point=P(Math.cos(a)*r,timeY(paper.year),Math.sin(a)*r);
   const at=Math.max(0,t-.10-.12*hash(paper.id+'attachment')),attachPoint=path(at);
   const pivot=P(attachPoint.x*.57+point.x*.43,attachPoint.y+(point.y-attachPoint.y)*.72,attachPoint.z*.57+point.z*.43);
   const near=P(point.x*.92+attachPoint.x*.08,point.y-.08,point.z*.92+attachPoint.z*.08);
   const entry={paper,point,attachPoint,twigPoints:[attachPoint,pivot,near,point],radius:.072*Math.sqrt(clamp(Number(paper.prominence)||1,1,5)),cluster:lane,domainId:domain.id};
   entries.push(entry);branch.entries.push(entry);
  });
  for(let lane=0;lane<4;lane++){
   const group=branch.entries.filter(e=>e.cluster===lane);if(!group.length)continue;
   const latest=[...group].sort((a,b)=>b.point.y-a.point.y).slice(0,Math.ceil(group.length*.55));
   const middle=latest.reduce((p,e)=>P(p.x+e.point.x,p.y+e.point.y,p.z+e.point.z),P(0,0,0));
   middle.x/=latest.length;middle.y/=latest.length;middle.z/=latest.length;
   const at=Math.max(0,((middle.y+4)/10.5)-.32),base=path(at);
   const bend=P(base.x*.5+middle.x*.5,base.y+(middle.y-base.y)*.68,base.z*.5+middle.z*.5);
   branch.limbPaths.push({points:[base,bend,middle],width:.052,cluster:lane});
  }
  branches.push(branch);
 });
 return{minYear,maxYear,timeY,branches,entries,bounds:{radius:7.4,minY:-5.1,maxY:7.2},mode};
}
