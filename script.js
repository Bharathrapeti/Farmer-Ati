'use strict';

// ============================================================
// FARMER ATI – Web Bluetooth Dashboard
//
// ESP32 BLE service:        0xA000
// ESP32 characteristic:     0xA001  (READ | NOTIFY)
// Device name:              FARMER ATI
//
// Reliable Framed Binary Protocol (Max 20 bytes per BLE packet):
//   [0]: 0xFA  (Magic byte 1)
//   [1]: 0x71  (Magic byte 2)
//   [2]: msgId (0..255)
//   [3]: pktIdx (0..totalPkts-1)
//   [4]: totalPkts (1..255)
//   [5..N]: payload bytes (reassembled first, then decoded as UTF-8)
//
// JSON format once assembled:
//   {"s":"SCREEN TITLE","l":["line 1","line 2",...]}
// ============================================================

const BLE_DEVICE_NAME         = 'FARMER ATI';
const BLE_SERVICE_UUID        = 0xA000;
const BLE_CHARACTERISTIC_UUID = 0xA001;

// ── State ────────────────────────────────────────────────────
let bleDevice         = null;
let bleServer         = null;
let bleCharacteristic = null;
let frameCount        = 0;

// ── DOM helpers ───────────────────────────────────────────────
const $  = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

// ── Crop / problem data (kept in JS so the tab works offline) ─
const CROPS = {
  "Paddy":      { Season:["KHARIF / RABI","DEPENDS ON REGION"], Type:["FIELD CROP"], Problems:["STEM BORER","LEAF FOLDER","BROWN PLANTHOPPER","BLAST / FUNGAL DISEASE"], "Organic Care":["USE HEALTHY SEED","MAINTAIN FIELD SANITATION","USE NEEM PRODUCTS","FOLLOW PRODUCT LABEL","ENCOURAGE BENEFICIAL INSECTS","AVOID UNNECESSARY SPRAYING"], Prevention:["BALANCED FERTILIZATION","PROPER SPACING","CLEAN FIELD","REGULAR SCOUTING"], "Spray Info":["NEEM OIL:","ABOUT 3-5 ML/L","FOLLOW PRODUCT LABEL"], Months:["JUNE TO JANUARY","DEPENDS ON LOCAL SEASON"] },
  "Groundnut":  { Season:["KHARIF / RABI","SUMMER DEPENDS ON REGION"], Type:["OILSEED"], Problems:["APHIDS","THRIPS","LEAF SPOT","RED HAIRY CATERPILLAR"], "Organic Care":["USE NEEM SEED EXTRACT","USE NEEM PRODUCTS","REMOVE SEVERELY AFFECTED LEAVES","MAINTAIN FIELD SANITATION","AVOID WATERLOGGING"], Prevention:["CROP ROTATION","HEALTHY SEED","GOOD DRAINAGE","FIELD MONITORING"], "Spray Info":["NEEM OIL:","ABOUT 3-5 ML/L","FOLLOW PRODUCT LABEL"], Months:["JUNE-JULY","AND REGIONAL SEASONS"] },
  "Black Gram": { Season:["KHARIF / RABI / SUMMER"], Type:["PULSE"], Problems:["APHIDS","WHITEFLY","POD BORER","YELLOW MOSAIC VIRUS"], "Organic Care":["USE NEEM PRODUCTS","REMOVE VIRUS-AFFECTED PLANTS","CONTROL WEEDS","ENCOURAGE BENEFICIAL INSECTS"], Prevention:["USE HEALTHY SEED","RESISTANT VARIETIES","CONTROL WEEDS"], "Spray Info":["NEEM OIL:","ABOUT 3-5 ML/L","FOLLOW PRODUCT LABEL"], Months:["JUNE-JULY","SEPTEMBER-OCTOBER"] },
  "Green Gram": { Season:["KHARIF / RABI / SUMMER"], Type:["PULSE"], Problems:["WHITEFLY","APHIDS","THRIPS","POWDERY MILDEW"], "Organic Care":["USE NEEM PRODUCTS","REMOVE INFECTED MATERIAL","IMPROVE AIR CIRCULATION","AVOID EXCESS IRRIGATION"], Prevention:["HEALTHY SEED","CROP ROTATION","WEED CONTROL","REGULAR INSPECTION"], "Spray Info":["NEEM OIL:","ABOUT 3-5 ML/L","FOLLOW PRODUCT LABEL"], Months:["JUNE-JULY","OCTOBER-MARCH"] },
  "Chilli":     { Season:["KHARIF / RABI","DEPENDS ON REGION"], Type:["VEGETABLE / SPICE"], Problems:["THRIPS","APHIDS","MITES","FRUIT ROT","LEAF CURL"], "Organic Care":["USE NEEM PRODUCTS","REMOVE BADLY INFECTED PLANTS","USE CLEAN PLANTING MATERIAL","IMPROVE DRAINAGE","AVOID LONG LEAF WETNESS"], Prevention:["HEALTHY SEEDLINGS","PROPER SPACING","REGULAR PEST SCOUTING"], "Spray Info":["NEEM OIL:","ABOUT 3-5 ML/L","FOLLOW PRODUCT LABEL"], Months:["JUNE-FEBRUARY","DEPENDS ON REGION"] },
  "Tomato":     { Season:["COOL / MODERATE","SEASON CROP"], Type:["VEGETABLE"], Problems:["FRUIT BORER","WHITEFLY","APHIDS","EARLY BLIGHT","LEAF CURL"], "Organic Care":["USE PHEROMONE TRAPS","USE NEEM PRODUCTS","REMOVE INFECTED LEAVES","REMOVE PLANT DEBRIS","USE PROPER STAKING","MAINTAIN SPACING"], Prevention:["CROP ROTATION","CLEAN NURSERY","PROPER SPACING","REMOVE DISEASED PLANTS"], "Spray Info":["NEEM OIL:","ABOUT 3-5 ML/L","FOLLOW PRODUCT LABEL"], Months:["SEPTEMBER-FEBRUARY","SOUTH INDIAN CONDITIONS"] },
  "Brinjal":    { Season:["WARM SEASON CROP"], Type:["VEGETABLE"], Problems:["SHOOT AND FRUIT BORER","APHIDS","WHITEFLY","MITES"], "Organic Care":["USE PHEROMONE TRAPS","REMOVE INFESTED SHOOTS","REMOVE INFESTED FRUITS","USE NEEM PRODUCTS","MAINTAIN SANITATION"], Prevention:["REGULAR INSPECTION","SANITATION","CROP ROTATION","HEALTHY SEEDLINGS"], "Spray Info":["NEEM OIL:","ABOUT 3-5 ML/L","FOLLOW PRODUCT LABEL"], Months:["MOST SEASONS","SUITABLE TEMPERATURE"] },
  "Onion":      { Season:["RABI / KHARIF","DEPENDS ON REGION"], Type:["BULB CROP"], Problems:["THRIPS","ONION MAGGOT","PURPLE BLOTCH","DOWNY MILDEW"], "Organic Care":["USE NEEM PRODUCTS","REMOVE DISEASED LEAVES","AVOID EXCESS IRRIGATION","MAINTAIN PROPER SPACING"], Prevention:["GOOD DRAINAGE","CROP ROTATION","HEALTHY SEEDLINGS","FIELD SANITATION"], "Spray Info":["NEEM OIL:","ABOUT 3-5 ML/L","FOLLOW PRODUCT LABEL"], Months:["SEPTEMBER-FEBRUARY","DEPENDS ON REGION"] },
  "Mango":      { Season:["PERENNIAL FRUIT TREE"], Type:["FRUIT TREE"], Problems:["MANGO HOPPER","MEALYBUG","FRUIT FLY","POWDERY MILDEW","ANTHRACNOSE"], "Organic Care":["USE NEEM PRODUCTS","USE FRUIT-FLY TRAPS","REMOVE FALLEN FRUITS","PRUNE CROWDED BRANCHES"], Prevention:["PRUNING","ORCHARD SANITATION","BALANCED NUTRITION","PEST MONITORING"], "Spray Info":["NEEM OIL:","ABOUT 3-5 ML/L","FOLLOW PRODUCT LABEL"], "Tree Info":["TREE DOSE DEPENDS","ON CANOPY SIZE","AND APPLICATION METHOD","FOLLOW PRODUCT LABEL"], Months:["YEAR ROUND MANAGEMENT","MONITOR FLOWERING","AND FRUITING"] },
  "Coconut":    { Season:["PERENNIAL","PLANTATION CROP"], Type:["PLANTATION / TREE"], Problems:["RHINOCEROS BEETLE","RED PALM WEEVIL","COCONUT MITE","LEAF-EATING CATERPILLAR"], "Organic Care":["MAINTAIN CLEAN PLANTATION","USE BIOLOGICAL CONTROL","USE NEEM PRODUCTS","REMOVE BREEDING SITES","REMOVE DAMAGED MATERIAL"], Prevention:["REGULAR CROWN INSPECTION","SANITATION","GOOD NUTRITION","REMOVE BREEDING MATERIAL"], "Spray Info":["USE COCONUT-APPROVED","PRODUCT AND LABEL DOSE","DO NOT USE A","GENERIC TREE DOSE"], "Tree Info":["DOSE DEPENDS ON","TREE SIZE AND CANOPY","APPLICATION METHOD","FOLLOW PRODUCT LABEL"], Months:["YEAR-ROUND"] }
};

