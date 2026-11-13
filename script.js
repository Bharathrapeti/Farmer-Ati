/**
 * FARMER ATI – Smart Agricultural Information System
 * Bluetooth Low Energy (BLE) Web Dashboard
 * Web Bluetooth API Implementation for ESP32 MicroPython
 */

'use strict';

// =============================================================================
// 1. BLE CONSTANTS & SPECIFICATIONS (EXACT HARDWARE MATCH)
// =============================================================================

// Custom FARMER ATI 16-bit Service UUID: 0xA000
const BLE_SERVICE_UUID = 0xa000;
// Characteristic for READ & NOTIFY: 0xA001
const BLE_CHARACTERISTIC_UUID = 0xa001;
// Expected BLE advertisement device name
const BLE_DEVICE_NAME = 'FARMER ATI';

// Full 128-bit fallback UUID strings for standard Bluetooth GATT resolution
const BLE_SERVICE_UUID_128 = '0000a000-0000-1000-8000-00805f9b34fb';
const BLE_CHAR_UUID_128 = '0000a001-0000-1000-8000-00805f9b34fb';

// =============================================================================
// 2. AUTHENTIC FARMER ATI DATASETS (MATCHING MICROPYTHON MAIN.PY)
// =============================================================================

const CROPS_DATA = {
  "Paddy": {
    "name": "Paddy (Rice)",
    "category": "FIELD CROP",
    "season": ["KHARIF / RABI", "DEPENDS ON REGION"],
    "type": ["FIELD CROP"],
    "defaultRate": 25,
    "rateUnit": "kg/acre",
    "problems": [
      "STEM BORER",
      "LEAF FOLDER",
      "BROWN PLANTHOPPER",
      "BLAST / FUNGAL DISEASE"
    ],
    "organicCare": [
      "USE HEALTHY SEED",
      "MAINTAIN FIELD SANITATION",
      "USE NEEM PRODUCTS",
      "FOLLOW PRODUCT LABEL",
      "ENCOURAGE BENEFICIAL INSECTS",
      "AVOID UNNECESSARY SPRAYING"
    ],
    "prevention": [
      "BALANCED FERTILIZATION",
      "PROPER SPACING (20x15 CM)",
      "CLEAN FIELD EDGES",
      "REGULAR FIELD SCOUTING"
    ],
    "sprayInfo": [
      "NEEM OIL: 3-5 ML/L",
      "SPRAY DURING EARLY MORNING OR LATE AFTERNOON",
      "ALWAYS FOLLOW PRODUCT LABEL"
    ],
    "months": [
      "JUNE TO JANUARY",
      "DEPENDS ON LOCAL MONSOON SEASON"
    ],
    "tip": "Maintain balanced nitrogen levels. Excess urea attracts stem borer and leaf folder pests."
  },

  "Groundnut": {
    "name": "Groundnut (Peanut)",
    "category": "OILSEED",
    "season": ["KHARIF / RABI", "SUMMER DEPENDS ON REGION"],
    "type": ["OILSEED"],
    "defaultRate": 45,
    "rateUnit": "kg/acre",
    "problems": [
      "APHIDS",
      "THRIPS",
      "LEAF SPOT (TIKKA)",
      "RED HAIRY CATERPILLAR"
    ],
    "organicCare": [
      "USE NEEM SEED KERNEL EXTRACT (NSKE 5%)",
      "USE NEEM OIL SPRAY",
      "REMOVE SEVERELY AFFECTED LEAVES",
      "MAINTAIN FIELD SANITATION",
      "AVOID WATERLOGGING IN ROOT ZONE"
    ],
    "prevention": [
      "CROP ROTATION WITH CEREALS",
      "HEALTHY CERTIFIED SEED",
      "PROPER SOIL DRAINAGE",
      "ROUTINE PEST MONITORING"
    ],
    "sprayInfo": [
      "NEEM OIL: 3-5 ML/L",
      "APPLY AT FIRST SIGN OF SAP-SUCKING PESTS",
      "FOLLOW PRODUCT LABEL"
    ],
    "months": [
      "JUNE-JULY & REGIONAL RABI SEASONS"
    ],
    "tip": "Provide gypsum at pegging stage for optimal pod development and healthy kernels."
  },

  "Black Gram": {
    "name": "Black Gram (Urad)",
    "category": "PULSE",
    "season": ["KHARIF / RABI / SUMMER"],
    "type": ["PULSE"],
    "defaultRate": 8,
    "rateUnit": "kg/acre",
    "problems": [
      "APHIDS",
      "WHITEFLY",
      "POD BORER",
      "YELLOW MOSAIC VIRUS (YMV)"
    ],
    "organicCare": [
      "USE NEEM PRODUCTS",
      "ROUGE OUT VIRUS-AFFECTED YELLOW PLANTS",
      "CONTROL WEEDS NEAR FIELD BORDERS",
      "ENCOURAGE LADYBIRD BENEFICIAL INSECTS"
    ],
    "prevention": [
      "USE HEALTHY CERTIFIED SEEDS",
      "SELECT YMV RESISTANT VARIETIES",
      "INSTALL YELLOW STICKY TRAPS"
    ],
    "sprayInfo": [
      "NEEM OIL: 3-5 ML/L",
      "CONTROL VECTOR WHITEFLIES PROMPTLY",
      "FOLLOW PRODUCT LABEL"
    ],
    "months": [
      "JUNE-JULY & SEPTEMBER-OCTOBER"
    ],
    "tip": "Whiteflies transmit Yellow Mosaic Virus. Install yellow sticky traps (6-8 per acre) to control vectors."
  },

  "Green Gram": {
    "name": "Green Gram (Moong)",
    "category": "PULSE",
    "season": ["KHARIF / RABI / SUMMER"],
    "type": ["PULSE"],
    "defaultRate": 8,
    "rateUnit": "kg/acre",
    "problems": [
      "WHITEFLY",
      "APHIDS",
      "THRIPS",
      "POWDERY MILDEW"
    ],
    "organicCare": [
      "USE NEEM PRODUCTS",
      "REMOVE AND BURN INFECTED PLANT RESIDUES",
      "IMPROVE INTER-ROW AIR CIRCULATION",
      "AVOID EXCESS OVERHEAD WATERING"
    ],
    "prevention": [
      "HEALTHY SEED TREATMENT",
      "PULSE-CEREAL CROP ROTATION",
      "TIMELY INTERCULTIVATION WEED CONTROL",
      "REGULAR LEAF-UNDERSIDE INSPECTION"
    ],
    "sprayInfo": [
      "NEEM OIL: 3-5 ML/L",
      "APPLY WETTABLE SULPHUR FOR MILDEW IF SEVERE",
      "FOLLOW PRODUCT LABEL"
    ],
    "months": [
      "JUNE-JULY & OCTOBER-MARCH"
    ],
    "tip": "Short duration pulse (60-70 days). Excellent for soil nitrogen enrichment between main crops."
  },

  "Chilli": {
    "name": "Chilli (Pepper)",
    "category": "VEGETABLE",
    "season": ["KHARIF / RABI", "DEPENDS ON REGION"],
    "type": ["VEGETABLE / SPICE"],
    "defaultRate": 0.25,
    "rateUnit": "kg/acre (Seedlings)",
    "problems": [
      "THRIPS",
      "APHIDS",
      "MITES",
      "FRUIT ROT (ANTHRACNOSE)",
      "LEAF CURL VIRUS"
    ],
    "organicCare": [
      "USE NEEM PRODUCTS & PONGAMIA OIL",
      "REMOVE BADLY INFECTED VIRUS PLANTS",
      "USE VIGOROUS TRANSPLANTED SEEDLINGS",
      "IMPROVE FURROW DRAINAGE",
      "AVOID PROLONGED CANOPY WETNESS"
    ],
    "prevention": [
      "RAISE HEALTHY NURSERY SEEDLINGS",
      "PROPER FIELD SPACING (60x45 CM)",
      "BLUE STICKY TRAPS FOR THRIPS",
      "YELLOW STICKY TRAPS FOR WHITEFLIES"
    ],
    "sprayInfo": [
      "NEEM OIL: 3-5 ML/L",
      "SPRAY BOTH UPPER & LOWER LEAF SURFACES",
      "FOLLOW PRODUCT LABEL"
    ],
    "months": [
      "JUNE TO FEBRUARY"
    ],
    "tip": "Upward leaf curl indicates thrips; downward leaf curl indicates mites. Inspect leaf undersides."
  },

  "Tomato": {
    "name": "Tomato",
    "category": "VEGETABLE",
    "season": ["COOL / MODERATE SEASON"],
    "type": ["VEGETABLE"],
    "defaultRate": 0.15,
    "rateUnit": "kg/acre (Seedlings)",
    "problems": [
      "FRUIT BORER (HELICOVERPA)",
      "WHITEFLY",
      "APHIDS",
      "EARLY & LATE BLIGHT",
      "TOMATO LEAF CURL VIRUS"
    ],
    "organicCare": [
      "INSTALL HELI-LURE PHEROMONE TRAPS (5/ACRE)",
      "USE NEEM OIL REGULARLY",
      "PINCH OFF OLDER LOWER DISEASED LEAVES",
      "REMOVE BLIGHT DEBRIS FROM SOIL",
      "STAKE PLANTS ERECT ON BAMBOO/TRELLIS",
      "MAINTAIN SPACED PLANT ROWS"
    ],
    "prevention": [
      "AVOID SOLANACEOUS CROP ROTATION",
      "CLEAN PROTECTED NURSERY BEDS",
      "PROPER AIR VENTILATION AROUND FOLIAGE",
      "ERADICATE VIRUS-STUNTED VINES"
    ],
    "sprayInfo": [
      "NEEM OIL: 3-5 ML/L",
      "BACILLUS THURINGIENSIS (BT) FOR FRUIT BORER",
      "FOLLOW PRODUCT LABEL"
    ],
    "months": [
      "SEPTEMBER TO FEBRUARY (SOUTH/PENINSULAR INDIA)"
    ],
    "tip": "Staking tomatoes off wet ground reduces fungal splash disease and fruit borer infestation by over 50%."
  },

  "Brinjal": {
    "name": "Brinjal (Eggplant / Aubergine)",
    "category": "VEGETABLE",
    "season": ["WARM SEASON CROP"],
    "type": ["VEGETABLE"],
    "defaultRate": 0.20,
    "rateUnit": "kg/acre (Seedlings)",
    "problems": [
      "SHOOT AND FRUIT BORER (LEUCINODES)",
      "APHIDS",
      "WHITEFLY",
      "RED SPIDER MITES"
    ],
    "organicCare": [
      "INSTALL LEUCINODES PHEROMONE TRAPS",
      "CLIP OFF AND DESTROY WILTING INFESTED SHOOTS WEEKLY",
      "COLLECT AND SAFELY BURY BORED FRUITS",
      "USE NEEM SEED OIL SPRAY",
      "KEEP RIDGES WEED-FREE"
    ],
    "prevention": [
      "CONTINUOUS FIELD SANITATION",
      "WEEKLY SHOOT INSPECTIONS",
      "CROP ROTATION WITH LEGUMES",
      "TRANSPLANT STURDY 30-DAY SEEDLINGS"
    ],
    "sprayInfo": [
      "NEEM OIL: 3-5 ML/L",
      "NEEM SEED KERNEL EXTRACT 5%",
      "FOLLOW PRODUCT LABEL"
    ],
    "months": [
      "MOST MONTHS WITH ADEQUATE WARMTH & WATER"
    ],
    "tip": "Clipping and destroying drooped shoots weekly removes borer larvae before they enter developing fruits."
  },

  "Onion": {
    "name": "Onion",
    "category": "VEGETABLE",
    "season": ["RABI / KHARIF DEPENDS ON REGION"],
    "type": ["BULB CROP"],
    "defaultRate": 4,
    "rateUnit": "kg/acre (Seeds)",
    "problems": [
      "THRIPS (TABACI)",
      "ONION MAGGOT",
      "PURPLE BLOTCH (ALTERNARIA)",
      "DOWNY MILDEW"
    ],
    "organicCare": [
      "USE NEEM OIL OR SOAP-WATER SPRAY",
      "REMOVE BLOTCHED FOLIAGE",
      "AVOID WATERLOGGING NEAR BULB BASE",
      "MAINTAIN 15x10 CM SPACING ON RAISED BEDS"
    ],
    "prevention": [
      "EXCELLENT SOIL DRAINAGE",
      "3-YEAR CROP ROTATION",
      "HEALTHY CLEAN BULBLETS / SEEDLINGS",
      "FIELD RESIDUE SANITATION"
    ],
    "sprayInfo": [
      "NEEM OIL: 3-5 ML/L",
      "ADD WETTING AGENT / STICKER DUE TO WAXY LEAVES",
      "FOLLOW PRODUCT LABEL"
    ],
    "months": [
      "SEPTEMBER TO FEBRUARY"
    ],
    "tip": "Onion leaves have a waxy coating. Always mix a mild soap or wetting sticker with neem sprays."
  },

  "Mango": {
    "name": "Mango",
    "category": "FRUIT TREE",
    "season": ["PERENNIAL FRUIT TREE"],
    "type": ["FRUIT TREE"],
    "defaultRate": 5,
    "rateUnit": "ml/L (Canopy Spray)",
    "problems": [
      "MANGO HOPPER (IDIOCERUS)",
      "MEALYBUG",
      "ORIENTAL FRUIT FLY",
      "POWDERY MILDEW",
      "ANTHRACNOSE"
    ],
    "organicCare": [
      "USE NEEM PRODUCTS & BIO-PESTICIDES",
      "HANG METHYL EUGENOL TRAPS (10/HECTARE) FOR FRUIT FLIES",
      "COLLECT AND DEEPLY BURY DROPPED INFESTED FRUITS",
      "PRUNE DEAD / INTERLOCKING SHADED CANOPY BRANCHES",
      "BAND TRUNKS WITH GREASE/PLASTIC TO STOP CRAWLING MEALYBUGS"
    ],
    "prevention": [
      "POST-HARVEST CANOPY PRUNING FOR SUNLIGHT",
      "ORCHARD CLEANLINESS & BASIN HOEING",
      "BALANCED MANURING (FARMYARD MANURE + POTASH)",
      "SCOUT INFLORESCENCE AT BUD BREAK"
    ],
    "sprayInfo": [
      "NEEM OIL: 3-5 ML/L",
      "SPRAY AT FLOWER BUD INITIATION",
      "AVOID SPRAYING DURING FULL BLOOM TO PROTECT POLLINATORS"
    ],
    "treeInfo": [
      "TREE DOSE DEPENDS ON CANOPY SIZE",
      "FOLLOW PRODUCT LABEL PRECAUTIONS"
    ],
    "months": [
      "YEAR-ROUND ORCHARD CARE; CRITICAL DURING FLOWERING & FRUIT SET"
    ],
    "tip": "Never apply insecticides during peak flowering bloom to safeguard honeybees and native pollinators."
  },

  "Coconut": {
    "name": "Coconut Palm",
    "category": "FRUIT TREE",
    "season": ["PERENNIAL PLANTATION CROP"],
    "type": ["PLANTATION / TREE"],
    "defaultRate": 10,
    "rateUnit": "ml or g / palm",
    "problems": [
      "RHINOCEROS BEETLE (ORYCTES)",
      "RED PALM WEEVIL (RHYNCHOPHORUS)",
      "ERIOPHYID COCONUT MITE",
      "BLACK HEADED CATERPILLAR"
    ],
    "organicCare": [
      "MAINTAIN CLEAN PALM BASINS & CROWNS",
      "USE BIOLOGICAL CONTROLS (BACULOVIRUS & GREEN MUSCARDINE FUNGUS)",
      "FILL INNERMOST LEAF AXILS WITH NEEM CAKE + SAND (1:1)",
      "DESTROY DECAYING MANURE HEAPS & DEAD PALM TRUNKS",
      "REMOVE ATTACKED TISSUE & SEAL WOUNDS WITH COAL TAR"
    ],
    "prevention": [
      "REGULAR CROWN CLEANING 2-3 TIMES A YEAR",
      "PLANTATION HYGIENE AND SANITATION",
      "BALANCED N-P-K PLUS BORON & MAGNESIUM",
      "TIMELY ERADICATION OF BREEDING PITS"
    ],
    "sprayInfo": [
      "USE COCONUT-APPROVED PRODUCT & LABEL DOSE",
      "DO NOT USE GENERIC CEREAL PESTICIDE DOSAGES",
      "ROOT FEEDING OR CROWN APPLICATION PER LABELED GUIDANCE"
    ],
    "treeInfo": [
      "DOSE DEPENDS ON PALM AGE, CROWN HEIGHT, AND APPLICATION ROUTE"
    ],
    "months": [
      "YEAR-ROUND CONTINUOUS CARE"
    ],
    "tip": "Placing a 1:1 mixture of neem cake and coarse river sand in top leaf axils repels rhinoceros beetles."
  }
};

