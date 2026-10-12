// Canonical, additive visual layer for generated location pages.
// The state /api/aurora engine remains authoritative for NOAA/NWS data and scoring.
const esc = (v='') => String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const safeJSON = v => JSON.stringify(v).replaceAll('<','\\u003c');

export const locationVisualCSS = String.raw`
.loc-visuals{margin:25px 0 37px;font:14px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif}
.loc-visuals h2{font:400 26px/1.3 Georgia,serif;border:0;padding:0;margin:8px 0 9px;color:inherit}
.loc-visuals h3{font:600 20px/1.3 Georgia,serif;color:#22483e;margin:0 0 7px}
.loc-visuals p{margin:0 0 10px}
.loc-head{padding:23px;background:radial-gradient(ellipse at top right,#27566c,#101d33 68%);border:1px solid #24465b;border-radius:12px;color:#ecf7ff}
.loc-head p{color:#c0d9e8;font-size:13px;max-width:740px}
.loc-kicker{font:700 11px/1.5 system-ui,sans-serif;letter-spacing:.13em;color:#8ad6c2;text-transform:uppercase}
.loc-grid{display:grid;grid-template-columns:1fr 1fr;gap:13px;margin-top:13px}
.loc-panel{background:#fff;border:1px solid #dae2dc;border-radius:11px;overflow:hidden;min-width:0}
.loc-panel-wide{grid-column:span 2}
.loc-panel-head{padding:17px 18px 11px}
.loc-panel-head p,.loc-muted{font:12px/1.6 system-ui,sans-serif;color:#586962}
.loc-map{height:350px;width:100%;background:#152334;position:relative}
.loc-map-shell{position:relative}
.loc-map-caption{padding:8px 18px 12px;font:12px/1.6 system-ui,sans-serif;color:#4a6154}
.loc-map-brand{position:absolute;z-index:5;bottom:39px;left:12px;padding:3px 7px;background:#102033df;border-radius:4px}
.loc-map-brand[hidden]{display:none}
.loc-map-brand img{display:block;width:128px;height:24px;object-fit:contain}
.loc-map-status{padding:8px 18px 2px;font:12px/1.5 system-ui,sans-serif;color:#4a625a}
.loc-place-links{border-top:1px solid #e3e9e5;padding:14px 18px}
.loc-place-links h4{margin:0 0 5px;font:700 13px system-ui,sans-serif;color:#294b3b}
.loc-place-links a{display:block;padding:5px 0;color:#225e48;font:13px/1.4 system-ui,sans-serif}
.loc-place-links small{color:#64796c;display:block;font-size:11px}
.loc-oval{width:100%;max-height:410px;object-fit:contain;display:block;background:#061321}
.loc-oval-error{padding:18px;color:#304c43;font-size:13px}
.loc-chart-wrap{padding:7px 12px 17px}
.loc-chart{width:100%;height:auto;max-height:240px;display:block}
.loc-chart-status{font:12px/1.6 system-ui,sans-serif;color:#536b5f;min-height:28px;padding:7px 0}
.loc-visual-note{font:12px/1.6 system-ui,sans-serif;color:#536b5f;padding:9px 18px 15px}
.loc-visual-note a{color:#285d48}
.loc-visuals .maplibregl-popup-content{font:12px/1.55 system-ui,sans-serif;color:#183b2e}
.loc-visuals .maplibregl-ctrl-attrib{font:10px system-ui,sans-serif!important;background:#fffef4!important;color:#20332b!important}
.loc-visuals .leaflet-popup-content{font:12px/1.5 system-ui,sans-serif}
.loc-map-link{color:#225b44;font-weight:600}
@media(max-width:720px){.loc-grid{grid-template-columns:1fr}.loc-panel-wide{grid-column:span 1}.loc-map{height:310px}.loc-head{padding:18px}.loc-visuals h2{font-size:23px}}
`;

export const locationVisualHead = '<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@5.6.1/dist/maplibre-gl.css"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">';