const PROBLEMS = {
  "Pest Attack":    ["INSPECT PLANTS","REMOVE HEAVILY INFESTED","PARTS WHERE PRACTICAL","USE NEEM OR BIOCONTROL"],
  "Yellow Leaves":  ["CHECK WATERLOGGING","CHECK ROOT HEALTH","CHECK NUTRIENT BALANCE","CHECK FOR PESTS"],
  "Leaf Spots":     ["REMOVE AFFECTED LEAVES","IMPROVE AIR CIRCULATION","AVOID EXCESS","OVERHEAD IRRIGATION"],
  "Poor Growth":    ["CHECK SOIL FERTILITY","CHECK PH","CHECK DRAINAGE","CHECK IRRIGATION","CHECK ROOT HEALTH"],
  "Water Shortage": ["USE MULCHING","USE DRIP IRRIGATION","IRRIGATE BY CROP NEED"],
  "Waterlogging":   ["IMPROVE DRAINAGE","AVOID CONTINUOUS","ROOT SATURATION"],
  "Fruit Damage":   ["USE TRAPS","SCOUT REGULARLY","REMOVE DAMAGED FRUITS","USE CROP-SPECIFIC","BIOLOGICAL METHODS"],
  "Weed Problem":   ["USE MULCHING","MANUAL OR MECHANICAL","TIMELY INTERCULTIVATION"],
  "Fungal Disease": ["IMPROVE VENTILATION","IMPROVE DRAINAGE","MAINTAIN SANITATION","USE LOCAL BIOLOGICAL","OR ORGANIC OPTIONS"],
  "Soil Fertility": ["USE SOIL TESTING","BEFORE LARGE AMOUNTS","OF FERTILIZER","OR MANURE"]
};