const FARMER_PROBLEMS_DATA = [
  {
    "title": "Pest Attack",
    "category": "Insects & Pests",
    "steps": [
      "Inspect plants carefully, checking undersides of leaves and growing tips.",
      "Hand-pick or prune heavily infested branches where practical.",
      "Spray 3-5 ml/L neem oil with a drop of organic liquid soap.",
      "Conserve beneficial predators (ladybirds, predatory wasps, spiders)."
    ]
  },
  {
    "title": "Yellow Leaves",
    "category": "Nutrient & Water",
    "steps": [
      "Examine roots for waterlogging, rot, or nematode galling.",
      "Assess soil drainage: saturated soil suffocates root oxygen uptake.",
      "If veins stay green while tissue yellows, apply iron/zinc micronutrients.",
      "If lower older leaves yellow first, supply nitrogen/compost."
    ]
  },
  {
    "title": "Leaf Spots",
    "category": "Fungal & Bacterial",
    "steps": [
      "Prune affected spotted leaves and burn or compost far away.",
      "Improve air spacing between plants to reduce humidity.",
      "Switch from overhead sprinkling to ground drip irrigation.",
      "Spray copper-based organic protectant or Trichoderma viride."
    ]
  },
  {
    "title": "Poor Growth & Stunting",
    "category": "Soil & Growth",
    "steps": [
      "Conduct a soil test for pH (optimal 6.0 to 7.5 for most crops).",
      "Check for soil compaction and loosen top layer gently.",
      "Ensure balanced organic compost (FYM or Vermicompost).",
      "Examine root zone for grub or subterranean pest feeding."
    ]
  },
  {
    "title": "Water Shortage & Drought",
    "category": "Water Management",
    "steps": [
      "Apply 5-8 cm organic crop straw mulch over the root zone.",
      "Adopt drip irrigation or micro-sprinklers for 50%+ water savings.",
      "Irrigate during cool morning or evening hours to curb evaporation.",
      "Add organic manure to improve soil water holding capacity."
    ]
  },
  {
    "title": "Waterlogging & Poor Drainage",
    "category": "Water Management",
    "steps": [
      "Excavate field drainage channels and clear outlet ditches immediately.",
      "Construct raised beds or broad bed and furrow (BBF) systems.",
      "Avoid continuous flooding; allow root aeration between irrigations.",
      "Incorporate coarse compost or gypsum in heavy clay soils."
    ]
  },
  {
    "title": "Fruit Damage & Dropping",
    "category": "Fruit Care",
    "steps": [
      "Install species-specific pheromone or methyl eugenol food lure traps.",
      "Scout orchards at weekly intervals around fruit set.",
      "Collect and bury fallen pierced fruits at least 2 feet deep.",
      "Maintain consistent soil moisture to prevent fruit split."
    ]
  },
  {
    "title": "Weed Infestation",
    "category": "Field Management",
    "steps": [
      "Spread organic mulch or biodegradable weed mat between crop rows.",
      "Perform shallow intercultivation before weeds reach flowering stage.",
      "Practice dense crop canopy spacing to shade out weed seedlings.",
      "Adopt crop rotation with fast-growing pulse cover crops."
    ]
  },
  {
    "title": "Fungal Disease & Blight",
    "category": "Fungal & Bacterial",
    "steps": [
      "Ensure generous row ventilation and prune crowded foliage.",
      "Sterilize pruning shears with alcohol between plant cuts.",
      "Apply biological biocontrol agents like Trichoderma viride.",
      "Avoid excess synthetic nitrogen which causes soft vulnerable tissues."
    ]
  },
  {
    "title": "Soil Fertility Depletion",
    "category": "Soil Health",
    "steps": [
      "Perform laboratory soil test before adding fertilizers.",
      "Apply 5 tons/acre well-decomposed farmyard manure or vermicompost.",
      "Sow green manure legumes (Sunnhemp, Dhaincha) and incorporate in situ.",
      "Apply biofertilizers (Rhizobium, Azotobacter, Phosphobacteria)."
    ]
  }
];

