# ============================================================
# FARMER ATI – BLE OLED Mirror Reference Patch
#
# Service:        0xA000
# Characteristic: 0xA001  READ | NOTIFY
# Device Name:    FARMER ATI
#
# Binary Packet Protocol (<= 20 bytes total per BLE notification):
#   [0]: 0xFA  (Magic 1)
#   [1]: 0x71  (Magic 2)
#   [2]: msg_id (0..255)
#   [3]: pkt_idx (0..total_pkts-1)
#   [4]: total_pkts (1..255)
#   [5..N]: JSON data slice (up to 15 bytes)
#
# JSON payload format once reassembled on tablet:
#   {"s": "SCREEN TITLE", "l": ["line 1", "line 2", ...]}
# ============================================================
