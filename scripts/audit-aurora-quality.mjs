// Static publication-quality audit; does not measure or guarantee Google traffic.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),state=require('../config/state.js');
const old=require('../config/seo-locations.js'),more=require('../config/seo-locations-expansion.js'),overrides=require('../config/seo-quality-overrides.js');
const pages=[...old,...more].map(p=>({...p,...(overrides[p.slug]||{})}));
const read=p=>fs.readFileSync(path.join(process.cwd(),p),'utf8');
const decode=s=>String(s||'').replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&#39;',"'");
const title=s=>decode((s.match(/<title>([^<]*)<\/title>/)||[])[1]||'');
const desc=s=>decode((s.match(/<meta name="description" content="([^"]*)"/i)||[])[1]||'');
function graph(s){try{return JSON.parse((s.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)||[])[1]||'{}')['@graph']||[]}catch{return []}}
const chk=(label,pass)=>({label,pass:!!pass});
const result=(name,url,checks)=>({name,url,score:checks.filter(c=>c.pass).length*5,max:checks.length*5,pass:checks.every(c=>c.pass),failed:checks.filter(c=>!c.pass).map(c=>c.label)});
function location(p){
 const h=read('public/'+p.slug+'/index.html'),canonical=state.canonical+p.slug+'/',g=graph(h);
 const app=g.find(x=>x['@type']==='WebApplication'),crumb=g.find(x=>x['@type']==='BreadcrumbList'),faq=g.find(x=>x['@type']==='FAQPage');
 const t=title(h),d=desc(h),r=state.regions.find(x=>x.id===p.region_id),n=p.field_notes||{},sources=p.sources||[],sites=p.viewing_sites||[];
 const checks=[
 chk('Query-first distinct title',t.startsWith('Northern Lights ')&&t.includes(p.name)&&t.length>=33&&t.length<=69),
 chk('Descriptive meta',d===p.meta_description&&d.length>=90&&d.length<=165),
 chk('Indexable self canonical',h.includes('<link rel="canonical" href="'+canonical+'">')&&h.includes('name="robots" content="index,follow')),
 chk('Structured data and author ID',app?.url===canonical&&app?.author?.['@id']==='https://chrisizworski.com/#person'&&crumb?.itemListElement?.length===5),
 chk('Social sharing metadata',h.includes('property="og:title"')&&h.includes('name="twitter:card"')),
 chk('Live source and sky-window verdict',h.includes("fetch(API+'?region='")&&h.includes('id="score"')&&h.includes('id="cloud"')&&h.includes('id="window"')),
 chk('Substantive place judgment',p.context?.length>=140&&p.decision_note?.length>=135&&h.includes(p.decision_note.slice(0,25))),
 chk('Truthful regional proxy/Kp guide',!!r&&h.includes('Forecast coverage:')&&h.includes(r.label)&&h.includes('planning benchmark')),
 chk('Unique sky-access tradeoffs',n.sky?.length>=80&&n.decision?.length>=90&&n.access?.length>=80&&h.includes('Where the sky actually opens')),
 chk('Clear probabilistic limits',h.includes('not a viewing probability')&&h.includes('0–100 planning index')),
 chk('Three explained locations',sites.length>=3&&sites.every(x=>x.name.length>=9&&x.note.length>=45&&h.includes(x.name.replaceAll('&','&amp;')))),
 chk('Linked destination research',sources.length>=1&&sources.every(x=>x.url.startsWith('https://')&&x.label.length>=10&&h.includes(x.url))),
 chk('Author identification',h.includes('https://chrisizworski.com/chris-izworski/')&&h.includes('Chris Izworski')),
 chk('Five local FAQs',faq?.mainEntity?.length===5&&faq.mainEntity.every(x=>x.acceptedAnswer?.text?.length>=85)),
 chk('Specific access FAQ',h.includes('Is nighttime access open at '+p.name)),
 chk('Keyless interactive map',h.includes('id="loc-aurora-map"')&&h.includes('styles.maptoolkit.org/dark.json')&&!h.includes('basemaps.cartocdn.com')),
 chk('Map fallback and search',h.includes('tile.openstreetmap.org')&&h.includes('Look up this named area')),
 chk('NOAA oval and failure state',h.includes('id="loc-noaa-oval"')&&h.includes('id="loc-noaa-error"')),
 chk('NOAA Kp chart and missing state',h.includes('id="loc-kp-chart"')&&h.includes('forecast_kp_periods')&&h.includes('NOAA forecast samples are currently unavailable')),
 chk('Linked state and siblings',h.includes('href="'+state.canonical+'"')&&pages.filter(x=>x.slug!==p.slug).every(x=>h.includes('href="'+state.canonical+x.slug+'/"')))
 ];
 return result(p.slug,canonical,checks);
}
function hub(){
 const h=read('public/index.html'),g=graph(h),person=g.find(x=>x['@type']==='Person'&&x['@id']==='https://chrisizworski.com/#person'),app=g.find(x=>x['@type']==='WebApplication');
 const t=title(h),d=desc(h);
 const checks=[
 chk('Title',t.length>=35&&t.length<=68&&t.includes(state.name)),
 chk('Description',d.length>=105&&d.length<=160),
 chk('Canonical',h.includes('<link rel="canonical" href="'+state.canonical+'">')),
 chk('Shared Person ID',!!person&&person.name==='Chris Izworski'&&app?.author?.['@id']==='https://chrisizworski.com/#person'),
 chk('Visible creator',h.includes('Built by Chris Izworski')&&h.includes('https://chrisizworski.com/chris-izworski/')),
 chk('Live decisions',h.includes('id="score"')&&h.includes('id="regions"')&&h.includes('api/aurora')),
 chk('Interactive map and Kp chart',h.includes('id="stateRegionMap"')&&h.includes('id="stateKpChart"')),
 chk('Auroral oval and field guide',h.includes('id="stateAuroraOvalImg"')&&h.includes('id="state-aurora-field-guide"')),
 chk('All location links',pages.every(p=>h.includes('href="'+state.canonical+p.slug+'/"'))),
 chk('OG/X previews',h.includes('property="og:title"')&&h.includes('name="twitter:card"'))
 ];
 const x=result('STATE HUB',state.canonical,checks);x.score*=2;x.max*=2;return x;
}
export function runQualityAudit(){
 const audits=[hub(),...pages.map(location)];
 const titles=pages.map(p=>title(read('public/'+p.slug+'/index.html')));
 const descriptions=pages.map(p=>desc(read('public/'+p.slug+'/index.html')));
 const sitemap=read('public/aurora-locations-sitemap.xml');
 if(new Set(titles).size!==titles.length)audits.push({name:'PORTFOLIO',pass:false,failed:['Duplicate titles']});
 if(new Set(descriptions).size!==descriptions.length)audits.push({name:'PORTFOLIO',pass:false,failed:['Duplicate snippets']});
 for(const p of pages)if(!sitemap.includes('<loc>'+state.canonical+p.slug+'/</loc>'))audits.push({name:p.slug,pass:false,failed:['Sitemap exclusion']});
 return {state:state.name,date:'2026-10-13',goal:'1,000,000 rolling 28-day GSC Web impressions, 5% CTR',gscImpressions:null,gscCTR:null,pass:audits.every(x=>x.pass),audits,scope:'Engineering publication quality only, not evidence of indexing, rankings or traffic.'};
}
