'use strict';

// ============================================================
// FARMER ATI – Intelligent Pond-Water-Based Seasonal Crop System
//
// ESP32 BLE service:        0xA000
// ESP32 characteristic:     0xA001  (READ | NOTIFY)
// Device name:              FARMER ATI
//
// Reliable Framed Binary Protocol (Max 20 bytes per BLE packet):
//   [0]: 0xFA  (Magic byte 1)
//   [1]: 0x72  (Magic byte 2: Text & Telemetry JSON protocol)
//   [2]: msgId (0..255)
//   [3]: pktIdx (0..totalPkts-1)
//   [4]: totalPkts (1..255)
//   [5..N]: payload bytes (reassembled first, then decoded as UTF-8)
//
// JSON format once assembled:
//   {
//     "s": "SCREEN TITLE",
//     "l": ["line 1", "line 2", ...],
//     "pm": "pond" | "default",
//     "sr": sensor_distance_m | null,
//     "wd": water_depth_m,
//     "wv": usable_water_litres,
//     "wp": water_pct,
//     "mo": "Month",
//     "se": "Season",
//     "rc": ["Crop1", "Crop2", ...],
//     "cc": "Current Crop"
//   }
// ============================================================

const BLE_DEVICE_NAME         = 'FARMER ATI';
const BLE_SERVICE_UUID        = 0xA000;
const BLE_CHARACTERISTIC_UUID = 0xA001;

// ── State ────────────────────────────────────────────────────
let bleDevice         = null;
let bleServer         = null;
let bleCharacteristic = null;
let frameCount        = 0;

// Pond & Recommendation Telemetry State
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

// UI Filters
let cropFilterMode   = 'all'; // 'all' or 'rec'
let cropSearchQuery  = '';
let problemFilterMode= 'all'; // 'all' or 'rec'
let selectedCrop     = null;

// ── DOM helpers ───────────────────────────────────────────────
const $  = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
  }
};

