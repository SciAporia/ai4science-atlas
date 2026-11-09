import fs from 'node:fs';
import assert from 'node:assert/strict';
const nodes=JSON.parse(fs.readFileSync('data/nodes.json','utf8'));
const links=JSON.parse(fs.readFileSync('data/relationships.json','utf8'));
const domains=new Set(['bio','chemistry','materials','energy','earth','math','physics','robotics','agents']);
assert(nodes.length>=100,'Expected at least one hundred curated works');
const ids=new Set(nodes.map(n=>n.id));assert.equal(ids.size,nodes.length,'Node ids must be unique');
for(const n of nodes){
 assert(domains.has(n.domain),n.id+': invalid primary domain');
 assert(Number.isInteger(n.year)&&n.year>=2000&&n.year<=2026,n.id+': year outside reviewed range');
 for(const field of ['short','title','authors','summary','summaryEn','retained','retainedEn','caveat','caveatEn','scoreReason','scoreReasonEn'])assert(typeof n[field]==='string'&&n[field].trim().length>0,n.id+': missing '+field);
 for(const key of ['representativeness','method','evidence'])assert(n.scores[key]>=1&&n.scores[key]<=5,n.id+': invalid score');
 assert(n.source.reference,n.id+': missing source citation');
 if(n.source.origin==='research'){assert(n.source.checkedAt==='2026-11-09',n.id+': missing research check date');assert(n.source.sources?.length>0,n.id+': missing primary sources');for(const src of n.source.sources){assert(/^https:\/\//.test(src.url)&&src.title,n.id+': invalid source');}assert(!n.source.page,n.id+': research addition must not invent survey page');assert(['journal','conference','preprint','project'].includes(n.source.publicationType),n.id+': missing publication type');}
 else{assert(n.source.page>=1&&n.source.page<=89,n.id+': missing source page');assert(n.source.section,n.id+': missing source section');}
 assert(Array.isArray(n.secondaryDomains)&&n.secondaryDomains.every(d=>domains.has(d)),n.id+': invalid secondary domain');
 if(n.url)assert(/^https:\/\//.test(n.url),n.id+': unsafe or invalid source URL');
 assert(!/[\uFFFD]/.test(JSON.stringify(n)),n.id+': replacement character');
}
for(const d of domains)assert(nodes.some(n=>n.domain===d),'No nodes for '+d);
for(const e of links){assert(ids.has(e.source)&&ids.has(e.target),'Unknown relationship endpoint');assert(e.type==='thematic','Only explicitly thematic links accepted');assert(e.reason&&e.reasonEn,'Relationships require bilingual rationale');assert(e.source!==e.target,'Self edge');}
assert.equal(nodes.filter(n=>n.source.origin!=='research').length,52,'Preserve all original survey records');
const review=JSON.parse(fs.readFileSync('data/research-review.json','utf8'));
for(const d of domains)assert(review.findings.some(f=>f.domain===d&&f.zh&&f.en),'Missing bilingual synthesis: '+d);
console.log(JSON.stringify({validated:true,nodes:nodes.length,domains:domains.size,relationships:links.length,years:[Math.min(...nodes.map(n=>n.year)),Math.max(...nodes.map(n=>n.year))],bilingual:true}));
