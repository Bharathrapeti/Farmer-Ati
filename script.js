// ============================================================
// FARMER ATI – Intelligent Pond-Water & Seasonal Dashboard
// Full Synchronization with ESP32 OLED Hardware
// ============================================================

const BLE_DEVICE_NAME         = 'FARMER ATI';
const BLE_SERVICE_UUID        = 0xA000;
const BLE_CHARACTERISTIC_UUID = 0xA001;

// ── State ────────────────────────────────────────────────────
let bleDevice         = null;
let bleServer         = null;
let bleCharacteristic = null;
let frameCount        = 0;

// Shared Recommendation & Pond Telemetry State (Exact match with ESP32)
let pondTelemetry = {
  mode: 'default',
  sensorDist: null,
  waterDepth: 0.0,
  waterLitres: 0,
  waterPct: 0.0,
  month: 'November',
  season: 'Samba / Thaladi',
  recCrops: [],
  currentCrop: ''
};

// Filter & Selection State
let cropFilterMode    = 'all';     // 'all' or 'rec'
let cropSearchQuery   = '';
let problemFilterMode = 'all';     // 'all' or 'rec'
let selectedCrop      = 'Paddy';
let lastScreenName    = '';

// ── DOM helpers ───────────────────────────────────────────────
const $  = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

// ── Specific Crop Icons & Emojis ─────────────────────────────
const CROP_ICONS = {
  "Paddy": "🌾",
  "Groundnut": "🥜",
  "Black Gram": "🫘",
  "Green Gram": "🫛",
  "Chilli": "🌶️",
  "Tomato": "🍅",
  "Brinjal": "🍆",
  "Onion": "🧅",
  "Maize": "🌽",
  "Ragi": "🌾",
  "Cotton": "☁️",
  "Sesame": "🫘",
  "Bhendi": "🥒",
  "Sugarcane": "🎋",
  "Mango": "🥭",
  "Coconut": "🥥"
};

function getCropIcon(name) {
  return CROP_ICONS[name] || "🌱";
}