// ── Common Field Problems & Solutions ─────────────────────────
const PROBLEMS = {
  "Stem Borer & Leaf Folder": [
    "Common in Paddy and Maize",
    "Signs: Dead heart at vegetative stage, white ear at maturity, folded leaves",
    "Organic Care: Trichogramma egg parasitoids, pheromone traps (5/acre)",
    "Spray: Neem oil 3-5 ml/L or NSKE 5% at early infestation",
    "Prevention: Balanced nitrogen, avoid continuous flooding, clip seedling tips"
  ],
  "Sucking Pests (Aphids/Thrips/Whitefly)": [
    "Affects Chilli, Tomato, Brinjal, Cotton, Black Gram, Green Gram, Groundnut",
    "Signs: Leaf curling, sooty mold, vector for Yellow Mosaic and Leaf Curl viruses",
    "Organic Care: Yellow and blue sticky traps (10/acre), spray neem seed kernel extract",
    "Spray: 5% Neem oil + soap solution or Verticillium lecanii bio-pesticide",
    "Prevention: Clean weeding, border cropping with maize or sorghum"
  ],
  "Fruit & Shoot Borer": [
    "Prevalent in Brinjal, Tomato, Bhendi, Chilli",
    "Signs: Drooping terminal shoots, borehole in fruits with excreta",
    "Organic Care: Clip and destroy infested shoots weekly, pheromone traps",
    "Spray: Bacillus thuringiensis (Bt) @ 2g/L or Neem cake soil application",
    "Prevention: Crop rotation with non-solanaceous crops, avoid ratoon cropping"
  ],
  "Fungal Blight & Leaf Spot": [
    "Affects Paddy (Blast), Groundnut (Tikka), Tomato (Early Blight)",
    "Signs: Concentric circular dark spots, spindle-shaped lesions on leaves",
    "Organic Care: Seed treatment with Trichoderma viride @ 4g/kg seed",
    "Spray: Pseudomonas fluorescens spray @ 10g/L or 1% Bordeaux mixture",
    "Prevention: Proper spacing, remove bottom diseased leaves, good air flow"
  ],
  "Powdery Mildew & Rust": [
    "Common in Green Gram, Black Gram, Bhendi, Mango, Sesame",
    "Signs: White powdery patches on leaf surfaces, yellowish/orange pustules",
    "Organic Care: Milk spray (10% solution) or sulfur-based organic formulation",
    "Spray: Wettable sulfur @ 2g/L or Ampelomyces quisqualis bio-fungicide",
    "Prevention: Wider plant spacing, avoid excess nitrogen, prune crowded branches"
  ],
  "Wilt & Root Rot Complex": [
    "Attacks Cotton, Chilli, Tomato, Groundnut, Sugarcane",
    "Signs: Sudden drooping and yellowing of foliage, vascular browning in stems",
    "Organic Care: Enrich farmyard manure with Trichoderma and Pseudomonas",
    "Spray / Drench: Drench root zone with bio-control slurry or copper hydroxide",
    "Prevention: Ensure raised beds, avoid waterlogging, long crop rotation"
  ],
  "Pond Water Shortage Management": [
    "Crucial during dry spells and low pond storage (<30%)",
    "Advisory: Shift immediately to micro-irrigation (drip / sprinkler)",
    "Practices: Mulch with crop residues (5 cm thickness) to conserve soil moisture",
    "Crop Choice: Switch to low-water pulses (Black Gram, Green Gram, Sesame, Ragi)",
    "Irrigation: Schedule irrigation at critical stages only (flowering & pod set)"
  ],
  "Waterlogging & Drainage Issues": [
    "Risk during heavy North-East monsoon showers (Oct-Dec)",
    "Signs: Yellowing leaves, root asphyxiation, stunted vegetative growth",
    "Action: Dig shallow field drainage channels to divert excess surface water",
    "Recovery: Apply light foliar spray of 1% urea or 0.5% micronutrient after drainage",
    "Prevention: Prepare broad-bed and furrow system for vegetable crops"
  ],
  "Weed Competition & Intercultivation": [
    "Reduces yield by 30-50% in early 30-45 days of all crops",
    "Action: First hand weeding at 15-20 days, second weeding at 35-40 days",
    "Organic Solution: Grow intercrops/cover crops (Cowpea or Sunnhemp) to smother weeds",
    "Mechanical: Use cono-weeder for SRI paddy and wheel hoe for row crops"
  ],
  "Soil Salinity & Low Organic Matter": [
    "Impairs nutrient uptake, seed germination, and root elongation",
    "Correction: Apply 5 tonnes/acre well-rotted FYM or vermicompost",
    "Green Manure: Grow and incorporate Daincha or Sunnhemp at 45 days",
    "Testing: Conduct soil test (NPK, pH, EC) before applying major fertilizers"
  ]
};

