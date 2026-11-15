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
  "Coconut": "🥥",
  "Banana": "🍌"
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
  },
  "Banana": {
    "Season": [
      "ALL YEAR ROUND (PERENNIAL)",
      "MAIN PLANTING: FEB-APR & AUG-OCT"
    ],
    "Type": [
      "PERENNIAL FRUIT CROP"
    ],
    "SowingMonths": [1, 2, 3, 4, 5, 8, 9, 10, 11],
    "WaterReq_L": 7250000,
    "WaterDepth_mm": 1800,
    "Duration": "11 - 14 MONTHS",
    "Irrigation": "15-20 LITRES/PLANT/DAY VIA DRIP, REGULAR MOISTURE AT BUNCH INITIATION",
    "Soil": "RICH WELL-DRAINED LOAM, ALLUVIAL, CLAY LOAM PH 6.5-7.5",
    "Problems": [
      "PANAMA WILT",
      "BANANA BUNCHY TOP VIRUS",
      "RHIZOME WEEVIL",
      "SIGATOKA LEAF SPOT"
    ],
    "Organic Care": [
      "PSEUDOMONAS DIP FOR SUCKERS",
      "NEEM CAKE IN PLANTING PITS",
      "TRICHODERMA VIRIDE APPLICATION",
      "REMOVAL OF DISEASED LEAVES"
    ],
    "Prevention": [
      "USE DISEASE-FREE TISSUE CULTURE PLANTS",
      "AVOID WATER STAGNATION",
      "TIMELY DESUCKERING",
      "CLEAN DRAINAGE CHANNELS"
    ],
    "Spray Info": [
      "NEEM OIL 3 ML/L FOR APHID VECTORS",
      "MINERAL OIL FOR SIGATOKA CONTROL"
    ],
    "Tree Info": [
      "SPACING: 1.8x1.8 METRES",
      "1,210 PLANTS PER ACRE",
      "PIT SIZE: 0.5x0.5x0.5 METRE"
    ],
    "Months": [
      "PLANTING: FEB-APR",
      "AND AUG-OCT"
    ],
    "SeedRate_1Acre": 1210.0
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

  // Smoothly scroll the activated tab button into view inside the tab bar dock
  const activeBtn = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
  if (activeBtn) {
    activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
}

// Ensure tab-bar starts at Overview (scrollLeft = 0) and supports drag scrolling
const scrollerEl = document.querySelector('.tab-bar-scroller') || document.querySelector('.tab-bar');
if (scrollerEl) {
  let isDown = false;
  let startX = 0;
  let sLeft = 0;

  scrollerEl.addEventListener('mousedown', (e) => {
    isDown = true;
    startX = e.pageX - scrollerEl.offsetLeft;
    sLeft = scrollerEl.scrollLeft;
  });

  scrollerEl.addEventListener('mouseleave', () => { isDown = false; });
  scrollerEl.addEventListener('mouseup', () => { isDown = false; });

  scrollerEl.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    const x = e.pageX - scrollerEl.offsetLeft;
    const walk = (x - startX);
    if (Math.abs(walk) > 5) {
      e.preventDefault();
      scrollerEl.scrollLeft = sLeft - walk;
    }
  });

  // Reset scroll to 0 on initial page load so Overview tab is always front & visible
  scrollerEl.scrollLeft = 0;
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
// TAB 5: INTELLIGENT CROP-SPECIFIC SEED & PLANTING CALCULATOR
// ============================================================