// =============================================================================
// 3. BLUETOOTH LE STATE MANAGEMENT
// =============================================================================

let bleDevice = null;
let bleServer = null;
let bleService = null;
let bleCharacteristic = null;
let isConnected = false;
let isConnecting = false;

// Telemetry metrics
let packetCounter = 0;
let totalBytesReceived = 0;
const textDecoder = new TextDecoder('utf-8');

// =============================================================================
// 4. DOM ELEMENTS CACHE
// =============================================================================

const UI = {
  // Navigation & Tabs
  navLinks: document.querySelectorAll('.nav-link'),
  tabPanes: document.querySelectorAll('.tab-pane'),
  
  // Header Controls
  headerBleStatusText: document.getElementById('headerBleStatusText'),
  headerBlePill: document.getElementById('headerBlePill'),
  btnHeaderConnect: document.getElementById('btnHeaderConnect'),
  btnHeaderConnectText: document.getElementById('btnHeaderConnectText'),
  
  // Bluetooth Alerts & Support
  bluetoothSupportAlert: document.getElementById('bluetoothSupportAlert'),
  bluetoothSupportMessage: document.getElementById('bluetoothSupportMessage'),
  btnDismissAlert: document.getElementById('btnDismissAlert'),
  
  // Overview Tab BLE Center
  btnHeroConnect: document.getElementById('btnHeroConnect'),
  btnJumpToLive: document.getElementById('btnJumpToLive'),
  overviewStatusTag: document.getElementById('overviewStatusTag'),
  overviewStatusText: document.getElementById('overviewStatusText'),
  btnBleConnect: document.getElementById('btnBleConnect'),
  btnBleDisconnect: document.getElementById('btnBleDisconnect'),
  btnBleReconnect: document.getElementById('btnBleReconnect'),
  chkAcceptAllDevices: document.getElementById('chkAcceptAllDevices'),
  liveMsgTimestamp: document.getElementById('liveMsgTimestamp'),
  overviewLatestMessageBox: document.getElementById('overviewLatestMessageBox'),
  
  // Crops Tab
  cropSearchInput: document.getElementById('cropSearchInput'),
  cropFilterPills: document.getElementById('cropFilterPills'),
  cropsGridContainer: document.getElementById('cropsGridContainer'),
  
  // Problems Tab
  problemSearchInput: document.getElementById('problemSearchInput'),
  problemsGridContainer: document.getElementById('problemsGridContainer'),
  
  // Calculator Tab
  btnModeField: document.getElementById('btnModeField'),
  btnModeTree: document.getElementById('btnModeTree'),
  calculatorFormTitle: document.getElementById('calculatorFormTitle'),
  fieldFormGroup: document.getElementById('fieldFormGroup'),
  treeFormGroup: document.getElementById('treeFormGroup'),
  calcCropSelect: document.getElementById('calcCropSelect'),
  calcAreaInput: document.getElementById('calcAreaInput'),
  calcAreaUnit: document.getElementById('calcAreaUnit'),
  calcRateInput: document.getElementById('calcRateInput'),
  calcTreeCropSelect: document.getElementById('calcTreeCropSelect'),
  calcCanopyInput: document.getElementById('calcCanopyInput'),
  calcTreeRateInput: document.getElementById('calcTreeRateInput'),
  btnCalculate: document.getElementById('btnCalculate'),
  calcResultTitle: document.getElementById('calcResultTitle'),
  calcTotalValue: document.getElementById('calcTotalValue'),
  calcTotalUnit: document.getElementById('calcTotalUnit'),
  calcFormulaText: document.getElementById('calcFormulaText'),
  calcTipText: document.getElementById('calcTipText'),
  btnCopyCalc: document.getElementById('btnCopyCalc'),
  
  // Live ESP32 Tab
  oledScreen: document.getElementById('oledScreen'),
  oledBleIcon: document.getElementById('oledBleIcon'),
  oledContent: document.getElementById('oledContent'),
  oledStatusText: document.getElementById('oledStatusText'),
  oledUpdateCounter: document.getElementById('oledUpdateCounter'),
  themeButtons: document.querySelectorAll('.theme-btn'),
  metricConnection: document.getElementById('metricConnection'),
  metricPackets: document.getElementById('metricPackets'),
  metricBytes: document.getElementById('metricBytes'),
  terminalLog: document.getElementById('terminalLog'),
  btnClearLog: document.getElementById('btnClearLog'),
  btnTestNotify: document.getElementById('btnTestNotify'),
  payloadTypeBadge: document.getElementById('payloadTypeBadge'),
  jsonInspectorBody: document.getElementById('jsonInspectorBody'),
  
  // Modal Elements
  cropDetailModal: document.getElementById('cropDetailModal'),
  modalBackdrop: document.getElementById('modalBackdrop'),
  modalCropType: document.getElementById('modalCropType'),
  modalCropName: document.getElementById('modalCropName'),
  modalCropSeason: document.getElementById('modalCropSeason'),
  modalCropBody: document.getElementById('modalCropBody'),
  btnModalClose: document.getElementById('btnModalClose'),
  btnModalDismiss: document.getElementById('btnModalDismiss'),
  btnModalCalc: document.getElementById('btnModalCalc')
};