// ── 16 Complete Crops Agronomy Database ───────────────────────
const CROPS = {
  "Paddy": {
    "Season": [
      "KHARIF / RABI / NAVARAI",
      "KURUVAI: JUN-SEP",
      "SAMBA: AUG-JAN"
    ],
    "Type": [
      "WETLAND CEREAL CROP"
    ],
    "SowingMonths": [
      1,
      6,
      7,
      8,
      9,
      10,
      11,
      12
    ],
    "WaterReq_L": 5050000,
    "WaterDepth_mm": 1250,
    "Duration": "105 - 145 DAYS",
    "Irrigation": "STANDING WATER 2-5 CM, CRITICAL AT TILLERING & FLOWERING",
    "Soil": "CLAYEY LOAM, ALLUVIAL WITH IMPERMEABLE SUBSOIL",
    "Problems": [
      "STEM BORER",
      "LEAF FOLDER",
      "BROWN PLANTHOPPER",
      "BLAST / FUNGAL DISEASE"
    ],
    "Organic Care": [
      "USE HEALTHY SEED",
      "MAINTAIN FIELD SANITATION",
      "USE NEEM PRODUCTS",
      "FOLLOW PRODUCT LABEL",
      "ENCOURAGE BENEFICIAL INSECTS",
      "AVOID UNNECESSARY SPRAYING"
    ],
    "Prevention": [
      "BALANCED FERTILIZATION",
      "PROPER SPACING",
      "CLEAN FIELD",
      "REGULAR SCOUTING"
    ],
    "Spray Info": [
      "NEEM OIL: 3-5 ML/L",
      "SPRAY EARLY MORNING",
      "FOLLOW PRODUCT LABEL"
    ],
    "Months": [
      "JUNE TO JANUARY",
      "DEPENDS ON LOCAL SEASON"
    ],
    "SeedRate_1Acre": 20.0
  },
  "Groundnut": {
    "Season": [
      "KHARIF / RABI",
      "SUMMER DEPENDS ON REGION"
    ],
    "Type": [
      "OILSEED / LEGUME"
    ],
    "SowingMonths": [
      1,
      2,
      4,
      5,
      6,
      7,
      11,
      12
    ],
    "WaterReq_L": 1820000,
    "WaterDepth_mm": 450,
    "Duration": "105 - 120 DAYS",
    "Irrigation": "CRITICAL AT FLOWERING, PEGGING & POD DEVELOPMENT",
    "Soil": "WELL-DRAINED RED SANDY LOAM, LIGHT TEXTURE",
    "Problems": [
      "APHIDS",
      "LEAF MINER",
      "TIKKA LEAF SPOT",
      "COLLAR ROT"
    ],
    "Organic Care": [
      "USE CLEAN SEEDS",
      "USE TRICHODERMA SEED TREATMENT",
      "USE NEEM SPRAY",
      "MAINTAIN PROPER DRAINAGE"
    ],
    "Prevention": [
      "CROP ROTATION",
      "AVOID WATERLOGGING",
      "DESTROY OLD RESIDUES",
      "TIMELY WEEDING"
    ],
    "Spray Info": [
      "NEEM OIL: 3-5 ML/L",
      "APPLY AT EARLY PEST DETECTION"
    ],
    "Months": [
      "JUNE TO AUGUST",
      "AND JAN TO FEB"
    ],
    "SeedRate_1Acre": 55.0
  },
  "Black Gram": {
    "Season": [
      "KHARIF / RABI / RICE FALLOW"
    ],
    "Type": [
      "PULSE CROP"
    ],
    "SowingMonths": [
      1,
      2,
      6,
      7,
      9,
      10,
      11
    ],
    "WaterReq_L": 1210000,
    "WaterDepth_mm": 300,
    "Duration": "65 - 75 DAYS",
    "Irrigation": "LOW WATER REQUIREMENT, SENSITIVE TO WATERLOGGING",
    "Soil": "LOAMY TO HEAVY BLACK CLAY SOILS",
    "Problems": [
      "YELLOW MOSAIC VIRUS",
      "WHITEFLY",
      "POD BORER",
      "ROOT ROT"
    ],
    "Organic Care": [
      "TREAT SEED WITH RHIZOBIUM",
      "YELLOW STICKY TRAPS FOR WHITEFLY",
      "NEEM FORMULATION AT 3 ML/L",
      "REMOVE INFECTED PLANTS"
    ],
    "Prevention": [
      "GROW RESISTANT VARIETIES (VBN)",
      "AVOID WATER STAGNATION",
      "TIMELY WEEDING WITHIN 20 DAYS"
    ],
    "Spray Info": [
      "NEEM SEED KERNEL EXTRACT 5%",
      "SPRAY AT FLOWER BUD INITIATION"
    ],
    "Months": [
      "SEP TO NOV",
      "AND JAN TO FEB IN RICE FALLOW"
    ],
    "SeedRate_1Acre": 8.0
  },
  "Green Gram": {
    "Season": [
      "KHARIF / SUMMER / RICE FALLOW"
    ],
    "Type": [
      "SHORT-DURATION PULSE"
    ],
    "SowingMonths": [
      1,
      2,
      3,
      4,
      6,
      7
    ],
    "WaterReq_L": 1130000,
    "WaterDepth_mm": 280,
    "Duration": "60 - 70 DAYS",
    "Irrigation": "DROUGHT RESISTANT, IRRIGATE AT FLOWERING & POD FILLING",
    "Soil": "WELL-DRAINED SANDY LOAM TO RICH LOAM",
    "Problems": [
      "POD BORER",
      "APHIDS",
      "POWDERY MILDEW",
      "YELLOW MOSAIC"
    ],
    "Organic Care": [
      "SEED TREATMENT WITH TRICHODERMA",
      "NEEM EXTRACT SPRAY",
      "PHEROMONE TRAPS FOR BORERS"
    ],
    "Prevention": [
      "PROPER PLANT DENSITY",
      "AVOID SHADED SITES",
      "SUMMER DEEP PLOUGHING"
    ],
    "Spray Info": [
      "PANCHAGAVYA 3% AS FOLIAR SPRAY",
      "SPRAY DURING COOL MORNING HOURS"
    ],
    "Months": [
      "FEB TO APR",
      "AND JUN TO JUL"
    ],
    "SeedRate_1Acre": 8.0
  },
  "Chilli": {
    "Season": [
      "KHARIF / RABI / SUMMER"
    ],
    "Type": [
      "SPICE / CASH CROP"
    ],
    "SowingMonths": [
      1,
      2,
      8,
      9,
      10
    ],
    "WaterReq_L": 2420000,
    "WaterDepth_mm": 600,
    "Duration": "150 - 180 DAYS",
    "Irrigation": "REGULAR LIGHT IRRIGATION, AVOID SATURATION AT FLOWERING",
    "Soil": "WELL-DRAINED BLACK OR RED LOAM WITH PH 6.5 - 7.5",
    "Problems": [
      "THRIPS",
      "MITES",
      "FRUIT ROT / ANTHRACNOSE",
      "LEAF CURL"
    ],
    "Organic Care": [
      "BLUE STICKY TRAPS FOR THRIPS",
      "NEEM OIL 5 ML/L FOR SUCKING PESTS",
      "PSEUDOMONAS SEEDLING DIP"
    ],
    "Prevention": [
      "BORDER CROPS OF MAIZE/SORGHUM",
      "RAISED NURSERY BEDS",
      "CLEAN HARVESTING"
    ],
    "Spray Info": [
      "NEEM OIL 0.3% OR FISH AMINO ACID",
      "AVOID HOT SUNLIGHT APPLICATION"
    ],
    "Months": [
      "AUG TO OCT",
      "AND JAN TO FEB"
    ],
    "SeedRate_1Acre": 0.4
  },
  "Tomato": {
    "Season": [
      "AUTUMN / WINTER / SPRING"
    ],
    "Type": [
      "VEGETABLE CROP"
    ],
    "SowingMonths": [
      1,
      2,
      6,
      7,
      8,
      11,
      12
    ],
    "WaterReq_L": 2020000,
    "WaterDepth_mm": 500,
    "Duration": "110 - 135 DAYS",
    "Irrigation": "DRIP PREFERRED, UNIFORM MOISTURE PREVENTS FRUIT CRACKING",
    "Soil": "DEEP, FERTILE WELL-DRAINED SANDY LOAM RICH IN ORGANIC MATTER",
    "Problems": [
      "EARLY BLIGHT",
      "FRUIT BORER",
      "LEAF MINER",
      "BACTERIAL WILT"
    ],
    "Organic Care": [
      "TRICHODERMA ENRICHED FYM",
      "NEEM OIL SPRAY",
      "PHEROMONE TRAP (HELILURE)"
    ],
    "Prevention": [
      "STAKING FOR TALL VARIETIES",
      "MULCHING TO RETAIN MOISTURE",
      "DESTROY OLD VINES"
    ],
    "Spray Info": [
      "PSEUDOMONAS 10 G/L FOR BLIGHT",
      "APPLY ON BOTH LEAF SURFACES"
    ],
    "Months": [
      "JUL TO AUG",
      "AND NOV TO JAN"
    ],
    "SeedRate_1Acre": 0.2
  },
  "Brinjal": {
    "Season": [
      "YEAR ROUND / MAIN KHARIF & RABI"
    ],
    "Type": [
      "VEGETABLE CROP"
    ],
    "SowingMonths": [
      1,
      5,
      6,
      7,
      11,
      12
    ],
    "WaterReq_L": 2220000,
    "WaterDepth_mm": 550,
    "Duration": "130 - 150 DAYS",
    "Irrigation": "REGULAR INTERVAL IRRIGATION, SENSITIVE TO DROUGHT AT FRUITING",
    "Soil": "SILT LOAM OR CLAY LOAM WITH EXCELLENT DRAINAGE",
    "Problems": [
      "SHOOT AND FRUIT BORER",
      "LEAF ROLLER",
      "LITTLE LEAF",
      "DAMPING OFF"
    ],
    "Organic Care": [
      "PROMPT REMOVAL OF BORED SHOOTS",
      "LUCINLURE PHEROMONE TRAPS",
      "NEEM CAKE APPLICATION"
    ],
    "Prevention": [
      "AVOID CONTINUOUS SOLANACEOUS ROTATION",
      "DEEP SUMMER TILLAGE",
      "HEALTHY SEEDLING SELECTION"
    ],
    "Spray Info": [
      "BACILLUS THURINGIENSIS (BT) 2 G/L",
      "SPRAY WHEN BORER DAMAGE APPEARS"
    ],
    "Months": [
      "DEC TO JAN",
      "AND MAY TO JUL"
    ],
    "SeedRate_1Acre": 0.2
  },
  "Onion": {
    "Season": [
      "KHARIF / LATE KHARIF / RABI"
    ],
    "Type": [
      "BULB VEGETABLE"
    ],
    "SowingMonths": [
      1,
      2,
      5,
      6,
      10,
      11
    ],
    "WaterReq_L": 1620000,
    "WaterDepth_mm": 400,
    "Duration": "90 - 120 DAYS",
    "Irrigation": "FREQUENT LIGHT IRRIGATION, STOP 15 DAYS BEFORE HARVEST",
    "Soil": "FRIABLE SANDY LOAM, FREE FROM HARD PAN, PH 6.0 - 7.0",
    "Problems": [
      "THRIPS",
      "PURPLE BLOTCH",
      "BASAL ROT",
      "DOWNEY MILDEW"
    ],
    "Organic Care": [
      "BLUE STICKY TRAPS",
      "NEEM OIL 4 ML/L",
      "TRICHODERMA BULB DIP"
    ],
    "Prevention": [
      "RAISED NURSERY BEDS",
      "PROPER BULB CURING AFTER HARVEST",
      "CLEAN FIELD DRAINAGE"
    ],
    "Spray Info": [
      "PSEUDOMONAS FLUORESCENS 5 G/L",
      "SPRAY AT 15-DAY INTERVALS"
    ],
    "Months": [
      "MAY TO JUN",
      "AND OCT TO NOV"
    ],
    "SeedRate_1Acre": 4.0
  },
  "Maize": {
    "Season": [
      "KHARIF / RABI / SUMMER"
    ],
    "Type": [
      "GRAIN / FORAGE CROP"
    ],
    "SowingMonths": [
      1,
      2,
      7,
      8,
      9,
      10
    ],
    "WaterReq_L": 2020000,
    "WaterDepth_mm": 500,
    "Duration": "100 - 110 DAYS",
    "Irrigation": "CRITICAL AT TASSELING, SILKING AND DOUGH STAGES",
    "Soil": "WELL-DRAINED FERTILE LOAM WITH HIGH ORGANIC CONTENT",
    "Problems": [
      "FALL ARMYWORM",
      "STEM BORER",
      "TURCICUM LEAF BLIGHT"
    ],
    "Organic Care": [
      "HAND PICKING EGGS & CATERPILLARS",
      "NEEM SEED KERNEL EXTRACT 5%",
      "RELEASE TRICHOGRAMMA PARASITOIDS"
    ],
    "Prevention": [
      "INTERCROPPING WITH COWPEA",
      "BORDER PLANTINGS",
      "EARLY SYNCHRONOUS PLANTING"
    ],
    "Spray Info": [
      "BACILLUS THURINGIENSIS (BT) 2 G/L",
      "WHORL APPLICATION IN EARLY EVENING"
    ],
    "Months": [
      "JUL TO AUG",
      "AND JAN TO FEB"
    ],
    "SeedRate_1Acre": 8.0
  },
  "Ragi": {
    "Season": [
      "KHARIF / LATE KHARIF / SUMMER"
    ],
    "Type": [
      "NUTRITIOUS MILLET"
    ],
    "SowingMonths": [
      1,
      4,
      5,
      6,
      7,
      8,
      9,
      12
    ],
    "WaterReq_L": 1410000,
    "WaterDepth_mm": 350,
    "Duration": "95 - 110 DAYS",
    "Irrigation": "HIGHLY DROUGHT HARDY, IRRIGATE AT TILLERING & FLOWERING",
    "Soil": "FREE-DRAINING RED SANDY LOAM, ADAPTABLE TO LIGHT SOILS",
    "Problems": [
      "BLAST DISEASE",
      "STEM BORER",
      "RAGI APHIDS"
    ],
    "Organic Care": [
      "SEED TREATMENT WITH PSEUDOMONAS",
      "NEEM EXTRACT AT EARLY STAGES",
      "BIO-FERTILIZER (AZOSPIRILLUM)"
    ],
    "Prevention": [
      "USE RESISTANT VARIETIES (GPU)",
      "MAINTAIN WEED-FREE FIELD",
      "BALANCED ORGANIC MANURING"
    ],
    "Spray Info": [
      "PANCHAGAVYA 3% ON LEAVES",
      "SPRAY AT FLOWERING ONCE"
    ],
    "Months": [
      "MAY TO JUL",
      "AND DEC TO JAN"
    ],
    "SeedRate_1Acre": 5.0
  },
  "Cotton": {
    "Season": [
      "KHARIF / WINTER IRRIGATED / SUMMER"
    ],
    "Type": [
      "COMMERCIAL FIBRE CROP"
    ],
    "SowingMonths": [
      2,
      3,
      8,
      9
    ],
    "WaterReq_L": 2630000,
    "WaterDepth_mm": 650,
    "Duration": "150 - 165 DAYS",
    "Irrigation": "AVOID EXCESS WATER IN VEGETATIVE STAGE, CRITICAL AT BOLL DEVELOPMENT",
    "Soil": "DEEP BLACK COTTON SOIL OR FERTILE RED LOAM WITH DEEP ROOT ZONE",
    "Problems": [
      "BOLLWORMS",
      "WHITEFLY",
      "JASSIDS",
      "ROOT ROT"
    ],
    "Organic Care": [
      "YELLOW & WHITE STICKY TRAPS",
      "PHEROMONE TRAPS (5/ACRE)",
      "NEEM OIL 5 ML/L"
    ],
    "Prevention": [
      "CASTOR/MARIGOLD TRAP CROPPING",
      "DEEP PLOUGHING",
      "DESTROY STALKS AFTER HARVEST"
    ],
    "Spray Info": [
      "BEAUVERIA BASSIANA 5 G/L",
      "SPRAY DURING CALM WINDS"
    ],
    "Months": [
      "AUG TO SEP",
      "AND FEB TO MAR"
    ],
    "SeedRate_1Acre": 1.5
  },
  "Sesame": {
    "Season": [
      "SUMMER / KHARIF / RICE FALLOW"
    ],
    "Type": [
      "LOW-WATER OILSEED"
    ],
    "SowingMonths": [
      2,
      3,
      4,
      5,
      6,
      7,
      10,
      11
    ],
    "WaterReq_L": 890000,
    "WaterDepth_mm": 220,
    "Duration": "75 - 85 DAYS",
    "Irrigation": "VERY LOW WATER NEED, HIGHLY SENSITIVE TO EXCESS WATER",
    "Soil": "SANDY LOAM TO LIGHT LOAM WITH EXCELLENT DRAINAGE",
    "Problems": [
      "SHOOT WEBBER / POD BORER",
      "PHYLLODY",
      "ROOT ROT"
    ],
    "Organic Care": [
      "DESTROY EARLY LEAF WEBS",
      "NEEM SEED KERNEL EXTRACT",
      "ROGUING PHYLLODY PLANTS"
    ],
    "Prevention": [
      "SUMMER TILLAGE",
      "INTERCROPPING WITH PULSES",
      "AVOID LOW-LYING FIELDS"
    ],
    "Spray Info": [
      "NEEM OIL 3 ML/L",
      "SPRAY AT FLOWERING COMMENCEMENT"
    ],
    "Months": [
      "FEB TO APR",
      "AND JUN TO JUL"
    ],
    "SeedRate_1Acre": 2.0
  },
  "Bhendi": {
    "Season": [
      "KHARIF / SUMMER"
    ],
    "Type": [
      "VEGETABLE CROP"
    ],
    "SowingMonths": [
      2,
      3,
      6,
      7
    ],
    "WaterReq_L": 1700000,
    "WaterDepth_mm": 420,
    "Duration": "90 - 100 DAYS",
    "Irrigation": "IRRIGATE EVERY 4-6 DAYS IN SUMMER, CRITICAL AT FLOWERING",
    "Soil": "FERTILE LOAMY SOIL RICH IN HUMUS, PH 6.0 - 6.8",
    "Problems": [
      "YELLOW VEIN MOSAIC VIRUS",
      "FRUIT BORER",
      "APHIDS"
    ],
    "Organic Care": [
      "YELLOW STICKY TRAPS FOR WHITEFLIES",
      "NEEM OIL 5 ML/L",
      "BACILLUS THURINGIENSIS"
    ],
    "Prevention": [
      "SOW RESISTANT HYBRIDS",
      "REGULAR ROGUING OF DISEASED PLANTS",
      "CROP ROTATION"
    ],
    "Spray Info": [
      "NEEM SEED KERNEL EXTRACT 5%",
      "HARVEST FRUITS BEFORE SPRAYING"
    ],
    "Months": [
      "JUN TO JUL",
      "AND FEB TO MAR"
    ],
    "SeedRate_1Acre": 3.0
  },
  "Sugarcane": {
    "Season": [
      "SPECIAL / EARLY / MAIN SEASON"
    ],
    "Type": [
      "CASH / CANE CROP"
    ],
    "SowingMonths": [
      1,
      2,
      3,
      4,
      6,
      7,
      12
    ],
    "WaterReq_L": 6470000,
    "WaterDepth_mm": 1600,
    "Duration": "300 - 360 DAYS",
    "Irrigation": "HIGH WATER DEMAND, CRITICAL AT GRAND GROWTH PHASE",
    "Soil": "DEEP, FERTILE, RETENTIVE LOAM OR CLAY LOAM WITH DEEP TILTH",
    "Problems": [
      "EARLY SHOOT BORER",
      "INTERNODE BORER",
      "RED ROT",
      "WHITEFLY"
    ],
    "Organic Care": [
      "RELEASE TRICHOGRAMMA CHILONIS",
      "TRASH MULCHING",
      "SETT TREATMENT WITH TRICHODERMA"
    ],
    "Prevention": [
      "HEALTHY SETT SELECTION",
      "EARTHING UP AT 45 AND 90 DAYS",
      "CLEAN HARVESTING AT GROUND LEVEL"
    ],
    "Spray Info": [
      "NEEM EXTRACT AT FORMATION STAGE",
      "FOLIAR SPRAY DURING DRY SPELLS"
    ],
    "Months": [
      "DEC TO MAR",
      "AND JUN TO JUL"
    ],
    "SeedRate_1Acre": 30000.0
  },
  "Mango": {
    "Season": [
      "PERENNIAL ORCHARD"
    ],
    "Type": [
      "FRUIT TREE"
    ],
    "SowingMonths": [
      7,
      8,
      9,
      10,
      11,
      12
    ],
    "WaterReq_L": 1210000,
    "WaterDepth_mm": 300,
    "Duration": "PERENNIAL ORCHARD",
    "Irrigation": "SUPPLEMENTAL IRRIGATION DURING FLOWERING AND FRUIT SWELLING",
    "Soil": "DEEP ALLUVIAL, RED LOAM WITH GOOD INTERNAL DRAINAGE",
    "Problems": [
      "MANGO HOPPER",
      "POWDERY MILDEW",
      "FRUIT FLY",
      "ANTHRACNOSE"
    ],
    "Organic Care": [
      "PHEROMONE TRAPS (METHYL EUGENOL)",
      "NEEM OIL AT FLOWERING",
      "PRUNING DEAD WOOD"
    ],
    "Prevention": [
      "ORCHARD SANITATION",
      "DESTROY FALLEN FRUITS",
      "TREE SMOKING AT BLOSSOM"
    ],
    "Spray Info": [
      "NEEM OIL 5 ML/L OR SULPHUR DUST",
      "DO NOT SPRAY DURING PEAK POLLINATION"
    ],
    "Tree Info": [
      "SPACING: 8-10 METRES",
      "PIT SIZE: 1x1x1 METRE",
      "TRAINING IN EARLY 3 YEARS"
    ],
    "Months": [
      "PLANTING: JUL TO DEC",
      "FLOWERING: DEC TO FEB"
    ],
    "SeedRate_1Acre": 40.0
  },
  "Coconut": {
    "Season": [
      "PERENNIAL PALM"
    ],
    "Type": [
      "PLANTATION PALM"
    ],
    "SowingMonths": [
      5,
      6,
      9,
      10,
      11
    ],
    "WaterReq_L": 2830000,
    "WaterDepth_mm": 700,
    "Duration": "PERENNIAL PALM",
    "Irrigation": "40-50 LITRES/TREE/DAY VIA DRIP OR BASIN MULCHING",
    "Soil": "COASTAL SANDY LOAM, RED SANDY LOAM WITH WATER TABLE AT 1-2M",
    "Problems": [
      "RHINOCEROS BEETLE",
      "RED PALM WEEVIL",
      "ROOT TALL WILT",
      "ERIOPHYID MITE"
    ],
    "Organic Care": [
      "ORYCTES VIRUS & METARHIZIUM",
      "NEEM CAKE + SAND IN LEAF AXILS",
      "METHYL SALICYLATE TRAPS"
    ],
    "Prevention": [
      "CLEAN CROWN HYGIENE",
      "AVOID STEM INJURIES",
      "INTERCROPPING WITH COCOA / BANANA"
    ],
    "Spray Info": [
      "NEEM AZAL 1% ROOT FEEDING",
      "OR AZADIRACHTIN CROWN DRENCH"
    ],
    "Tree Info": [
      "SPACING: 7.5x7.5 METRES",
      "60 TREES PER ACRE",
      "DRIP IRRIGATION HIGHLY RECOMMENDED"
    ],
    "Months": [
      "PLANTING: MAY-JUN",
      "AND OCT-NOV"
    ],
    "SeedRate_1Acre": 70.0
  }
};