const CALC_CONFIG = {
  "Paddy": {
    name: "Paddy",
    icon: "🌾",
    category: "weight",
    categoryLabel: "Seed Weight Calculation",
    badgeClass: "badge-weight",
    defaultMethod: "transplanted",
    methods: {
      "transplanted": {
        label: "Transplanted Paddy (Standard Nursery)",
        rate: 20,
        unit: "kg",
        unitDisplay: "kg seeds",
        rateDisplay: "20 kg / acre",
        spacing: "20 × 10 cm (or 15 × 10 cm)",
        formula: "Land Area (Acres) × 20 kg/acre",
        tip: "Standard recommendation for Kuruvai / Samba seasons. Keep 5% extra seed for nursery border and gap filling at 10–14 days after transplanting."
      },
      "direct_broadcast": {
        label: "Direct Sown / Broadcast (Wetland / Dryland)",
        rate: 40,
        unit: "kg",
        unitDisplay: "kg seeds",
        rateDisplay: "40 kg / acre",
        spacing: "Broadcasting / Solid drill",
        formula: "Land Area (Acres) × 40 kg/acre",
        tip: "Higher seed rate compensates for bird damage, deeper burial, and uneven emergence in direct-seeded rice (DSR)."
      },
      "sri": {
        label: "System of Rice Intensification (SRI — Single Seedling)",
        rate: 2.5,
        unit: "kg",
        unitDisplay: "kg seeds",
        rateDisplay: "2.5 kg / acre",
        spacing: "25 × 25 cm (Square Planting)",
        formula: "Land Area (Acres) × 2.5 kg/acre",
        tip: "Uses very low seed rate. Single 14-day-old young seedling per hill with rotary cono-weeding for massive tillering."
      }
    }
  },
  "Coconut": {
    name: "Coconut",
    icon: "🥥",
    category: "population",
    categoryLabel: "Tree Population Calculation",
    badgeClass: "badge-trees",
    defaultMethod: "square_75",
    methods: {
      "square_75": {
        label: "Standard Square Planting (7.5m × 7.5m / 25ft × 25ft)",
        rate: 70,
        unit: "trees",
        unitDisplay: "seedlings / trees",
        rateDisplay: "70 palms / acre",
        spacing: "7.5 × 7.5 metres (25 × 25 ft)",
        formula: "Land Area (Acres) × 70 palms/acre (rounded to whole tree)",
        isCount: true,
        tip: "TNAU standard recommendation for tall & hybrid varieties. Dig 1m × 1m × 1m pits 2 months before planting with 25 kg FYM and 1 kg neem cake."
      },
      "square_80": {
        label: "Wider Spacing (8.0m × 8.0m / 26ft × 26ft)",
        rate: 64,
        unit: "trees",
        unitDisplay: "seedlings / trees",
        rateDisplay: "64 palms / acre",
        spacing: "8.0 × 8.0 metres (26 × 26 ft)",
        formula: "Land Area (Acres) × 64 palms/acre (rounded to whole tree)",
        isCount: true,
        tip: "Ideal for fertile soils and multi-tier intercropping systems with cocoa, banana, or pepper."
      },
      "triangular_75": {
        label: "Triangular System (7.5m Equilateral)",
        rate: 80,
        unit: "trees",
        unitDisplay: "seedlings / trees",
        rateDisplay: "80 palms / acre",
        spacing: "7.5m equilateral triangle",
        formula: "Land Area (Acres) × 80 palms/acre (rounded to whole tree)",
        isCount: true,
        tip: "Triangular planting accommodates ~15% more trees per acre while maintaining equal canopy sunlight access."
      },
      "dwarf_high_density": {
        label: "High Density / Dwarf Cultivars (6.0m × 6.0m)",
        rate: 110,
        unit: "trees",
        unitDisplay: "seedlings / trees",
        rateDisplay: "110 palms / acre",
        spacing: "6.0 × 6.0 metres (20 × 20 ft)",
        formula: "Land Area (Acres) × 110 palms/acre (rounded to whole tree)",
        isCount: true,
        tip: "Suitable exclusively for tender-nut dwarf cultivars like Chowghat Orange Dwarf (COD)."
      }
    }
  },
  "Banana": {
    name: "Banana",
    icon: "🍌",
    category: "planting_material",
    categoryLabel: "Planting Material (Suckers / Tissue Culture)",
    badgeClass: "badge-suckers",
    defaultMethod: "standard_18",
    methods: {
      "standard_18": {
        label: "Standard Spacing (1.8m × 1.8m / 6ft × 6ft)",
        rate: 1210,
        unit: "suckers",
        unitDisplay: "suckers / plantlets",
        rateDisplay: "1,210 suckers / acre",
        spacing: "1.8 × 1.8 metres (6 × 6 ft)",
        formula: "Land Area (Acres) × 1,210 suckers/acre (rounded to whole sucker)",
        isCount: true,
        tip: "NRCB / TNAU standard for Cavendish (Grand Naine), Robusta, Poovan, and Rasthali. Select healthy sword suckers weighing 1.5–2.0 kg or secondary-hardened tissue culture plants."
      },
      "high_density_15": {
        label: "High Density Planting (1.5m × 1.5m / 5ft × 5ft)",
        rate: 1800,
        unit: "suckers",
        unitDisplay: "suckers / plantlets",
        rateDisplay: "1,800 suckers / acre",
        spacing: "1.5 × 1.5 metres (5 × 5 ft)",
        formula: "Land Area (Acres) × 1,800 suckers/acre (rounded to whole sucker)",
        isCount: true,
        tip: "Recommended for Dwarf Cavendish and tissue culture plantlets under precision drip fertigation."
      },
      "paired_row": {
        label: "Paired Row System (1.2m × 1.2m in pairs with 2.0m inter-pair alley)",
        rate: 1400,
        unit: "suckers",
        unitDisplay: "suckers / plantlets",
        rateDisplay: "1,400 suckers / acre",
        spacing: "1.2 × 1.2 × 2.0 metres",
        formula: "Land Area (Acres) × 1,400 suckers/acre (rounded to whole sucker)",
        isCount: true,
        tip: "Allows easy tractor movement, drip line installation, bunch harvest, and inter-crop management between paired rows."
      }
    }
  },
  "Tomato": {
    name: "Tomato",
    icon: "🍅",
    category: "seedling",
    categoryLabel: "Seedling / Seed Requirement",
    badgeClass: "badge-seedling",
    defaultMethod: "seedlings_hybrid",
    methods: {
      "seedlings_hybrid": {
        label: "Transplanted Seedlings (Determinate / Commercial Hybrids)",
        rate: 9000,
        unit: "seedlings",
        unitDisplay: "seedlings",
        rateDisplay: "9,000 seedlings / acre",
        spacing: "60 × 60 cm (or 90 × 45 cm)",
        formula: "Land Area (Acres) × 9,000 seedlings/acre (rounded to whole seedling)",
        isCount: true,
        tip: "Includes a 10% nursery buffer for gap filling. Seedlings ready at 25–30 days when raised in 98-cell pro-trays using coco-peat."
      },
      "seedlings_staked": {
        label: "Transplanted Seedlings (Indeterminate / Staked Trellis)",
        rate: 6000,
        unit: "seedlings",
        unitDisplay: "seedlings",
        rateDisplay: "6,000 seedlings / acre",
        spacing: "90 × 60 cm (3 × 2 ft)",
        formula: "Land Area (Acres) × 6,000 seedlings/acre (rounded to whole seedling)",
        isCount: true,
        tip: "Wider spacing for continuous fruiting staked varieties with trellising wires and bilateral staking."
      },
      "seeds_nursery_hybrid": {
        label: "F1 Hybrid Seeds for Nursery Raising (Weight)",
        rate: 0.15,
        unit: "grams",
        unitDisplay: "grams seed (0.15 kg)",
        rateDisplay: "150 grams (0.15 kg) / acre",
        spacing: "Raised beds / Pro-tray nursery",
        formula: "Land Area (Acres) × 150 grams/acre",
        isGrams: true,
        tip: "Cost-effective high-germination F1 seeds (approx. 300–350 seeds/gram). Raise in pro-trays under 50% shade net."
      },
      "seeds_nursery_op": {
        label: "Open-Pollinated (OP) Varieties Seed Weight",
        rate: 0.20,
        unit: "grams",
        unitDisplay: "grams seed (0.20 kg)",
        rateDisplay: "200 grams (0.20 kg) / acre",
        spacing: "Raised beds nursery",
        formula: "Land Area (Acres) × 200 grams/acre",
        isGrams: true,
        tip: "Standard recommendation for traditional OP varieties like PKM-1 or CO-3."
      }
    }
  },
  "Chilli": {
    name: "Chilli",
    icon: "🌶️",
    category: "seedling",
    categoryLabel: "Seedling / Seed Requirement",
    badgeClass: "badge-seedling",
    defaultMethod: "seedlings",
    methods: {
      "seedlings": {
        label: "Transplanted Seedlings (Standard Field Planting)",
        rate: 11000,
        unit: "seedlings",
        unitDisplay: "seedlings",
        rateDisplay: "11,000 seedlings / acre",
        spacing: "60 × 45 cm (2 × 1.5 ft)",
        formula: "Land Area (Acres) × 11,000 seedlings/acre (rounded to whole seedling)",
        isCount: true,
        tip: "Includes 10% buffer. Dip seedling roots in Pseudomonas fluorescens (10g/L) for 30 minutes before planting."
      },
      "seeds_nursery": {
        label: "Nursery Seed Weight",
        rate: 0.40,
        unit: "grams",
        unitDisplay: "grams seed (0.40 kg)",
        rateDisplay: "400 grams (0.40 kg) / acre",
        spacing: "Raised nursery beds",
        formula: "Land Area (Acres) × 400 grams/acre",
        isGrams: true,
        tip: "Sow seeds on raised beds treated with Trichoderma seed treatment to prevent damping-off."
      }
    }
  },
  "Brinjal": {
    name: "Brinjal",
    icon: "🍆",
    category: "seedling",
    categoryLabel: "Seedling / Seed Requirement",
    badgeClass: "badge-seedling",
    defaultMethod: "seedlings",
    methods: {
      "seedlings": {
        label: "Transplanted Seedlings (Hybrids / Varieties)",
        rate: 8500,
        unit: "seedlings",
        unitDisplay: "seedlings",
        rateDisplay: "8,500 seedlings / acre",
        spacing: "75 × 60 cm (2.5 × 2 ft)",
        formula: "Land Area (Acres) × 8,500 seedlings/acre (rounded to whole seedling)",
        isCount: true,
        tip: "Plant 30–35 day old seedlings. Ridge and furrow planting ensures good root aeration."
      },
      "seeds_nursery": {
        label: "Nursery Seed Weight",
        rate: 0.20,
        unit: "grams",
        unitDisplay: "grams seed (0.20 kg)",
        rateDisplay: "200 grams (0.20 kg) / acre",
        spacing: "Raised nursery beds",
        formula: "Land Area (Acres) × 200 grams/acre",
        isGrams: true,
        tip: "High germination rate seeds require ~200g per acre of main field."
      }
    }
  },
  "Onion": {
    name: "Onion",
    icon: "🧅",
    category: "seedling",
    categoryLabel: "Seedlings / Bulbs / Seeds",
    badgeClass: "badge-seedling",
    defaultMethod: "seedlings",
    methods: {
      "seedlings": {
        label: "Transplanted Seedlings (Bellary / Big Onion)",
        rate: 180000,
        unit: "seedlings",
        unitDisplay: "seedlings",
        rateDisplay: "180,000 seedlings / acre",
        spacing: "15 × 10 cm on flat beds or broad beds",
        formula: "Land Area (Acres) × 180,000 seedlings/acre (rounded to whole seedling)",
        isCount: true,
        tip: "Transplant 40–45 day old healthy seedlings on raised broad bed furrows (BBF) for optimal bulb expansion."
      },
      "bulb_setts": {
        label: "Small Bulb Setts (Aggregatum / Small Shallots)",
        rate: 450,
        unit: "kg",
        unitDisplay: "kg small bulbs (setts)",
        rateDisplay: "450 kg bulbs / acre",
        spacing: "15 × 10 cm",
        formula: "Land Area (Acres) × 450 kg bulbs/acre",
        tip: "Traditional method for CO-4 and CO-5 small onions. Select medium-sized 10–15g disease-free mother bulbs."
      },
      "seeds_nursery": {
        label: "Nursery Seed Weight (for raising seedlings)",
        rate: 4.0,
        unit: "kg",
        unitDisplay: "kg seeds",
        rateDisplay: "4.0 kg seeds / acre",
        spacing: "Raised beds",
        formula: "Land Area (Acres) × 4.0 kg/acre",
        tip: "Requires ~0.05 acre nursery area per 1 acre of main transplanted field."
      }
    }
  },
  "Groundnut": {
    name: "Groundnut",
    icon: "🥜",
    category: "weight",
    categoryLabel: "Seed Weight Calculation",
    badgeClass: "badge-weight",
    defaultMethod: "bunch",
    methods: {
      "bunch": {
        label: "Bunch Varieties (TMV 7, VRI 2, Kadiri — Irrigated / Rainfed)",
        rate: 55,
        unit: "kg",
        unitDisplay: "kg seed kernels",
        rateDisplay: "55 kg kernels / acre",
        spacing: "30 × 10 cm (~133,000 plants/acre)",
        formula: "Land Area (Acres) × 55 kg kernels/acre",
        tip: "Treat kernels with Trichoderma viride @ 4g/kg seed + Rhizobium culture before sowing."
      },
      "spreading": {
        label: "Semi-Spreading Varieties",
        rate: 50,
        unit: "kg",
        unitDisplay: "kg seed kernels",
        rateDisplay: "50 kg kernels / acre",
        spacing: "30 × 15 cm",
        formula: "Land Area (Acres) × 50 kg kernels/acre",
        tip: "Slightly wider spacing accommodates lateral branch spreading and peg penetration."
      }
    }
  },
  "Black Gram": {
    name: "Black Gram",
    icon: "🫘",
    category: "weight",
    categoryLabel: "Seed Weight Calculation",
    badgeClass: "badge-weight",
    defaultMethod: "pure",
    methods: {
      "pure": {
        label: "Pure / Irrigated Crop (VBN 6, 8, CO 6)",
        rate: 8,
        unit: "kg",
        unitDisplay: "kg seeds",
        rateDisplay: "8 kg / acre",
        spacing: "30 × 10 cm",
        formula: "Land Area (Acres) × 8 kg/acre",
        tip: "Sow at 2–3 cm depth. Inoculate with Rhizobium and phosphobacteria biofertilizers."
      },
      "rice_fallow": {
        label: "Rice Fallow Broadcast (Sown into standing paddy 7–10 days before harvest)",
        rate: 12,
        unit: "kg",
        unitDisplay: "kg seeds",
        rateDisplay: "12 kg / acre",
        spacing: "Broadcast in paddy stubbles",
        formula: "Land Area (Acres) × 12 kg/acre",
        tip: "Higher rate ensures adequate plant stand in unploughed paddy stubble soil."
      }
    }
  },
  "Green Gram": {
    name: "Green Gram",
    icon: "🫛",
    category: "weight",
    categoryLabel: "Seed Weight Calculation",
    badgeClass: "badge-weight",
    defaultMethod: "pure",
    methods: {
      "pure": {
        label: "Pure / Irrigated Crop",
        rate: 8,
        unit: "kg",
        unitDisplay: "kg seeds",
        rateDisplay: "8 kg / acre",
        spacing: "30 × 10 cm",
        formula: "Land Area (Acres) × 8 kg/acre",
        tip: "Inoculate with Rhizobium and phosphobacteria for optimal nitrogen nodulation."
      },
      "rice_fallow": {
        label: "Rice Fallow Pulse",
        rate: 12,
        unit: "kg",
        unitDisplay: "kg seeds",
        rateDisplay: "12 kg / acre",
        spacing: "Broadcast in paddy stubbles",
        formula: "Land Area (Acres) × 12 kg/acre",
        tip: "Broadcast when field has waxy moisture before paddy harvest."
      }
    }
  },
  "Maize": {
    name: "Maize",
    icon: "🌽",
    category: "weight",
    categoryLabel: "Seed Weight Calculation",
    badgeClass: "badge-weight",
    defaultMethod: "hybrid",
    methods: {
      "hybrid": {
        label: "Grain Hybrid Maize (Single Cross Hybrids)",
        rate: 8,
        unit: "kg",
        unitDisplay: "kg seeds",
        rateDisplay: "8 kg / acre",
        spacing: "60 × 20 cm (~33,000 plants/acre)",
        formula: "Land Area (Acres) × 8 kg/acre",
        tip: "One seed per hill at 4–5 cm depth. Avoid planting two seeds to prevent nutrient competition."
      },
      "sweet_baby_corn": {
        label: "Sweet Corn / Baby Corn",
        rate: 10,
        unit: "kg",
        unitDisplay: "kg seeds",
        rateDisplay: "10 kg / acre",
        spacing: "45 × 20 cm (higher plant density)",
        formula: "Land Area (Acres) × 10 kg/acre",
        tip: "Closer planting density yields tender, uniform baby corn ears."
      }
    }
  },
  "Ragi": {
    name: "Ragi",
    icon: "🌾",
    category: "weight",
    categoryLabel: "Seed Weight Calculation",
    badgeClass: "badge-weight",
    defaultMethod: "transplanted",
    methods: {
      "transplanted": {
        label: "Transplanted Ragi (Nursery Raised)",
        rate: 2,
        unit: "kg",
        unitDisplay: "kg seeds",
        rateDisplay: "2 kg / acre (Nursery)",
        spacing: "22.5 × 10 cm (2 seedlings/hill)",
        formula: "Land Area (Acres) × 2 kg/acre",
        tip: "2 kg seed in 1.5 cents nursery yields enough seedlings for 1 acre of main field."
      },
      "direct": {
        label: "Direct Line Sown / Broadcast",
        rate: 5,
        unit: "kg",
        unitDisplay: "kg seeds",
        rateDisplay: "5 kg / acre",
        spacing: "Line sowing at 22.5 × 10 cm",
        formula: "Land Area (Acres) × 5 kg/acre",
        tip: "Direct seeding requires thinning at 15–20 DAS to maintain proper plant population."
      }
    }
  },
  "Cotton": {
    name: "Cotton",
    icon: "☁️",
    category: "weight",
    categoryLabel: "Seed Weight Calculation",
    badgeClass: "badge-weight",
    defaultMethod: "bt_hybrid",
    methods: {
      "bt_hybrid": {
        label: "Bt Cotton Hybrids (Standard Spacing 90 × 60 cm)",
        rate: 1.5,
        unit: "kg",
        unitDisplay: "kg seeds (~6,500 seeds)",
        rateDisplay: "1.5 kg / acre (or ~6,000 seeds)",
        spacing: "90 × 60 cm (3 × 2 ft = ~7,400 plants/acre)",
        formula: "Land Area (Acres) × 1.5 kg/acre",
        tip: "One seed per hill. Gap filling must be completed within 10 days of germination."
      },
      "high_density": {
        label: "High Density Planting System (HDPS — 60 × 15 cm)",
        rate: 4.0,
        unit: "kg",
        unitDisplay: "kg seeds",
        rateDisplay: "4.0 kg / acre",
        spacing: "60 × 15 cm (~44,000 plants/acre)",
        formula: "Land Area (Acres) × 4.0 kg/acre",
        tip: "HDPS compact varieties under rainfed conditions maximize early boll formation."
      }
    }
  },
  "Sesame": {
    name: "Sesame",
    icon: "🫘",
    category: "weight",
    categoryLabel: "Seed Weight Calculation",
    badgeClass: "badge-weight",
    defaultMethod: "standard",
    methods: {
      "standard": {
        label: "Pure Sown Crop (TMV 3, 7, VRI 1, 2)",
        rate: 2,
        unit: "kg",
        unitDisplay: "kg seeds",
        rateDisplay: "2 kg / acre",
        spacing: "30 × 30 cm",
        formula: "Land Area (Acres) × 2 kg/acre",
        tip: "Mix seed with dry sand (1:4 ratio) for uniform broadcast distribution of tiny seeds."
      }
    }
  },
  "Bhendi": {
    name: "Bhendi",
    icon: "🥒",
    category: "weight",
    categoryLabel: "Seed Weight Calculation",
    badgeClass: "badge-weight",
    defaultMethod: "hybrid",
    methods: {
      "hybrid": {
        label: "Kharif / Monsoon Season (Hybrids)",
        rate: 3,
        unit: "kg",
        unitDisplay: "kg seeds",
        rateDisplay: "3 kg / acre",
        spacing: "45 × 30 cm (~29,600 plants/acre)",
        formula: "Land Area (Acres) × 3 kg/acre",
        tip: "Soak seeds in water for 12 hours before sowing for uniform rapid germination."
      },
      "summer": {
        label: "Summer Season (Higher Density)",
        rate: 4,
        unit: "kg",
        unitDisplay: "kg seeds",
        rateDisplay: "4 kg / acre",
        spacing: "30 × 30 cm",
        formula: "Land Area (Acres) × 4 kg/acre",
        tip: "Closer planting in summer reduces evaporation and maintains soil moisture canopy."
      }
    }
  },
  "Sugarcane": {
    name: "Sugarcane",
    icon: "🎋",
    category: "planting_material",
    categoryLabel: "Planting Material (Setts)",
    badgeClass: "badge-suckers",
    defaultMethod: "two_bud",
    methods: {
      "two_bud": {
        label: "Two-Budded Setts (Standard Ridge & Furrow)",
        rate: 30000,
        unit: "setts",
        unitDisplay: "two-budded setts",
        rateDisplay: "30,000 setts / acre (~75,000 buds)",
        spacing: "90 cm or 120 cm furrows",
        formula: "Land Area (Acres) × 30,000 setts/acre (rounded to whole sett)",
        isCount: true,
        tip: "Select 7–8 month old disease-free seed crop. Dip setts in Carbendazim solution before planting."
      },
      "single_bud_stp": {
        label: "Single-Bud Setts / Sustainable Sugarcane Initiative (SSI)",
        rate: 15000,
        unit: "setts",
        unitDisplay: "single-bud setts / chip buds",
        rateDisplay: "15,000 setts / acre",
        spacing: "150 cm wide furrows",
        formula: "Land Area (Acres) × 15,000 setts/acre (rounded to whole sett)",
        isCount: true,
        tip: "Chip-bud technology saves 75% seed cane by weight and gives profuse tillering."
      }
    }
  },
  "Mango": {
    name: "Mango",
    icon: "🥭",
    category: "population",
    categoryLabel: "Tree Population Calculation",
    badgeClass: "badge-trees",
    defaultMethod: "standard_10",
    methods: {
      "standard_10": {
        label: "Standard Spacing (10m × 10m / 33ft × 33ft)",
        rate: 40,
        unit: "trees",
        unitDisplay: "trees (grafts)",
        rateDisplay: "40 trees / acre",
        spacing: "10 × 10 metres (Square system)",
        formula: "Land Area (Acres) × 40 trees/acre (rounded to whole tree)",
        isCount: true,
        tip: "Traditional spacing for Alphonso, Banganapalli, Neelum. Dig 1m × 1m × 1m pits with 50 kg compost."
      },
      "medium_75": {
        label: "Medium Density (7.5m × 7.5m)",
        rate: 70,
        unit: "trees",
        unitDisplay: "trees (grafts)",
        rateDisplay: "70 trees / acre",
        spacing: "7.5 × 7.5 metres",
        formula: "Land Area (Acres) × 70 trees/acre (rounded to whole tree)",
        isCount: true,
        tip: "Suitable for regular-bearing dwarf varieties like Amrapali or Mallika."
      },
      "ultra_high_density": {
        label: "High Density Planting (HDP — 5m × 5m)",
        rate: 160,
        unit: "trees",
        unitDisplay: "trees (grafts)",
        rateDisplay: "160 trees / acre",
        spacing: "5 × 5 metres",
        formula: "Land Area (Acres) × 160 trees/acre (rounded to whole tree)",
        isCount: true,
        tip: "Requires annual post-harvest canopy pruning and drip fertigation."
      }
    }
  }
};

