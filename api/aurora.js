const STATE = require("../config/state");
const {
  number, parseKpForecast, parseCurrentKp, parseSolarWind, parseOvation,
  parseSkyCover, skyAt, parseMoon, bestCloudWindow, regionVerdict, viewingScore, groupNights
}=require("../lib/aurora");

const URLS={
  kpForecast:"https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json",
  kpCurrent:"https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json",
  solarWindMag:"https://services.swpc.noaa.gov/products/summary/solar-wind-mag-field.json",
  solarWindSpeed:"https://services.swpc.noaa.gov/products/summary/solar-wind-speed.json",
  ovation:"https://services.swpc.noaa.gov/json/ovation_aurora_latest.json"
};
const UA=`ChrisIzworski-${STATE.slug}-Aurora/1.0 (+${STATE.canonical})`;
async function json(url){
  const r=await fetch(url,{headers:{accept:"application/json","user-agent":UA},signal:AbortSignal.timeout(8000)});
  if(!r.ok)throw new Error(`${new URL(url).hostname} returned ${r.status}`);
  return r.json();
}
async function nws(region){
  const points=await json(`https://api.weather.gov/points/${region.latitude.toFixed(4)},${region.longitude.toFixed(4)}`);
  const grid=await json(points.properties.forecastGridData);
  const hourly=await json(points.properties.forecastHourly);
  return {points,grid,hourly};
}
function nightHours(hourly,sky,now=Date.now()){
  return (hourly?.properties?.periods||[]).filter(p=>{
    const t=Date.parse(p.startTime);return Number.isFinite(t)&&t>=now-3600000&&t<=now+30*3600000&&p.isDaytime===false;
  }).map(p=>({time:p.startTime,cloud_percent:skyAt(sky,p.startTime),temperature_f:p.temperature,short_forecast:p.shortForecast||null}));
}
function localDate(now,tz){
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:tz,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now);
  const o=Object.fromEntries(parts.map(p=>[p.type,p.value]));return `${o.year}-${o.month}-${o.day}`;
}
function utcOffsetHours(now,tz){
  const part=new Intl.DateTimeFormat("en-US",{timeZone:tz,timeZoneName:"longOffset"}).formatToParts(now).find(x=>x.type==="timeZoneName")?.value||"GMT+00:00";
  const m=part.match(/^GMT([+-])(\d{2}):?(\d{2})$/);if(!m)return 0;
  const n=Number(m[2])+Number(m[3])/60;return m[1]==="-"?-n:n;
}
async function moon(region,tz){
  const now=new Date(),date=localDate(now,tz),offset=utcOffsetHours(now,tz);
  const url=`https://aa.usno.navy.mil/api/rstt/oneday?date=${date}&coords=${region.latitude.toFixed(3)},${region.longitude.toFixed(3)}&tz=${offset}&dst=false&id=CIzw`;
  return parseMoon(await json(url),date);
}
function src(name,url,result,updatedAt=null){return {name,url,available:result?.status==="fulfilled",updated_at:updatedAt};}