// ============================================================
// TAB NAVIGATION
// ============================================================

$$('.tab-button').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.tab-button').forEach(b => b.classList.toggle('active', b === btn));
    $$('.tab-page').forEach(p => p.classList.toggle('active', p.id === btn.dataset.tab));
    document.body.classList.toggle('tab-live-active', btn.dataset.tab === 'tab-live');
  });
});

// ============================================================
// CROP LIBRARY TAB
// ============================================================

let selectedCrop = null;

function buildCropLibrary() {
  const grid = $('cropGrid');
  if (!grid) return;
  grid.innerHTML = '';
  Object.keys(CROPS).forEach(name => {
    const btn = document.createElement('button');
    btn.className = 'crop-btn';
    btn.id = 'cropbtn-' + name.replace(/[^a-zA-Z0-9]/g, '_');
    btn.innerHTML = `<span class="crop-name">${esc(name)}</span><span class="crop-hint">Tap for guide</span>`;
    btn.addEventListener('click', () => selectCrop(name));
    grid.appendChild(btn);
  });
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

  const makeSection = (title, items) => {
    if (!items || !items.length) return '';
    return `<div class="detail-section">
      <div class="detail-label">${esc(title)}</div>
      <ul>${items.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
    </div>`;
  };

  detail.innerHTML = `
    <h3 class="detail-crop-title">🌱 ${esc(name)}</h3>
    ${makeSection('Season', d.Season)}
    ${makeSection('Type', d.Type)}
    ${makeSection('Common Problems', d.Problems)}
    ${makeSection('Organic Care', d['Organic Care'])}
    ${makeSection('Prevention', d.Prevention)}
    ${makeSection('Spray Information', d['Spray Info'])}
    ${d['Tree Info'] ? makeSection('Tree Information', d['Tree Info']) : ''}
    ${makeSection('Growing Months', d.Months)}
  `;
}

function highlightActiveCrop(name) {
  if (!name) return;
  $$('.crop-btn').forEach(btn => {
    const isCurrent = btn.id === 'cropbtn-' + name.replace(/[^a-zA-Z0-9]/g, '_');
    btn.classList.toggle('oled-active', isCurrent);
    btn.querySelector('.crop-hint').textContent = isCurrent ? '📟 On OLED now' : 'Tap for guide';
  });
}

// ============================================================
// FARMER PROBLEMS TAB
// ============================================================

function buildProblems() {
  const grid = $('problemGrid');
  if (!grid) return;
  grid.innerHTML = '';
  Object.keys(PROBLEMS).forEach(name => {
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

    calcResult.innerHTML = `
      <div class="calc-answer">
        <div class="calc-row"><span>Crop</span><strong>${esc(crop)}</strong></div>
        <div class="calc-row"><span>Area / Canopy</span><strong>${area}</strong></div>
        <div class="calc-row"><span>Rate per unit</span><strong>${rate}</strong></div>
        <div class="calc-row total-row"><span>Total required</span><strong>${total} ${unit}</strong></div>
      </div>
    `;
  });

  // Populate crop selector
  const sel = $('calcCrop');
  if (sel) {
    Object.keys(CROPS).forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      sel.appendChild(opt);
    });
  }
}

// ============================================================
// LIVE DISPLAY TAB — render incoming BLE data
// ============================================================

function renderLiveScreen(data) {
  /* data = { s: "SCREEN NAME", l: ["line1", "line2", ...] } */
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

  // Detect active crop from visible lines
  const visible = lines.join(' ').toLowerCase();
  let activeCrop = '';
  Object.keys(CROPS).forEach(name => {
    if (visible.includes(name.toLowerCase())) activeCrop = name;
  });

  // Update overview stat cards
  const screenName = $('statScreen');
  if (screenName) screenName.textContent = screen || '—';

  const activeCropEl = $('statCrop');
  if (activeCropEl) activeCropEl.textContent = activeCrop || '—';

  // Highlight crop in library
  if (activeCrop) highlightActiveCrop(activeCrop);

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
    // If an old 0xFA 0x71 framebuffer packet arrives from old buffer, ignore safely!
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