function updateCalculatorCropList() {
  const sel = $('calcCrop');
  if (!sel) return;
  const currentVal = sel.value;
  sel.innerHTML = '<option value="" disabled>Select crop…</option>';

  const allNames = Object.keys(CALC_CONFIG);

  if (pondTelemetry.recCrops.length > 0) {
    const optGroupRec = document.createElement('optgroup');
    optGroupRec.label = '🌱 Eligible Crops for Selected Pond Mode';
    pondTelemetry.recCrops.forEach(name => {
      if (CALC_CONFIG[name]) {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = `${getCropIcon(name)} ${name}`;
        optGroupRec.appendChild(opt);
      }
    });
    if (optGroupRec.children.length > 0) {
      sel.appendChild(optGroupRec);
    }
  }

  const optGroupAll = document.createElement('optgroup');
  optGroupAll.label = `All Supported Crops (${allNames.length})`;
  allNames.forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = `${getCropIcon(name)} ${name}`;
    optGroupAll.appendChild(opt);
  });
  sel.appendChild(optGroupAll);

  if (currentVal && allNames.includes(currentVal)) {
    sel.value = currentVal;
  } else if (pondTelemetry.recCrops.length > 0 && CALC_CONFIG[pondTelemetry.recCrops[0]]) {
    sel.value = pondTelemetry.recCrops[0];
  } else {
    sel.value = 'Paddy';
  }

  syncCropCalculationUI();
}