module.exports=async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("X-Robots-Tag","noindex, nofollow");
  res.setHeader("Cache-Control","public, s-maxage=300, stale-while-revalidate=900");
  if(!["GET","HEAD"].includes(req.method)){res.setHeader("Allow","GET, HEAD");return res.status(405).json({error:"Method not allowed"});}
  const region=STATE.regions.find(r=>r.id===String(req.query?.region||""))||STATE.regions.find(r=>r.id===STATE.default_region)||STATE.regions[0];

  const results=await Promise.allSettled([
    json(URLS.kpForecast),json(URLS.kpCurrent),json(URLS.solarWindMag),json(URLS.solarWindSpeed),json(URLS.ovation),nws(region)
  ]);
  const [kf,kc,sm,ss,ov,nw]=results;
  const forecast=kf.status==="fulfilled"?parseKpForecast(kf.value):{peak_24h:null,peak_24h_at:null,peak_72h:null,peak_72h_at:null,periods:[]};
  const current=kc.status==="fulfilled"?parseCurrentKp(kc.value):null;
  const solar=parseSolarWind(sm.status==="fulfilled"?sm.value:[],ss.status==="fulfilled"?ss.value:[]);
  const oval=ov.status==="fulfilled"?parseOvation(ov.value):null;

  let sky={updated_at:null,periods:[]},nights=[],tz=STATE.time_zone_fallback;
  if(nw.status==="fulfilled"){
    sky=parseSkyCover(nw.value.grid);nights=nightHours(nw.value.hourly,sky);
    tz=nw.value.points?.properties?.timeZone||tz;
  }
  const best=bestCloudWindow(nights,3);
  const cloud=best?.average_cloud_percent??(nights[0]?.cloud_percent??null);
  let moonData=null,moonOk=false;
  try{moonData=await moon(region,tz);moonOk=Boolean(moonData);}catch{}
  const ovationValue=oval?oval.valueAt(region.latitude,region.longitude):null;
  const score=viewingScore({region,ovation:ovationValue,peakKp:forecast.peak_24h,cloud,hasDarkness:nights.length>0,
    moon:moonData?.illumination_percent??null,bz:solar?.bz_gsm_nt??null,speed:solar?.speed_km_s??null});

  const regional=STATE.regions.map(r=>{const v=oval?oval.valueAt(r.latitude,r.longitude):null;return {...r,ovation_value:v,...regionVerdict(r,forecast.peak_24h,v)};});
  const fetchedAt=new Date().toISOString();
  return res.status(200).json({
    state:{name:STATE.name,abbr:STATE.abbr,slug:STATE.slug,canonical:STATE.canonical},
    fetched_at:fetchedAt,degraded:results.some(x=>x.status==="rejected"),
    selected_region:{...region,time_zone:tz},
    verdict:score,
    conditions:{
      current_kp:current?.kp??null,current_kp_at:current?.observed_at??null,
      peak_24h_kp:forecast.peak_24h,peak_24h_at:forecast.peak_24h_at,peak_72h_kp:forecast.peak_72h,
      local_ovation:ovationValue,ovation_forecast_at:oval?.forecast_time?new Date(oval.forecast_time).toISOString():null,
      solar_wind:solar,cloud_percent:cloud,best_dark_window:best,moon:moonData
    },
    three_night_outlook:groupNights(forecast.periods,tz),
    regions:regional,
    notes:{
      score:"Our 0–100 viewing score is a planning index, not a percent probability of seeing aurora.",
      kp:"Kp describes broad geomagnetic activity and does not guarantee local visibility.",
      ovation:"NOAA OVATION is a short-term modeled aurora signal, not a sighting probability.",
      visibility:"Darkness, clouds, moonlight, light pollution, terrain and horizon quality can prevent a sighting."
    },
    sources:[
      src("NOAA SWPC — Kp forecast","https://www.swpc.noaa.gov/products/3-day-forecast",kf,forecast.peak_24h_at),
      src("NOAA SWPC — planetary K index","https://www.swpc.noaa.gov/products/planetary-k-index",kc,current?.observed_at||null),
      {name:"NOAA SWPC — real-time solar wind",url:"https://www.swpc.noaa.gov/products/real-time-solar-wind",available:sm.status==="fulfilled"||ss.status==="fulfilled",updated_at:solar?.observed_at||null},
      src("NOAA SWPC — Aurora 30-Minute Forecast","https://www.swpc.noaa.gov/products/aurora-30-minute-forecast",ov,oval?.forecast_time?new Date(oval.forecast_time).toISOString():null),
      src("National Weather Service API","https://www.weather.gov/documentation/services-web-api",nw,sky.updated_at),
      {name:"U.S. Naval Observatory",url:"https://aa.usno.navy.mil/data/api",available:moonOk,updated_at:moonData?.date||null}
    ]
  });
};
module.exports._test={nightHours,localDate,utcOffsetHours};
