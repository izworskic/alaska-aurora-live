import fs from "node:fs";import path from "node:path";
const root=process.cwd();const html=fs.readFileSync(path.join(root,"public","index.html"),"utf8");
const config=await import(path.join(root,"config","state.js"));
const state=config.default||config;
const failures=[];
if(!html.includes(state.canonical))failures.push("canonical missing");
if(!html.includes(`Northern Lights ${state.name} Tonight`))failures.push("state title missing");
if(!html.includes("Viewing score"))failures.push("viewing score label missing");
if(!fs.existsSync(path.join(root,"api","aurora.js")))failures.push("api missing");

const createRequire=(await import("node:module")).createRequire;
const localRequire=createRequire(import.meta.url);
const locationPages=localRequire("../config/seo-locations.js");
for(const loc of locationPages){
 const file=path.join(root,"public",loc.slug,"index.html");
 if(!fs.existsSync(file)){failures.push(loc.slug+": generated page missing");continue}
 const body=fs.readFileSync(file,"utf8");
 const canonical=state.canonical+loc.slug+"/";
 const region=state.regions.find(r=>r.id===loc.region_id);
 if(!region){failures.push(loc.slug+": location region invalid");continue}
 for(const fragment of [
   '<link rel="canonical" href="'+canonical+'">',
   'id="location-aurora-visuals"',
   'id="loc-aurora-map"',
   'id="loc-kp-chart"',
   'id="loc-noaa-oval"',
   'services.swpc.noaa.gov/images/aurora-forecast-northern-hemisphere.jpg',
   'styles.maptoolkit.org/dark.json',
   'tile.openstreetmap.org',
   'aurora-location-live-data',
   'forecast_kp_periods'
 ])if(!body.includes(fragment))failures.push(loc.slug+": missing "+fragment);
 if(body.includes('basemaps.cartocdn.com'))failures.push(loc.slug+": key-gated CARTO is forbidden");
 if(!body.includes('"selected":"'+region.id+'"'))failures.push(loc.slug+": incorrect region in map visual");
}

const {runQualityAudit}=await import('./audit-aurora-quality.mjs');
const qualityReport=runQualityAudit();
fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});
fs.writeFileSync(path.join(root,'artifacts','aurora-quality-gate.json'),JSON.stringify(qualityReport,null,2)+'\n');
for(const item of qualityReport.audits){
 if(item.pass) console.log('Aurora quality PASS '+item.url+' ('+item.score+'/'+item.max+')');
 else failures.push('Aurora quality FAIL '+(item.url||item.name)+': '+(item.failed||[]).join('; '));
}
if(failures.length){console.error(failures.join("\n"));process.exit(1);}
console.log(`Validated ${state.name} Aurora build: ${html.length} bytes`);