function syncCropCalculationUI() {
  const selCrop = $('calcCrop');
  if (!selCrop) return;
  const crop = selCrop.value || 'Paddy';
  const cfg = CALC_CONFIG[crop];
  if (!cfg) return;

  // 1. Update Mode Badge
  const badge = $('calcModeBadge');
  if (badge) {
    badge.className = `calc-badge-pill ${cfg.badgeClass}`;
    badge.textContent = `${cfg.icon} ${cfg.categoryLabel}`;
  }

  // 2. Update Cultivation Method Dropdown
  const methodGroup = $('calcMethodGroup');
  const selMethod = $('calcMethod');
  const methodKeys = Object.keys(cfg.methods);

  if (selMethod && methodGroup) {
    if (methodKeys.length > 1) {
      methodGroup.style.display = 'flex';
      selMethod.innerHTML = '';
      methodKeys.forEach(k => {
        const m = cfg.methods[k];
        const opt = document.createElement('option');
        opt.value = k;
        opt.textContent = `${m.label} (${m.rateDisplay})`;
        selMethod.appendChild(opt);
      });
      selMethod.value = cfg.defaultMethod;
    } else {
      methodGroup.style.display = 'none';
      selMethod.innerHTML = '';
      const opt = document.createElement('option');
      opt.value = cfg.defaultMethod;
      opt.textContent = cfg.methods[cfg.defaultMethod].label;
      selMethod.appendChild(opt);
      selMethod.value = cfg.defaultMethod;
    }
  }

  // 3. Update Custom Rate in Advanced Details
  syncCustomRateField();

  // 4. Update Crop Banner
  updateCropBanner();
}

