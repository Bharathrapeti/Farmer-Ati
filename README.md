# FARMER ATI – Smart Agricultural Information System

A BLE-connected agricultural information dashboard for the **FARMER ATI** ESP32 project.

> **School:** Kendriya Vidyalaya No.2 · **Event:** NCSC 2026–27

---

## Live site

**[https://Bharathrapeti.github.io/Farmer-Ati/](https://Bharathrapeti.github.io/Farmer-Ati/)**

Open in **Google Chrome on Android** or desktop Chrome (Bluetooth must be enabled).

---

## How it works

| Layer | Technology |
|-------|-----------|
| ESP32 firmware | MicroPython 1.28.0 |
| Communication | Bluetooth Low Energy (BLE GATT) |
| BLE service | `0xA000` |
| BLE characteristic | `0xA001` (READ + NOTIFY) |
| Dashboard | Web Bluetooth API (Chrome) |
| Hosting | GitHub Pages (HTTPS) |

The ESP32 sends the **current OLED screen contents as JSON** via BLE notification every time the display changes.  
The tablet receives the notification and renders the same information using **modern web fonts and a clean dashboard layout**.

---

## Connecting from Android Chrome

1. Enable Bluetooth on the tablet.
2. Open **[https://Bharathrapeti.github.io/Farmer-Ati/](https://Bharathrapeti.github.io/Farmer-Ati/)** in Chrome.
3. Click **⚡ Connect to FARMER ATI**.
4. Chrome shows a Bluetooth device picker — select **FARMER ATI**.
5. The dashboard connects and the **📟 Live Display** tab starts mirroring the OLED.

---

## Dashboard tabs

| Tab | Contents |
|-----|---------|
| **Overview** | BLE status, stat cards, keypad guide |
| **📟 Live Display** | Real-time OLED mirror via BLE |
| **Crop Library** | Full 10-crop agronomy database |
| **Farmer Problems** | 10 common problem guides |
| **Seed Calculator** | Seed rate & tree canopy calculators |

---

## Files

| File | Purpose |
|------|---------|
| `index.html` | Dashboard web application |
| `style.css` | Agricultural green/white theme |
| `script.js` | Web Bluetooth API + crop/problem data |
| `README.md` | This file |

---

## ESP32 BLE Packet Protocol

Each notification contains up to 20 bytes (safe for standard 23-byte BLE ATT MTU):

- `[0]`: `0xFA` (Magic byte 1)
- `[1]`: `0x72` (Magic byte 2: text-based JSON protocol)
- `[2]`: `msg_id` (0..255 wrapping message counter)
- `[3]`: `pkt_idx` (0..total_pkts - 1)
- `[4]`: `total_pkts` (1..255)
- `[5..N]`: Payload slice (up to 15 bytes of UTF-8 JSON data)

Reassembled JSON format:
```json
{"s": "SCREEN TITLE", "l": ["line 1", "line 2", "..."]}
```

---

## Preserving the original project

✅ Physical OLED display unchanged  
✅ 4×4 keypad navigation unchanged  
✅ All crop data, problem guides, calculators preserved  
✅ Presentation/intro screens unchanged  
✅ Standby timer unchanged  
✅ `sh1106.py` not modified  
✅ No Wi-Fi required for BLE mirroring  

---

## Hardware

- **Board:** ESP32 development board
- **Display:** SH1106 OLED 128×64, I²C 0x3C (SDA GPIO 21, SCL GPIO 22)
- **Keypad:** 4×4 matrix (rows: 13,12,14,27 · cols: 26,25,33,32)