// ============================================================
// TAB NAVIGATION
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

  // Extract fields
  if (data.pm) pondTelemetry.mode = data.pm;
  if (data.sr !== undefined) pondTelemetry.sensorDist = data.sr;
  if (data.wd !== undefined) pondTelemetry.waterDepth = Number(data.wd) || 0;
  if (data.wv !== undefined) pondTelemetry.waterLitres = Number(data.wv) || 0;
  if (data.wp !== undefined) pondTelemetry.waterPct = Number(data.wp) || 0;
  if (data.mo) pondTelemetry.month = data.mo;
  if (data.se) pondTelemetry.season = data.se;
  if (Array.isArray(data.rc)) pondTelemetry.recCrops = data.rc;
  if (data.cc) pondTelemetry.currentCrop = data.cc;

  // Update Overview Elements
  const depthEl = $('pondDepth');
  if (depthEl) {
    depthEl.textContent = pondTelemetry.waterDepth > 0
      ? pondTelemetry.waterDepth.toFixed(2) + ' m'
      : (pondTelemetry.mode === 'pond' ? '0.00 m' : 'Seasonal Est.');
  }

  const sensorEl = $('pondSensorDist');
  if (sensorEl) {
    if (pondTelemetry.mode === 'pond') {
      sensorEl.textContent = pondTelemetry.sensorDist !== null
        ? `Ultrasonic Echo: ${pondTelemetry.sensorDist.toFixed(2)} m (Ref: 5.0m)`
        : 'Sensor offline / Disconnected';
    } else {
      sensorEl.textContent = 'Mode: Default Seasonal (No sensor)';
    }
  }

  const litresEl = $('pondLitres');
  if (litresEl) {
    litresEl.textContent = pondTelemetry.waterLitres > 0
      ? pondTelemetry.waterLitres.toLocaleString() + ' L'
      : (pondTelemetry.mode === 'pond' ? '0 Litres (Dry)' : 'Seasonal Normal');
  }

  const volM3El = $('pondVolumeM3');
  if (volM3El) {
    if (pondTelemetry.waterLitres > 0) {
      const m3 = (pondTelemetry.waterLitres / 1000).toFixed(0);
      volM3El.textContent = `${m3} m³ usable · 75% eff. (Dead storage 0.3m)`;
    } else {
      volM3El.textContent = '75% Irrig. Eff. · Dead Storage 0.3m';
    }
  }

  const pctEl = $('pondPct');
  if (pctEl) {
    pctEl.textContent = pondTelemetry.waterPct > 0
      ? pondTelemetry.waterPct.toFixed(1) + '%'
      : (pondTelemetry.mode === 'pond' ? '0%' : 'Normal');
  }

  const fillBar = $('pondFillBar');
  if (fillBar) {
    const pct = Math.min(100, Math.max(0, pondTelemetry.waterPct));
    fillBar.style.width = pct + '%';
    if (pct < 25) {
      fillBar.style.background = 'linear-gradient(90deg, #ef4444, #f97316)';
    } else if (pct < 50) {
      fillBar.style.background = 'linear-gradient(90deg, #f59e0b, #eab308)';
    } else {
      fillBar.style.background = 'linear-gradient(90deg, #38bdf8 0%, #2563eb 50%, #10b981 100%)';
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

  // Render chips
  const chipsEl = $('pondCropList');
  if (chipsEl) {
    if (pondTelemetry.recCrops.length > 0) {
      chipsEl.innerHTML = pondTelemetry.recCrops.map(name => {
        const crop = CROPS[name];
        const waterStr = crop && crop.WaterReq_L ? `${(crop.WaterReq_L / 1000000).toFixed(1)}M L/ac` : '';
        return `<span class="crop-chip" data-crop="${esc(name)}">
          <span>🌱 ${esc(name)}</span>
          ${waterStr ? `<span class="chip-water">${waterStr}</span>` : ''}
        </span>`;
      }).join('');

      // Chip click jumps to Crop Library
      chipsEl.querySelectorAll('.crop-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          const cName = chip.dataset.crop;
          switchTab('tab-crops');
          selectCrop(cName);
        });
      });
    } else {
      chipsEl.innerHTML = '<span class="chip-empty">No crops meet the current water and seasonal criteria. Check pond storage.</span>';
    }
  }

  // Refresh crop grid & problems if active
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

  // 1. Filter by recommendation
  if (cropFilterMode === 'rec' && pondTelemetry.recCrops.length > 0) {
    filtered = filtered.filter(name => pondTelemetry.recCrops.includes(name));
  }

  // 2. Filter by search query
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

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="muted" style="grid-column: 1/-1; padding: 20px; text-align: center;">No crops match your current filter.</div>';
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
      <span class="crop-name">${esc(name)}</span>
      ${waterStr ? `<span class="crop-water-pill">💧 ${waterStr}</span>` : ''}
      <span class="crop-hint">${isRec ? 'Recommended' : 'Tap for guide'}</span>
    `;
    btn.addEventListener('click', () => selectCrop(name));
    grid.appendChild(btn);
  });

  // Re-select currently selected crop if present
  if (selectedCrop && filtered.includes(selectedCrop)) {
    selectCrop(selectedCrop);
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

  const makeSection = (title, items) => {
    if (!items || !items.length) return '';
    return `<div class="detail-section">
      <div class="detail-label">${esc(title)}</div>
      <ul>${items.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
    </div>`;
  };

  const makeTextSection = (title, text) => {
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
      <h3 class="detail-crop-title" style="margin:0;">🌱 ${esc(name)}</h3>
      ${isRec ? '<span class="pond-mode-badge badge-pond">Recommended for Current Pond & Season</span>' : ''}
    </div>
    ${makeTextSection('Water Requirement', waterFormatted)}
    ${makeTextSection('Duration', d.Duration)}
    ${makeTextSection('Irrigation Schedule', d.Irrigation)}
    ${makeTextSection('Suitable Soil Type', d.Soil)}
    ${makeSection('Season & Calendar', d.Season)}
    ${makeSection('Crop Classification', d.Type)}
    ${makeSection('Common Field Problems', d.Problems)}
    ${makeSection('Organic Care & Biocontrol', d['Organic Care'])}
    ${makeSection('Preventive Measures', d.Prevention)}
    ${makeSection('Spray Formulation & Label Guide', d['Spray Info'])}
    ${d['Tree Info'] ? makeSection('Tree Canopy & Spacing Info', d['Tree Info']) : ''}
    ${makeSection('Optimal Sowing Months', d.Months)}
  `;
}