function updateCropBanner() {
  const selCrop = $('calcCrop');
  const selMethod = $('calcMethod');
  const banner = $('calcCropBanner');
  if (!selCrop || !banner) return;

  const crop = selCrop.value || 'Paddy';
  const cfg = CALC_CONFIG[crop];
  if (!cfg) return;

  const methodKey = selMethod ? selMethod.value : cfg.defaultMethod;
  const m = cfg.methods[methodKey] || cfg.methods[cfg.defaultMethod];

  banner.innerHTML = `
    <div class="banner-title">${cfg.icon} ${cfg.name} &bull; ${cfg.categoryLabel}</div>
    <div class="banner-details">
      <span>📐 Standard Spacing: <strong>${esc(m.spacing)}</strong></span> &bull; 
      <span>🌱 Recommended Rate: <strong>${esc(m.rateDisplay)}</strong></span>
    </div>
  `;
}

function syncCustomRateField() {
  const selCrop = $('calcCrop');
  const selMethod = $('calcMethod');
  const customRateInput = $('calcCustomRate');
  const customRateLabel = $('calcCustomRateLabel');
  const customRateHint = $('calcCustomRateHint');

  if (!selCrop || !customRateInput) return;
  const crop = selCrop.value || 'Paddy';
  const cfg = CALC_CONFIG[crop];
  if (!cfg) return;

  const methodKey = selMethod ? selMethod.value : cfg.defaultMethod;
  const m = cfg.methods[methodKey] || cfg.methods[cfg.defaultMethod];

  customRateInput.value = m.rate;

  if (customRateLabel) {
    customRateLabel.textContent = `Standard Recommendation (${m.unitDisplay} per acre):`;
  }
  if (customRateHint) {
    customRateHint.textContent = `Default TNAU / ICAR standard is ${m.rateDisplay}. Edit only if following custom spacing.`;
  }
}

function calculateSeedRequirement() {
  const selCrop = $('calcCrop');
  const selMethod = $('calcMethod');
  const calcResult = $('calcResult');
  const areaInput = $('calcArea');
  const customRateInput = $('calcCustomRate');

  if (!selCrop || !calcResult || !areaInput) return;

  const crop = selCrop.value;
  const cfg = CALC_CONFIG[crop];
  if (!cfg) {
    calcResult.innerHTML = '<div class="calc-error">⚠ Please select a valid crop.</div>';
    return;
  }

  const area = parseFloat(areaInput.value);
  if (isNaN(area) || area <= 0) {
    calcResult.innerHTML = '<div class="calc-error">⚠ Please enter a valid field area greater than 0 (e.g. 0.5, 1.0, 2.0).</div>';
    return;
  }

  const methodKey = (selMethod && selMethod.value) ? selMethod.value : cfg.defaultMethod;
  const m = cfg.methods[methodKey] || cfg.methods[cfg.defaultMethod];

  // Rate: Use custom rate if user actively modified it and valid, else use standard rate
  let activeRate = m.rate;
  if (customRateInput && !isNaN(parseFloat(customRateInput.value)) && parseFloat(customRateInput.value) > 0) {
    activeRate = parseFloat(customRateInput.value);
  }

  let totalNumeric = 0;
  let formattedTotal = '';
  let unitText = '';
  let formulaCalculationText = '';

  if (m.isCount) {
    // Trees, palms, seedlings, suckers, setts: rounded to nearest whole integer
    totalNumeric = Math.round(area * activeRate);
    formattedTotal = totalNumeric.toLocaleString();
    unitText = m.unitDisplay;
    formulaCalculationText = `${area} Acre × ${activeRate.toLocaleString()} / acre = ${totalNumeric.toLocaleString()} ${m.unit} (rounded to whole integer)`;
  } else if (m.isGrams) {
    // Nursery seeds in grams
    totalNumeric = area * (activeRate * 1000); // grams
    if (totalNumeric >= 1000) {
      formattedTotal = (totalNumeric / 1000).toFixed(2);
      unitText = 'kg seeds (' + Math.round(totalNumeric).toLocaleString() + ' g)';
    } else {
      formattedTotal = Math.round(totalNumeric).toLocaleString();
      unitText = 'grams seed';
    }
    formulaCalculationText = `${area} Acre × ${(activeRate * 1000).toFixed(0)} grams/acre = ${formattedTotal} ${unitText}`;
  } else {
    // Weight in kg
    totalNumeric = area * activeRate;
    formattedTotal = (totalNumeric % 1 === 0) ? totalNumeric.toFixed(0) : totalNumeric.toFixed(2);
    unitText = m.unitDisplay;
    formulaCalculationText = `${area} Acre × ${activeRate} kg/acre = ${formattedTotal} kg`;
  }

  // Requirement Category Header Label
  let requirementCategoryName = 'SEED';
  if (cfg.category === 'population') {
    requirementCategoryName = 'PLANTING / TREE';
  } else if (cfg.category === 'planting_material') {
    requirementCategoryName = 'PLANTING MATERIAL';
  } else if (cfg.category === 'seedling') {
    requirementCategoryName = m.isGrams ? 'NURSERY SEED' : 'SEEDLING';
  }

  // Preserve Farm Pond Telemetry integration & water demand calculation
  let waterInfoHtml = '';
  const cropData = CROPS[crop];
  if (cropData && cropData.WaterReq_L) {
    const cropLitres = cropData.WaterReq_L * area;
    const cropM3 = (cropLitres / 1000).toFixed(0);
    const pondAvailable = pondTelemetry.waterLitres;
    let pondCompare = '';

    if (pondTelemetry.mode === 'pond' && pondAvailable > 0) {
      const canSustain = pondAvailable >= cropLitres;
      pondCompare = canSustain
        ? `<div class="calc-detail-row" style="color:#047857;"><span>Pond Water Adequacy</span><strong>✔ Usable pond storage sufficient (${(pondAvailable - cropLitres).toLocaleString()} L surplus)</strong></div>`
        : `<div class="calc-detail-row" style="color:#dc2626;"><span>Pond Water Adequacy</span><strong>⚠ Storage Deficit of ${(cropLitres - pondAvailable).toLocaleString()} L from current pond storage</strong></div>`;
    } else if (pondTelemetry.mode === 'default') {
      pondCompare = '<div class="calc-detail-row" style="color:#0284c7;"><span>Advisory Mode</span><strong>Default Seasonal Recommendation Active</strong></div>';
    }

    waterInfoHtml = `
      <div class="calc-detail-row">
        <span>Seasonal Crop Water Demand</span>
        <strong>${cropLitres.toLocaleString()} L (~${cropM3} m³)</strong>
      </div>
      ${pondCompare}
    `;
  }

  const areaSqMetres = (area * 4046.86).toLocaleString(undefined, { maximumFractionDigits: 1 });
  const areaSqFeet = Math.round(area * 43560).toLocaleString();

  calcResult.innerHTML = `
    <div class="calc-answer-card">
      <div class="calc-result-header">
        <div class="calc-result-icon">${cfg.icon}</div>
        <div>
          <h3 class="calc-result-title">${esc(crop)} — ${requirementCategoryName} REQUIREMENT</h3>
          <div class="calc-result-subtitle">${esc(m.label)}</div>
        </div>
      </div>

      <div class="calc-highlight-box">
        <div class="highlight-label">Total Required for ${area} ${area === 1 ? 'Acre' : 'Acres'}</div>
        <div class="highlight-number">${formattedTotal} <span class="highlight-unit">${unitText}</span></div>
        <div class="highlight-caption">${cfg.categoryLabel} &bull; Official ICAR / TNAU Agronomic Standards</div>
      </div>

      <div class="calc-breakdown-grid">
        <div class="calc-detail-row">
          <span>Field Area</span>
          <strong>${area} ${area === 1 ? 'Acre' : 'Acres'} (${areaSqMetres} m² / ${areaSqFeet} sq.ft)</strong>
        </div>
        <div class="calc-detail-row">
          <span>Cultivation / Planting Method</span>
          <strong>${esc(m.label)}</strong>
        </div>
        <div class="calc-detail-row">
          <span>Recommended Rate / Spacing</span>
          <strong>${esc(m.rateDisplay)}</strong>
        </div>
        <div class="calc-detail-row">
          <span>Standard Field Spacing</span>
          <strong>${esc(m.spacing)}</strong>
        </div>
        <div class="calc-detail-row formula-row">
          <span>Calculation Formula</span>
          <strong>${esc(formulaCalculationText)}</strong>
        </div>
        ${waterInfoHtml}
      </div>

      <div class="calc-tip-box">
        <span class="tip-icon">💡</span>
        <div class="tip-text">
          <strong>Agronomic Best Practice:</strong> ${esc(m.tip)}
        </div>
      </div>
    </div>
  `;
}

