# MASTER EXECUTION PROMPT — Alaska NORTHERN LIGHTS LIVE

## ROLE
You are the principal product engineer, space-weather data engineer, meteorological-data engineer, astronomy engineer, GIS/UX engineer, SEO engineer, QA engineer, observability engineer and release owner for **Alaska Northern Lights Live**.

Execute the product end to end. Do not stop at planning, scaffolding, or TODOs.

## NON-NEGOTIABLE PRESERVATION RULE
The Michigan implementation is the reference product, not a shared deployment target.
- Do **not** edit `izworskic/chrisizworski-com`.
- Do **not** edit `/northern-lights-michigan/`, `/api/aurora`, Michigan aurora parser files, Michigan routing, or Michigan canonical metadata.
- Do **not** make Michigan depend on this repo.
- Do **not** redirect the Michigan canonical to this tool.
- This state tool must be independently deployable and independently revertible.

A single write to the Michigan aurora implementation is a release-blocking failure.

## PRIMARY USER DECISION
Answer, within the first viewport:
**“Is it worth going out tonight in Alaska, where should I go, what time is best, and what could ruin the view?”**

The first screen must expose:
1. a plain-language verdict,
2. an explicitly labeled **Viewing Score (0–100)**,
3. selected Alaska region,
4. local NOAA OVATION signal,
5. local NWS cloud context,
6. peak 24-hour Kp,
7. best dark-sky window when available,
8. the three-night outlook.

The Viewing Score is a decision aid, **not a probability**.

## DATA CONTRACT
Use primary public sources:
- NOAA SWPC planetary K index forecast and current Kp.
- NOAA SWPC OVATION Aurora 30-Minute Forecast.
- NOAA SWPC real-time solar-wind magnetic field and speed.
- NWS API for selected-region grid sky cover and hourly day/night periods.
- U.S. Naval Observatory for moon phase/illumination.
- State-region latitude/longitude and planning Kp thresholds from the repo config.

Use `Promise.allSettled` or equivalent soft-failure handling. Live-source failure must degrade specific fields rather than collapse the page.

### Truth boundaries
- Never call Kp a local probability.
- Never call OVATION grid values a percent chance of seeing aurora.
- Never convert missing values into `0`.
- Never display stale cached data as current without timestamp/status.
- Never create a numeric Viewing Score when both Kp and OVATION are unavailable.
- Suppress the score when useful darkness is unavailable.
- Cloud cover, darkness, moonlight, light pollution, terrain and horizon quality must be described as independent visibility constraints.

## STATE REGIONS
Use the checked-in `config/state.js` as the single source of truth. Each region needs:
`id`, `label`, `places`, `latitude`, `longitude`, `planning_kp`.

Planning Kp is an approximate travel/monitoring threshold, not a physical boundary or guarantee.

## SCORE MODEL
Calculate an explainable 0–100 planning score only when darkness and at least one space-weather signal are available:
- OVATION: up to 40 points.
- Kp relative to region planning threshold: up to 25.
- NWS cloud cover: up to 20.
- Darkness: 8.
- Southward Bz: up to 4.
- Solar-wind speed: up to 3.
- Very bright moon: penalty up to 5.
Clamp 0–100.

Labels:
- 70–100: `Strong viewing setup`
- 50–69: `Possible — worth checking`
- 30–49: `Watch conditions`
- 0–29: `Unlikely right now`
- high clouds + meaningful signal: `Aurora signal, poor sky`
- no darkness: `No useful darkness`
- Kp + OVATION unavailable: `Live space-weather unavailable`

Never present the score with a `%` symbol.

## UX / VISUAL REFERENCE
Emulate the successful Michigan Northern Lights page:
- editorial ChrisIzworski.com shell,
- light paper background and restrained green typography,
- dark aurora hero panel,
- circular viewing-score gauge,
- region selector,
- three concise decision factors,
- three-night strip,
- solar-wind/current-Kp cards,
- regional outlook cards,
- source/status section,
- mobile-first behavior.

Do not clone Michigan copy verbatim. Localize all geography and visitor decisions to Alaska. Keep dense technical explanation below the decision layer.

## SEO
Canonical: `https://chrisizworski.com/national-tools/aurora/alaska/`
Target intent families:
- northern lights Alaska tonight
- aurora forecast Alaska
- can I see northern lights in Alaska
- northern lights near [state destination]
- aurora borealis Alaska
- best place to see northern lights in Alaska

Requirements:
- unique title and meta description,
- WebApplication schema,
- BreadcrumbList schema,
- index/follow on the page,
- `X-Robots-Tag: noindex, nofollow` for API responses,
- no duplicate Michigan canonical,
- no doorway/thin copy: state page must have real state geography and state-specific decision value.

## PERFORMANCE / RELIABILITY
- Target first-load static HTML under 150 KB.
- API response cache: `s-maxage=300`, `stale-while-revalidate=900`.
- Upstream timeout around 8 seconds.
- No paid data dependency.
- No database required.
- No runtime dependency on Replit.
- Must deploy on Vercel from its own GitHub repository.

## TESTS
At minimum test:
- Kp forecast parsing with NOAA header rows.
- OVATION coordinate normalization.
- sky-cover interval parsing.
- missing data remains null.
- Viewing Score never exceeds 100 or drops below 0.
- Viewing Score is null without darkness.
- Viewing Score is null with Kp + OVATION unavailable.
- every region id is unique.
- default region exists.
- all latitudes/longitudes are valid.
- canonical contains `/national-tools/aurora/alaska/`.
- generated HTML does not include a `%` sign adjacent to the Viewing Score.
- API includes `X-Robots-Tag: noindex, nofollow`.

## VALUE FUNCTION — RELEASE TARGET >= 92/100
- Decision clarity: 20
- Data reliability/truthfulness: 20
- State-local specificity: 15
- Repeat-visit value: 10
- Mobile usability/accessibility: 10
- Performance/resilience: 10
- SEO/search-intent coverage: 10
- Observability/source transparency: 5

## LOSS FUNCTION / HARD VETOES
- Any Michigan repo/page/API modification: **-100 and stop release**
- False sighting probability or `%` misuse: **-50**
- Missing data silently converted to zero: **-40**
- Broken region selector/API: **-35**
- Stale data presented as live without timestamp: **-35**
- Generic state clone lacking local regions: **-25**
- Failed tests or failed build: **-25**
- Duplicate/incorrect canonical: **-25**
- Mobile first-view does not answer the decision: **-20**

## EXECUTION SEQUENCE
1. Verify Michigan baseline SHA and record it.
2. Research Alaska aurora geography and dark-sky anchors from authoritative sources.
3. Implement state config, parsers, API, static UI, schemas and tests.
4. Run `npm test`.
5. Run `npm run build`.
6. Inspect the built page on a ~390 px viewport and desktop.
7. Exercise API success and degraded paths.
8. Commit to the dedicated repo `alaska-aurora-live`.
9. Connect the repo to a dedicated Vercel project.
10. Smoke-test production page and API.
11. Verify canonical, source links, API noindex and mobile first viewport.
12. Re-check Michigan SHA. It must be unchanged by this work.
13. Only then add a card/link from the National Tools hub, without modifying Michigan aurora behavior.

## DEFINITION OF DONE
The product is not done merely because it renders.
It is done when a person in Alaska can decide whether to go out, where within the state to aim, when the best local dark/clear window is, how strong the real space-weather signal is, and how trustworthy the answer is — while Michigan remains untouched.
