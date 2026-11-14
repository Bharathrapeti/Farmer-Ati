'use strict';

/*
 * FARMER ATI BLE OLED MIRROR
 *
 * ESP32 service:        0xA000
 * ESP32 characteristic: 0xA001
 * Device name:          FARMER ATI
 *
 * Each notification:
 * [0]    0xFA
 * [1]    0x71
 * [2]    Frame ID
 * [3]    Packet index
 * [4]    Total packets
 * [5-19] OLED data
 *
 * OLED buffer:
 * 128 x 64 pixels = 1024 bytes
 * SH1106 MONO_VLSB format
 */

const BLE_DEVICE_NAME = 'FARMER ATI';
const BLE_SERVICE_UUID = 0xA000;
const BLE_CHARACTERISTIC_UUID = 0xA001;

const FRAME_SIZE = 1024;

let bleDevice = null;
let bleServer = null;
let bleCharacteristic = null;

let receivedFrameId = -1;
let expectedPackets = 0;
let receivedPackets = new Set();
let frameBuffer = new Uint8Array(FRAME_SIZE);
let frameCount = 0;

const connectButton = document.getElementById('connectButton');
const disconnectButton = document.getElementById('disconnectButton');

const connectionDot = document.getElementById('connectionDot');
const connectionText = document.getElementById('connectionText');
const connectionMessage = document.getElementById('connectionMessage');
const deviceStatus = document.getElementById('deviceStatus');

const frameStatus = document.getElementById('frameStatus');
const frameCounter = document.getElementById('frameCounter');

const canvas = document.getElementById('oledCanvas');
const ctx = canvas.getContext('2d', {
    alpha: false
});

let imageData = ctx.createImageData(128, 64);

/* INITIAL OLED SCREEN */

function showBlankOLED() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 128, 64);
}

showBlankOLED();

/* TAB NAVIGATION */

document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        const selectedTab = button.dataset.tab;

        document.querySelectorAll('.tab-button').forEach(item => {
            item.classList.toggle('active', item === button);
        });

        document.querySelectorAll('.tab-page').forEach(page => {
            page.classList.toggle(
                'active',
                page.id === selectedTab
            );
        });
    });
});

/* CONNECTION STATUS */

function setConnectionStatus(connected, message) {
    connectionDot.classList.toggle('connected', connected);
    connectionDot.classList.toggle('disconnected', !connected);

    connectionText.textContent = connected
        ? 'Bluetooth connected'
        : 'Not connected';

    deviceStatus.textContent = connected
        ? 'Connected'
        : 'Disconnected';

    connectionMessage.textContent = message;

    connectButton.disabled = connected;
    disconnectButton.disabled = !connected;
}

/* CONNECT BUTTON */

connectButton.addEventListener('click', async () => {
    if (!navigator.bluetooth) {
        setConnectionStatus(
            false,
            'Web Bluetooth is not supported by this browser. Open this page in Chrome on Android.'
        );
        return;
    }

    try {
        connectionMessage.textContent = 'Searching for FARMER ATI...';
        connectButton.disabled = true;

        bleDevice = await navigator.bluetooth.requestDevice({
            filters: [
                {
                    name: BLE_DEVICE_NAME
                }
            ],
            optionalServices: [
                BLE_SERVICE_UUID
            ]
        });

        bleDevice.addEventListener(
            'gattserverdisconnected',
            handleDisconnection
        );

        connectionMessage.textContent = 'Connecting to ESP32...';

        bleServer = await bleDevice.gatt.connect();

        const service = await bleServer.getPrimaryService(
            BLE_SERVICE_UUID
        );

        bleCharacteristic = await service.getCharacteristic(
            BLE_CHARACTERISTIC_UUID
        );

        await bleCharacteristic.startNotifications();

        bleCharacteristic.addEventListener(
            'characteristicvaluechanged',
            handleIncomingBLEData
        );

        setConnectionStatus(
            true,
            'Connected to FARMER ATI. Waiting for OLED frames...'
        );

        frameStatus.textContent = 'Receiving display data';

    } catch (error) {
        console.error('BLE connection error:', error);

        setConnectionStatus(
            false,
            'Connection failed: ' + error.message
        );

        connectButton.disabled = false;
    }
});