function setupCalculator() {
  const calcBtn = $('calcBtn');
  const selCrop = $('calcCrop');
  const selMethod = $('calcMethod');
  const areaInput = $('calcArea');
  const customRateInput = $('calcCustomRate');
  const areaChips = $$('.area-chip');

  if (!calcBtn) return;

  // 1. Crop Selection Change
  if (selCrop) {
    selCrop.addEventListener('change', () => {
      syncCropCalculationUI();
      calculateSeedRequirement();
    });
  }

  // 2. Method Selection Change
  if (selMethod) {
    selMethod.addEventListener('change', () => {
      syncCustomRateField();
      updateCropBanner();
      calculateSeedRequirement();
    });
  }

  // 3. Quick Area Preset Chips
  if (areaChips.length > 0) {
    areaChips.forEach(chip => {
      chip.addEventListener('click', () => {
        areaChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        if (areaInput) {
          areaInput.value = chip.dataset.area;
        }
        calculateSeedRequirement();
      });
    });
  }

  // 4. Area Input Change
  if (areaInput) {
    areaInput.addEventListener('input', () => {
      const currentVal = parseFloat(areaInput.value);
      areaChips.forEach(c => {
        c.classList.toggle('active', parseFloat(c.dataset.area) === currentVal);
      });
      calculateSeedRequirement();
    });
  }

  // 5. Custom Rate Input Change
  if (customRateInput) {
    customRateInput.addEventListener('input', () => {
      calculateSeedRequirement();
    });
  }

  // 6. Compute Button Click
  calcBtn.addEventListener('click', calculateSeedRequirement);

  // Initialize
  updateCalculatorCropList();
  calculateSeedRequirement();
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
// COMPACT LIVE WEATHER WIDGET (OPEN-METEO)
// ============================================================

const WMO_WEATHER_NAMES = {
  0:  "Clear Sky",
  1:  "Mainly Clear",
  2:  "Partly Cloudy",
  3:  "Cloudy",
  45: "Foggy",
  48: "Rime Fog",
  51: "Light Drizzle",
  53: "Drizzle",
  55: "Dense Drizzle",
  56: "Freezing Drizzle",
  57: "Freezing Drizzle",
  61: "Slight Rain",
  63: "Moderate Rain",
  65: "Heavy Rain",
  66: "Freezing Rain",
  67: "Freezing Rain",
  71: "Slight Snow",
  73: "Moderate Snow",
  75: "Heavy Snow",
  77: "Snow Grains",
  80: "Rain Showers",
  81: "Rain Showers",
  82: "Heavy Showers",
  85: "Snow Showers",
  86: "Snow Showers",
  95: "Thunderstorm",
  96: "Thunderstorm",
  99: "Thunderstorm"
};

function getSvgWeatherIcon(code) {
  // Rain / Showers / Drizzle
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return `<svg viewBox="0 0 64 64" width="38" height="38" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 36a9 9 0 0 1 1.5-17.8 13 13 0 0 1 24.5 3.6A8.5 8.5 0 0 1 44 38H20a9 9 0 0 1 0-2z" fill="rgba(255,255,255,0.12)" stroke="#ffffff"/>
      <line x1="22" y1="44" x2="19" y2="50" stroke="#ffffff" stroke-width="3"/>
      <line x1="30" y1="44" x2="27" y2="50" stroke="#ffffff" stroke-width="3"/>
      <line x1="38" y1="44" x2="35" y2="50" stroke="#ffffff" stroke-width="3"/>
      <line x1="46" y1="44" x2="43" y2="50" stroke="#ffffff" stroke-width="3"/>
    </svg>`;
  }
  // Clear sky
  if (code === 0) {
    return `<svg viewBox="0 0 64 64" width="38" height="38" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="32" cy="32" r="12" fill="rgba(255,255,255,0.15)" stroke="#ffffff"/>
      <line x1="32" y1="8" x2="32" y2="14" stroke="#ffffff"/>
      <line x1="32" y1="50" x2="32" y2="56" stroke="#ffffff"/>
      <line x1="8" y1="32" x2="14" y2="32" stroke="#ffffff"/>
      <line x1="50" y1="32" x2="56" y2="32" stroke="#ffffff"/>
      <line x1="15" y1="15" x2="19" y2="19" stroke="#ffffff"/>
      <line x1="45" y1="45" x2="49" y2="49" stroke="#ffffff"/>
      <line x1="15" y1="49" x2="19" y2="45" stroke="#ffffff"/>
      <line x1="45" y1="19" x2="49" y2="15" stroke="#ffffff"/>
    </svg>`;
  }
  // Mainly clear / Partly cloudy
  if ([1, 2].includes(code)) {
    return `<svg viewBox="0 0 64 64" width="38" height="38" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="26" cy="24" r="8" fill="rgba(255,255,255,0.15)" stroke="#ffffff"/>
      <line x1="26" y1="10" x2="26" y2="13" stroke="#ffffff"/>
      <line x1="12" y1="24" x2="15" y2="24" stroke="#ffffff"/>
      <line x1="16" y1="14" x2="18" y2="16" stroke="#ffffff"/>
      <path d="M22 42h24a8 8 0 0 0 1.5-15.8 11 11 0 0 0-21.5 2.8A7 7 0 0 0 22 42z" fill="rgba(255,255,255,0.12)" stroke="#ffffff"/>
    </svg>`;
  }
  // Thunderstorm
  if ([95, 96, 99].includes(code)) {
    return `<svg viewBox="0 0 64 64" width="38" height="38" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 36a9 9 0 0 1 1.5-17.8 13 13 0 0 1 24.5 3.6A8.5 8.5 0 0 1 44 38H20z" fill="rgba(255,255,255,0.12)" stroke="#ffffff"/>
      <polyline points="33,38 27,47 34,47 29,56" stroke="#ffffff" stroke-width="3"/>
    </svg>`;
  }
  // Snow
  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return `<svg viewBox="0 0 64 64" width="38" height="38" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 36a9 9 0 0 1 1.5-17.8 13 13 0 0 1 24.5 3.6A8.5 8.5 0 0 1 44 38H20z" fill="rgba(255,255,255,0.12)" stroke="#ffffff"/>
      <circle cx="23" cy="46" r="2" fill="#ffffff"/>
      <circle cx="32" cy="50" r="2" fill="#ffffff"/>
      <circle cx="41" cy="46" r="2" fill="#ffffff"/>
    </svg>`;
  }
  // Fog
  if ([45, 48].includes(code)) {
    return `<svg viewBox="0 0 64 64" width="38" height="38" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <line x1="16" y1="26" x2="48" y2="26" stroke="#ffffff"/>
      <line x1="12" y1="34" x2="52" y2="34" stroke="#ffffff"/>
      <line x1="18" y1="42" x2="46" y2="42" stroke="#ffffff"/>
    </svg>`;
  }
  // Overcast / Cloudy
  return `<svg viewBox="0 0 64 64" width="38" height="38" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20 42h26a9 9 0 0 0 1.8-17.8 13 13 0 0 0-25.2 3.8A8 8 0 0 0 20 42z" fill="rgba(255,255,255,0.15)" stroke="#ffffff"/>
  </svg>`;
}