// =============================================================================
// 5. APPLICATION INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  initWebBluetoothCheck();
  initNavigation();
  renderCropLibrary();
  renderFarmerProblems();
  initCalculator();
  initOLEDTheme();
  initBLEControls();
  
  logToTerminal('System', 'FARMER ATI Web Bluetooth Dashboard ready.');
  logToTerminal('Config', `Targeting Service: 0x${BLE_SERVICE_UUID.toString(16).toUpperCase()} | Char: 0x${BLE_CHARACTERISTIC_UUID.toString(16).toUpperCase()}`);
});

// =============================================================================
// 6. WEB BLUETOOTH API SUPPORT CHECK
// =============================================================================

function initWebBluetoothCheck() {
  if (!navigator.bluetooth) {
    showBluetoothAlert(
      "Web Bluetooth is not supported or not enabled in this browser. " +
      "Please open this website in Google Chrome on your Android tablet or desktop computer over HTTPS. " +
      "Make sure Bluetooth and Location are switched ON in Android system settings."
    );
  } else {
    // Check if Bluetooth adapter is available
    if (navigator.bluetooth.getAvailability) {
      navigator.bluetooth.getAvailability().then(available => {
        if (!available) {
          showBluetoothAlert(
            "Bluetooth adapter is turned OFF or unavailable on this device. " +
            "Please turn on Bluetooth in your device settings."
          );
        }
      });
    }
  }

  UI.btnDismissAlert.addEventListener('click', () => {
    UI.bluetoothSupportAlert.classList.add('hidden');
  });
}

function showBluetoothAlert(message) {
  UI.bluetoothSupportMessage.textContent = message;
  UI.bluetoothSupportAlert.classList.remove('hidden');
}

// =============================================================================
// 7. NAVIGATION & TAB SWITCHING
// =============================================================================

function initNavigation() {
  UI.navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetTabId = link.getAttribute('data-tab');
      switchTab(targetTabId);
    });
  });

  UI.btnJumpToLive.addEventListener('click', () => {
    switchTab('tab-live');
  });
}