// ── 10 Structured Farmer Problems Database ────────────────────
const PROBLEMS = {
  "Stem Borer & Leaf Folder": {
    "crops": [
      "Paddy",
      "Maize"
    ],
    "symptoms": [
      "Dead hearts during early vegetative tillering stage",
      "White heads (chaffy panicles with no grain) at maturity",
      "Leaves longitudinally folded with scraped transparent epidermal patches"
    ],
    "causes": [
      "Scirpophaga incertulas (Yellow stem borer larvae bore into stem bases)",
      "Cnaphalocrocis medinalis (Leaf folder caterpillars weave leaf margins)",
      "Excessive nitrogen application and dense transplanting spacing"
    ],
    "solutions": [
      "Spray Chlorantraniliprole 18.5% SC @ 60 ml/acre or Cartap Hydrochloride 50% SP @ 400 g/acre",
      "Clip seedling tips before transplanting to eliminate egg masses",
      "Maintain alternate wetting and drying instead of continuous waterlogging"
    ],
    "organic": [
      "Release Trichogramma japonicum egg parasitoids @ 40,000/acre at weekly intervals",
      "Install pheromone traps (5 per acre) with Scirpophaga lures for monitoring",
      "Spray 5% Neem Seed Kernel Extract (NSKE) or Neem Oil @ 3-5 ml/L"
    ]
  },
  "Sucking Pest Complex (Aphids, Thrips, Whiteflies)": {
    "crops": [
      "Chilli",
      "Tomato",
      "Brinjal",
      "Cotton",
      "Black Gram",
      "Green Gram",
      "Groundnut",
      "Bhendi",
      "Onion"
    ],
    "symptoms": [
      "Upward or downward leaf curling, crinkling, and stunted terminal flushes",
      "Silvery sheen on underside of leaves with black fecal specks (thrips)",
      "Sooty mold development on sticky honeydew secreted by aphids/whiteflies",
      "Vector transmission of Yellow Vein Mosaic and Leaf Curl viruses"
    ],
    "causes": [
      "Thrips palmi, Bemisia tabaci, and Aphis gossypii feeding on phloem sap",
      "Dry, warm weather spells with low relative humidity"
    ],
    "solutions": [
      "Foliar spray with Imidacloprid 17.8% SL @ 50 ml/acre or Acetamiprid 20% SP @ 40 g/acre",
      "Grow 2-3 border rows of sorghum or maize to trap and buffer incoming pests",
      "Avoid spraying synthetic pyrethroids which induce pest resurgence"
    ],
    "organic": [
      "Erect yellow and blue sticky traps @ 10-12 traps per acre",
      "Spray Verticillium lecanii or Beauveria bassiana bio-fungicide @ 5 g/L",
      "Spray 10,000 ppm Azadirachtin / Neem oil @ 3 ml/L with mild soap sticker"
    ]
  },
  "Fruit, Shoot & Pod Borers": {
    "crops": [
      "Brinjal",
      "Tomato",
      "Chilli",
      "Bhendi",
      "Cotton",
      "Black Gram",
      "Green Gram"
    ],
    "symptoms": [
      "Wilting and drooping of tender apical shoots in vegetative stage",
      "Circular boreholes on fruits and pods with extruded larval frass",
      "Premature dropping of flower buds and unmarketable distorted fruits"
    ],
    "causes": [
      "Leucinodes orbonalis (Brinjal shoot & fruit borer)",
      "Helicoverpa armigera (Tomato / Cotton bollworm)",
      "Earias vittella (Spotted bollworm in Bhendi and Cotton)"
    ],
    "solutions": [
      "Spray Flubendiamide 39.35% SC @ 40 ml/acre or Emamectin Benzoate 5% SG @ 80 g/acre",
      "Collect and deep-bury infested fruits and withered terminal shoots weekly",
      "Observe safety waiting periods (pre-harvest interval) before picking"
    ],
    "organic": [
      "Install species-specific sex pheromone traps @ 5-8 traps/acre",
      "Spray Bacillus thuringiensis (Bt var. kurstaki) @ 2 g/L during twilight hours",
      "Apply Neem cake to the soil @ 100 kg/acre at the time of planting"
    ]
  },
  "Fungal Blights, Leaf Spots & Blast": {
    "crops": [
      "Paddy",
      "Groundnut",
      "Tomato",
      "Chilli",
      "Onion",
      "Ragi"
    ],
    "symptoms": [
      "Spindle-shaped lesions with grayish centers and brown borders (Paddy Blast)",
      "Circular dark necrotic spots surrounded by yellow halos (Groundnut Tikka)",
      "Concentric rings producing 'target board' lesions on leaves (Tomato Early Blight)"
    ],
    "causes": [
      "Magnaporthe oryzae (Pyricularia), Cercospora personata, Alternaria solani",
      "High relative humidity (>85%), cloudy weather, and leaf wetness duration > 10 hours"
    ],
    "solutions": [
      "Spray Tricyclazole 75% WP @ 120 g/acre for Blast or Mancozeb 75% WP @ 400 g/acre for Blight",
      "Ensure balanced fertilization: avoid excess nitrogen and supply adequate potassium",
      "Remove lower infected leaves to prevent upward fungal spore splash"
    ],
    "organic": [
      "Seed treatment with Trichoderma viride @ 4 g/kg seed or Pseudomonas fluorescens @ 10 g/kg",
      "Foliar spray with Pseudomonas fluorescens @ 5 g/L or 1% Bordeaux mixture",
      "Soil enrichment with farmyard manure composted with Trichoderma"
    ]
  },
  "Powdery Mildew & Rusts": {
    "crops": [
      "Green Gram",
      "Black Gram",
      "Bhendi",
      "Mango",
      "Sesame",
      "Chilli"
    ],
    "symptoms": [
      "White talcum-like powdery fungal growth on upper and lower leaf surfaces",
      "Yellowish-brown chlorotic spots on corresponding upper leaf surfaces",
      "Blossom blighting and fruit drop in mango inflorescences"
    ],
    "causes": [
      "Erysiphe polygoni, Oidium mangiferae, and Leveillula taurica",
      "Warm days coupled with cool, humid nights in winter and spring"
    ],
    "solutions": [
      "Foliar spray of Wettable Sulfur 80% WDG @ 500 g/acre or Hexaconazole 5% EC @ 200 ml/acre",
      "Spray during early morning or late afternoon to prevent sulfur phytotoxicity",
      "Prune crowded, crossing canopy branches to improve sunlight penetration"
    ],
    "organic": [
      "Foliar spray of 10% unboiled fresh cow milk or diluted sour butter milk",
      "Spray Ampelomyces quisqualis hyperparasitic bio-fungicide @ 5 g/L",
      "Apply micronized organic wettable sulfur formulations at first onset"
    ]
  },
  "Wilt & Root Rot Complex": {
    "crops": [
      "Cotton",
      "Chilli",
      "Tomato",
      "Groundnut",
      "Sugarcane",
      "Black Gram"
    ],
    "symptoms": [
      "Sudden flaccidity, drooping, and yellowing of foliage despite moist soil",
      "Dark brown vascular discoloration visible when lower stem is sliced lengthwise",
      "Shredded, decayed cortical root tissues with black sclerotial bodies"
    ],
    "causes": [
      "Fusarium oxysporum, Rhizoctonia solani, and Macrophomina phaseolina",
      "Poor soil aeration, compaction, and root damage from nematodes or waterlogging"
    ],
    "solutions": [
      "Drench collar zone with Copper Oxychloride 50% WP @ 2.5 g/L or Carbendazim @ 1 g/L",
      "Adopt raised broad-bed and furrow cultivation to avoid standing moisture at root collars",
      "Practice 3-year crop rotation with non-host cereals or millets"
    ],
    "organic": [
      "Treat seeds with Trichoderma harzianum @ 10 g/kg seed before sowing",
      "Soil application of 1 kg Trichoderma mixed in 100 kg well-cured FYM per acre",
      "Drench root zone with Panchagavya (3% solution) or Jeevamrutha slurry"
    ]
  },
  "Pond Water Shortage & Drought Management": {
    "crops": [
      "All Crops"
    ],
    "symptoms": [
      "Pond depth dropping below 1.0 metre (<20% storage capacity)",
      "Leaf rolling, wilting during noon hours, and premature flower shedding",
      "Tip drying and reduced tillering/branching across field crops"
    ],
    "causes": [
      "Prolonged dry spell, delayed monsoon replenishment, and high evaporation losses",
      "Over-irrigation in early stages exhausting farm pond storage"
    ],
    "solutions": [
      "Switch strictly to micro-irrigation (drip / micro-sprinklers) to conserve 40-60% water",
      "Prioritize irrigation only during critical stages (flowering and grain/fruit filling)",
      "Irrigate during evening and night hours to minimize surface evaporation"
    ],
    "organic": [
      "Apply organic mulching with dry crop residue/straw (5 cm thickness) across beds",
      "Spray 1% Potassium Chloride (MOP) or Kaolin 5% as anti-transpirant to reduce leaf water loss",
      "Foliar spray with Pink Pigmented Facultative Methylotrophs (PPFM) @ 2 ml/L"
    ]
  },
  "Waterlogging & Poor Drainage Stress": {
    "crops": [
      "Groundnut",
      "Black Gram",
      "Green Gram",
      "Chilli",
      "Tomato",
      "Cotton",
      "Sesame"
    ],
    "symptoms": [
      "Uniform yellowing of leaves (nitrogen leaching and root hypoxia)",
      "Root decay, blackening, and sour fermentation odor from soil",
      "Premature leaf drop and stunting of newly emerging flushes"
    ],
    "causes": [
      "Heavy monsoon downpours exceeding pond inflow diversion capacity",
      "Impermeable subsoil hardpan and absence of field drainage furrows"
    ],
    "solutions": [
      "Excavate temporary surface drainage channels (30 cm deep) to drain standing ponding within 12 hours",
      "Apply light foliar spray of 1% Urea + 0.5% Micronutrient mix once drainage is established",
      "Incorporate gypsum (200 kg/acre) in clay soils to enhance soil permeability"
    ],
    "organic": [
      "Spray fermented curd-extract or Panchagavya 3% to revive root metabolic function",
      "Apply vermicompost enriched with Pseudomonas to check anaerobic fungal pathogens",
      "Loosen topsoil between crop rows using a hand wheel-hoe once surface dries"
    ]
  },
  "Weed Competition & Field Cleanliness": {
    "crops": [
      "All Crops"
    ],
    "symptoms": [
      "Crop yellowing and severe yield suppression due to weed canopy shading",
      "Competition for 30-50% of available soil moisture and applied nutrients",
      "Weed stands serving as alternate overwintering hosts for pests and viruses"
    ],
    "causes": [
      "Echinochloa, Cyperus rotundus, Parthenium hysterophorus, and Trianthema portulacastrum",
      "Delayed critical-period weeding (first 20 to 45 days after sowing)"
    ],
    "solutions": [
      "Execute first mechanical/manual weeding at 15-20 DAS and second at 35-40 DAS",
      "Use cono-weeder in SRI paddy at 10-day intervals to incorporate weeds as green manure",
      "Apply pre-emergence herbicide like Pendimethalin 30% EC @ 1.0 L/acre within 3 days of sowing"
    ],
    "organic": [
      "Practice intercropping with smother crops like Cowpea, Black Gram, or Sunnhemp",
      "Lay biodegradable coir pith or paddy straw mulch across vegetable furrows",
      "Deploy wheel-hoe intercultivation between crop rows during early seedling stages"
    ]
  },
  "Soil Salinity & Organic Matter Depletion": {
    "crops": [
      "All Crops"
    ],
    "symptoms": [
      "White or grayish salt encrustation on ridges and furrow beds",
      "Marginal leaf scorching, poor seed germination, and patchy crop establishment",
      "Soil hardening, surface crusting, and poor water infiltration"
    ],
    "causes": [
      "Continuous irrigation with brackish water without periodic leaching",
      "Absence of farmyard manure, green manuring, and crop residue recycling"
    ],
    "solutions": [
      "Conduct routine soil health tests (pH, EC, Organic Carbon, Available NPK)",
      "Leach excess salts with good-quality pond water through drainage ditches",
      "Apply agricultural gypsum @ 1-2 tonnes/acre based on ESP (Exchangeable Sodium Percentage)"
    ],
    "organic": [
      "Grow and incorporate green manure crops (Daincha / Sesbania or Sunnhemp) at 45 days",
      "Apply 5 tonnes well-decomposed FYM or 2 tonnes vermicompost per acre annually",
      "Inoculate soil with bio-fertilizers: Azospirillum, Phosphobacteria, and VAM"
    ]
  }
};