/* DISCONNECT BUTTON */

disconnectButton.addEventListener('click', () => {
    if (bleDevice && bleDevice.gatt.connected) {
        bleDevice.gatt.disconnect();
    }
});

/* HANDLE DISCONNECTION */

function handleDisconnection() {
    bleCharacteristic = null;
    bleServer = null;

    receivedPackets.clear();
    expectedPackets = 0;
    receivedFrameId = -1;

    setConnectionStatus(
        false,
        'Disconnected from FARMER ATI. Press Connect ESP32 to reconnect.'
    );

    frameStatus.textContent = 'Waiting for display';
}

/* RECEIVE BLE NOTIFICATIONS */

function handleIncomingBLEData(event) {
    const value = event.target.value;

    const bytes = new Uint8Array(
        value.buffer,
        value.byteOffset,
        value.byteLength
    );

    if (bytes.length < 5) {
        return;
    }

    // Ignore anything that is not an OLED frame packet.
    if (bytes[0] !== 0xFA || bytes[1] !== 0x71) {
        return;
    }

    receiveOLEDPacket(bytes);
}

/* ASSEMBLE THE 1024-BYTE FRAME */

function receiveOLEDPacket(packet) {
    const frameId = packet[2];
    const packetIndex = packet[3];
    const totalPackets = packet[4];

    if (totalPackets === 0 || totalPackets > 100) {
        return;
    }

    if (packetIndex >= totalPackets) {
        return;
    }

    // A new frame starts a new assembly.
    if (frameId !== receivedFrameId) {
        receivedFrameId = frameId;
        expectedPackets = totalPackets;
        receivedPackets = new Set();
        frameBuffer = new Uint8Array(FRAME_SIZE);
    }

    if (totalPackets !== expectedPackets) {
        return;
    }

    const dataStart = packetIndex * 15;
    const payloadLength = packet.length - 5;

    if (payloadLength <= 0 || dataStart >= FRAME_SIZE) {
        return;
    }

    const copyLength = Math.min(
        payloadLength,
        FRAME_SIZE - dataStart
    );

    frameBuffer.set(
        packet.subarray(5, 5 + copyLength),
        dataStart
    );

    receivedPackets.add(packetIndex);

    frameStatus.textContent =
        'Receiving ' + receivedPackets.size +
        ' / ' + expectedPackets;

    // Draw only after all packets have arrived.
    if (receivedPackets.size === expectedPackets) {
        drawOLEDFrame(frameBuffer);

        frameCount++;

        frameCounter.textContent = 'Frames: ' + frameCount;
        frameStatus.textContent = 'OLED synchronized';
    }
}

/* DRAW THE EXACT SH1106 FRAMEBUFFER */

function drawOLEDFrame(frame) {
    const pixels = imageData.data;

    for (let y = 0; y < 64; y++) {
        for (let x = 0; x < 128; x++) {

            /*
             * SH1106 MONO_VLSB layout:
             * byte index = x + (y >> 3) * 128
             * bit index  = y & 7
             */

            const byteIndex = x + (y >> 3) * 128;
            const bitIndex = y & 7;

            const pixelOn =
                (frame[byteIndex] >> bitIndex) & 1;

            const pixelValue = pixelOn ? 255 : 0;

            const pixelIndex = (y * 128 + x) * 4;

            pixels[pixelIndex] = pixelValue;
            pixels[pixelIndex + 1] = pixelValue;
            pixels[pixelIndex + 2] = pixelValue;
            pixels[pixelIndex + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

/* BROWSER SUPPORT MESSAGE */

if (!navigator.bluetooth) {
    connectionMessage.textContent =
        'Web Bluetooth is unavailable. Use Chrome on Android and open the GitHub Pages HTTPS website.';
}