function switchTab(tabId) {
  UI.navLinks.forEach(link => {
    const isTarget = link.getAttribute('data-tab') === tabId;
    link.classList.toggle('active', isTarget);
    link.setAttribute('aria-selected', isTarget ? 'true' : 'false');
  });

  UI.tabPanes.forEach(pane => {
    pane.classList.toggle('active', pane.id === tabId);
  });

  // Scroll to top of window smoothly on mobile/tablet
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// =============================================================================
// 8. WEB BLUETOOTH LE CONNECTION & NOTIFICATION ENGINE
// =============================================================================

function initBLEControls() {
  // Connect Buttons
  UI.btnHeaderConnect.addEventListener('click', handleConnectButtonClick);
  UI.btnHeroConnect.addEventListener('click', handleConnectButtonClick);
  UI.btnBleConnect.addEventListener('click', handleConnectButtonClick);
  
  // Disconnect & Reconnect Buttons
  UI.btnBleDisconnect.addEventListener('click', disconnectBLE);
  UI.btnBleReconnect.addEventListener('click', reconnectBLE);

  // Clear Terminal Log
  UI.btnClearLog.addEventListener('click', () => {
    UI.terminalLog.innerHTML = '';
    logToTerminal('System', 'Terminal log cleared.');
  });

  // Simulated Test Packet
  UI.btnTestNotify.addEventListener('click', () => {
    simulateIncomingTestMessage();
  });
}

async function handleConnectButtonClick() {
  if (isConnected) {
    disconnectBLE();
  } else {
    connectBLE();
  }
}

/**
 * Connect to FARMER ATI via Web Bluetooth API
 */
async function connectBLE() {
  if (!navigator.bluetooth) {
    alert("Web Bluetooth is not supported in this browser. Please use Google Chrome on Android over HTTPS.");
    return;
  }

  try {
    setConnectionState('connecting', 'Requesting Bluetooth Device...');
    logToTerminal('BLE', `Scanning for '${BLE_DEVICE_NAME}' with Service 0x${BLE_SERVICE_UUID.toString(16).toUpperCase()}...`);

    const acceptAll = UI.chkAcceptAllDevices.checked;
    let requestOptions = {};

    if (acceptAll) {
      // Fallback mode: accepts all devices but declares required service
      requestOptions = {
        acceptAllDevices: true,
        optionalServices: [BLE_SERVICE_UUID, BLE_SERVICE_UUID_128]
      };
      logToTerminal('Scan', 'Using broad device discovery mode (all devices)...');
    } else {
      // Standard targeted filter
      requestOptions = {
        filters: [
          { name: BLE_DEVICE_NAME },
          { services: [BLE_SERVICE_UUID] },
          { services: [BLE_SERVICE_UUID_128] }
        ],
        optionalServices: [BLE_SERVICE_UUID, BLE_SERVICE_UUID_128]
      };
      logToTerminal('Scan', `Filtering for device name '${BLE_DEVICE_NAME}' & service 0x${BLE_SERVICE_UUID.toString(16).toUpperCase()}...`);
    }

    // 1. Prompt user to select device
    bleDevice = await navigator.bluetooth.requestDevice(requestOptions);
    logToTerminal('Device', `Selected device: ${bleDevice.name || 'Unnamed Device'} [ID: ${bleDevice.id}]`);

    // Attach disconnect listener
    bleDevice.addEventListener('gattserverdisconnected', onBLEDisconnected);

    // 2. Connect to GATT Server
    setConnectionState('connecting', 'Connecting to GATT Server...');
    logToTerminal('GATT', 'Opening GATT connection to ESP32...');
    bleServer = await bleDevice.gatt.connect();
    logToTerminal('GATT', 'GATT Server successfully connected.');

    // 3. Obtain Service 0xA000
    setConnectionState('connecting', 'Obtaining Service 0xA000...');
    logToTerminal('Service', `Requesting primary service 0x${BLE_SERVICE_UUID.toString(16).toUpperCase()}...`);
    
    try {
      bleService = await bleServer.getPrimaryService(BLE_SERVICE_UUID);
    } catch (err) {
      logToTerminal('Service', `16-bit lookup retry with full UUID: ${BLE_SERVICE_UUID_128}`);
      bleService = await bleServer.getPrimaryService(BLE_SERVICE_UUID_128);
    }
    logToTerminal('Service', 'Service 0xA000 successfully retrieved.');

    // 4. Obtain Characteristic 0xA001
    setConnectionState('connecting', 'Obtaining Characteristic 0xA001...');
    logToTerminal('Char', `Discovering characteristic 0x${BLE_CHARACTERISTIC_UUID.toString(16).toUpperCase()}...`);
    
    try {
      bleCharacteristic = await bleService.getCharacteristic(BLE_CHARACTERISTIC_UUID);
    } catch (err) {
      logToTerminal('Char', `16-bit lookup retry with full UUID: ${BLE_CHAR_UUID_128}`);
      bleCharacteristic = await bleService.getCharacteristic(BLE_CHAR_UUID_128);
    }
    logToTerminal('Char', 'Characteristic 0xA001 retrieved. Checking READ / NOTIFY properties...');

    // 5. Read characteristic value if initially available
    try {
      const initialValue = await bleCharacteristic.readValue();
      if (initialValue && initialValue.byteLength > 0) {
        logToTerminal('Read', `Initial value read (${initialValue.byteLength} bytes).`);
        handleIncomingBLEData(initialValue);
      }
    } catch (readErr) {
      logToTerminal('Read', 'Initial read not available or not yet populated. Awaiting notifications.');
    }

    // 6. Subscribe to Notifications
    setConnectionState('connecting', 'Subscribing to Notifications...');
    logToTerminal('Notify', 'Enabling GATT notifications on Characteristic 0xA001...');
    await bleCharacteristic.startNotifications();
    bleCharacteristic.addEventListener('characteristicvaluechanged', onCharacteristicValueChanged);
    logToTerminal('Notify', 'Notifications active! Awaiting messages from ESP32...');

    // Fully connected!
    setConnectionState('connected', `Connected: ${bleDevice.name || 'FARMER ATI'}`);

  } catch (error) {
    console.error("BLE Connection Error:", error);
    if (error.name === 'NotFoundError') {
      logToTerminal('Cancel', 'User cancelled device selection or device not found.');
      setConnectionState('disconnected', 'Device selection cancelled');
    } else {
      logToTerminal('Error', `Connection failed: ${error.message}`);
      setConnectionState('disconnected', `Error: ${error.message}`);
    }
  }
}

/**
 * Handle incoming characteristic value change notification
 */
function onCharacteristicValueChanged(event) {
  const value = event.target.value;
  handleIncomingBLEData(value);
}

/**
 * Decode and process incoming DataView or ArrayBuffer from BLE
 */
function handleIncomingBLEData(dataView) {
  try {
    const rawBytes = new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength);
    const decodedText = textDecoder.decode(rawBytes).trim();
    
    packetCounter++;
    totalBytesReceived += rawBytes.byteLength;

    // Update telemetry metrics
    UI.metricPackets.textContent = packetCounter;
    UI.metricBytes.textContent = formatBytes(totalBytesReceived);

    const timeStr = new Date().toLocaleTimeString();
    UI.liveMsgTimestamp.textContent = `Received at ${timeStr} (${rawBytes.byteLength} B)`;

    // Log to terminal
    logToTerminal('Data', `[Packet #${packetCounter}] "${decodedText}"`);

    // Update Overview Live Message Callout Box
    UI.overviewLatestMessageBox.textContent = decodedText;
    UI.overviewLatestMessageBox.classList.add('active-message');

    // Process into Live OLED Display & JSON Parser
    processMessageForDisplay(decodedText);

  } catch (err) {
    console.error("Error processing incoming BLE packet:", err);
    logToTerminal('Error', `Failed to decode packet: ${err.message}`);
  }
}

