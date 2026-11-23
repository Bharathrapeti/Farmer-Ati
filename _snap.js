const { spawnSync } = require('child_process');
const fs = require('fs');

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDesktop = 'C:\\Users\\rapet\\.gemini\\antigravity\\brain\\d2c885c9-b676-4eab-863c-99e491f35d00\\snap_desktop.png';
const outTablet = 'C:\\Users\\rapet\\.gemini\\antigravity\\brain\\d2c885c9-b676-4eab-863c-99e491f35d00\\snap_tablet.png';

// Create temp index with tab-live active
let html = fs.readFileSync('D:\\Smart ATI\\index.html', 'utf8');
html = html.replace('class="tab-page active" id="tab-overview"', 'class="tab-page" id="tab-overview"');
html = html.replace('class="tab-page" id="tab-live"', 'class="tab-page active" id="tab-live"');
fs.writeFileSync('D:\\Smart ATI\\_temp_live.html', html, 'utf8');

const url = 'file:///D:/Smart%20ATI/_temp_live.html';

console.log('Taking desktop snap...');
spawnSync(chrome, [
  '--headless=new',
  '--screenshot=' + outDesktop,
  '--window-size=1200,900',
  '--virtual-time-budget=2000',
  url
]);

console.log('Taking tablet snap...');
spawnSync(chrome, [
  '--headless=new',
  '--screenshot=' + outTablet,
  '--window-size=768,1024',
  '--virtual-time-budget=2000',
  url
]);

fs.unlinkSync('D:\\Smart ATI\\_temp_live.html');

console.log('Desktop exists:', fs.existsSync(outDesktop));
console.log('Tablet exists:', fs.existsSync(outTablet));