function highlightActiveCrop(name) {
  if (!name) return;
  $$('.crop-btn').forEach(btn => {
    const isCurrent = btn.id === 'cropbtn-' + name.replace(/[^a-zA-Z0-9]/g, '_');
    btn.classList.toggle('oled-active', isCurrent);
    if (isCurrent) {
      const hint = btn.querySelector('.crop-hint');
      if (hint) hint.textContent = '📟 On OLED now';
    }
  });
}

// ============================================================
// FARMER PROBLEMS TAB
// ============================================================

function buildProblems() {
  const grid = $('problemGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const problemKeys = Object.keys(PROBLEMS);

  let filtered = problemKeys;
  if (problemFilterMode === 'rec' && pondTelemetry.recCrops.length > 0) {
    // Collect all problem keywords relevant to recommended crops
    const recCropProblems = [];
    pondTelemetry.recCrops.forEach(cName => {
      const c = CROPS[cName];
      if (c && c.Problems) recCropProblems.push(...c.Problems.map(p => p.toLowerCase()));
    });

    // Always include pond water shortage and waterlogging
    filtered = filtered.filter(pName => {
      const pLow = pName.toLowerCase();
      if (pLow.includes('pond') || pLow.includes('water') || pLow.includes('soil')) return true;
      return recCropProblems.some(rcp => pLow.includes(rcp) || rcp.includes(pLow));
    });
  }

  filtered.forEach(name => {
    const card = document.createElement('div');
    card.className = 'problem-card';
    card.innerHTML = `
      <div class="problem-title">${esc(name)}</div>
      <ul>${PROBLEMS[name].map(x => `<li>${esc(x)}</li>`).join('')}</ul>
    `;
    grid.appendChild(card);
  });
}

// ============================================================
// SEED RATE CALCULATOR TAB
// ============================================================

function updateCalculatorCropList() {
  const sel = $('calcCrop');
  if (!sel) return;
  const currentVal = sel.value;
  sel.innerHTML = '<option value="" disabled>Select crop…</option>';

  const allNames = Object.keys(CROPS);

  // Group recommended crops first
  if (pondTelemetry.recCrops.length > 0) {
    const optGroupRec = document.createElement('optgroup');
    optGroupRec.label = '🌱 Recommended for Current Pond Level';
    pondTelemetry.recCrops.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = `🌱 ${name}`;
      optGroupRec.appendChild(opt);
    });
    sel.appendChild(optGroupRec);
  }

  const optGroupAll = document.createElement('optgroup');
  optGroupAll.label = 'All Crops';
  allNames.forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
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
}

