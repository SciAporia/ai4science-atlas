export type Language = 'zh' | 'en';
export type Theme = 'dark' | 'light';
export type KnowledgeNode = {
 id:string; short:string; title:string; authors:string; year:number; domain:string;
 secondaryDomains:string[]; type:string; summary:string; summaryEn:string;
 retained:string; retainedEn:string; caveat:string; caveatEn:string;
 source:{origin?:'survey'|'research';section?:string;page?:number;reference:string|number;checkedAt?:string;publicationType?:'journal'|'conference'|'preprint'|'project';yearNote?:string;yearNoteEn?:string;sources?:{title:string;url:string}[]}; url:string;
 scores:{representativeness:number;method:number;evidence:number};
 scoreReason:string;scoreReasonEn:string;keywords:string[];subfield?:string;subfieldEn?:string;
};
export type Domain = {id:string;name:string;en:string;color:string;description:string;descriptionEn:string};
export type Relation = {source:string;target:string;type:string;label:string;labelEn?:string;reason:string;reasonEn?:string};
export const importance=(n:KnowledgeNode)=>0.5*n.scores.representativeness+0.3*n.scores.method+0.2*n.scores.evidence;