// ============================================================
// TAB NAVIGATION & SYNCHRONIZATION
// ============================================================

$$('.tab-button').forEach(btn => {
  btn.addEventListener('click', () => {
    switchTab(btn.dataset.tab);
  });
});

function switchTab(tabId) {
  $$('.tab-button').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
  $$('.tab-page').forEach(p => p.classList.toggle('active', p.id === tabId));
  document.body.classList.toggle('tab-live-active', tabId === 'tab-live');
}

// ============================================================
// POND WATER & RECOMMENDATION TELEMETRY UI
// ============================================================

function updatePondTelemetryUI(data) {
  if (!data) return;

  if (data.pm) pondTelemetry.mode = data.pm;
  if (data.sr !== undefined) pondTelemetry.sensorDist = data.sr;
  if (data.wd !== undefined) pondTelemetry.waterDepth = Number(data.wd) || 0;
  if (data.wv !== undefined) pondTelemetry.waterLitres = data.wv !== null ? Number(data.wv) : null;
  if (data.wp !== undefined) pondTelemetry.waterPct = data.wp !== null ? Number(data.wp) : null;
  if (data.mo) pondTelemetry.month = data.mo;
  if (data.se) pondTelemetry.season = data.se;
  if (Array.isArray(data.rc)) pondTelemetry.recCrops = data.rc;
  if (data.cc) pondTelemetry.currentCrop = data.cc;
  if (data.tc !== undefined) pondTelemetry.tankWaterCm = data.tc !== null ? Number(data.tc) : null;
  if (data.ss !== undefined) pondTelemetry.sensorStatus = data.ss;

  const nowTime = new Date().toLocaleTimeString();

  // Overview Tab UI
  const depthEl = $('pondDepth');
  if (depthEl) {
    if (pondTelemetry.mode === 'pond') {
      const status = pondTelemetry.sensorStatus || 'OK';
      if (status === 'TIMEOUT' || status === 'NO_ECHO') {
        depthEl.textContent = 'Sensor Timeout';
      } else if (status === 'TOO_CLOSE') {
        depthEl.textContent = 'Too Close (<3.5cm)';
      } else if (status === 'OUT_OF_RANGE') {
        depthEl.textContent = 'Out of Range (>25cm)';
      } else {
        depthEl.textContent = pondTelemetry.waterDepth !== null
          ? pondTelemetry.waterDepth.toFixed(2) + ' m'
          : '0.00 m';
      }
    } else {
      depthEl.textContent = 'Seasonal Est.';
    }
  }

  const litresEl = $('pondLitres');
  if (litresEl) {
    const status = pondTelemetry.sensorStatus || 'OK';
    if (pondTelemetry.mode === 'pond' && (status === 'TIMEOUT' || status === 'NO_ECHO')) {
      litresEl.textContent = 'Sensor Timeout';
    } else if (pondTelemetry.mode === 'pond' && status === 'TOO_CLOSE') {
      litresEl.textContent = 'Warning: Overfilled';
    } else {
      litresEl.textContent = pondTelemetry.waterLitres !== null && pondTelemetry.waterLitres > 0
        ? pondTelemetry.waterLitres.toLocaleString() + ' L'
        : (pondTelemetry.mode === 'pond' ? '0 Litres (Dry)' : 'Seasonal Normal');
    }
  }

  const volM3El = $('pondVolumeM3');
  if (volM3El) {
    if (pondTelemetry.waterLitres !== null && pondTelemetry.waterLitres > 0) {
      const m3 = (pondTelemetry.waterLitres / 1000).toFixed(0);
      volM3El.textContent = `${m3} m³ usable · 75% eff. (0.3m dead storage · 1-acre model)`;
    } else {
      volM3El.textContent = '75% Irrig. Eff. · Dead Storage 0.3m · 1-acre model';
    }
  }

  const pctEl = $('pondPct');
  if (pctEl) {
    const status = pondTelemetry.sensorStatus || 'OK';
    if (pondTelemetry.mode === 'pond' && (status === 'TIMEOUT' || status === 'NO_ECHO')) {
      pctEl.textContent = '—';
    } else if (pondTelemetry.mode === 'pond' && status === 'TOO_CLOSE') {
      pctEl.textContent = '100%+';
    } else {
      pctEl.textContent = pondTelemetry.waterPct !== null && pondTelemetry.waterPct > 0
        ? pondTelemetry.waterPct.toFixed(1) + '%'
        : (pondTelemetry.mode === 'pond' ? '0%' : 'Normal');
    }
  }

  const fillBar = $('pondFillBar');
  if (fillBar) {
    const status = pondTelemetry.sensorStatus || 'OK';
    if (pondTelemetry.mode === 'pond' && (status === 'TIMEOUT' || status === 'NO_ECHO')) {
      fillBar.style.width = '0%';
    } else {
      const pct = pondTelemetry.waterPct !== null ? Math.min(100, Math.max(0, pondTelemetry.waterPct)) : 0;
      fillBar.style.width = pct + '%';
      if (pct < 25) {
        fillBar.style.background = 'linear-gradient(90deg, #ef4444, #f97316)';
      } else if (pct < 50) {
        fillBar.style.background = 'linear-gradient(90deg, #f59e0b, #eab308)';
      } else {
        fillBar.style.background = 'linear-gradient(90deg, #38bdf8 0%, #2563eb 50%, #10b981 100%)';
      }
    }
  }

  const monthSeasonEl = $('pondMonthSeason');
  if (monthSeasonEl) {
    monthSeasonEl.textContent = `${pondTelemetry.month} · ${pondTelemetry.season}`;
  }

  const badgeEl = $('pondModeBadge');
  if (badgeEl) {
    if (pondTelemetry.mode === 'pond') {
      badgeEl.textContent = '💧 Based on Pond Level';
      badgeEl.className = 'pond-mode-badge badge-pond';
    } else {
      badgeEl.textContent = '📅 Default Seasonal Level';
      badgeEl.className = 'pond-mode-badge badge-default';
    }
  }

  const countEl = $('pondCropCount');
  if (countEl) countEl.textContent = pondTelemetry.recCrops.length;

  const countRecCropsEl = $('countRecCrops');
  if (countRecCropsEl) countRecCropsEl.textContent = pondTelemetry.recCrops.length;

  // Render clickable crop chips
  const chipsEl = $('pondCropList');
  if (chipsEl) {
    if (pondTelemetry.recCrops.length > 0) {
      chipsEl.innerHTML = pondTelemetry.recCrops.map(name => {
        const crop = CROPS[name];
        const waterStr = crop && crop.WaterReq_L ? `${(crop.WaterReq_L / 1000000).toFixed(1)}M L/ac` : '';
        return `<span class="crop-chip" data-crop="${esc(name)}">
          <span>${getCropIcon(name)} ${esc(name)}</span>
          ${waterStr ? `<span class="chip-water">${waterStr}</span>` : ''}
        </span>`;
      }).join('');

      chipsEl.querySelectorAll('.crop-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          const cName = chip.dataset.crop;
          switchTab('tab-crops');
          selectCrop(cName);
        });
      });
    } else {
      chipsEl.innerHTML = '<span class="chip-empty">No crops meet current water & seasonal criteria. Check pond storage.</span>';
    }
  }

  // Refresh tabs dynamically
  buildCropLibrary();
  buildProblems();
  updateCalculatorCropList();
}