function setupCalculator() {
  const calcBtn = $('calcBtn');
  const calcResult = $('calcResult');
  if (!calcBtn) return;

  calcBtn.addEventListener('click', () => {
    const area  = parseFloat($('calcArea').value);
    const rate  = parseFloat($('calcRate').value);
    const crop  = $('calcCrop').value;

    if (isNaN(area) || isNaN(rate) || area <= 0 || rate <= 0) {
      calcResult.innerHTML = '<span class="calc-error">⚠ Please enter valid area and rate values.</span>';
      return;
    }

    const total = (area * rate).toFixed(2);
    const unit  = (crop === 'Mango' || crop === 'Coconut') ? 'trees (canopy-based)' : 'kg seed';

    // Calculate crop water requirement for this acreage
    let waterInfo = '';
    const cropData = CROPS[crop];
    if (cropData && cropData.WaterReq_L) {
      const cropLitres = cropData.WaterReq_L * area;
      const cropM3 = (cropLitres / 1000).toFixed(0);
      const pondAvailable = pondTelemetry.waterLitres;
      let pondCompare = '';
      if (pondAvailable > 0) {
        const canSustain = pondAvailable >= cropLitres;
        pondCompare = canSustain
          ? `<div class="calc-row" style="color:#047857;"><span>Pond Water Adequacy</span><strong>✔ Pond water sufficient (${(pondAvailable - cropLitres).toLocaleString()} L surplus)</strong></div>`
          : `<div class="calc-row" style="color:#dc2626;"><span>Pond Water Adequacy</span><strong>⚠ Deficit of ${(cropLitres - pondAvailable).toLocaleString()} L from current pond</strong></div>`;
      }

      waterInfo = `
        <div class="calc-row"><span>Crop Water Need</span><strong>${cropLitres.toLocaleString()} L (~${cropM3} m³)</strong></div>
        ${pondCompare}
      `;
    }

    calcResult.innerHTML = `
      <div class="calc-answer">
        <div class="calc-row"><span>Crop</span><strong>${esc(crop)}</strong></div>
        <div class="calc-row"><span>Area / Canopy</span><strong>${area} acres</strong></div>
        <div class="calc-row"><span>Seed Rate</span><strong>${rate} ${unit}/acre</strong></div>
        <div class="calc-row total-row"><span>Total Seed Required</span><strong>${total} ${unit}</strong></div>
        ${waterInfo}
      </div>
    `;
  });

  updateCalculatorCropList();
}

// ============================================================
// LIVE DISPLAY TAB — render incoming BLE data
// ============================================================

function renderLiveScreen(data) {
  /* data = { s: "SCREEN NAME", l: ["line1", "line2", ...], ... } */
  const lines = Array.isArray(data.l) ? data.l : [];
  const screen = data.s || '';

  // Update status bar
  const liveTitle = $('liveScreenTitle');
  if (liveTitle) liveTitle.textContent = screen || 'FARMER ATI';

  const liveTime = $('liveScreenTime');
  if (liveTime) liveTime.textContent = new Date().toLocaleTimeString();

  // Render lines
  const container = $('liveLines');
  if (!container) return;

  if (!lines.length) {
    container.innerHTML = '<div class="live-empty">Waiting for ESP32 screen update…</div>';
    return;
  }

  // Classify lines into heading / selected / normal
  container.innerHTML = lines.map((text, i) => {
    let cls = 'live-line';
    if (i === 0 && text.length <= 20) cls += ' live-heading';
    else if (text.startsWith('>')) cls += ' live-selected';
    else if (text.match(/^[A-Z ]+:$/)) cls += ' live-label';
    return `<div class="${cls}">${esc(text)}</div>`;
  }).join('');

  // Detect active crop from visible lines or payload
  let activeCrop = data.cc || '';
  if (!activeCrop) {
    const visible = lines.join(' ').toLowerCase();
    Object.keys(CROPS).forEach(name => {
      if (visible.includes(name.toLowerCase())) activeCrop = name;
    });
  }

  // Update overview stat cards
  const screenName = $('statScreen');
  if (screenName) screenName.textContent = screen || '—';

  const activeCropEl = $('statCrop');
  if (activeCropEl) activeCropEl.textContent = activeCrop || '—';

  // Highlight crop in library
  if (activeCrop) highlightActiveCrop(activeCrop);

  // Update pond telemetry UI
  updatePondTelemetryUI(data);

  frameCount++;
  const fc = $('frameCount');
  if (fc) fc.textContent = frameCount;
}

// ============================================================
// RELIABLE BINARY PACKET PROTOCOL & REASSEMBLY
//
// Header (5 bytes):
//   [0]: 0xFA (magic 1)
//   [1]: 0x72 (magic 2: text-based JSON protocol)
//   [2]: msgId (0..255)
//   [3]: pktIdx (0..totalPkts-1)
//   [4]: totalPkts (1..255)
//   [5..N]: payload data bytes (never decoded as UTF-8 until reassembled)
// ============================================================

const MAGIC_0 = 0xFA;
const MAGIC_1 = 0x72; // Protocol identifier for text-based JSON mirror
const HEADER_SIZE = 5;

// Active message assemblers: msgId -> { totalPkts, fragments: Map(pktIdx -> Uint8Array), timestamp }
const activeAssemblers = new Map();

