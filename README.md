# FARMER ATI – Smart Agricultural Information System
### Bluetooth LE Web Dashboard for ESP32 MicroPython

A responsive, offline-first agricultural information dashboard hosted on **GitHub Pages** that connects directly to the **ESP32 FARMER ATI** field unit via **Bluetooth Low Energy (BLE)** using the **Web Bluetooth API**.

---

## 🌾 Project Overview

**FARMER ATI** is an embedded smart agricultural advisor designed for farmers and field demonstrations. The ESP32 device runs MicroPython with a physical 128×64 SH1106 OLED display and a 4×4 matrix keypad. 

This web dashboard provides an interactive tablet companion interface that:
- Connects directly to the ESP32 via **Bluetooth LE GATT** (zero local Wi-Fi, hotspot, or local IP required).
- Displays live GATT notifications and mirrors the physical OLED screen in real-time.
- Features a complete **Crop Library** for 10 major crops with organic care, prevention tips, and neem spray schedules.
- Includes a **Farmer Problems Guide** for diagnostic checklists and natural remedies.
- Features a **Seed Rate & Tree Dosage Calculator** supporting both field crops (Area × Rate) and tree crops (Canopy × Rate).

---

## 🛠️ Hardware & Firmware Specifications

| Component | Specification |
|---|---|
| **Microcontroller** | Generic ESP32 Development Board |
| **Firmware** | MicroPython v1.28.0 |
| **Display** | SH1106 OLED, 128×64 Monochrome |
| **I2C Address** | `0x3C` |
| **I2C Bus** | Bus 0: SDA = GPIO 21, SCL = GPIO 22 (100,000 Hz) |
| **Input** | 4×4 Matrix Physical Keypad |
| **Keypad Controls** | `*`: Home \| `C`: Back \| `D`: OK / Select |

---

## 📡 Bluetooth LE GATT Configuration

| Parameter | Value |
|---|---|
| **BLE Device Name** | `FARMER ATI` |
| **Custom GATT Service UUID** | `0xA000` (`0000a000-0000-1000-8000-00805f9b34fb`) |
| **Data Characteristic UUID** | `0xA001` (`0000a001-0000-1000-8000-00805f9b34fb`) |
| **Characteristic Properties** | `READ`, `NOTIFY` |
| **Initial Notification String** | `FARMER ATI Bluetooth connection successful!` |

---

## 📱 How to Open and Connect on Android Tablet (Google Chrome)

### 1. Requirements
- **Google Chrome** on your Android tablet (Chrome 79+ supports Web Bluetooth by default).
- **Bluetooth** turned ON in Android settings.
- **Location Services** turned ON in Android settings (required by Android OS for BLE scanning).
- An active HTTPS connection (GitHub Pages provides automatic HTTPS).

### 2. Connection Steps
1. Power up your ESP32 running the MicroPython BLE server (`crop.py` test server or FARMER ATI BLE firmware).
   - The ESP32 will start advertising with the name `FARMER ATI` and service `0xA000`.
2. Open your GitHub Pages dashboard URL in **Google Chrome** on your Android tablet:
   `https://<your-username>.github.io/<repo-name>/`
3. Tap the **"Connect to FARMER ATI"** button in the top navigation bar or the Overview card.
4. Android Chrome will display the native Bluetooth device chooser dialog:
   - Select **`FARMER ATI`** from the list.
   - Tap **Pair / Connect**.
5. The dashboard will:
   - Connect to the GATT server.
   - Discover Primary Service `0xA000`.
   - Discover Characteristic `0xA001`.
   - Read the characteristic and start real-time notifications.
6. The connection indicator will turn green (**CONNECTED**), and notifications such as `FARMER ATI Bluetooth connection successful!` will appear immediately in the **Live Notification Box** and on the **Live ESP32 OLED Display**!

---

## 🖥️ Dashboard Navigation

1. **Overview**: Project architecture, hardware pinout, live connection status card, and connection controls.
2. **Crop Library**: 10 major crops (Paddy, Groundnut, Black Gram, Green Gram, Chilli, Tomato, Brinjal, Onion, Mango, Coconut) with seasons, pest tags, organic remedies, and neem spray dosages.
3. **Farmer Problems**: 10 diagnostic advisory cards covering yellow leaves, pest attacks, leaf spots, waterlogging, fruit damage, soil fertility, and more.
4. **Seed Rate Calculator**: Calculate seed requirements by selecting a crop, entering the acreage (Acres, Hectares, Cents), or entering canopy size for Mango and Coconut.
5. **Live ESP32 Display**: Pixel-accurate 128×64 SH1106 OLED display simulator with themes (White, Amber, Green, Cyan) and live BLE telemetry packet viewer.

---

## 🔒 Preservation Confirmation

- The original working MicroPython project (`D:\documents\kids\in.py`) remains 100% untouched.
- `main.py`, `sh1106.py`, OLED pin assignments (GPIO 21/22), 4×4 keypad mapping, crop data, and standby timer logic are preserved without modification.
- The web dashboard runs completely independently and interfaces directly via the established BLE GATT protocol.