function formatWeatherDate(d = new Date()) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

const liveWeatherState = {
  lat: 12.5043,
  lon: 80.1656,
  timer: null
};

let lastSuccessfulWeatherFetch = null;
let lastWeatherPayload = null;

function initLiveWeather() {
  // 1. Immediately format today's date
  const dateEl = $('weatherCompactDate');
  if (dateEl) {
    dateEl.textContent = formatWeatherDate(new Date());
  }

  // Initial placeholder advisory matching standard clear/favourable starting state
  updateAdvisoryTicker('suitable', "🟢 SUITABLE FOR SPRAYING — 🌱 FARMER ATI ADVISORY: Today's weather conditions are favourable for crop spraying. Check wind speed and ensure crop foliage is dry before application. Follow recommended product dosage and wear personal protective equipment (PPE).");

  // 2. Click on the right bubble or ticker to refresh live weather
  const bubble = document.querySelector('.weather-glass-bubble');
  if (bubble) {
    bubble.addEventListener('click', () => {
      fetchOpenMeteoWeather(liveWeatherState.lat, liveWeatherState.lon);
    });
  }

  const tickerContainer = $('advisoryTickerContainer');
  if (tickerContainer) {
    tickerContainer.addEventListener('click', () => {
      fetchOpenMeteoWeather(liveWeatherState.lat, liveWeatherState.lon);
    });
  }

  // 3. Silently request tablet GPS location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        liveWeatherState.lat = pos.coords.latitude;
        liveWeatherState.lon = pos.coords.longitude;
        fetchOpenMeteoWeather(liveWeatherState.lat, liveWeatherState.lon);
      },
      (err) => {
        // Fallback silently to default agro farm location
        fetchOpenMeteoWeather(liveWeatherState.lat, liveWeatherState.lon);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 }
    );
  } else {
    fetchOpenMeteoWeather(liveWeatherState.lat, liveWeatherState.lon);
  }

  // 4. Auto-refresh every 15 minutes
  if (liveWeatherState.timer) clearInterval(liveWeatherState.timer);
  liveWeatherState.timer = setInterval(() => {
    fetchOpenMeteoWeather(liveWeatherState.lat, liveWeatherState.lon);
  }, 15 * 60 * 1000);
}

function extractCurrentHourRainProbability(hourly) {
  if (!hourly || !hourly.time || !hourly.precipitation_probability) return 10;
  const now = new Date();
  let closestIdx = 0;
  let minDiff = Infinity;

  for (let i = 0; i < hourly.time.length; i++) {
    const t = new Date(hourly.time[i]);
    const diff = Math.abs(t.getTime() - now.getTime());
    if (diff < minDiff) {
      minDiff = diff;
      closestIdx = i;
    }
  }

  const prob = hourly.precipitation_probability[closestIdx];
  return typeof prob === 'number' ? Math.round(prob) : 10;
}

async function fetchOpenMeteoWeather(lat, lon) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_gusts_10m&hourly=precipitation_probability,precipitation&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) {
      handleWeatherFetchStaleness();
      return;
    }
    const json = await res.json();
    if (!json || !json.current) {
      handleWeatherFetchStaleness();
      return;
    }

    lastSuccessfulWeatherFetch = Date.now();
    lastWeatherPayload = json;
    renderCompactWeatherUI(json);
    updateAdvisoryTickerFromWeather(json);
  } catch (_) {
    handleWeatherFetchStaleness();
  }
}

function handleWeatherFetchStaleness() {
  if (!lastWeatherPayload || !lastSuccessfulWeatherFetch) {
    updateAdvisoryTicker('unknown', "⚪ INSUFFICIENT WEATHER DATA — ℹ️ FARMER ATI ADVISORY: Real-time weather measurements unavailable. Spraying suitability cannot be confirmed. Verify local wind speed, foliage wetness, and rain probability manually before chemical application.");
    return;
  }
  const ageMinutes = Math.round((Date.now() - lastSuccessfulWeatherFetch) / 60000);
  if (ageMinutes > 35) {
    const evalResult = evaluateSprayAdvisory(lastWeatherPayload);
    updateAdvisoryTicker(evalResult.status, `⚠️ STALE WEATHER ADVISORY (Updated ${ageMinutes} min ago) — ${evalResult.message}`);
  }
}