/**
 * Process received message for the OLED simulator and JSON inspector.
 * Supports plain text (initial ESP32 test server) AND structured JSON payloads.
 */
function processMessageForDisplay(messageText) {
  let isJson = false;
  let parsedPayload = null;

  try {
    if (messageText.startsWith('{') && messageText.endsWith('}')) {
      parsedPayload = JSON.parse(messageText);
      isJson = true;
    }
  } catch (e) {
    isJson = false;
  }

  if (isJson && parsedPayload) {
    // Handle structured JSON
    UI.payloadTypeBadge.textContent = 'STRUCTURED JSON';
    UI.payloadTypeBadge.className = 'payload-type-badge json';
    UI.jsonInspectorBody.textContent = JSON.stringify(parsedPayload, null, 2);

    updateOledFromJson(parsedPayload);
  } else {
    // Handle plain text (e.g. "FARMER ATI Bluetooth connection successful!")
    UI.payloadTypeBadge.textContent = 'PLAIN TEXT';
    UI.payloadTypeBadge.className = 'payload-type-badge';
    UI.jsonInspectorBody.textContent = `Plain text (${messageText.length} chars):\n"${messageText}"`;

    updateOledFromPlainText(messageText);
  }

  UI.oledUpdateCounter.textContent = `Updates: ${packetCounter}`;
  UI.oledStatusText.textContent = `Display Status: Synchronized via BLE GATT (${new Date().toLocaleTimeString()})`;
}

/**
 * Render plain text onto the 128x64 OLED simulator
 */
function updateOledFromPlainText(text) {
  // Split long string into ~18-20 char lines to simulate SH1106 display
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= 20) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  let html = `<div class="oled-line oled-heading">FARMER ATI</div>`;
  html += `<div class="oled-line">BLE: CONNECTED</div>`;
  html += `<div class="oled-line">--------------------</div>`;

  lines.forEach((line, index) => {
    html += `<div class="oled-line oled-highlight">${escapeHtml(line)}</div>`;
  });

  UI.oledContent.innerHTML = html;
}

/**
 * Render structured JSON payload onto OLED simulator
 */
function updateOledFromJson(payload) {
  let html = `<div class="oled-line oled-heading">${escapeHtml(payload.screen || 'FARMER ATI')}</div>`;
  html += `<div class="oled-line">--------------------</div>`;

  if (Array.isArray(payload.lines)) {
    payload.lines.forEach(row => {
      const lineText = typeof row === 'object' ? (row.text || '') : String(row);
      html += `<div class="oled-line">${escapeHtml(lineText)}</div>`;
    });
  } else if (payload.message) {
    html += `<div class="oled-line oled-highlight">${escapeHtml(payload.message)}</div>`;
  }

  if (payload.crop) {
    html += `<div class="oled-line">CROP: ${escapeHtml(payload.crop.toUpperCase())}</div>`;
  }

  UI.oledContent.innerHTML = html;
}

/**
 * Disconnect current BLE GATT session
 */
function disconnectBLE() {
  if (bleDevice && bleDevice.gatt.connected) {
    logToTerminal('GATT', 'Disconnecting from device...');
    bleDevice.gatt.disconnect();
  } else {
    onBLEDisconnected();
  }
}

/**
 * Reconnect to the previously paired device
 */
async function reconnectBLE() {
  if (bleDevice) {
    logToTerminal('Reconnect', `Attempting reconnection to ${bleDevice.name}...`);
    try {
      setConnectionState('connecting', 'Reconnecting to device...');
      bleServer = await bleDevice.gatt.connect();
      bleService = await bleServer.getPrimaryService(BLE_SERVICE_UUID);
      bleCharacteristic = await bleService.getCharacteristic(BLE_CHARACTERISTIC_UUID);
      await bleCharacteristic.startNotifications();
      bleCharacteristic.addEventListener('characteristicvaluechanged', onCharacteristicValueChanged);
      setConnectionState('connected', `Reconnected: ${bleDevice.name}`);
      logToTerminal('Reconnect', 'Reconnection successful!');
    } catch (err) {
      logToTerminal('Error', `Reconnection failed: ${err.message}`);
      setConnectionState('disconnected', 'Reconnection failed');
    }
  } else {
    connectBLE();
  }
}

/**
 * Event handler triggered when BLE GATT connection drops
 */
function onBLEDisconnected() {
  logToTerminal('GATT', 'BLE GATT server disconnected.');
  setConnectionState('disconnected', 'Disconnected');
  
  // Re-enable reconnect if device object exists
  if (bleDevice) {
    UI.btnBleReconnect.disabled = false;
  }
}

/**
 * Update UI connection indicators across all sections
 */
function setConnectionState(state, statusMessage) {
  isConnected = (state === 'connected');
  isConnecting = (state === 'connecting');

  // Header pill & text
  UI.headerBlePill.className = `ble-pill ${state}`;
  UI.headerBleStatusText.textContent = state.toUpperCase();
  
  if (isConnected) {
    UI.btnHeaderConnectText.textContent = 'Disconnect';
    UI.btnHeaderConnect.classList.replace('btn-connect-header', 'btn-danger');
  } else if (isConnecting) {
    UI.btnHeaderConnectText.textContent = 'Connecting...';
  } else {
    UI.btnHeaderConnectText.textContent = 'Connect to FARMER ATI';
    UI.btnHeaderConnect.className = 'btn btn-connect-header';
  }

  // Overview status tag
  UI.overviewStatusTag.className = `connection-status-tag ${state}`;
  UI.overviewStatusText.textContent = statusMessage;

  // Buttons in Overview
  UI.btnBleConnect.disabled = (isConnected || isConnecting);
  UI.btnBleDisconnect.disabled = !isConnected;
  UI.btnHeroConnect.disabled = (isConnected || isConnecting);

  // Live Telemetry Tab
  UI.metricConnection.textContent = state.toUpperCase();
  UI.metricConnection.className = `metric-value status-text-${state}`;
  UI.oledBleIcon.textContent = isConnected ? 'BLE: ON' : 'BLE: OFF';
}

/**
 * Append an entry to the live terminal log
 */
function logToTerminal(tag, message) {
  const time = new Date().toLocaleTimeString();
  const entry = document.createElement('div');
  
  let entryClass = 'log-system';
  if (tag === 'Data') entryClass = 'log-data';
  else if (tag === 'Error') entryClass = 'log-error';
  else if (tag === 'GATT' || tag === 'Service' || tag === 'Char') entryClass = 'log-info';

  entry.className = `log-entry ${entryClass}`;
  entry.innerHTML = `<span class="log-time">[${time}] [${tag}]</span> <span class="log-msg">${escapeHtml(message)}</span>`;

  UI.terminalLog.appendChild(entry);
  UI.terminalLog.scrollTop = UI.terminalLog.scrollHeight;
}

/**
 * Simulate an incoming BLE notification for demo / testing
 */
