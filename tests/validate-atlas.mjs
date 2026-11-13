import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const nodes = read('data/nodes.json');
const links = read('data/relationships.json');
const review = read('data/research-review.json');
const baseline = read('tests/fixtures/baseline-atlas.json');
const domains = new Set(['bio', 'chemistry', 'materials', 'energy', 'earth', 'math', 'physics', 'robotics', 'agents']);
const types = new Set(['模型', '方法', '智能体', '闭环系统', '基准', '实验']);
const today = new Date().toISOString().slice(0, 10);
const currentYear = Number(today.slice(0, 4));
const text = value => typeof value === 'string' && value.trim().length > 0;
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value && value <= today;
const https = value => { try { return new URL(value).protocol === 'https:'; } catch { return false; } };
const normalize = value => value.normalize('NFKD').toLowerCase().replace('three-track', '3-track').replace(/[^\p{L}\p{N}]/gu, '');
const sourceIdentity = value => {
 const u = new URL(decodeURIComponent(value.toLowerCase()));
 const path = u.pathname.replace(/\/$/, '');
 if (u.hostname.includes('arxiv.org')) return 'arxiv:' + path.split('/').at(-1).replace(/v\d+$/, '');
 if (path.includes('/doi/')) return 'doi:' + path.split('/doi/').at(-1).replace(/^(abs|full|pdf)\//, '');
 if (['doi.org', 'dx.doi.org'].includes(u.hostname)) return 'doi:' + path.slice(1);
 if (u.hostname.includes('nature.com') && path.includes('/articles/')) return 'doi:10.1038/' + path.split('/articles/').at(-1);
 if (u.hostname.includes('pubs.rsc.org') && path.includes('/articlehtml/')) return 'doi:10.1039/' + path.split('/').at(-1);
 return u.hostname + path + u.search;
};
const locator = (value, id) => {
 assert(text(value.file) && !value.file.startsWith('/') && !value.file.split('/').includes('..'), id + ': invalid manuscript file locator');
 assert(text(value.section) && text(value.bibkey), id + ': incomplete manuscript locator');
};

assert(Array.isArray(nodes) && nodes.length >= baseline.nodeIds.length, 'The baseline collection must not shrink');
const ids = new Set(nodes.map(n => n.id));
assert.equal(ids.size, nodes.length, 'Node IDs must be unique');
const titles = new Map();
const identities = new Map();
for (const n of nodes) {
 assert(text(n.id), 'Missing node ID');
 assert(domains.has(n.domain), n.id + ': invalid primary domain');
 assert(Number.isInteger(n.year) && n.year >= 1900 && n.year <= currentYear, n.id + ': year outside reviewed range');
 for (const field of ['short', 'title', 'authors', 'summary', 'summaryEn', 'retained', 'retainedEn', 'caveat', 'caveatEn', 'scoreReason', 'scoreReasonEn']) assert(text(n[field]), n.id + ': missing ' + field);
 assert(types.has(n.type), n.id + ': invalid research type');
 assert(Array.isArray(n.keywords) && n.keywords.length > 0 && n.keywords.every(text), n.id + ': missing search keywords');
 assert(Array.isArray(n.secondaryDomains) && new Set(n.secondaryDomains).size === n.secondaryDomains.length && n.secondaryDomains.every(d => domains.has(d) && d !== n.domain), n.id + ': invalid secondary domains');
 for (const key of ['representativeness', 'method', 'evidence']) assert(Number.isFinite(n.scores[key]) && n.scores[key] >= 1 && n.scores[key] <= 5, n.id + ': invalid score');
 if (n.editorialTier !== undefined) {
  assert([1, 2, 3].includes(n.editorialTier), n.id + ': invalid editorial tier');
  const expected = { 1: 2, 2: 3, 3: 5 }[n.editorialTier];
  assert.equal(n.scores.representativeness, expected, n.id + ': tier/representation mismatch');
  assert.equal(n.scores.method, expected, n.id + ': tier/method mismatch');
  assert.equal(n.scores.evidence, 3, n.id + ': evidence-discussion baseline mismatch');
 }
 assert(n.source && (text(n.source.reference) || Number.isFinite(n.source.reference)), n.id + ': missing source citation');
 assert(['survey', 'research'].includes(n.source.origin || 'survey'), n.id + ': invalid provenance');
 if (n.source.checkedAt) assert(validDate(n.source.checkedAt) && n.source.checkedAt <= review.checkedAt, n.id + ': invalid or future check date');
 if (n.source.origin === 'research') {
  assert(validDate(n.source.checkedAt), n.id + ': missing research check date');
  assert(n.source.sources?.length > 0, n.id + ': missing primary sources');
  assert(!n.source.page, n.id + ': research addition must not invent survey page');
  assert(['journal', 'conference', 'preprint', 'project'].includes(n.source.publicationType), n.id + ': missing publication type');
 } else {
  assert(text(n.source.section), n.id + ': missing source section');
  if (n.source.file) locator(n.source, n.id);
  else assert(Number.isInteger(n.source.page) && n.source.page >= 1, n.id + ': survey requires page or manuscript file locator');
 }
 if (n.source.manuscriptLocators) n.source.manuscriptLocators.forEach(item => locator(item, n.id));
 if (n.source.sources) for (const src of n.source.sources) assert(https(src.url) && text(src.title), n.id + ': invalid primary source');
 assert((!n.url && baseline.surveyNodeIds.includes(n.id)) || https(n.url), n.id + ': unsafe or invalid source URL');
 if (n.source.yearNote) assert(text(n.source.yearNoteEn), n.id + ': missing English publication-year note');
 if (n.subfield) assert(text(n.subfieldEn), n.id + ': missing English subfield');
 assert(!/[\uFFFD]/.test(JSON.stringify(n)), n.id + ': replacement character');
 const title = normalize(n.title), identity = n.url ? sourceIdentity(n.url) : null;
 assert(!titles.has(title), n.id + ': duplicate title with ' + titles.get(title));
 if (identity) assert(!identities.has(identity), n.id + ': duplicate paper/version with ' + identities.get(identity));
 titles.set(title, n.id); if (identity) identities.set(identity, n.id);
}
for (const id of baseline.nodeIds) assert(ids.has(id), 'Removed baseline ID: ' + id);
for (const id of baseline.surveyNodeIds) {
 const n = nodes.find(item => item.id === id);
 assert(n && n.source.origin !== 'research' && n.source.page >= 1, 'Lost baseline survey provenance: ' + id);
}
const edgeKeys = new Set();
for (const e of links) {
 assert(ids.has(e.source) && ids.has(e.target), 'Unknown relationship endpoint');
 assert.equal(e.type, 'thematic', 'Only explicitly thematic links are accepted');
 assert(text(e.label) && text(e.labelEn) && text(e.reason) && text(e.reasonEn), 'Relationships require bilingual labels and rationale');
 assert.notEqual(e.source, e.target, 'Self edge');
 const key = [e.source, e.target].sort().join('|');
 assert(!edgeKeys.has(key), 'Duplicate relationship: ' + key);
 edgeKeys.add(key);
}
for (const preserved of baseline.relationships) assert(links.some(e => JSON.stringify(e) === JSON.stringify(preserved)), 'Removed or changed baseline relationship: ' + preserved.source + ' → ' + preserved.target);
assert(validDate(review.checkedAt), 'Invalid review date');
assert.equal(review.scope.totalNodes, nodes.length, 'Review count mismatch');
assert.equal(review.scope.baselineNodes, baseline.nodeIds.length, 'Baseline count mismatch');
assert.equal(review.scope.newNodes, nodes.length - baseline.nodeIds.length, 'New count mismatch');
assert.equal(review.scope.relationships, links.length, 'Relationship count mismatch');
assert.equal(review.scope.baselineRelationships, baseline.relationships.length, 'Baseline relationship count mismatch');
assert.equal(review.scope.surveyNodes, nodes.filter(n => n.source.origin !== 'research').length, 'Survey count mismatch');
assert.equal(review.scope.researchAdditions, nodes.filter(n => n.source.origin === 'research').length, 'Research count mismatch');
for (const d of domains) {
 const count = nodes.filter(n => n.domain === d).length;
 assert(count > 0, 'No nodes for ' + d);
 assert.equal(review.scope.domainCounts[d], count, 'Domain count mismatch for ' + d);
 assert(review.findings.some(f => f.domain === d && text(f.zh) && text(f.en)), 'Missing bilingual synthesis: ' + d);
}
for (const batch of review.reviewBatches) assert(validDate(batch.checkedAt) && batch.checkedAt <= review.checkedAt, 'Invalid batch review date');
assert(review.sources.every(s => text(s.title) && https(s.url)), 'Invalid review bibliography');
console.log(JSON.stringify({ validated: true, nodes: nodes.length, added: nodes.length - baseline.nodeIds.length, domains: domains.size, relationships: links.length, preservedNodes: baseline.nodeIds.length, preservedRelationships: baseline.relationships.length, years: [Math.min(...nodes.map(n => n.year)), Math.max(...nodes.map(n => n.year))], bilingual: true }));