export function renderLocationVisuals(l,r,state){
 const spots=(l.viewing_sites||[]).map(site=>'<a href="https://www.openstreetmap.org/search?query='+encodeURIComponent(site.name+', '+l.name+', '+state.name)+'" target="_blank" rel="noopener noreferrer">'+esc(site.name)+'<small>Look up this named area — not a confirmed parking coordinate</small></a>').join('');
 return '<section class="loc-visuals" id="location-aurora-visuals" aria-labelledby="locVisualHeading"><div class="loc-head"><div class="loc-kicker">Explore the night sky · '+esc(l.name)+'</div><h2 id="locVisualHeading">What does the aurora forecast look like here?</h2><p>Use the regional map, the latest NOAA auroral-oval model, and the real 72-hour planetary Kp forecast together with the live local cloud and darkness assessment above. They are planning tools, not a sighting guarantee.</p></div><div class="loc-grid"><section class="loc-panel loc-panel-wide" aria-label="'+esc(l.name)+' interactive forecast map"><div class="loc-panel-head"><h3>'+esc(l.name)+' in the aurora network</h3><p>The highlighted marker represents the '+esc(r.label)+' forecast region. Other markers are regional model reference points, not suggested parking locations. Select a marker for that area’s own forecast.</p></div><div class="loc-map-shell"><div id="loc-aurora-map" class="loc-map" role="region" aria-label="'+esc(l.name)+' and neighboring aurora forecast regions"></div><a id="loc-maptoolkit-brand" class="loc-map-brand" href="https://www.maptoolkit.com/" target="_blank" rel="noopener noreferrer" title="Maptoolkit attribution"><img src="https://www.maptoolkit.org/assets/maptoolkit-attribution.png" alt="Maptoolkit" width="128" height="24"></a></div><div id="loc-map-status" class="loc-map-status" role="status">Loading the key-free dark map…</div><p class="loc-map-caption">Showing the region behind this live local forecast. Map markers are broad modeling centers; use the location-name search links and check legal access before traveling.</p><div class="loc-place-links"><h4>Places to investigate near '+esc(l.name)+'</h4>'+spots+'</div></section><section class="loc-panel"><div class="loc-panel-head"><h3>Live NOAA auroral oval</h3><p>NOAA’s Northern Hemisphere 30-minute model. The illuminated band indicates modeled auroral activity, not a local camera or visibility probability.</p></div><img id="loc-noaa-oval" class="loc-oval" src="https://services.swpc.noaa.gov/images/aurora-forecast-northern-hemisphere.jpg" alt="NOAA modeled aurora oval over the Northern Hemisphere" loading="lazy" width="700" height="700"><div id="loc-noaa-error" class="loc-oval-error" hidden>NOAA’s image is unavailable here. <a href="https://www.swpc.noaa.gov/products/aurora-30-minute-forecast" target="_blank" rel="noopener noreferrer">View the official aurora forecast</a>.</div><div class="loc-visual-note">Source: <a href="https://www.swpc.noaa.gov/products/aurora-30-minute-forecast" target="_blank" rel="noopener noreferrer">NOAA SWPC</a> · the image refreshes on NOAA’s schedule.</div></section><section class="loc-panel"><div class="loc-panel-head"><h3>72-hour Kp forecast for planning</h3><p>Three-hour samples from NOAA, plotted against this region’s approximate Kp '+esc(r.planning_kp)+' planning threshold. The line is not a hard cutoff.</p></div><div class="loc-chart-wrap"><svg id="loc-kp-chart" class="loc-chart" role="img" aria-label="NOAA 72-hour Kp forecast for '+esc(l.name)+'" viewBox="0 0 740 240" preserveAspectRatio="xMidYMid meet"></svg><div id="loc-kp-chart-status" class="loc-chart-status" role="status">Retrieving NOAA forecast values…</div></div><div class="loc-visual-note">Kp is planetary. Local cloud, darkness, horizon, and NOAA OVATION values still determine how useful the forecast is. <a href="https://www.swpc.noaa.gov/products/3-day-forecast" target="_blank" rel="noopener noreferrer">NOAA 3-day source</a>.</div></section></div></section>';
}
const locationVisualJS = String.raw`
(function(){
"use strict";
const cfg=__CONFIG__;
const mapContainer=document.getElementById("loc-aurora-map"),mapStatus=document.getElementById("loc-map-status");
let map=null,mode="none",fired=false;
function textFallback(message){if(mapContainer)mapContainer.textContent=message;if(mapStatus)mapStatus.textContent="The forecast and location links above remain available.";}
function popupContent(r){
 const div=document.createElement("div"),title=document.createElement("strong"),p=document.createElement("p"),a=document.createElement("a");
 title.textContent=r.label+(r.id===cfg.selected?" · selected":"");
 p.textContent="Regional planning threshold: Kp "+r.planning_kp+" (not a visibility guarantee)";
 p.style.margin="6px 0";
 const location=cfg.pages.find(x=>x.region_id===r.id);
 a.href=location?cfg.canonical+location.slug+"/":cfg.canonical;
 a.className="loc-map-link";a.textContent=location?"View "+location.name+" live forecast":"Compare all "+cfg.name+" regions";
 div.append(title,p,a);return div;
}
function fallbackMap(){
 if(mode==="raster")return;
 if(map&&typeof map.remove==="function"){try{map.remove()}catch(e){}}
 map=null;mapContainer.replaceChildren();
 const brand=document.getElementById("loc-maptoolkit-brand");if(brand)brand.hidden=true;
 if(!window.L){textFallback("Map unavailable. The researched viewing locations and live forecast remain below.");return;}
 try{
  map=L.map(mapContainer,{scrollWheelZoom:false,attributionControl:true});
  mode="raster";
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:18,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'}).addTo(map);
  const bounds=[];
  for(const r of cfg.regions){
   bounds.push([r.latitude,r.longitude]);
   const m=L.circleMarker([r.latitude,r.longitude],{radius:r.id===cfg.selected?11:7,color:r.id===cfg.selected?"#fff":"#213c4d",weight:r.id===cfg.selected?3:1.5,fillOpacity:.96,fillColor:r.id===cfg.selected?"#3ee2ae":"#88a0b3"}).addTo(map);
   m.bindPopup(popupContent(r));
  }
  if(bounds.length)map.fitBounds(bounds,{maxZoom:7,padding:[24,24]});
  mapStatus.textContent="OpenStreetMap backup map · region markers are forecast model centers.";
 }catch(e){mode="none";textFallback("The map could not be loaded. Use the location links below.")}
}
function initMap(){
 if(!mapContainer)return;
 if(!window.maplibregl){fallbackMap();return;}
 try{
  map=new maplibregl.Map({container:mapContainer,style:"https://styles.maptoolkit.org/dark.json",center:[cfg.region.longitude,cfg.region.latitude],zoom:5,maxZoom:15,scrollZoom:false,attributionControl:false});
  mode="vector";
  map.addControl(new maplibregl.NavigationControl({showCompass:false}),"top-right");
  map.addControl(new maplibregl.AttributionControl({compact:false,customAttribution:'&copy; <a href="https://www.maptoolkit.com/copyright/">Maptoolkit</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}),"bottom-right");
  map.on("error",e=>{if(!fired&&!map.isStyleLoaded()&&/style|fetch|403|404|failed/i.test(e?.error?.message||"")){fired=true;fallbackMap()}});
  const bounds=new maplibregl.LngLatBounds();
  for(const r of cfg.regions){
   const button=document.createElement("button");button.type="button";
   const focus=r.id===cfg.selected;
   button.title=r.label+" · Kp "+r.planning_kp+" planning guide";
   button.setAttribute("aria-label",r.label+" forecast region");
   button.style.cssText="width:"+(focus?23:16)+"px;height:"+(focus?23:16)+"px;border:"+(focus?3:2)+"px solid "+(focus?"#fff":"#263945")+";border-radius:50%;background:"+(focus?"#3ee2ae":"#88a0b3")+";box-shadow:0 0 0 2px rgba(255,255,255,.25);cursor:pointer";
   new maplibregl.Marker({element:button,anchor:"center"}).setLngLat([r.longitude,r.latitude]).setPopup(new maplibregl.Popup({offset:15}).setDOMContent(popupContent(r))).addTo(map);
   bounds.extend([r.longitude,r.latitude]);
  }
  if(!bounds.isEmpty())map.fitBounds(bounds,{maxZoom:7,padding:35,duration:0});
  mapStatus.textContent="Key-free dark map · bright green shows the region for this page. Tap another marker to compare.";
 }catch(e){fallbackMap()}
}
function paintKp(data){
 const svg=document.getElementById("loc-kp-chart"),status=document.getElementById("loc-kp-chart-status");
 if(!svg||!status)return;
 svg.replaceChildren();
 const points=(Array.isArray(data?.forecast_kp_periods)?data.forecast_kp_periods:[]).filter(x=>Number.isFinite(x.kp)&&Number.isFinite(Date.parse(x.time_tag))).slice(0,28);
 if(!points.length){status.textContent="NOAA forecast samples are currently unavailable. The chart will not invent values.";return;}
 const NS="http://www.w3.org/2000/svg",W=740,H=240,L=42,R=14,T=25,B=53,w=W-L-R,h=H-T-B;
 const add=(tag,attrs,parent=svg)=>{const el=document.createElementNS(NS,tag);for(const [key,value] of Object.entries(attrs||{}))el.setAttribute(key,String(value));parent.appendChild(el);return el;};
 const y=k=>T+h*(1-Math.min(9,Math.max(0,k))/9);
 for(const tick of [0,3,5,7,9]){
  add("line",{x1:L,x2:W-R,y1:y(tick),y2:y(tick),stroke:"#d6dedb","stroke-dasharray":"3 5"});
  const t=add("text",{x:L-8,y:y(tick)+4,"text-anchor":"end",fill:"#526d60","font-size":12});t.textContent=tick;
 }
 const ref=cfg.region.planning_kp;
 add("line",{x1:L,x2:W-R,y1:y(ref),y2:y(ref),stroke:"#ae813d","stroke-width":2,"stroke-dasharray":"7 5"});
 const lbl=add("text",{x:W-R-3,y:Math.max(15,y(ref)-7),"text-anchor":"end",fill:"#865826","font-size":12,"font-weight":700});
 lbl.textContent="Local Kp guide "+ref;
 const bw=w/points.length,tz=data?.selected_region?.time_zone||cfg.timezone;
 points.forEach((point,i)=>{
  const xx=L+i*bw+bw*.12;
  const rect=add("rect",{x:xx,y:y(point.kp),width:Math.max(3,bw*.75),height:Math.max(0,T+h-y(point.kp)),rx:3,fill:point.kp>=ref?"#df9e55":"#62a591"});
  const title=add("title",{},rect);
  const clock=new Date(point.time_tag).toLocaleString("en-US",{timeZone:tz,weekday:"short",hour:"numeric"});
  title.textContent=clock+" · NOAA Kp "+point.kp;
  if(i===0||i===points.length-1||i%Math.max(1,Math.floor(points.length/6))===0){const label=add("text",{x:xx+bw*.37,y:H-19,"text-anchor":"middle",fill:"#526d60","font-size":11});label.textContent=clock;}
 });
 const name=add("text",{x:L,y:13,"font-size":12,fill:"#526d60"});name.textContent="Planetary Kp · 0–9";
 status.textContent=points.length+" real NOAA 3-hour samples · local time: "+tz+". Kp is not a local sighting probability.";
}
const oval=document.getElementById("loc-noaa-oval");
if(oval){
 oval.addEventListener("error",()=>{oval.hidden=true;document.getElementById("loc-noaa-error").hidden=false});
}
document.addEventListener("aurora-location-live-data",event=>paintKp(event.detail));
document.addEventListener("aurora-location-live-error",()=>{const s=document.getElementById("loc-kp-chart-status");if(s)s.textContent="The live feed is unavailable. No chart values are being estimated."});
initMap();
})();`;
export function locationVisualScript(l,r,state,locations){
 const info={name:state.name,canonical:state.canonical,region:{id:r.id,label:r.label,planning_kp:r.planning_kp,latitude:r.latitude,longitude:r.longitude},selected:r.id,timezone:state.time_zone_fallback,regions:state.regions.map(x=>({id:x.id,label:x.label,latitude:x.latitude,longitude:x.longitude,planning_kp:x.planning_kp})),pages:locations.map(x=>({slug:x.slug,name:x.name,region_id:x.region_id}))};
 const script=locationVisualJS.replace('__CONFIG__',safeJSON(info));
 return '<script src="https://unpkg.com/maplibre-gl@5.6.1/dist/maplibre-gl.js"></script><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script><script>'+script+'</script>';
}
