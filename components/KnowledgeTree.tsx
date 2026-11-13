import React,{useEffect,useRef,useState} from 'react';
import type {KnowledgeNode,Domain,Language,Theme,Relation} from '../lib/atlas-types';
import {importance} from '../lib/atlas-types';

type Props={nodes:KnowledgeNode[];domains:Domain[];activeDomain:string|null;selectedId:string|null;visibleIds:string[];onSelect:(id:string)=>void;onHover?:(id:string|null)=>void;onDomainSelect?:(id:string)=>void;resetKey:number;lang:Language;theme?:Theme;layout?:'organic'|'helix';autoRotate?:boolean;showLabels?:boolean;showRelations?:boolean;relationships?:Relation[]};
type Engine={setData:(nodes:unknown[])=>void;filter:(ids:string[],domain:string|null)=>void;select:(id:string|null)=>void;setTheme:(theme:Theme)=>void;setLanguage:(language:Language)=>void;setAutoRotate:(active:boolean)=>void;focusDomain:(id:string)=>void;reset:()=>void;zoom:(delta:number)=>void;resize:()=>void;dispose:()=>void;setLabels?:(active:boolean)=>void;setRelations?:(relations:Relation[],active:boolean)=>void;setLayout?:(layout:string)=>void;rotate?:(delta:number)=>void};

/** React owns application state; both rendering paths share identical geometry. */
export default function KnowledgeTree(props:Props){
 const host=useRef<HTMLDivElement>(null),engine=useRef<Engine|null>(null),latest=useRef(props);
 const [error,setError]=useState(false);latest.current=props;
 const update=(p:Props)=>{const e=engine.current;if(!e)return;e.setTheme(p.theme||'light');e.setLanguage(p.lang);e.filter(p.visibleIds,p.activeDomain);e.setAutoRotate(!!p.autoRotate);e.setLabels?.(p.showLabels!==false);e.setRelations?.(p.relationships||[],!!p.showRelations);};
 useEffect(()=>{update(props)},[props.visibleIds,props.activeDomain,props.lang,props.theme,props.autoRotate,props.showLabels,props.showRelations,props.relationships]);
 useEffect(()=>{engine.current?.select(props.selectedId)},[props.selectedId]);
 useEffect(()=>{if(props.activeDomain)engine.current?.focusDomain(props.activeDomain);else engine.current?.reset()},[props.activeDomain]);
 useEffect(()=>{engine.current?.reset()},[props.resetKey]);
 useEffect(()=>{engine.current?.setLayout?.(props.layout||'organic')},[props.layout]);
 useEffect(()=>{
  let disposed=false;const element=host.current;if(!element)return;
  const url=new URL(import.meta.env.BASE_URL+'engine/tree.js',document.baseURI).href;
  import(/* @vite-ignore */ url).then(module=>{
   if(disposed)return;const p=latest.current;
   const e:Engine=new module.KnowledgeTree(element,{
    domains:p.domains.map(d=>({id:d.id,color:d.color,label:{en:d.en,zh:d.name}})),
    onSelect:(paper:{id:string})=>latest.current.onSelect(paper.id),
    onHover:(paper:{id:string}|null)=>latest.current.onHover?.(paper?.id||null),
    onDomainSelect:(id:string)=>latest.current.onDomainSelect?.(id)
   });engine.current=e;
   e.setData(p.nodes.map(n=>({...n,type:({'模型':'model','方法':'method','基准':'method','闭环系统':'experiment','实验':'experiment','智能体':'agent'} as Record<string,string>)[n.type]||'method',prominence:importance(n),summary:{en:n.summaryEn,zh:n.summary},caution:{en:n.caveatEn,zh:n.caveat}})));
   e.setLayout?.(p.layout||'organic');update(p);e.select(p.selectedId);if(p.activeDomain)e.focusDomain(p.activeDomain);
  }).catch(err=>{console.error('Atlas renderer failed:',err);if(!disposed)setError(true)});
  const camera=(event:Event)=>{const e=engine.current;if(!e)return;const action=(event as CustomEvent<{action:string}>).detail.action;if(action==='in')e.zoom(1);else if(action==='out')e.zoom(-1);else if(action==='left')e.rotate?.(-.25);else if(action==='right')e.rotate?.(.25);else e.reset();};
  const keyboard=(event:KeyboardEvent)=>{const actions:Record<string,string>={'+':'in','=':'in','-':'out',ArrowLeft:'left',ArrowRight:'right',Home:'reset'};if(actions[event.key]){event.preventDefault();camera(new CustomEvent('arbor-camera',{detail:{action:actions[event.key]}}))}};
  window.addEventListener('arbor-camera',camera);element.addEventListener('keydown',keyboard);
  return()=>{disposed=true;window.removeEventListener('arbor-camera',camera);element.removeEventListener('keydown',keyboard);engine.current?.dispose();engine.current=null;element.replaceChildren()};
 },[props.nodes,props.domains]);
 return <div ref={host} className="sculpture-host" tabIndex={0} role="group" aria-label={props.lang==='zh'?'交互式三维知识雕塑；方向键旋转，加减缩放，Home 复位。':'Interactive knowledge sculpture. Arrow keys rotate, plus/minus zoom, Home resets.'}>{error&&<div className="engine-error">{props.lang==='zh'?'渲染器未能加载。仍可通过时间线、领域图和论文索引浏览全部研究。':'The renderer could not load. Explore all research through Timeline, Domains and the paper index.'}</div>}</div>;
}