// ============================================================
// CROP LIBRARY TAB
// ============================================================

function buildCropLibrary() {
  const grid = $('cropGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const allNames = Object.keys(CROPS);
  const countAll = $('countAllCrops');
  if (countAll) countAll.textContent = allNames.length;

  let filtered = allNames;

  // Filter mode: recommended only
  if (cropFilterMode === 'rec' && pondTelemetry.recCrops.length > 0) {
    filtered = filtered.filter(name => pondTelemetry.recCrops.includes(name));
  }

  // Search filter
  if (cropSearchQuery.trim()) {
    const q = cropSearchQuery.toLowerCase();
    filtered = filtered.filter(name => {
      const d = CROPS[name];
      return name.toLowerCase().includes(q) ||
        (d.Type && d.Type.join(' ').toLowerCase().includes(q)) ||
        (d.Season && d.Season.join(' ').toLowerCase().includes(q)) ||
        (d.Soil && d.Soil.toLowerCase().includes(q));
    });
  }

  // Sort so recommended crops based on pond level selection come first, followed by all remaining crops
  if (pondTelemetry.recCrops && pondTelemetry.recCrops.length > 0) {
    filtered.sort((a, b) => {
      const aRec = pondTelemetry.recCrops.includes(a);
      const bRec = pondTelemetry.recCrops.includes(b);
      if (aRec && !bRec) return -1;
      if (!aRec && bRec) return 1;
      if (aRec && bRec) {
        return pondTelemetry.recCrops.indexOf(a) - pondTelemetry.recCrops.indexOf(b);
      }
      return 0;
    });
  }

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="muted" style="grid-column:1/-1; padding:20px; text-align:center;">No crops match your current filter.</div>';
    return;
  }

  filtered.forEach(name => {
    const d = CROPS[name];
    const isRec = pondTelemetry.recCrops.includes(name);
    const btn = document.createElement('button');
    btn.className = 'crop-btn' + (isRec ? ' is-recommended' : '');
    btn.id = 'cropbtn-' + name.replace(/[^a-zA-Z0-9]/g, '_');

    const waterStr = d.WaterReq_L ? `${(d.WaterReq_L / 1000000).toFixed(1)}M L/acre (${d.WaterDepth_mm || '--'}mm)` : '';

    btn.innerHTML = `
      <span class="crop-name">${getCropIcon(name)} ${esc(name)}</span>
      ${waterStr ? `<span class="crop-water-pill">💧 ${waterStr}</span>` : ''}
      <span class="crop-hint">${isRec ? 'Eligible for Mode' : 'Cultivation Guide'}</span>
    `;
    btn.addEventListener('click', () => selectCrop(name));
    grid.appendChild(btn);
  });

  if (selectedCrop && filtered.includes(selectedCrop)) {
    selectCrop(selectedCrop);
  } else if (filtered.length > 0) {
    selectCrop(filtered[0]);
  }
}

function selectCrop(name) {
  selectedCrop = name;
  $$('.crop-btn').forEach(b => b.classList.toggle('selected', b.id === 'cropbtn-' + name.replace(/[^a-zA-Z0-9]/g, '_')));
  renderCropDetail(name);
}