function simulateIncomingTestMessage() {
  const testMessages = [
    "FARMER ATI Bluetooth connection successful!",
    "PADDY: STEM BORER ALERT - SPRAY NEEM 3-5ML/L",
    "AREA: 2.5 ACRES | SEED REQD: 62.5 KG",
    JSON.stringify({
      screen: "Crop: Paddy",
      crop: "Paddy",
      lines: [
        { y: 12, text: "PADDY (RICE)" },
        { y: 22, text: "SEASON: KHARIF/RABI" },
        { y: 32, text: "STEM BORER REMEDY" },
        { y: 42, text: "NEEM OIL: 3-5 ML/L" }
      ],
      updated: Date.now()
    })
  ];

  const randomMsg = testMessages[Math.floor(Math.random() * testMessages.length)];
  const encoder = new TextEncoder();
  const encoded = encoder.encode(randomMsg);
  const dataView = new DataView(encoded.buffer);

  logToTerminal('Simulator', 'Simulating incoming ESP32 BLE notification packet...');
  handleIncomingBLEData(dataView);
}

// =============================================================================
// 9. CROP LIBRARY RENDERING & FILTERING
// =============================================================================

function renderCropLibrary(filterCategory = 'all', searchQuery = '') {
  UI.cropsGridContainer.innerHTML = '';
  const crops = Object.entries(CROPS_DATA);
  const query = searchQuery.trim().toLowerCase();

  const filteredCrops = crops.filter(([key, crop]) => {
    const matchesCategory = (filterCategory === 'all') || (crop.category === filterCategory);
    const matchesSearch = !query || 
      crop.name.toLowerCase().includes(query) ||
      crop.problems.some(p => p.toLowerCase().includes(query)) ||
      crop.season.some(s => s.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  if (filteredCrops.length === 0) {
    UI.cropsGridContainer.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
        <p>No crops match your search criteria. Try a different keyword or category.</p>
      </div>`;
    return;
  }

  filteredCrops.forEach(([key, crop]) => {
    const card = document.createElement('div');
    card.className = 'crop-card';
    card.addEventListener('click', () => openCropModal(key, crop));

    const problemsList = crop.problems.slice(0, 3).map(p => `<span class="crop-pest-tag">${escapeHtml(p)}</span>`).join('');
    
    card.innerHTML = `
      <div class="crop-card-top">
        <h3 class="crop-card-title">${escapeHtml(crop.name)}</h3>
        <span class="crop-badge">${escapeHtml(crop.category)}</span>
      </div>
      <div class="crop-season-tag">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        <span>${escapeHtml(crop.season.join(' / '))}</span>
      </div>
      <div class="crop-meta-section">
        <div class="crop-meta-label">Primary Pests & Diseases:</div>
        <div class="crop-tags-container">
          ${problemsList}
        </div>
      </div>
      <div class="crop-spray-callout">
        <strong>Dosage:</strong> ${escapeHtml(crop.sprayInfo[0] || 'Neem oil 3-5 ml/L')}
      </div>
      <div class="crop-card-actions">
        <button class="btn btn-sm btn-outline btn-block" type="button">
          View Complete Guide
        </button>
      </div>
    `;

    UI.cropsGridContainer.appendChild(card);
  });

  // Filter Pills Event Handling
  UI.cropFilterPills.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', () => {
      UI.cropFilterPills.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      renderCropLibrary(pill.getAttribute('data-filter'), UI.cropSearchInput.value);
    });
  });

  // Search input handler
  UI.cropSearchInput.addEventListener('input', (e) => {
    const activePill = UI.cropFilterPills.querySelector('.pill.active');
    const category = activePill ? activePill.getAttribute('data-filter') : 'all';
    renderCropLibrary(category, e.target.value);
  });
}

function openCropModal(cropKey, crop) {
  UI.modalCropName.textContent = crop.name;
  UI.modalCropType.textContent = crop.category;
  UI.modalCropSeason.textContent = `Season: ${crop.season.join(' | ')}`;

  const problemsHtml = crop.problems.map(p => `<li>${escapeHtml(p)}</li>`).join('');
  const organicHtml = crop.organicCare.map(o => `<li>${escapeHtml(o)}</li>`).join('');
  const preventionHtml = crop.prevention.map(pr => `<li>${escapeHtml(pr)}</li>`).join('');
  const sprayHtml = crop.sprayInfo.map(s => `<li>${escapeHtml(s)}</li>`).join('');
  const monthsHtml = crop.months.map(m => `<li>${escapeHtml(m)}</li>`).join('');

  UI.modalCropBody.innerHTML = `
    <div class="modal-section">
      <div class="modal-section-title">Major Target Pests & Diseases:</div>
      <ul class="modal-list">${problemsHtml}</ul>
    </div>
    <div class="modal-section">
      <div class="modal-section-title">Organic Field Care & Remediation:</div>
      <ul class="modal-list">${organicHtml}</ul>
    </div>
    <div class="modal-section">
      <div class="modal-section-title">Preventative Agronomy Practices:</div>
      <ul class="modal-list">${preventionHtml}</ul>
    </div>
    <div class="modal-section">
      <div class="modal-section-title">Spray & Application Dosage:</div>
      <ul class="modal-list">${sprayHtml}</ul>
    </div>
    <div class="modal-section">
      <div class="modal-section-title">Cultivation Calendar / Months:</div>
      <ul class="modal-list">${monthsHtml}</ul>
    </div>
  `;

  // Modal Calculator Button jumps to Seed Rate Calculator with this crop selected
  UI.btnModalCalc.onclick = () => {
    closeCropModal();
    selectCropInCalculator(cropKey);
    switchTab('tab-calculator');
  };

  UI.cropDetailModal.classList.remove('hidden');
}

function closeCropModal() {
  UI.cropDetailModal.classList.add('hidden');
}

UI.btnModalClose.addEventListener('click', closeCropModal);
UI.btnModalDismiss.addEventListener('click', closeCropModal);
UI.modalBackdrop.addEventListener('click', closeCropModal);

// =============================================================================
// 10. FARMER PROBLEMS RENDERING & SEARCH
// =============================================================================

function renderFarmerProblems(searchQuery = '') {
  UI.problemsGridContainer.innerHTML = '';
  const query = searchQuery.trim().toLowerCase();

  const filtered = FARMER_PROBLEMS_DATA.filter(problem => {
    return !query || 
      problem.title.toLowerCase().includes(query) ||
      problem.category.toLowerCase().includes(query) ||
      problem.steps.some(step => step.toLowerCase().includes(query));
  });

  if (filtered.length === 0) {
    UI.problemsGridContainer.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
        <p>No problem guides match your search term.</p>
      </div>`;
    return;
  }

  filtered.forEach(prob => {
    const card = document.createElement('div');
    card.className = 'problem-card';

    const stepsHtml = prob.steps.map(s => `<li>${escapeHtml(s)}</li>`).join('');

    card.innerHTML = `
      <div class="problem-header">
        <div class="problem-icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <div>
          <h3 class="problem-name">${escapeHtml(prob.title)}</h3>
          <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">${escapeHtml(prob.category)}</span>
        </div>
      </div>
      <div>
        <div class="problem-steps-title">Recommended Action Protocol:</div>
        <ol class="problem-steps-list">
          ${stepsHtml}
        </ol>
      </div>
    `;

    UI.problemsGridContainer.appendChild(card);
  });

  UI.problemSearchInput.addEventListener('input', (e) => {
    renderFarmerProblems(e.target.value);
  });
}

// =============================================================================
// 11. SEED RATE & TREE DOSAGE CALCULATOR
// =============================================================================

let currentCalcMode = 'field'; // 'field' or 'tree'

function initCalculator() {
  // Mode switching
  UI.btnModeField.addEventListener('click', () => setCalculatorMode('field'));
  UI.btnModeTree.addEventListener('click', () => setCalculatorMode('tree'));

  // Calculate triggers
  UI.btnCalculate.addEventListener('click', calculateRequirement);
  UI.calcCropSelect.addEventListener('change', onCropSelectChange);
  UI.calcAreaInput.addEventListener('input', calculateRequirement);
  UI.calcAreaUnit.addEventListener('change', calculateRequirement);
  UI.calcRateInput.addEventListener('input', calculateRequirement);
  
  UI.calcTreeCropSelect.addEventListener('change', onTreeCropSelectChange);
  UI.calcCanopyInput.addEventListener('input', calculateRequirement);
  UI.calcTreeRateInput.addEventListener('input', calculateRequirement);

  // Copy Result
  UI.btnCopyCalc.addEventListener('click', copyCalculationSummary);

  calculateRequirement();
}

function setCalculatorMode(mode) {
  currentCalcMode = mode;
  if (mode === 'field') {
    UI.btnModeField.classList.add('active');
    UI.btnModeTree.classList.remove('active');
    UI.fieldFormGroup.classList.remove('hidden');
    UI.treeFormGroup.classList.add('hidden');
    UI.calculatorFormTitle.textContent = "Field Crop Seed Calculation";
  } else {
    UI.btnModeTree.classList.add('active');
    UI.btnModeField.classList.remove('active');
    UI.treeFormGroup.classList.remove('hidden');
    UI.fieldFormGroup.classList.add('hidden');
    UI.calculatorFormTitle.textContent = "Tree & Plantation Dosage Calculation";
  }
  calculateRequirement();
}

function onCropSelectChange() {
  const selected = UI.calcCropSelect.options[UI.calcCropSelect.selectedIndex];
  const rate = selected.getAttribute('data-rate');
  if (rate) {
    UI.calcRateInput.value = rate;
  }
  calculateRequirement();
}

function onTreeCropSelectChange() {
  const selected = UI.calcTreeCropSelect.options[UI.calcTreeCropSelect.selectedIndex];
  const rate = selected.getAttribute('data-rate');
  if (rate) {
    UI.calcTreeRateInput.value = rate;
  }
  calculateRequirement();
}

function selectCropInCalculator(cropKey) {
  if (cropKey === 'Mango' || cropKey === 'Coconut') {
    setCalculatorMode('tree');
    UI.calcTreeCropSelect.value = cropKey;
    onTreeCropSelectChange();
  } else {
    setCalculatorMode('field');
    const option = Array.from(UI.calcCropSelect.options).find(opt => opt.value === cropKey);
    if (option) {
      UI.calcCropSelect.value = cropKey;
      onCropSelectChange();
    }
  }
}

function calculateRequirement() {
  if (currentCalcMode === 'field') {
    const areaRaw = parseFloat(UI.calcAreaInput.value) || 0;
    const unitMultiplier = parseFloat(UI.calcAreaUnit.value) || 1;
    const areaInAcres = areaRaw * unitMultiplier;
    const ratePerAcre = parseFloat(UI.calcRateInput.value) || 0;
    const total = areaInAcres * ratePerAcre;

    const cropName = UI.calcCropSelect.value;
    const cropData = CROPS_DATA[cropName];

    let unitText = 'kg';
    let formattedTotal = total.toFixed(2);
    if (total < 1 && total > 0) {
      // Display grams for small quantities (e.g. Tomato or Chilli seeds)
      unitText = 'kg (' + (total * 1000).toFixed(0) + ' grams)';
    }

    UI.calcResultTitle.textContent = `Total Seed Requirement for ${cropName}:`;
    UI.calcTotalValue.textContent = formattedTotal;
    UI.calcTotalUnit.textContent = unitText;
    UI.calcFormulaText.textContent = `Formula: ${areaRaw} ${getUnitName(unitMultiplier)} (${areaInAcres.toFixed(2)} Acres) × ${ratePerAcre} kg/Acre = ${formattedTotal} kg`;

    if (cropData && cropData.tip) {
      UI.calcTipText.textContent = cropData.tip;
    } else {
      UI.calcTipText.textContent = "Maintain optimal plant spacing and ensure certified disease-free seed stock.";
    }

  } else {
    // Tree / Orchard mode
    const count = parseFloat(UI.calcCanopyInput.value) || 0;
    const rate = parseFloat(UI.calcTreeRateInput.value) || 0;
    const total = count * rate;
    const treeCrop = UI.calcTreeCropSelect.value;

    UI.calcResultTitle.textContent = `Total Input Requirement for ${treeCrop}:`;
    UI.calcTotalValue.textContent = total.toFixed(2);
    UI.calcTotalUnit.textContent = 'units (ml or g)';
    UI.calcFormulaText.textContent = `Formula: ${count} Trees × ${rate} per tree = ${total.toFixed(2)} total units`;

    if (treeCrop === 'Mango') {
      UI.calcTipText.textContent = "For Mango, spray neem oil 3-5 ml/L at flowering bud emergence. Avoid pesticide applications during peak bee pollination.";
    } else if (treeCrop === 'Coconut') {
      UI.calcTipText.textContent = "For Coconut, fill innermost leaf axils with a 1:1 mixture of neem cake and sand to ward off rhinoceros beetles.";
    } else {
      UI.calcTipText.textContent = "Adjust individual tree dosage proportionally to canopy spread and trunk diameter.";
    }
  }
}

function getUnitName(multiplier) {
  if (multiplier === 1) return 'Acres';
  if (multiplier === 2.471) return 'Hectares';
  return 'Cents';
}

function copyCalculationSummary() {
  const text = `${UI.calcResultTitle.textContent} ${UI.calcTotalValue.textContent} ${UI.calcTotalUnit.textContent}\n${UI.calcFormulaText.textContent}\nAgronomy: ${UI.calcTipText.textContent}`;
  navigator.clipboard.writeText(text).then(() => {
    const origText = UI.btnCopyCalc.innerHTML;
    UI.btnCopyCalc.innerHTML = `<span>Copied to Clipboard!</span>`;
    setTimeout(() => { UI.btnCopyCalc.innerHTML = origText; }, 2000);
  }).catch(() => {
    alert("Copied:\n" + text);
  });
}

// =============================================================================
// 12. OLED HARDWARE SCREEN DISPLAY THEMES
// =============================================================================

function initOLEDTheme() {
  UI.themeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      UI.themeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const theme = btn.getAttribute('data-theme');
      UI.oledScreen.className = `oled-screen ${theme}`;
    });
  });
}

// =============================================================================
// 13. UTILITIES
// =============================================================================

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  return (bytes / 1024).toFixed(1) + ' KB';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