function evaluateSprayAdvisory(weatherData) {
  if (!weatherData || !weatherData.current) {
    return {
      status: 'unknown',
      message: "⚪ INSUFFICIENT WEATHER DATA — ℹ️ FARMER ATI ADVISORY: Weather information is incomplete. Check local field conditions before chemical application."
    };
  }

  const cur = weatherData.current;
  const hourly = weatherData.hourly || {};
  const temp = Math.round(Number(cur.temperature_2m ?? 28));
  const humidity = Math.round(Number(cur.relative_humidity_2m ?? 65));
  const wCode = Number(cur.weather_code ?? 0);
  const conditionName = WMO_WEATHER_NAMES[wCode] || "Clear";
  const windSpeed = Math.round(Number(cur.wind_speed_10m ?? 8));
  const windGusts = Math.round(Number(cur.wind_gusts_10m ?? (windSpeed * 1.3)));
  const rainProb = extractCurrentHourRainProbability(hourly);

  // Check upcoming 3-4 hours rainfall forecast
  let maxNextRainProb = rainProb;
  let nextRainMm = 0;
  if (hourly.precipitation_probability && hourly.precipitation_probability.length) {
    const nextHours = hourly.precipitation_probability.slice(0, 4);
    maxNextRainProb = Math.max(...nextHours, rainProb);
  }
  if (hourly.precipitation && hourly.precipitation.length) {
    const nextP = hourly.precipitation.slice(0, 4);
    nextRainMm = nextP.reduce((a, b) => a + (Number(b) || 0), 0);
  }

  // 1. Rain / Storm Warning (RED)
  // WMO codes: 51-67 (Drizzle/Rain), 80-82 (Showers), 95-99 (Thunderstorms)
  const isRainingNow = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(wCode);
  if (isRainingNow || maxNextRainProb >= 50 || nextRainMm > 0.8) {
    return {
      status: 'warning',
      message: `🔴 NOT RECOMMENDED FOR SPRAYING — 🌧️ WEATHER ALERT: Rain or precipitation expected (Rain risk: ${maxNextRainProb}%, Condition: ${conditionName}). Postpone chemical application to prevent pesticide wash-off and reduced efficacy. Observe product-specific rain-fast intervals before application.`
    };
  }

  // 2. High Wind / Drift Risk (RED)
  if (windSpeed > 20 || windGusts > 25) {
    return {
      status: 'warning',
      message: `🔴 NOT RECOMMENDED FOR SPRAYING — 💨 WEATHER ALERT: Strong winds detected (Wind: ${windSpeed} km/h, Gusts: ${windGusts} km/h). Avoid spraying to prevent chemical drift towards nearby crops, residential areas, people, and water bodies. Wait for safer, calmer conditions.`
    };
  }

  // 3. Extreme High Temperature (RED)
  if (temp >= 35) {
    return {
      status: 'warning',
      message: `🔴 NOT RECOMMENDED FOR SPRAYING — ☀️ WEATHER ALERT: High temperatures detected (${temp}°C). Avoid spraying in extreme heat; high evaporation rates increase foliar scorch and crop-injury risk. Reschedule operations to cooler, calmer morning or late afternoon hours.`
    };
  }

  // 4. Fog / Mist / Saturated Dew (YELLOW - Caution)
  if ([45, 48].includes(wCode) || humidity >= 90) {
    return {
      status: 'caution',
      message: `🟡 CAUTION – CHECK CONDITIONS — 🌫️ WEATHER ALERT: Fog or high humidity detected (${humidity}%). Wait until visibility improves and crop foliage is completely dry before spraying. Wet foliage dilutes chemicals and causes excessive runoff.`
    };
  }

  // 5. Moderate Wind or Dead Calm / Inversion Risk (YELLOW - Caution)
  if (windSpeed > 15 && windSpeed <= 20) {
    return {
      status: 'caution',
      message: `🟡 CAUTION – CHECK CONDITIONS — 🍃 SPRAYING WARNING: Moderate wind speed (${windSpeed} km/h). Windy conditions may cause spray droplets to drift away from the target crop. Use drift-reducing coarse nozzles and keep spray boom low.`
    };
  }
  if (windSpeed < 3) {
    return {
      status: 'caution',
      message: `🟡 CAUTION – CHECK CONDITIONS — 🌡️ INVERSION WARNING: Near dead-calm wind (${windSpeed} km/h). Risk of temperature inversion where airborne fine droplets stay suspended and drift unpredictably. Confirm active atmospheric mixing before spraying.`
    };
  }

  // 6. Elevated Warm Temperature (YELLOW - Caution)
  if (temp >= 30 && temp < 35) {
    return {
      status: 'caution',
      message: `🟡 CAUTION – CHECK CONDITIONS — 🌤️ ELEVATED TEMPERATURE: Warm conditions detected (${temp}°C). Increased evaporation can reduce chemical uptake. Consider cooler, calmer morning or late evening hours when permitted by the pesticide label.`
    };
  }

  // 7. Marginal Rain Probability (YELLOW - Caution)
  if (maxNextRainProb >= 30 && maxNextRainProb < 50) {
    return {
      status: 'caution',
      message: `🟡 CAUTION – CHECK CONDITIONS — ⛅ WEATHER ADVISORY: Marginal rain probability (${maxNextRainProb}%). Rain may wash chemicals from leaves. Follow the product-specific rain-free interval and ensure leaves stay dry after application.`
    };
  }

  // 8. Favourable / Suitable Conditions (GREEN)
  return {
    status: 'suitable',
    message: `🟢 SUITABLE FOR SPRAYING — 🌱 FARMER ATI ADVISORY: Today's weather conditions are favourable for crop spraying (Temp: ${temp}°C, Wind: ${windSpeed} km/h, Rain Risk: ${rainProb}%). Check wind speed and ensure crop leaves are dry before application. Follow the recommended dosage, wear protective equipment (PPE), and avoid spraying near water bodies.`
  };
}

function updateAdvisoryTickerFromWeather(json) {
  const evalResult = evaluateSprayAdvisory(json);
  updateAdvisoryTicker(evalResult.status, evalResult.message);
}

function updateAdvisoryTicker(status, message) {
  const container = $('advisoryTickerContainer');
  const badgeLabel = $('advisoryBadgeLabel');
  const textEl = $('advisoryTickerText');
  if (!container || !textEl) return;

  container.className = `advisory-ticker-container status-${status}`;
  
  const statusLabels = {
    'suitable': 'SUITABLE FOR SPRAYING',
    'caution':  'CAUTION – CHECK CONDITIONS',
    'warning':  'NOT RECOMMENDED',
    'unknown':  'INSUFFICIENT DATA'
  };
  if (badgeLabel) {
    badgeLabel.textContent = statusLabels[status] || 'SPRAY ADVISORY';
  }

  if (textEl.textContent.trim() !== message.trim()) {
    textEl.textContent = message;
    
    // Dynamic animation speed based on sentence length (approx 22-32 seconds)
    const duration = Math.min(34, Math.max(20, Math.round(message.length * 0.16)));
    
    // Restart continuous animation smoothly from right edge
    textEl.style.animation = 'none';
    void textEl.offsetWidth; // Force reflow
    textEl.style.animation = `tickerMarquee ${duration}s linear infinite`;
  }
}

function renderCompactWeatherUI(json) {
  const current = json.current || {};
  const daily = json.daily || {};
  const hourly = json.hourly || {};

  const temp = Math.round(current.temperature_2m ?? 32);
  const wCode = current.weather_code ?? 80;
  const conditionName = WMO_WEATHER_NAMES[wCode] || "Rain Showers";
  const rainProb = extractCurrentHourRainProbability(hourly);

  const maxTemp = (daily.temperature_2m_max && daily.temperature_2m_max.length)
    ? Math.round(daily.temperature_2m_max[0])
    : 32;
  const minTemp = (daily.temperature_2m_min && daily.temperature_2m_min.length)
    ? Math.round(daily.temperature_2m_min[0])
    : 24;

  const elTemp = $('weatherTemp');
  const elCond = $('weatherCondition');
  const elRainProb = $('weatherRainProb');
  const elMax = $('weatherTempMax');
  const elMin = $('weatherTempMin');
  const elGraphic = $('weatherGraphic');

  if (elTemp) elTemp.textContent = temp;
  if (elCond) elCond.textContent = conditionName;
  if (elRainProb) elRainProb.textContent = `${rainProb}%`;
  if (elMax) elMax.textContent = `${maxTemp}°`;
  if (elMin) elMin.textContent = `${minTemp}°`;
  if (elGraphic) elGraphic.innerHTML = getSvgWeatherIcon(wCode);
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
initLiveWeather();
setStatus('idle');

if (!navigator.bluetooth) {
  $('connectionMessage').textContent =
    '⚠ Web Bluetooth is not available. Please use Google Chrome on Android or desktop Chrome with Bluetooth enabled.';
  if (connectBtn) connectBtn.disabled = true;
}