function renderCropDetail(name) {
  const d = CROPS[name];
  if (!d) return;
  const detail = $('cropDetail');
  if (!detail) return;

  const isRec = pondTelemetry.recCrops.includes(name);

  const makeList = (title, items) => {
    if (!items || !items.length) return '';
    return `<div class="detail-section">
      <div class="detail-label">${esc(title)}</div>
      <ul>${items.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
    </div>`;
  };

  const makeText = (title, text) => {
    if (!text) return '';
    return `<div class="detail-section">
      <div class="detail-label">${esc(title)}</div>
      <p style="margin:4px 0 0; color:var(--text-body); font-size:14px;">${esc(text)}</p>
    </div>`;
  };

  const waterFormatted = d.WaterReq_L
    ? `${d.WaterReq_L.toLocaleString()} Litres/acre (~${d.WaterDepth_mm} mm total crop water requirement)`
    : 'Not specified';

  detail.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
      <h3 class="detail-crop-title" style="margin:0;">${getCropIcon(name)} ${esc(name)}</h3>
      ${isRec ? '<span class="pond-mode-badge badge-pond">Eligible in Active Mode</span>' : '<span class="pond-mode-badge badge-default">General Crop Library</span>'}
    </div>
    ${makeText('Crop Water Requirement (1 Acre)', waterFormatted)}
    ${makeText('Crop Duration', d.Duration)}
    ${makeText('Irrigation Schedule & Water Critical Stages', d.Irrigation)}
    ${makeText('Suitable Soil Type & pH', d.Soil)}
    ${makeList('Season & Sowing Windows', d.Season)}
    ${makeList('Crop Classification', d.Type)}
    ${makeList('Common Pests & Field Problems', d.Problems)}
    ${makeList('Organic Care & Biocontrol Practices', d['Organic Care'])}
    ${makeList('Preventive Agronomic Measures', d.Prevention)}
    ${makeList('Spray Formulation & Label Guide', d['Spray Info'])}
    ${d['Tree Info'] ? makeList('Tree Canopy & Spacing Info', d['Tree Info']) : ''}
    ${makeList('Optimal Sowing Months (Tamil Nadu Calendar)', d.Months)}
  `;
}

function highlightActiveCrop(name) {
  if (!name) return;
  $$('.crop-btn').forEach(btn => {
    const isCurrent = btn.id === 'cropbtn-' + name.replace(/[^a-zA-Z0-9]/g, '_');
    btn.classList.toggle('oled-active', isCurrent);
    if (isCurrent) {
      const hint = btn.querySelector('.crop-hint');
      if (hint) hint.textContent = '📟 Active on OLED';
    }
  });
}

// ============================================================
// FARMER PROBLEMS TAB (SYMPTOMS, CAUSES, SOLUTIONS, ORGANIC)
// ============================================================

function buildProblems() {
  const grid = $('problemGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const problemKeys = Object.keys(PROBLEMS);

  let filtered = problemKeys;
  if (problemFilterMode === 'rec' && pondTelemetry.recCrops.length > 0) {
    // Filter problems associated with eligible crops
    filtered = filtered.filter(pName => {
      const p = PROBLEMS[pName];
      if (!p || !p.crops) return true;
      if (p.crops.includes('All Crops')) return true;
      return p.crops.some(c => pondTelemetry.recCrops.includes(c));
    });
  }

  filtered.forEach(name => {
    const p = PROBLEMS[name];
    const card = document.createElement('div');
    card.className = 'problem-card';

    const cropsBadge = p.crops ? `<div style="font-size:11.5px; color:#047857; margin-bottom:8px; font-weight:600;">🎯 Relevant to: ${p.crops.join(', ')}</div>` : '';

    const formatList = (title, items) => {
      if (!items || !items.length) return '';
      return `<div style="margin-top:8px;">
        <strong style="font-size:12px; text-transform:uppercase; color:var(--text-muted);">${title}:</strong>
        <ul style="margin:4px 0 0; padding-left:16px;">${items.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      </div>`;
    };

    card.innerHTML = `
      <div class="problem-title">${esc(name)}</div>
      ${cropsBadge}
      ${formatList('Symptoms', p.symptoms)}
      ${formatList('Causes', p.causes)}
      ${formatList('Field Solutions & Spray Advice', p.solutions)}
      ${formatList('Organic Care & Biocontrol', p.organic)}
    `;
    grid.appendChild(card);
  });
}

// ============================================================
// SEED RATE & 1-ACRE POND WATER CALCULATOR TAB
// ============================================================

function updateCalculatorCropList() {
  const sel = $('calcCrop');
  if (!sel) return;
  const currentVal = sel.value;
  sel.innerHTML = '<option value="" disabled>Select crop…</option>';

  const allNames = Object.keys(CROPS);

  if (pondTelemetry.recCrops.length > 0) {
    const optGroupRec = document.createElement('optgroup');
    optGroupRec.label = '🌱 Eligible Crops for Selected Mode';
    pondTelemetry.recCrops.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = `${getCropIcon(name)} ${name}`;
      optGroupRec.appendChild(opt);
    });
    sel.appendChild(optGroupRec);
  }

  const optGroupAll = document.createElement('optgroup');
  optGroupAll.label = 'All 16 Crops';
  allNames.forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = `${getCropIcon(name)} ${name}`;
    optGroupAll.appendChild(opt);
  });
  sel.appendChild(optGroupAll);

  if (currentVal && allNames.includes(currentVal)) {
    sel.value = currentVal;
  } else if (pondTelemetry.recCrops.length > 0) {
    sel.value = pondTelemetry.recCrops[0];
  } else {
    sel.value = 'Paddy';
  }

  syncDefaultSeedRate();
}

function syncDefaultSeedRate() {
  const sel = $('calcCrop');
  const rateInput = $('calcRate');
  if (!sel || !rateInput) return;
  const crop = sel.value;
  const cData = CROPS[crop];
  if (cData && cData.SeedRate_1Acre) {
    rateInput.value = cData.SeedRate_1Acre;
  }
}

function setupCalculator() {
  const calcBtn = $('calcBtn');
  const calcResult = $('calcResult');
  const sel = $('calcCrop');
  if (!calcBtn) return;

  if (sel) {
    sel.addEventListener('change', syncDefaultSeedRate);
  }

  calcBtn.addEventListener('click', () => {
    const area  = parseFloat($('calcArea').value) || 1.0;
    const rate  = parseFloat($('calcRate').value);
    const crop  = $('calcCrop').value;

    if (isNaN(rate) || rate <= 0) {
      calcResult.innerHTML = '<span class="calc-error">⚠ Please enter a valid seed rate.</span>';
      return;
    }

    const total = (area * rate).toFixed(2);
    const unit  = (crop === 'Mango' || crop === 'Coconut') ? 'trees / palms' : (crop === 'Sugarcane' ? 'setts' : 'kg seed');

    let waterInfo = '';
    const cropData = CROPS[crop];
    if (cropData && cropData.WaterReq_L) {
      const cropLitres = cropData.WaterReq_L * area;
      const cropM3 = (cropLitres / 1000).toFixed(0);
      const pondAvailable = pondTelemetry.waterLitres;
      let pondCompare = '';

      if (pondTelemetry.mode === 'pond' && pondAvailable > 0) {
        const canSustain = pondAvailable >= cropLitres;
        pondCompare = canSustain
          ? `<div class="calc-row" style="color:#047857;"><span>Pond Water Adequacy</span><strong>✔ Usable pond water sufficient (${(pondAvailable - cropLitres).toLocaleString()} L surplus)</strong></div>`
          : `<div class="calc-row" style="color:#dc2626;"><span>Pond Water Adequacy</span><strong>⚠ Deficit of ${(cropLitres - pondAvailable).toLocaleString()} L from current pond storage</strong></div>`;
      } else if (pondTelemetry.mode === 'default') {
        pondCompare = '<div class="calc-row" style="color:#0284c7;"><span>Mode</span><strong>Default Seasonal Recommendation Mode</strong></div>';
      }

      waterInfo = `
        <div class="calc-row"><span>Crop Water Demand (${area} Acre)</span><strong>${cropLitres.toLocaleString()} L (~${cropM3} m³)</strong></div>
        ${pondCompare}
      `;
    }

    calcResult.innerHTML = `
      <div class="calc-answer">
        <div class="calc-row"><span>Crop</span><strong>${esc(crop)}</strong></div>
        <div class="calc-row"><span>Field Area</span><strong>${area} Acre (1-Acre Pond Setup)</strong></div>
        <div class="calc-row"><span>Seed Rate</span><strong>${rate} ${unit}/acre</strong></div>
        <div class="calc-row total-row"><span>Total Requirement</span><strong>${total} ${unit}</strong></div>
        ${waterInfo}
      </div>
    `;
  });

  updateCalculatorCropList();
}

// ============================================================
// LIVE DISPLAY & AUTOMATIC TAB SYNCHRONIZATION
// ============================================================

function renderLiveScreen(data) {
  const lines = Array.isArray(data.l) ? data.l : [];
  const screen = (data.s || '').trim();

  // Update status bar
  const liveTitle = $('liveScreenTitle');
  if (liveTitle) liveTitle.textContent = screen || 'FARMER ATI';

  const liveTime = $('liveScreenTime');
  if (liveTime) liveTime.textContent = new Date().toLocaleTimeString();

  // Render lines in Kiosk
  const container = $('liveLines');
  if (container) {
    if (!lines.length) {
      container.innerHTML = '<div class="live-empty">Waiting for ESP32 screen update…</div>';
    } else {
      container.innerHTML = lines.map((text, i) => {
        let cls = 'live-line';
        if (i === 0 && text.length <= 20) cls += ' live-heading';
        else if (text.startsWith('>')) cls += ' live-selected';
        else if (text.match(/^[A-Z ]+:$/)) cls += ' live-label';
        return `<div class="${cls}">${esc(text)}</div>`;
      }).join('');
    }
  }

  // Active crop identification
  let activeCrop = data.cc || '';
  if (!activeCrop) {
    const visible = lines.join(' ').toLowerCase();
    Object.keys(CROPS).forEach(name => {
      if (visible.includes(name.toLowerCase())) activeCrop = name;
    });
  }

  const screenName = $('statScreen');
  if (screenName) screenName.textContent = screen || '—';

  const activeCropEl = $('statCrop');
  if (activeCropEl) activeCropEl.textContent = activeCrop || '—';

  if (activeCrop) highlightActiveCrop(activeCrop);

  // Update Telemetry UI
  updatePondTelemetryUI(data);

  // ════════════════════════════════════════════════════════
  // AUTOMATIC OLED -> WEBSITE TAB SYNCHRONIZATION
  // ════════════════════════════════════════════════════════
  const sUpper = screen.toUpperCase();
  if (sUpper !== lastScreenName) {
    lastScreenName = sUpper;

    if (sUpper.includes('CROP LIBRARY') || sUpper.includes('SUITABLE')) {
      switchTab('tab-crops');
    } else if (sUpper.includes('FARMER PROBLEMS') || sUpper.includes('PROBLEMS')) {
      switchTab('tab-problems');
    } else if (sUpper.includes('POND LEVEL')) {
      switchTab('tab-overview');
    }

    // If OLED opened a specific crop guide, automatically select it on website
    if (activeCrop && CROPS[activeCrop]) {
      switchTab('tab-crops');
      selectCrop(activeCrop);
    }
  }

  frameCount++;
  const fc = $('frameCount');
  if (fc) fc.textContent = frameCount;
}

// ============================================================
// RELIABLE BINARY PACKET PROTOCOL & REASSEMBLY
// ============================================================

const MAGIC_0 = 0xFA;
const MAGIC_1 = 0x72; // Protocol identifier for text-based JSON mirror
const HEADER_SIZE = 5;

const activeAssemblers = new Map();

const debugStats = {
  packetsReceived: 0,
  messagesCompleted: 0,
  droppedIncomplete: 0,
  jsonErrors: 0,
  lastError: 'None',
  lastCompletedMsgId: null,
  lastSyncTime: '—',
  lastHex: '—',
  lastJson: '—'
};

function updateDebugUI(latestHex, latestIdx, latestTotal) {
  const hexEl = $('debugHex');
  if (hexEl && latestHex) hexEl.textContent = latestHex;

  const progEl = $('debugProgress');
  if (progEl) {
    if (latestIdx !== undefined && latestTotal !== undefined) {
      progEl.textContent = `Packet ${latestIdx + 1} of ${latestTotal} (Msg ID: ${debugStats.lastMsgId ?? '—'}, Total packets received: ${debugStats.packetsReceived})`;
    } else {
      progEl.textContent = `Packets received: ${debugStats.packetsReceived}, Messages completed: ${debugStats.messagesCompleted}`;
    }
  }

  const jsonEl = $('debugJson');
  if (jsonEl && debugStats.lastJson) jsonEl.textContent = debugStats.lastJson;

  const statusEl = $('debugStatus');
  if (statusEl) {
    if (debugStats.lastError === 'None') {
      statusEl.textContent = `OK — Message ${debugStats.lastCompletedMsgId ?? '—'} rendered at ${debugStats.lastSyncTime}`;
      statusEl.className = 'debug-ok';
    } else {
      statusEl.textContent = `Error: ${debugStats.lastError} (Total errors: ${debugStats.jsonErrors})`;
      statusEl.className = 'debug-error';
    }
  }

  const p = $('debugPackets');
  if (p) p.textContent = debugStats.packetsReceived;

  const m = $('debugMessages');
  if (m) m.textContent = debugStats.messagesCompleted;

  const d = $('debugDropped');
  if (d) d.textContent = debugStats.droppedIncomplete;

  const e = $('debugErrors');
  if (e) e.textContent = debugStats.jsonErrors;

  const s = $('debugLastSync');
  if (s) s.textContent = debugStats.lastSyncTime;

  const fc = $('frameCount');
  if (fc) fc.textContent = debugStats.messagesCompleted;
}

function handleNotification(event) {
  const value = event.target.value;
  if (!value || value.byteLength === 0) return;

  const bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  debugStats.packetsReceived++;

  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
  debugStats.lastHex = hex;

  if (bytes.length < HEADER_SIZE + 1) {
    debugStats.jsonErrors++;
    debugStats.lastError = `Packet too small (${bytes.length} bytes): ${hex}`;
    updateDebugUI(hex);
    return;
  }

  if (bytes[0] !== MAGIC_0 || bytes[1] !== MAGIC_1) {
    debugStats.jsonErrors++;
    debugStats.lastError = `Ignored non-protocol packet: Header [${bytes[0].toString(16).toUpperCase()}, ${bytes[1].toString(16).toUpperCase()}]. Expected [FA, 72].`;
    updateDebugUI(hex);
    return;
  }

  const msgId = bytes[2];
  const pktIdx = bytes[3];
  const totalPkts = bytes[4];
  const chunkData = bytes.slice(HEADER_SIZE);
  debugStats.lastMsgId = msgId;

  if (totalPkts === 0 || pktIdx >= totalPkts) {
    debugStats.jsonErrors++;
    debugStats.lastError = `Corrupt header: pkt ${pktIdx} >= total ${totalPkts}`;
    updateDebugUI(hex, pktIdx, totalPkts);
    return;
  }

  const now = Date.now();

  for (const [id, asm] of activeAssemblers.entries()) {
    if (now - asm.timestamp > 2500) {
      debugStats.droppedIncomplete++;
      activeAssemblers.delete(id);
    }
  }

  let asm = activeAssemblers.get(msgId);
  if (!asm) {
    asm = {
      totalPkts: totalPkts,
      fragments: new Map(),
      timestamp: now
    };
    activeAssemblers.set(msgId, asm);
  }

  asm.fragments.set(pktIdx, chunkData);
  updateDebugUI(hex, pktIdx, totalPkts);

  if (asm.fragments.size === asm.totalPkts) {
    activeAssemblers.delete(msgId);

    let totalLength = 0;
    for (let i = 0; i < asm.totalPkts; i++) {
      const fragment = asm.fragments.get(i);
      if (!fragment) {
        debugStats.droppedIncomplete++;
        debugStats.lastError = `Missing slice index ${i} in msg ${msgId}`;
        updateDebugUI(hex, pktIdx, totalPkts);
        return;
      }
      totalLength += fragment.length;
    }

    const completeBytes = new Uint8Array(totalLength);
    let offset = 0;
    for (let i = 0; i < asm.totalPkts; i++) {
      const fragment = asm.fragments.get(i);
      completeBytes.set(fragment, offset);
      offset += fragment.length;
    }

    let jsonString = '';
    try {
      jsonString = new TextDecoder('utf-8', { fatal: true }).decode(completeBytes);
    } catch (decodeErr) {
      debugStats.jsonErrors++;
      debugStats.lastError = 'UTF-8 decode failed: ' + decodeErr.message;
      updateDebugUI(hex, pktIdx, totalPkts);
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (parseErr) {
      debugStats.jsonErrors++;
      debugStats.lastError = 'JSON parse error: ' + parseErr.message;
      updateDebugUI(hex, pktIdx, totalPkts);
      return;
    }

    if (!parsed || typeof parsed !== 'object' || typeof parsed.s !== 'string' || !Array.isArray(parsed.l)) {
      debugStats.jsonErrors++;
      debugStats.lastError = 'Invalid schema: expected {s:string, l:string[]}';
      updateDebugUI(hex, pktIdx, totalPkts);
      return;
    }

    debugStats.messagesCompleted++;
    debugStats.lastCompletedMsgId = msgId;
    debugStats.lastSyncTime = new Date().toLocaleTimeString();
    debugStats.lastJson = jsonString;
    debugStats.lastError = 'None';

    renderLiveScreen(parsed);
    updateDebugUI(hex, pktIdx, totalPkts);
    setStatus('connected');
  }
}

// ============================================================
// BLE CONNECTION
// ============================================================

function setStatus(state, message) {
  const dot  = $('connectionDot');
  const txt  = $('connectionStatus');
  const msg  = $('connectionMessage');
  const stat = $('statConnection');

  const dot2 = $('connectionDot2');
  const txt2 = $('connectionStatus2');

  const states = {
    idle:        { dot: 'dot-idle',        label: 'Not connected',  msg: message || 'Click "Connect to FARMER ATI" to begin.' },
    connecting:  { dot: 'dot-connecting',  label: 'Connecting…',    msg: message || 'Opening Bluetooth dialog…' },
    connected:   { dot: 'dot-connected',   label: 'Connected',      msg: message || 'Receiving live data from ESP32.' },
    reconnecting:{ dot: 'dot-connecting',  label: 'Reconnecting…',  msg: message || 'Connection lost. Trying to reconnect…' },
    error:       { dot: 'dot-error',       label: 'Error',          msg: message || 'Could not connect. Please try again.' }
  };

  const s = states[state] || states.idle;
  if (dot) { dot.className = 'status-dot ' + s.dot; }
  if (txt) txt.textContent = s.label;
  if (dot2) { dot2.className = 'status-dot ' + s.dot; }
  if (txt2) txt2.textContent = s.label;
  if (msg) msg.textContent = s.msg;
  if (stat) stat.textContent = s.label;
}

async function connectBLE() {
  if (!navigator.bluetooth) {
    setStatus('error', 'Web Bluetooth is not supported in this browser. Use Chrome on Android.');
    return;
  }

  setStatus('connecting');
  $('connectButton').disabled = true;

  try {
    bleDevice = await navigator.bluetooth.requestDevice({
      filters: [
        { name: BLE_DEVICE_NAME },
        { services: [BLE_SERVICE_UUID] }
      ],
      optionalServices: [BLE_SERVICE_UUID]
    });

    bleDevice.addEventListener('gattserverdisconnected', onDisconnected);

    bleServer = await bleDevice.gatt.connect();
    const service = await bleServer.getPrimaryService(BLE_SERVICE_UUID);
    bleCharacteristic = await service.getCharacteristic(BLE_CHARACTERISTIC_UUID);

    await bleCharacteristic.startNotifications();
    bleCharacteristic.addEventListener('characteristicvaluechanged', handleNotification);

    setStatus('connected', 'Connected to FARMER ATI. Synchronized with ESP32.');
    $('connectButton').style.display = 'none';
    $('disconnectButton').style.display = 'inline-flex';

  } catch (err) {
    console.error('BLE connect error:', err);
    if (err.name === 'NotFoundError') {
      setStatus('idle', 'No device selected. Click Connect to try again.');
    } else {
      setStatus('error', 'Connection failed: ' + err.message);
    }
    $('connectButton').disabled = false;
  }
}

async function disconnectBLE() {
  if (bleCharacteristic) {
    try { await bleCharacteristic.stopNotifications(); } catch (_) {}
  }
  if (bleDevice && bleDevice.gatt.connected) {
    bleDevice.gatt.disconnect();
  }
  bleDevice = null;
  bleServer = null;
  bleCharacteristic = null;
  activeAssemblers.clear();

  setStatus('idle', 'Disconnected. Click Connect to reconnect.');
  $('connectButton').disabled = false;
  $('connectButton').style.display = 'inline-flex';
  $('disconnectButton').style.display = 'none';
}

function onDisconnected() {
  setStatus('reconnecting');
  $('connectButton').disabled = false;
  $('connectButton').style.display = 'inline-flex';
  $('disconnectButton').style.display = 'none';

  setTimeout(async () => {
    if (!bleDevice) return;
    try {
      setStatus('connecting', 'Auto-reconnecting…');
      bleServer = await bleDevice.gatt.connect();
      const service = await bleServer.getPrimaryService(BLE_SERVICE_UUID);
      bleCharacteristic = await service.getCharacteristic(BLE_CHARACTERISTIC_UUID);
      await bleCharacteristic.startNotifications();
      bleCharacteristic.addEventListener('characteristicvaluechanged', handleNotification);
      setStatus('connected', 'Reconnected to FARMER ATI.');
      $('connectButton').style.display = 'none';
      $('disconnectButton').style.display = 'inline-flex';
    } catch (e) {
      setStatus('error', 'Auto-reconnect failed. Please click Connect again.');
    }
  }, 2000);
}

// ============================================================
// FILTER & SEARCH EVENT LISTENERS
// ============================================================

const btnFilterAllCrops = $('btnFilterAllCrops');
const btnFilterRecCrops = $('btnFilterRecCrops');
const cropSearchInput   = $('cropSearchInput');

if (btnFilterAllCrops && btnFilterRecCrops) {
  btnFilterAllCrops.addEventListener('click', () => {
    cropFilterMode = 'all';
    btnFilterAllCrops.classList.add('active');
    btnFilterRecCrops.classList.remove('active');
    buildCropLibrary();
  });

  btnFilterRecCrops.addEventListener('click', () => {
    cropFilterMode = 'rec';
    btnFilterRecCrops.classList.add('active');
    btnFilterAllCrops.classList.remove('active');
    buildCropLibrary();
  });
}

if (cropSearchInput) {
  cropSearchInput.addEventListener('input', (e) => {
    cropSearchQuery = e.target.value;
    buildCropLibrary();
  });
}

const btnFilterAllProblems = $('btnFilterAllProblems');
const btnFilterRecProblems = $('btnFilterRecProblems');

if (btnFilterAllProblems && btnFilterRecProblems) {
  btnFilterAllProblems.addEventListener('click', () => {
    problemFilterMode = 'all';
    btnFilterAllProblems.classList.add('active');
    btnFilterRecProblems.classList.remove('active');
    buildProblems();
  });

  btnFilterRecProblems.addEventListener('click', () => {
    problemFilterMode = 'rec';
    btnFilterRecProblems.classList.add('active');
    btnFilterAllProblems.classList.remove('active');
    buildProblems();
  });
}

// ============================================================
// TAB 6: NUTRIENT CARE & DEFICIENCY GUIDE
// ============================================================

const NUTRIENT_DATA = [
  {
    name: 'Nitrogen',
    chem: 'N',
    chemClass: 'chem-n',
    image: 'assets/nutrients/nitrogen.jpg',
    subtitle: 'Leaf and plant growth',
    whatHappens: [
      'Leaves turn light green to yellow.',
      'Stunted plant growth.',
      'Less tillering / branching.',
      'Early leaf fall.'
    ],
    whereShows: 'Older leaves first'
  },
  {
    name: 'Phosphorus',
    chem: 'P',
    chemClass: 'chem-p',
    image: 'assets/nutrients/phosphorus.jpg',
    subtitle: 'Root development',
    whatHappens: [
      'Stunted growth.',
      'Leaves turn dark green, then purple.',
      'Poor root development.',
      'Late maturity.'
    ],
    whereShows: 'Older leaves'
  },
  {
    name: 'Potassium',
    chem: 'K',
    chemClass: 'chem-k',
    image: 'assets/nutrients/potassium.jpg',
    subtitle: 'Fruit quality and disease resistance',
    whatHappens: [
      'Yellowing on leaf edges (scorching).',
      'Poor fruit size and quality.',
      'Weak stems, lodging.',
      'More disease and pest attack.'
    ],
    whereShows: 'Older leaves (edges)'
  },
  {
    name: 'Calcium',
    chem: 'Ca',
    chemClass: 'chem-ca',
    image: 'assets/nutrients/calcium.jpg',
    subtitle: 'Root and cell development',
    whatHappens: [
      'Poor root growth.',
      'Young leaves deformed.',
      'Blossom end rot in fruits.',
      'Weak cell walls.'
    ],
    whereShows: 'New leaves, growing points'
  },
  {
    name: 'Magnesium',
    chem: 'Mg',
    chemClass: 'chem-mg',
    image: 'assets/nutrients/magnesium.jpg',
    subtitle: 'Chlorophyll formation',
    whatHappens: [
      'Yellowing between veins (veins remain green).',
      'Older leaves affected.',
      'Poor photosynthesis.'
    ],
    whereShows: 'Older leaves (between veins)'
  },
  {
    name: 'Sulphur',
    chem: 'S',
    chemClass: 'chem-s',
    image: 'assets/nutrients/sulphur.jpg',
    subtitle: 'Protein formation',
    whatHappens: [
      'Uniform yellowing of young leaves.',
      'Stunted growth.',
      'Weak stems.',
      'Poor protein content.'
    ],
    whereShows: 'Young leaves'
  },
  {
    name: 'Iron',
    chem: 'Fe',
    chemClass: 'chem-fe',
    image: 'assets/nutrients/iron.jpg',
    subtitle: 'Chlorophyll production',
    whatHappens: [
      'Yellowing between veins (especially in young leaves).',
      'Leaves turn almost white.'
    ],
    whereShows: 'Young leaves'
  },
  {
    name: 'Zinc',
    chem: 'Zn',
    chemClass: 'chem-zn',
    image: 'assets/nutrients/zinc.jpg',
    subtitle: 'Growth and enzyme activity',
    whatHappens: [
      'Small narrow leaves.',
      'Leaves become pale.',
      'Short internodes (little leaf spacing).',
      'Poor growth.'
    ],
    whereShows: 'Young leaves'
  },
  {
    name: 'Boron',
    chem: 'B',
    chemClass: 'chem-b',
    image: 'assets/nutrients/boron.jpg',
    subtitle: 'Flowering and fruit development',
    whatHappens: [
      'Poor flowering.',
      'Flower drop.',
      'Cracked / deformed fruits.',
      'Hollow stems.'
    ],
    whereShows: 'Growing points, flowers, fruits'
  },
  {
    name: 'Manganese',
    chem: 'Mn',
    chemClass: 'chem-mn',
    image: 'assets/nutrients/manganese.jpg',
    subtitle: 'Photosynthesis',
    whatHappens: [
      'Yellowing between veins with small brown spots.',
      'Grey specks in severe cases.',
      'Reduced photosynthesis.'
    ],
    whereShows: 'Young to middle leaves'
  },
  {
    name: 'Copper',
    chem: 'Cu',
    chemClass: 'chem-cu',
    image: 'assets/nutrients/copper.jpg',
    subtitle: 'Enzyme activity',
    whatHappens: [
      'Leaves wilt and curl.',
      'Die-back of shoots.',
      'Poor flower and seed formation.'
    ],
    whereShows: 'Young leaves, shoot tips'
  }
];

function buildNutrientCare() {
  const feed = $('nutrientFeed');
  if (!feed) return;
  feed.innerHTML = '';

  NUTRIENT_DATA.forEach(item => {
    const article = document.createElement('article');
    article.className = 'nutrient-card';

    const bullets = item.whatHappens.map(b => `<li>${esc(b)}</li>`).join('');

    article.innerHTML = `
      <div class="nutrient-media">
        <div class="nutrient-image-frame">
          <img src="${esc(item.image)}"
               alt="${esc(item.name)} deficiency symptoms"
               class="nutrient-img"
               loading="lazy">
        </div>
      </div>

      <div class="nutrient-details">
        <div class="nutrient-identity">
          <span class="nutrient-symbol ${item.chemClass}">${esc(item.chem)}</span>
          <div class="nutrient-name-block">
            <h3 class="nutrient-name">${esc(item.name)} <span class="chem-paren">(${esc(item.chem)})</span></h3>
            <div class="nutrient-function">${esc(item.subtitle)}</div>
          </div>
        </div>

        <div class="nutrient-info-block">
          <div class="info-heading">What Happens</div>
          <ul class="symptoms-list">${bullets}</ul>
        </div>

        <div class="nutrient-where-block">
          <div class="info-heading">Where It Shows</div>
          <div class="where-highlight">${esc(item.whereShows)}</div>
        </div>
      </div>
    `;
    feed.appendChild(article);
  });
}


// ============================================================
// BUTTON WIRING
// ============================================================

const connectBtn    = $('connectButton');
const disconnectBtn = $('disconnectButton');

if (connectBtn)    connectBtn.addEventListener('click', connectBLE);
if (disconnectBtn) disconnectBtn.addEventListener('click', disconnectBLE);

// ============================================================
// UTILITY
// ============================================================

function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// ============================================================
// INITIALISE
// ============================================================

buildCropLibrary();
buildProblems();
setupCalculator();
buildNutrientCare();
setStatus('idle');

if (!navigator.bluetooth) {
  $('connectionMessage').textContent =
    '⚠ Web Bluetooth is not available. Please use Google Chrome on Android or desktop Chrome with Bluetooth enabled.';
  if (connectBtn) connectBtn.disabled = true;
}
