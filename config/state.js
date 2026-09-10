module.exports = Object.freeze({
  "name": "Alaska",
  "abbr": "AK",
  "slug": "alaska",
  "repo": "alaska-aurora-live",
  "canonical": "https://chrisizworski.com/national-tools/aurora/alaska/",
  "default_region": "fairbanks",
  "time_zone_fallback": "America/Anchorage",
  "tagline": "Live aurora activity, clouds, darkness and viewing windows across Alaska.",
  "context": "Alaska sits under and near the auroral oval, so even modest geomagnetic activity can produce displays. Summer daylight is often the limiting factor.",
  "local_note": "In Alaska, darkness can matter more than Kp in late spring and summer. The tool suppresses a numeric viewing score when there is no useful darkness.",
  "regions": [
    {"id":"fairbanks","label":"Fairbanks & Interior","places":"Fairbanks, Chena Hot Springs, Interior Alaska","latitude":64.8378,"longitude":-147.7164,"planning_kp":1},
    {"id":"coldfoot","label":"Coldfoot & Brooks Range","places":"Coldfoot, Wiseman, Brooks Range","latitude":67.2524,"longitude":-150.1761,"planning_kp":0},
    {"id":"denali","label":"Denali","places":"Denali, Healy, Cantwell","latitude":63.1148,"longitude":-151.1926,"planning_kp":1},
    {"id":"talkeetna","label":"Talkeetna","places":"Talkeetna and the upper Susitna Valley","latitude":62.3209,"longitude":-150.1066,"planning_kp":1},
    {"id":"anchorage","label":"Anchorage & Mat-Su","places":"Anchorage, Palmer, Wasilla, Mat-Su Valley","latitude":61.2181,"longitude":-149.9003,"planning_kp":2},
    {"id":"nome","label":"Nome & Seward Peninsula","places":"Nome and the Seward Peninsula","latitude":64.5011,"longitude":-165.4064,"planning_kp":1},
    {"id":"juneau","label":"Juneau & Southeast","places":"Juneau, Gustavus, Glacier Bay and Southeast Alaska","latitude":58.3019,"longitude":-134.4197,"planning_kp":3}
  ]
});