// Diagnostics / Debug tracking
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

  // 1. Verify Minimum Size (5 header bytes + at least 1 byte data)
  if (bytes.length < HEADER_SIZE + 1) {
    debugStats.jsonErrors++;
    debugStats.lastError = `Packet too small (${bytes.length} bytes): ${hex}`;
    updateDebugUI(hex);
    return;
  }

  // 2. Verify Magic Header [0xFA, 0x72]
  if (bytes[0] !== MAGIC_0 || bytes[1] !== MAGIC_1) {
    debugStats.jsonErrors++;
    debugStats.lastError = `Ignored non-protocol packet: Header [${bytes[0].toString(16).toUpperCase()}, ${bytes[1].toString(16).toUpperCase()}]. Expected [FA, 72].`;
    updateDebugUI(hex);
    return;
  }

  // 3. Extract reliable packet identification
  const msgId = bytes[2];
  const pktIdx = bytes[3];
  const totalPkts = bytes[4];
  const chunkData = bytes.slice(HEADER_SIZE); // Raw binary slice — DO NOT decode as UTF-8 yet!
  debugStats.lastMsgId = msgId;

  // Validate packet bounds
  if (totalPkts === 0 || pktIdx >= totalPkts) {
    debugStats.jsonErrors++;
    debugStats.lastError = `Corrupt header: pkt ${pktIdx} >= total ${totalPkts}`;
    updateDebugUI(hex, pktIdx, totalPkts);
    return;
  }

  const now = Date.now();

  // 4. Prune stale assemblers older than 2500ms
  for (const [id, asm] of activeAssemblers.entries()) {
    if (now - asm.timestamp > 2500) {
      debugStats.droppedIncomplete++;
      activeAssemblers.delete(id);
    }
  }

  // 5. Fetch or create assembler for this message
  let asm = activeAssemblers.get(msgId);
  if (!asm) {
    asm = {
      totalPkts: totalPkts,
      fragments: new Map(),
      timestamp: now
    };
    activeAssemblers.set(msgId, asm);
  }

  // Store binary fragment (idempotent: safely handles duplicate & out-of-order packets)
  asm.fragments.set(pktIdx, chunkData);
  updateDebugUI(hex, pktIdx, totalPkts);

  // 6. When all packets for this message have arrived, assemble
  if (asm.fragments.size === asm.totalPkts) {
    activeAssemblers.delete(msgId);

    // Calculate total buffer length
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

    // Allocate single contiguous byte buffer
    const completeBytes = new Uint8Array(totalLength);
    let offset = 0;
    for (let i = 0; i < asm.totalPkts; i++) {
      const fragment = asm.fragments.get(i);
      completeBytes.set(fragment, offset);
      offset += fragment.length;
    }

    // 7. Decode the complete reassembled message as UTF-8
    let jsonString = '';
    try {
      jsonString = new TextDecoder('utf-8', { fatal: true }).decode(completeBytes);
    } catch (decodeErr) {
      debugStats.jsonErrors++;
      debugStats.lastError = 'UTF-8 decode failed: ' + decodeErr.message;
      updateDebugUI(hex, pktIdx, totalPkts);
      return;
    }

    // 8. Parse JSON
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (parseErr) {
      debugStats.jsonErrors++;
      debugStats.lastError = 'JSON parse error: ' + parseErr.message;
      updateDebugUI(hex, pktIdx, totalPkts);
      return;
    }

    // 9. Verify schema structure: { s: string, l: array }
    if (!parsed || typeof parsed !== 'object' || typeof parsed.s !== 'string' || !Array.isArray(parsed.l)) {
      debugStats.jsonErrors++;
      debugStats.lastError = 'Invalid schema: expected {s:string, l:string[]}';
      updateDebugUI(hex, pktIdx, totalPkts);
      return;
    }

    // 10. Schema verified! Render to modern UI
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

    // Subscribe to notifications
    await bleCharacteristic.startNotifications();
    bleCharacteristic.addEventListener('characteristicvaluechanged', handleNotification);

    setStatus('connected', 'Connected to FARMER ATI. Waiting for live screen...');
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

  // Auto-reconnect after 2 seconds
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
setStatus('idle');

// Check Bluetooth availability
if (!navigator.bluetooth) {
  $('connectionMessage').textContent =
    '⚠ Web Bluetooth is not available. Please use Google Chrome on Android or desktop Chrome with Bluetooth enabled.';
  if (connectBtn) connectBtn.disabled = true;
}
