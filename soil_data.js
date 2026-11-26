// ============================================================
// FARMER ATI – CROP SOIL REQUIREMENTS & SUITABILITY DATASET
// Credible references: ICAR, TNAU Agronomy Guidelines & Indian Agricultural Standards
// Covers all 17 crops with specific soil parameters and improvement recommendations
// ============================================================

const CROP_SOIL_DATA = {
  "Paddy": {
    name: "Paddy",
    icon: "🌾",
    importance: "Paddy requires continuous soil moisture and standing water during vegetative stages. Testing your soil ensures the presence of an impermeable subsoil hardpan to retain pond irrigation, avoids zinc deficiency, and verifies optimal pH for nutrient availability.",
    ph: "5.5 – 7.0 (Slightly acidic to neutral; optimal 6.0–6.8; alkaline soils above 7.8 induce severe zinc and iron chlorosis)",
    ec: "Below 2.0 dS/m (Moderately tolerant in vegetative stage; sensitive during flowering and panicle initiation; salinity > 3.0 dS/m reduces tillering)",
    organicCarbon: "0.50% – 0.85% (Desirable > 0.60%; anaerobic submerged conditions slow decomposition and maintain soil humus)",
    nitrogen: "Medium to High (Soil test reference: 280 – 560 kg/ha available N; split applications of neem-coated urea at tillering and panicle initiation)",
    phosphorus: "Medium (Soil test reference: 11 – 22 kg/ha available P₂O₅; critical for early root establishment and tillering)",
    potassium: "Medium to High (Soil test reference: 140 – 280 kg/ha available K₂O; prevents lodging, improves grain filling and disease resistance)",
    soilType: "Clay loam, heavy clay, silty clay, and delta alluvial soils with an impermeable subsoil layer",
    drainage: "Requires poor/controlled percolation during vegetative growth (2–5 cm standing water), but requires good surface drainage 10–12 days prior to harvest",
    conditions: "Puddled soil bed with reduced percolation; level land is essential to maintain uniform water depth across the field",
    improvement: {
      ph: "For acidic soils (pH < 5.5), broadcast agricultural lime @ 1–2 tonnes/ha during summer ploughing. For alkaline/sodic soils (pH > 8.0), apply gypsum based on soil gypsum requirement test with leaching.",
      organicCarbon: "Incorporate green manure crops like Sesbania aculeata (Daincha) or Crotalaria juncea (Sunnhemp) @ 12.5 t/ha at 45 days after sowing before puddling.",
      nutrients: "Apply zinc sulphate @ 25 kg/ha if zinc deficient (prevents Khaira disease). Inoculate seeds with Azospirillum and Phosphobacteria biofertilizers @ 2 kg/ha.",
      drainage: "Construct peripheral surface drainage channels around field bunds to drain excess water before harvest or in case of excessive monsoon flooding.",
      salinity: "Leach soluble salts with good quality pond/rain water before puddling; avoid tubewell water with high residual sodium carbonate (RSC).",
      cropSpecific: "Puddle the soil thoroughly to create a water-retaining hardpan at 15–20 cm depth, reducing daily irrigation requirements by up to 35%."
    }
  },

  "Groundnut": {
    name: "Groundnut",
    icon: "🥜",
    importance: "Groundnut develops its pods underground. Checking soil texture, friability, and calcium content (gypsum) is vital to ensure pegs can penetrate easily and pods can fill without producing hollow shells ('pops').",
    ph: "6.0 – 7.5 (Prefers slightly acidic to neutral; pH < 5.5 impairs nodulation & calcium uptake; pH > 7.8 induces lime-induced iron chlorosis)",
    ec: "Below 1.2 dS/m (Highly sensitive to soil salinity; germination and peg entry are severely inhibited if EC exceeds 1.5 dS/m)",
    organicCarbon: "0.50% – 0.75% (Moderate organic matter; loose, aerated friable structure is more critical than heavy organic clay)",
    nitrogen: "Low to Medium (Soil test: 200 – 300 kg/ha; legume fixes atmospheric nitrogen via Rhizobium nodules; starter nitrogen only)",
    phosphorus: "Medium to High (Soil test: 15 – 25 kg/ha available P; crucial for nodule development and root branching)",
    potassium: "Medium (Soil test: 150 – 250 kg/ha available K; supports pod filling and oil synthesis)",
    soilType: "Well-drained light-textured red sandy loam, loamy sand, or alluvial light loam with loose topsoil",
    drainage: "Excellent internal drainage mandatory; extremely sensitive to waterlogging (causes root rot, collar rot, and asphyxiation)",
    conditions: "Loose, friable surface layer (0–10 cm depth) allowing easy gynophore (peg) penetration and pod expansion; adequate calcium in podding zone",
    improvement: {
      ph: "If soil pH is below 6.0, apply agricultural lime 3 weeks before sowing to improve calcium availability and nodulation. For calcareous soils (pH > 7.8), spray ferrous sulphate (0.5%) + citric acid for iron chlorosis.",
      organicCarbon: "Apply 10–12.5 tonnes/ha well-decomposed FYM or compost during final land preparation to improve soil friability and aeration.",
      nutrients: "Treat seeds with Rhizobium (strain TAL-1000/NC-92) and Phosphobacteria. Apply Gypsum @ 400 kg/ha at pegging (40–45 days) to supply calcium and sulfur for full pod filling.",
      drainage: "Form broad-bed and furrows (BBF: 1.5 m beds) or ridges to avoid water stagnation during heavy monsoon rains.",
      salinity: "Choose non-saline fields; leach salts with fresh pond or canal water prior to sowing. Avoid saline borehole water.",
      cropSpecific: "Never allow the soil surface to form a hard crust after rain; perform light inter-cultivation before flowering to keep the pegging zone loose."
    }
  },

  "Black Gram": {
    name: "Black Gram",
    icon: "🫘",
    importance: "Black Gram (Urad) is a short-duration pulse that enriches soil through root nodules. Verifying soil moisture retention, pH, and phosphorus level ensures strong nodulation, rapid flowering, and bumper grain yield.",
    ph: "6.5 – 7.5 (Neutral to mildly alkaline; tolerates pH 6.0–8.0; fails in highly acidic or waterlogged soils)",
    ec: "Below 1.0 dS/m (Highly sensitive to salinity; seedling mortality occurs if EC exceeds 1.5 dS/m)",
    organicCarbon: "0.45% – 0.70% (Moderate organic carbon; biological nitrogen fixation meets majority of nitrogen needs)",
    nitrogen: "Low (Soil test: 180 – 280 kg/ha; starter dose 20–25 kg N/ha, remainder fixed from atmosphere by Rhizobium)",
    phosphorus: "Medium to High (Soil test: 15 – 22 kg/ha available P; single most vital nutrient for pulse nodulation and root vigor)",
    potassium: "Medium (Soil test: 125 – 200 kg/ha available K; enhances drought tolerance and pod resilience)",
    soilType: "Well-drained loam, sandy loam, or medium to heavy black clay soils (Vertisols) with good water-holding capacity",
    drainage: "Good surface drainage essential; sensitive to excess moisture and standing water during early vegetative stages",
    conditions: "Firm seedbed with adequate residual moisture (ideal for rice-fallow cropping); moderate tilth without clods",
    improvement: {
      ph: "If soil is acidic (< 6.2), apply agricultural lime @ 500 kg/ha or use rock phosphate as P source. If slightly alkaline (pH 7.5–8.2), black gram performs well if drainage is maintained.",
      organicCarbon: "Apply 5 tonnes/ha FYM or vermicompost @ 2 t/ha during field preparation.",
      nutrients: "Treat seeds with Rhizobium biofertilizer @ 600 g/ha seed + Phosphobacteria. Apply Single Super Phosphate (SSP) to provide both phosphorus and sulfur.",
      drainage: "For rice-fallow or clay soils, open shallow drainage channels every 3–4 metres to avoid standing water.",
      salinity: "Avoid saline soils; pulses are highly vulnerable to chlorides and exchangeable sodium.",
      cropSpecific: "Foliar spray of 2% DAP or TNAU Pulse Wonder @ 2 kg/acre at flower initiation significantly reduces flower shedding and increases pod set."
    }
  },

  "Green Gram": {
    name: "Green Gram",
    icon: "🫛",
    importance: "Green Gram (Moong) matures rapidly in 60–70 days. Checking soil drainage and salinity is critical, as its tender taproot cannot withstand waterlogging, salinity, or soil-borne fungal pathogens.",
    ph: "6.2 – 7.5 (Neutral range; does not tolerate acidic soils below pH 5.8 or sodic soils above 8.2)",
    ec: "Below 1.0 dS/m (Very sensitive to soil salinity and chloride toxicity)",
    organicCarbon: "0.45% – 0.70% (Standard agricultural range; short duration benefits from readily mineralizable organic matter)",
    nitrogen: "Low (Soil test: 180 – 250 kg/ha; starter dose 20 kg N/ha; fixes nitrogen rapidly through symbiosis)",
    phosphorus: "Medium to High (Soil test: 15 – 25 kg/ha; essential for rapid root elongation and early flowering)",
    potassium: "Medium (Soil test: 120 – 180 kg/ha available K; regulates water loss and leaf stomatal closure)",
    soilType: "Well-drained fertile loam, sandy loam, or alluvial loam; avoid heavy poorly-drained sticky clays",
    drainage: "Must be well-drained; highly vulnerable to collar rot, root rot, and damping off in waterlogged conditions",
    conditions: "Fine, moist, weed-free seedbed; warm soil temperatures (25–35°C) for rapid 3–4 day germination",
    improvement: {
      ph: "Apply lime for acid soils to raise pH above 6.2. Apply 20 kg/ha sulfur (or gypsum) if sulfur is deficient in soil report.",
      organicCarbon: "Incorporate well-rotted compost @ 5 t/ha or apply vermicompost @ 1.5 t/ha in seed furrows.",
      nutrients: "Seed pelleting with Rhizobium and Trichoderma viride (4 g/kg seed) to prevent root rot. Foliar spray of 2% DAP or 1% pulse wonder at flowering.",
      drainage: "Ridge and furrow planting or raised beds in low-lying tracts to avert seasonal rain stagnation.",
      salinity: "Do not sow where EC > 1.0 dS/m; flush field with good quality irrigation water prior to land preparation.",
      cropSpecific: "Ensure field is weed-free for the first 25 days; weed competition during this period can reduce yield by up to 50%."
    }
  },

  "Maize": {
    name: "Maize",
    icon: "🌽",
    importance: "Maize is a heavy feeder crop with massive biomass production. Verifying soil depth, nitrogen supplying capacity, and soil drainage prevents stunted vegetative growth and yellowing from poor root aeration.",
    ph: "6.0 – 7.5 (Adaptable; tolerates 5.8–7.8; susceptible to iron/zinc unavailability above pH 8.0)",
    ec: "Below 1.5 dS/m (Moderately salt tolerant; yield drops markedly if EC exceeds 2.5 dS/m)",
    organicCarbon: "0.55% – 0.85% (Heavy feeder requiring fertile, organically enriched soil)",
    nitrogen: "High (Soil test: > 350 kg/ha; high demand across knee-high, tasseling, and silking stages)",
    phosphorus: "Medium to High (Soil test: 18 – 25 kg/ha; deficiency causes purpling of early leaves)",
    potassium: "High (Soil test: > 200 kg/ha; critical for stalk strength and cob weight)",
    soilType: "Deep, fertile, well-drained loamy, silt loam, or clay loam soils rich in organic matter",
    drainage: "Needs excellent drainage; cannot endure waterlogging for more than 24 hours (causes root suffocation)",
    conditions: "Deep friable root zone (> 60 cm depth) without compacted plow pan; warm, well-aerated seedbed",
    improvement: {
      ph: "Apply lime for soils with pH < 5.8 to prevent aluminum and manganese toxicity. For high pH (> 7.8), apply zinc sulphate @ 25 kg/ha.",
      organicCarbon: "Apply 12.5 t/ha FYM or compost with coir pith compost during primary tillage.",
      nutrients: "Apply split nitrogen (1/3 basal, 1/3 knee-high, 1/3 tasseling). Apply Azospirillum and Phosphobacteria @ 2 kg/ha.",
      drainage: "Plant on ridges and furrows (60 cm row spacing) to facilitate drainage and irrigation.",
      salinity: "Ensure irrigation water salinity is < 1.2 dS/m; avoid high-salinity seedbeds.",
      cropSpecific: "Earthing up at 30–35 days after sowing strengthens the brace roots and prevents crop lodging during wind."
    }
  },

  "Chilli": {
    name: "Chilli",
    icon: "🌶️",
    importance: "Chilli plants are extremely susceptible to waterlogging and soil-borne wilt. Checking soil drainage, organic matter, and potassium status ensures strong flowering, disease resistance, and high fruit pungency.",
    ph: "6.0 – 7.0 (Slightly acidic to neutral; avoids alkaline soils where damping off and wilt become rampant)",
    ec: "Below 1.2 dS/m (Sensitive to salinity; causes leaf scorch, stunted growth, and flower drop)",
    organicCarbon: "0.60% – 0.85% (Requires high organic fertility for steady vegetative and flowering flushes)",
    nitrogen: "Medium to High (Needs balanced split nitrogen; excess vegetative N promotes pest attack)",
    phosphorus: "Medium to High (Essential for healthy root system and early fruit setting)",
    potassium: "High (Improves fruit pungency, color, capsaicin content, and storage life)",
    soilType: "Well-drained light loamy soils, rich sandy loam, or red loam with high organic content",
    drainage: "Superb drainage mandatory; stagnant water even for a few hours triggers fatal root rot and bacterial wilt",
    conditions: "Warm, friable, loose soil bed with high aeration and no hardpan; suitable for raised bed cultivation",
    improvement: {
      ph: "Incorporate agricultural lime or dolomite if soil pH < 5.8. For calcareous soils, use sulfur or acidic compost.",
      organicCarbon: "Apply 25 t/ha well-decomposed FYM or 5 t/ha vermicompost + neem cake @ 250 kg/ha (suppresses nematodes).",
      nutrients: "Bio-fertilizer application (Azospirillum + VAM). Split potash applications during fruit development.",
      drainage: "Cultivate on 15–20 cm raised beds with drip irrigation and plastic mulch to prevent water stagnation.",
      salinity: "Irrigate strictly with low-salinity water (< 1.0 dS/m); provide deep drainage lines.",
      cropSpecific: "Drench nursery seedlings with Trichoderma and Pseudomonas fluorescens before transplanting to shield against damping off."
    }
  },

  "Tomato": {
    name: "Tomato",
    icon: "🍅",
    importance: "Tomatoes demand balanced calcium, potassium, and soil aeration. Testing soil pH and calcium levels prevents blossom-end rot (black sunken fruit bottoms) and ensures firm, uniform red fruit.",
    ph: "6.0 – 7.0 (Optimal 6.2–6.8; calcium uptake drops significantly below pH 6.0 causing Blossom End Rot)",
    ec: "Below 1.5 dS/m (Moderately sensitive; salinity increases fruit TSS but reduces overall yield and fruit size)",
    organicCarbon: "0.60% – 0.90% (Prefers organically rich soils to sustain vigorous indeterminate or determinate growth)",
    nitrogen: "Medium (Soil test: 250 – 400 kg/ha; excessive N causes flower abortion and vegetative overgrowth)",
    phosphorus: "High (Soil test: > 20 kg/ha; critical for early root vigor and flower cluster development)",
    potassium: "High (Soil test: > 250 kg/ha; vital for fruit firmness, uniform red coloration, and shelf life)",
    soilType: "Deep, fertile, well-drained sandy loam, gravelly loam, or red loamy soil with high moisture retention",
    drainage: "Needs prompt drainage; standing water leads to asphyxiation, phytophthora blight, and bacterial wilt",
    conditions: "Uniform moisture regime and high calcium status in the root zone; loose tilth up to 45 cm depth",
    improvement: {
      ph: "Apply gypsum or agricultural lime if calcium is deficient (prevents blossom end rot). Maintain soil pH between 6.2 and 6.8.",
      organicCarbon: "Apply 25 t/ha FYM + 2 kg Trichoderma enriched compost during basal land preparation.",
      nutrients: "Apply boron (borax @ 10 kg/ha) and zinc sulphate (15 kg/ha) if micronutrient tests indicate deficiency.",
      drainage: "Form raised beds (15–20 cm high) with furrow irrigation or drip systems.",
      salinity: "Flush root zone with canal or pond water; avoid chloride-heavy fertilizers (prefer potassium sulphate).",
      cropSpecific: "Ensure consistent soil moisture; irregular watering cycles combined with low calcium cause fruit cracking and blossom-end rot."
    }
  },

  "Brinjal": {
    name: "Brinjal",
    icon: "🍆",
    importance: "Brinjal (Eggplant) has a prolonged harvesting season of several months. Checking soil depth and organic fertility ensures continuous fruit flushes and resistance to bacterial wilt and nematodes.",
    ph: "5.5 – 6.8 (Slightly acidic to neutral; fairly hardy, can tolerate up to pH 7.5 if organic matter is high)",
    ec: "Below 1.5 dS/m (Moderately tolerant of mild salinity compared to tomato or chilli)",
    organicCarbon: "0.55% – 0.80% (Good humus content ensures prolonged harvesting flushes)",
    nitrogen: "Medium to High (Supports continuous vegetative regrowth and repeated fruit pickings)",
    phosphorus: "Medium (Promotes deep taproot penetration and branching)",
    potassium: "High (Improves fruit glossiness, size, and resistance to shoot and fruit borer)",
    soilType: "Deep, fertile, well-drained silt loam, clay loam, or fertile sandy loam",
    drainage: "Requires good drainage; does not tolerate seasonal prolonged submergence",
    conditions: "Thoroughly cultivated soil with 25–30 cm plow depth; free of root-knot nematode infestations",
    improvement: {
      ph: "Adjust acidic soils below 5.5 with lime. In alkaline soils, add sulfur and organic farmyard manure.",
      organicCarbon: "Apply 20–25 tonnes/ha FYM and 500 kg/ha neem cake (crucial for nematode suppression).",
      nutrients: "Balanced NPK with top dressing of nitrogen and potassium after every 3–4 pickings.",
      drainage: "Plant on ridges and furrows (75 cm x 60 cm) to provide root aeration.",
      salinity: "Leach salts before transplanting; maintain adequate soil moisture to minimize osmotic stress.",
      cropSpecific: "Apply neem cake @ 250 kg/ha at planting to protect the root system from root-knot nematodes (Meloidogyne spp.)."
    }
  },

  "Onion": {
    name: "Onion",
    icon: "🧅",
    importance: "Onion has a very shallow fibrous root system and is extremely sensitive to soil salinity, hard soil clods, and poor drainage. Checking soil tilth and sulfur content ensures uniform bulb expansion without rot.",
    ph: "6.0 – 7.2 (Neutral; highly sensitive to acidity < 5.8; aluminum toxicity causes root tipping)",
    ec: "Below 1.2 dS/m (Extremely sensitive to salinity; bulb initiation and expansion drop sharply at EC > 1.5 dS/m)",
    organicCarbon: "0.60% – 0.85% (Well-rotted organic matter is essential for loose bulb formation)",
    nitrogen: "Medium (Soil test: 200 – 300 kg/ha; excess late N causes thick necks and poor bulb storage)",
    phosphorus: "High (Soil test: > 22 kg/ha; shallow root system demands easily accessible water-soluble P)",
    potassium: "High (Soil test: > 220 kg/ha; vital for bulb scale firmness, pungency, and storage)",
    soilType: "Light, friable, fertile sandy loam, silt loam, or red loam completely free of stones and hard clods",
    drainage: "Needs exceptional drainage; water stagnation causes basal bulb rot, purple blotch, and collar rot",
    conditions: "Fine, stone-free tilth; friable top 20 cm allows unrestricted bulb expansion without shape distortion",
    improvement: {
      ph: "Apply agricultural limestone or dolomite if pH < 6.0 at least 1 month prior to planting.",
      organicCarbon: "Apply 25 t/ha thoroughly decomposed FYM or 5 t/ha vermicompost (avoid fresh manure which attracts onion fly).",
      nutrients: "Apply sulfur @ 30–40 kg/ha (crucial for onion pungency and bulb quality). Inoculate with VAM (Mycorrhizae) for phosphorus uptake.",
      drainage: "Broad-bed furrow (BBF: 1.2 m wide) or raised nursery beds to prevent standing water.",
      salinity: "Never cultivate in saline or sodic soils; onion is one of the most salt-sensitive vegetable crops.",
      cropSpecific: "Stop all nitrogen applications 30 days before harvest to avoid thick-necked bulbs and post-harvest rotting."
    }
  },

  "Ragi": {
    name: "Ragi",
    icon: "🌾",
    importance: "Ragi (Finger Millet) is an exceptionally climate-resilient millet that thrives even in poor red soils. Checking your soil helps optimize modest nutrient inputs to achieve high grain yield and nutritious fodder.",
    ph: "5.0 – 7.5 (Widely adaptable; tolerates acidic red soils down to pH 5.0 and moderately alkaline soils)",
    ec: "Below 2.0 dS/m (Moderately salt tolerant; one of the hardiest cereal crops for dryland tracts)",
    organicCarbon: "0.40% – 0.65% (Thrives even in low to moderate organic matter soils)",
    nitrogen: "Low to Medium (Soil test: 150 – 250 kg/ha; modest requirement; over-fertilization causes lodging)",
    phosphorus: "Medium (Soil test: 12 – 18 kg/ha; stimulates rapid tillering and head development)",
    potassium: "Medium (Soil test: 120 – 180 kg/ha; enhances drought tolerance and grain filling)",
    soilType: "Red sandy loam, gravelly light soil, red loams, lateritic soils, or medium black soils",
    drainage: "Good surface drainage required; tolerates short dry spells exceptionally well, dislikes prolonged flooding",
    conditions: "Firm, fine, weed-free seedbed; shallow sowing (1–2 cm) due to very small seed size",
    improvement: {
      ph: "Performs well in acidic red soils; apply modest lime (500 kg/ha) only if pH drops below 5.0.",
      organicCarbon: "Apply 10 tonnes/ha FYM or compost during early land preparation.",
      nutrients: "Apply Azospirillum and Phosphobacteria seed treatment @ 600 g/ha. Balanced 50:40:25 kg NPK/ha.",
      drainage: "Form compartmental bunds or field furrows to conserve rainwater while preventing waterlogging.",
      salinity: "Tolerates slight salinity; suitable for dryland farm-pond catchments.",
      cropSpecific: "Sow at shallow depth (1–1.5 cm); deep sowing in crusted soils prevents tiny ragi coleoptiles from emerging."
    }
  },

  "Cotton": {
    name: "Cotton",
    icon: "☁️",
    importance: "Cotton develops a deep taproot and requires deep soil moisture retention. Testing soil depth, salinity, and potassium levels is essential to prevent leaf reddening and ensure full boll development.",
    ph: "6.0 – 8.0 (Neutral to alkaline; deep black soils typically pH 7.0–8.2; tolerates slight sodicity if drained)",
    ec: "Below 2.5 dS/m (One of the most salt-tolerant commercial crops; germination is the most sensitive stage)",
    organicCarbon: "0.45% – 0.70% (Typical of semi-arid black soils; benefits from green manure incorporation)",
    nitrogen: "High (Soil test: > 300 kg/ha; split applications at square formation and peak boll filling)",
    phosphorus: "Medium (Soil test: 15 – 22 kg/ha; early root penetration into deeper subsoil)",
    potassium: "High (Soil test: > 250 kg/ha; essential to prevent leaf reddening and ensure fiber length/strength)",
    soilType: "Deep black cotton soils (Vertisols), fertile alluvial soils, or deep loamy soils with high moisture retention",
    drainage: "Moderate internal drainage; deep black soils must have surface drains to avoid waterlogging in wet monsoons",
    conditions: "Deep soil profile (> 90 cm) allowing taproot penetration; free of subsurface hardpan or calcium carbonate slabs",
    improvement: {
      ph: "If pH > 8.5, apply gypsum @ 2 t/ha with leaching to reduce exchangeable sodium percentage.",
      organicCarbon: "Incorporate Sunnhemp or Dhaincha green manure or apply 10–12.5 t/ha FYM.",
      nutrients: "Apply magnesium sulphate (25 kg/ha) and zinc sulphate (25 kg/ha) to prevent leaf reddening.",
      drainage: "Deep summer subsoiling to break hardpan; plant on ridges and furrows (90 cm to 120 cm).",
      salinity: "Can be grown in saline-tolerant zones; ensure furrow irrigation to push salts away from the seed row.",
      cropSpecific: "Maintain high potassium levels during flowering and boll formation; potassium deficiency triggers premature defoliation and small bolls."
    }
  },

  "Sesame": {
    name: "Sesame",
    icon: "🫘",
    importance: "Sesame (Gingelly/Til) has ultra-fine seeds and zero tolerance for water stagnation. Verifying light soil texture, excellent drainage, and non-saline conditions is crucial before sowing.",
    ph: "5.5 – 7.5 (Prefers neutral soils; pH 6.0–7.0 optimal; very sensitive to highly acidic or alkaline/saline soils)",
    ec: "Below 1.0 dS/m (Extremely sensitive to salinity; even slight salinity hampers germination and causes crop death)",
    organicCarbon: "0.40% – 0.65% (Modest organic carbon requirement; suitable for light soils)",
    nitrogen: "Low to Medium (Soil test: 150 – 220 kg/ha; excessive N leads to dense canopy, fungal disease, and low oil)",
    phosphorus: "Medium (Soil test: 12 – 18 kg/ha; promotes root growth and capsule development)",
    potassium: "Medium (Soil test: 100 – 150 kg/ha; supports oil synthesis and seed quality)",
    soilType: "Well-drained light sandy loam, alluvial loam, or light red soil; avoid heavy clays with poor aeration",
    drainage: "Strictly well-drained; highly susceptible to water stagnation (even 2–3 hours of standing water kills seedlings)",
    conditions: "Very fine, level, moist seedbed; free of clods; small seeds require shallow sowing (1 cm)",
    improvement: {
      ph: "Apply lime if pH < 5.5. Avoid saline soils completely.",
      organicCarbon: "Apply 5 tonnes/ha FYM during last ploughing.",
      nutrients: "Inoculate seed with Trichoderma and Azospirillum. Apply micronutrient manganese sulphate if deficient.",
      drainage: "Provide dead furrows every 3–4 metres to facilitate rapid runoff of excess rain.",
      salinity: "Do not sow in saline or waterlogged fields; sesame is among the most salt-sensitive oilseeds.",
      cropSpecific: "Mix small sesame seeds with sand (1:4 ratio) to ensure uniform spacing and prevent over-crowded, spindly seedlings."
    }
  },

  "Bhendi": {
    name: "Bhendi (Okra)",
    icon: "🥒",
    importance: "Bhendi (Okra) produces pods continuously when soil moisture and organic matter are optimal. Testing soil drainage and organic fertility prevents collar rot and root-knot nematode damage.",
    ph: "6.0 – 7.5 (Neutral to slightly alkaline; tolerates pH 6.0–7.8; susceptible to nutrient lockup below 5.8)",
    ec: "Below 1.5 dS/m (Moderately tolerant; yields decline if EC exceeds 2.0 dS/m)",
    organicCarbon: "0.50% – 0.75% (Adequate organic matter required for sustained tender pod production)",
    nitrogen: "Medium to High (Split applications support continuous flowering and multiple pod pickings)",
    phosphorus: "Medium (Soil test: 15 – 20 kg/ha; promotes healthy root system and early blooming)",
    potassium: "High (Soil test: > 180 kg/ha; gives crisp, tender, dark green pods and strengthens against wilt)",
    soilType: "Deep, rich sandy loam, clay loam, or fertile alluvial soil with high humus content",
    drainage: "Good drainage essential; water stagnation causes collar rot, yellow vein mosaic susceptibility, and stunting",
    conditions: "Warm, well-aerated soil with good moisture holding capacity; fine, deep tilth",
    improvement: {
      ph: "Apply lime for acid soils below 6.0. Add compost and gypsum for alkaline soils above 7.8.",
      organicCarbon: "Apply 20 t/ha well-rotted FYM + 250 kg/ha neem cake (deters soil nematodes and grubs).",
      nutrients: "Seed treatment with Azospirillum (200 g/kg). Top dress nitrogen at 30 and 45 days after sowing.",
      drainage: "Plant on ridges (45–60 cm apart) to prevent water contact with stem base.",
      salinity: "Ensure irrigation water has EC < 1.2 dS/m; maintain ridge planting to minimize salt buildup at root zone.",
      cropSpecific: "Soak seeds in water for 12 hours before sowing to soften seed coat and ensure rapid, uniform emergence."
    }
  },

  "Sugarcane": {
    name: "Sugarcane",
    icon: "🎋",
    importance: "Sugarcane occupies the land for 10–12 months and extracts massive moisture and nutrients. Testing soil depth, organic carbon, and drainage prevents waterlogging and poor cane girth.",
    ph: "6.5 – 7.8 (Prefers slightly acidic to slightly alkaline; can tolerate 5.5 to 8.2 with proper amendments)",
    ec: "Below 2.0 dS/m (Moderately tolerant; salinity reduces tillering, cane diameter, and juice sucrose/Brix recovery)",
    organicCarbon: "0.65% – 0.95% (Heavy gross feeder; deep rooted, requires rich long-term organic reserves)",
    nitrogen: "Very High (Soil test: > 350 kg/ha; 250–300 kg/ha fertilizer N in multiple splits)",
    phosphorus: "Medium to High (Soil test: 20 – 30 kg/ha; critical at planting for root proliferation and tillering)",
    potassium: "Very High (Soil test: > 280 kg/ha; crucial for stalk weight, sugar translocation, and drought defense)",
    soilType: "Deep, fertile, well-drained loams, clay loams, or heavy alluvial soils with at least 1 metre depth",
    drainage: "Requires excellent sub-surface and surface drainage; cannot tolerate permanent waterlogging",
    conditions: "Deep friable root zone with no impermeable hardpan; high moisture holding capacity with good aeration",
    improvement: {
      ph: "Apply agricultural lime @ 2–4 t/ha for acidic soils. Apply gypsum @ 3–5 t/ha with leaching for sodic/alkaline soils.",
      organicCarbon: "Apply 25–30 t/ha FYM or pressmud (sugar mill waste) @ 12.5 t/ha + trash mulching between cane rows.",
      nutrients: "Apply Gluconacetobacter diazotrophicus (nitrogen-fixing endophyte) and Phosphobacteria. Apply zinc and iron if chlorotic.",
      drainage: "Deep trench or furrow planting (90 cm to 150 cm spacing); create drainage outlet ditches.",
      salinity: "Install field sub-surface drains in saline soils; apply pressmud and green manure to neutralize salt stress.",
      cropSpecific: "Trash mulching (spread dry sugarcane leaves 10 cm thick) conserves soil moisture and suppresses weeds."
    }
  },

  "Mango": {
    name: "Mango",
    icon: "🥭",
    importance: "Mango is a long-lived perennial tree with a deep taproot penetrating 2–4 metres. Testing soil depth, subsoil drainage, and absence of hardpan is critical before establishing an orchard.",
    ph: "5.5 – 7.5 (Prefers slightly acidic to neutral; tolerates 5.0–7.8; alkaline calcareous soils cause zinc/iron chlorosis)",
    ec: "Below 1.0 dS/m (Extremely sensitive to salinity; chlorides and boron cause severe leaf tip burning and twig dieback)",
    organicCarbon: "0.50% – 0.85% (Deep perennial tree; organic matter in top 1 m promotes robust feeder root zone)",
    nitrogen: "Medium (Excess N before flowering suppresses floral induction and promotes vegetative flushes)",
    phosphorus: "Medium (Soil test: 15 – 25 kg/ha; applied in ring trenches around tree drip line)",
    potassium: "High (Crucial for fruit size, pulp sweetness, TSS, color development, and post-harvest shelf life)",
    soilType: "Deep, fertile, well-drained alluvial, red loamy, or lateritic soils with minimum 2 metres soil depth",
    drainage: "Absolute free drainage mandatory; taproot penetrates 3–5 m; high water table or stagnation kills root system",
    conditions: "Deep profile without hard pan, rocky substratum, or high water table within 2 metres of ground surface",
    improvement: {
      ph: "For high pH calcareous soils (> 7.5), apply sulfur around tree canopy basin and spray chelated iron/zinc.",
      organicCarbon: "Apply 50 kg well-rotted FYM or compost per mature tree annually during post-harvest basin opening.",
      nutrients: "Apply micronutrients (zinc sulphate 0.5% + borax 0.2%) foliar spray before panicle emergence.",
      drainage: "Plant in deep pits (1m x 1m x 1m) filled with topsoil, FYM, and red earth; ensure slope runoff.",
      salinity: "Strictly avoid saline irrigation water (EC > 1.0 dS/m); provide basin leaching with monsoon rainwater.",
      cropSpecific: "Withhold irrigation 2 months prior to flowering (October–November in South India) to encourage heavy floral bud burst."
    }
  },

  "Coconut": {
    name: "Coconut",
    icon: "🥥",
    importance: "Coconut palms produce fronds and nuts every month for decades. Verifying soil depth, aeration, and adequate potassium reserves is critical to avoid button shedding and sustain high nut yields.",
    ph: "5.2 – 8.0 (Broad adaptation; thrives in coastal sands, red loams, and alluvial soils)",
    ec: "Below 2.5 dS/m (One of the most salt-tolerant plantation trees; can tolerate coastal brackish groundwater)",
    organicCarbon: "0.50% – 0.80% (Essential in light sandy soils to enhance moisture and nutrient holding capacity)",
    nitrogen: "High (Promotes continuous leaf emergence, spadix development, and crown vigor)",
    phosphorus: "Medium (Crucial for root proliferation and robust crown development)",
    potassium: "Very High (Single most critical nutrient for coconut; drives nut count, copra weight, and drought resistance)",
    soilType: "Deep coastal sand, red sandy loam, river alluvium, or lateritic soils with good depth (> 1.5 m)",
    drainage: "Needs free drainage with fluctuating water table (1–1.5 m below surface); hates stagnant marshy water",
    conditions: "Well-aerated soil profile; adequate soil moisture without prolonged water stagnation; permeable subsoil",
    improvement: {
      ph: "For acidic laterite soils (pH < 5.5), apply 1–2 kg agricultural lime or dolomite per palm per year.",
      organicCarbon: "Apply 50 kg FYM or compost per palm annually + bury coconut husks in trenches around palm basin.",
      nutrients: "Apply 1.3 kg MOP (Muriate of Potash), 1 kg Urea, 2 kg SSP per mature palm per year in split doses. Apply magnesium sulphate (500 g).",
      drainage: "In low-lying coastal areas, plant on raised mounds and dig drainage channels between palm rows.",
      salinity: "Highly tolerant of salinity; ensure chloride is balanced with potassium for healthy nut yield.",
      cropSpecific: "Bury coconut husks (layered with hollow side up) in a 2-metre radius around the trunk to store monsoon moisture through dry spells."
    }
  },

  "Banana": {
    name: "Banana",
    icon: "🍌",
    importance: "Banana is a giant herbaceous plant with heavy water and nutrient uptake. Verifying deep soil tilth, high potassium reserves, and zero water stagnation protects against Panama wilt and guarantees heavy bunches.",
    ph: "6.0 – 7.5 (Prefers slightly acidic to neutral; pH < 5.5 predisposes to Panama wilt; pH > 8.0 locks up micronutrients)",
    ec: "Below 1.2 dS/m (Highly sensitive to soil salinity; salinity reduces bunch weight, finger length, and leaf area)",
    organicCarbon: "0.70% – 1.00% (Heavy feeder requiring abundant, continuous organic matter and moisture)",
    nitrogen: "Very High (Essential for rapid pseudostem girth, broad leaf canopy, and high bunch yield)",
    phosphorus: "Medium to High (Soil test: 20 – 30 kg/ha; applied early for root establishment and corm vigor)",
    potassium: "Exceptionally High (Most vital nutrient; builds large bunches, sweet pulp, and resistance to lodging)",
    soilType: "Deep, rich, loose, fertile clay loam, alluvial loam, or sandy loam with high water holding capacity",
    drainage: "Must be thoroughly drained; shallow root system (top 45 cm) suffocates within 24 hours of waterlogging",
    conditions: "Deep (minimum 1 metre), crumbly, fertile soil rich in humus; continuous moisture without stagnation",
    improvement: {
      ph: "For acid soils (< 6.0), apply agricultural lime or dolomite @ 500 g/plant at planting. For alkaline soils, apply gypsum + sulfur.",
      organicCarbon: "Apply 20–25 kg well-rotted FYM or compost per pit + vermicompost @ 2 kg during planting and side dressing.",
      nutrients: "Split application of N and K (at 2nd, 3rd, 4th, and 5th months); apply zinc, iron, and boron foliar sprays.",
      drainage: "Dig deep drainage trenches (60 cm deep) every 4 rows in heavy delta soils to prevent root asphyxiation.",
      salinity: "Irrigate only with fresh, low-salinity water (< 1.0 dS/m); avoid saline coastal groundwater.",
      cropSpecific: "Earthing up at 3rd and 5th month creates deep furrows for irrigation and prevents pseudostem toppling under heavy bunch weight."
    }
  }
};

// Helper lookup for crops
function getCropSoilData(cropName) {
  if (CROP_SOIL_DATA[cropName]) return CROP_SOIL_DATA[cropName];
  // Handle alias like "Bhendi (Okra)"
  const cleaned = cropName.replace(/\s*\(.*\)/, '').trim();
  if (CROP_SOIL_DATA[cleaned]) return CROP_SOIL_DATA[cleaned];
  for (const k of Object.keys(CROP_SOIL_DATA)) {
    if (cropName.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(cropName.toLowerCase())) {
      return CROP_SOIL_DATA[k];
    }
  }
  return null;
}
