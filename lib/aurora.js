function number(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function parseNoaaTime(value) {
  const s = String(value || "").trim();
  if (!s) return null;
  const zoned = /(?:z|[+-]\d\d:?\d\d)$/i.test(s) ? s : `${s}Z`;
  const t = Date.parse(zoned);
  return Number.isFinite(t) ? t : null;
}
function rows(payload, aliases) {
  if (!Array.isArray(payload)) return [];
  return payload.map((r) => {
    if (Array.isArray(r)) return r;
    if (!r || typeof r !== "object") return [];
    return aliases.map((names) => {
      for (const k of names) if (r[k] !== undefined && r[k] !== null) return r[k];
      return null;
    });
  }).filter((r) => String(r[0] || "").toLowerCase() !== "time_tag");
}
function parseKpForecast(payload, now=Date.now()) {
  const parsed = rows(payload, [["time_tag"],["kp","Kp"],["observed"],["noaa_scale"]])
    .map(([time,kp,observed,scale]) => ({t:parseNoaaTime(time),kp:number(kp),observed:observed||null,noaa_scale:scale||null}))
    .filter((x)=>x.t!==null && x.kp!==null)
    .sort((a,b)=>a.t-b.t);
  const window = parsed.filter((x)=>x.t >= now-3*3600000 && x.t <= now+72*3600000);
  const peak = (hours) => window.filter((x)=>x.t<=now+hours*3600000).reduce((p,x)=>!p||x.kp>p.kp?x:p,null);
  const p24=peak(24), p72=peak(72);
  return {peak_24h:p24?.kp??null,peak_24h_at:p24?new Date(p24.t).toISOString():null,
    peak_72h:p72?.kp??null,peak_72h_at:p72?new Date(p72.t).toISOString():null,
    periods:window.map(x=>({...x,time_tag:new Date(x.t).toISOString(),t:undefined}))};
}
function parseCurrentKp(payload) {
  const parsed = rows(payload, [["time_tag"],["Kp","kp"]])
    .map(([time,kp])=>({t:parseNoaaTime(time),kp:number(kp)}))
    .filter(x=>x.t!==null&&x.kp!==null).sort((a,b)=>a.t-b.t);
  const x=parsed.at(-1);
  return x?{kp:x.kp,observed_at:new Date(x.t).toISOString()}:null;
}
function latest(payload, aliases, idxs) {
  return rows(payload, aliases).filter(r=>idxs.some(i=>number(r[i])!==null)).at(-1)||null;
}
function parseSolarWind(magPayload,speedPayload) {
  const m=latest(magPayload,[["time_tag"],["bz_gsm"],["bt"]],[1,2]);
  const s=latest(speedPayload,[["time_tag"],["proton_speed","speed"]],[1]);
  if(!m&&!s)return null;
  const times=[parseNoaaTime(m?.[0]),parseNoaaTime(s?.[0])].filter(Number.isFinite);
  return {observed_at:times.length?new Date(Math.max(...times)).toISOString():null,
    bz_gsm_nt:number(m?.[1]),bt_nt:number(m?.[2]),speed_km_s:number(s?.[1])};
}
function lon360(v){const n=number(v); return n===null?null:((Math.round(n)%360)+360)%360;}
function parseOvation(payload){
  const grid=new Map();
  for(const c of Array.isArray(payload?.coordinates)?payload.coordinates:[]){
    if(!Array.isArray(c)||c.length<3)continue;
    const lon=lon360(c[0]),lat=number(c[1]),val=number(c[2]);
    if(lon===null||lat===null||val===null)continue;
    grid.set(`${lon}:${Math.round(lat)}`,val);
  }
  return {forecast_time:parseNoaaTime(payload?.["Forecast Time"]),observation_time:parseNoaaTime(payload?.["Observation Time"]),
    valueAt(lat,lon){const lo=lon360(lon),la=number(lat);if(lo===null||la===null)return null;return grid.get(`${lo}:${Math.round(la)}`)??null;}};
}
function parseDuration(v){
  const m=String(v||"").match(/^P(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i);
  if(!m)return null; return Number(m[1]||0)*86400000+Number(m[2]||0)*3600000+Number(m[3]||0)*60000+Number(m[4]||0)*1000;
}
function parseSkyCover(payload,now=Date.now()){
  const vals=Array.isArray(payload?.properties?.skyCover?.values)?payload.properties.skyCover.values:[];
  const periods=vals.map(r=>{const [start,dur]=String(r?.validTime||"").split("/");const t=Date.parse(start),d=parseDuration(dur),p=number(r?.value);
    if(!Number.isFinite(t)||!Number.isFinite(d)||p===null||t+d<now-3600000||t>now+72*3600000)return null;
    return {start_time:new Date(t).toISOString(),end_time:new Date(t+d).toISOString(),percent:Math.round(clamp(p,0,100))};}).filter(Boolean);
  return {updated_at:payload?.properties?.updateTime||null,periods};
}
function skyAt(sky,iso){const t=Date.parse(iso);const p=(sky?.periods||[]).find(x=>t>=Date.parse(x.start_time)&&t<Date.parse(x.end_time));return p?number(p.percent):null;}
function parseMoon(payload,date=null){
  const d=payload?.properties?.data;if(!d)return null;
  const illum=number(String(d.fracillum||"").replace("%",""));
  return {date:date||d.date||null,phase:d.curphase||null,illumination_percent:illum===null?null:clamp(illum,0,100)};
}
function bestCloudWindow(nights,span=3){
  if(!Array.isArray(nights)||nights.length<span)return null;
  let best=null;
  for(let i=0;i<=nights.length-span;i++){
    const slice=nights.slice(i,i+span);const clouds=slice.map(x=>number(x.cloud_percent)).filter(x=>x!==null);
    if(clouds.length!==slice.length)continue;
    const avg=Math.round(clouds.reduce((a,b)=>a+b,0)/clouds.length);
    if(!best||avg<best.average_cloud_percent)best={start:slice[0].time,end:slice.at(-1).time,average_cloud_percent:avg};
  }
  return best;
}
function regionVerdict(region,peakKp,ovation){
  if(peakKp===null&&ovation===null)return {level:"unavailable",label:"Live signal unavailable"};
  if(ovation!==null&&ovation>=10)return {level:"active",label:"Active short-term signal"};
  if(peakKp!==null&&peakKp>=region.planning_kp)return {level:"possible",label:"Possible in the 24-hour outlook"};
  if(peakKp!==null&&peakKp>=region.planning_kp-1)return {level:"watch",label:"Watch conditions"};
  return {level:"low",label:"Low signal"};
}
function viewingScore({region,ovation,peakKp,cloud,hasDarkness,moon,bz,speed}){
  if(!hasDarkness)return {score:null,label:"No useful darkness",reason:"Aurora may be active, but the sky is not dark enough in the near-term viewing window."};
  if(ovation===null&&peakKp===null)return {score:null,label:"Live space-weather unavailable",reason:"The tool will not invent a score when both local and broad space-weather signals are missing."};
  let s=0;
  if(ovation!==null)s+=Math.min(40,Math.max(0,ovation)*2);
  if(peakKp!==null){const d=peakKp-region.planning_kp;s+=d>=0?25:d===-1?16:d===-2?8:2;}
  if(cloud!==null)s+=(100-clamp(cloud,0,100))/100*20;
  s+=8;
  if(bz!==null)s+=bz<=-5?4:bz<=-2?2:0;
  if(speed!==null)s+=speed>=500?3:speed>=400?1:0;
  if(moon!==null&&moon>75)s-=Math.min(5,(moon-75)/5);
  s=Math.round(clamp(s,0,100));
  let label=s>=70?"Strong viewing setup":s>=50?"Possible — worth checking":s>=30?"Watch conditions":"Unlikely right now";
  if(cloud!==null&&cloud>85&&s>=30)label="Aurora signal, poor sky";
  return {score:s,label,reason:"Viewing score combines NOAA aurora signal and Kp with local NWS clouds, darkness, solar wind and moonlight. It is a planning score, not a probability."};
}
function localDay(iso,tz){return new Intl.DateTimeFormat("en-CA",{timeZone:tz,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(iso));}
function groupNights(periods,tz){
  const map=new Map();
  for(const p of periods||[]){const key=localDay(p.time_tag,tz);const cur=map.get(key);if(!cur||p.kp>cur.kp)map.set(key,{date:key,kp:p.kp,at:p.time_tag});}
  return [...map.values()].slice(0,3);
}
module.exports={number,clamp,parseKpForecast,parseCurrentKp,parseSolarWind,parseOvation,parseSkyCover,skyAt,parseMoon,bestCloudWindow,regionVerdict,viewingScore,groupNights};
