const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const indexPath = path.join(distDir, 'index.html');
const manifestSrc = path.join(__dirname, '..', 'public', 'manifest.json');
const manifestDst = path.join(distDir, 'manifest.json');

if (!fs.existsSync(indexPath)) {
  console.error('dist/index.html not found. Run expo export first.');
  process.exit(1);
}

if (fs.existsSync(manifestSrc)) {
  fs.copyFileSync(manifestSrc, manifestDst);
}

let html = fs.readFileSync(indexPath, 'utf8');

const inserts = [
  '<link rel="manifest" href="/manifest.json">',
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-status-bar-style" content="default">',
  '<meta name="apple-mobile-web-app-title" content="GreenCheck">'
];

for (const tag of inserts) {
  if (!html.includes(tag)) {
    html = html.replace('</head>', `${tag}\n</head>`);
  }
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('PWA post-export patch applied.');
