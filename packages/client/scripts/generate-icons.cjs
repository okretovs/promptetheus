// Simple script to generate placeholder icons
const fs = require('fs');
const path = require('path');

// Create a simple SVG and convert to PNG using a base64 encoded SVG
function createIcon(size) {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#3b82f6"/>
      <text x="50%" y="50%" font-size="${size * 0.5}" font-family="Arial, sans-serif"
            fill="white" text-anchor="middle" dominant-baseline="middle">P</text>
    </svg>
  `;
  return svg.trim();
}

// For now, just create SVG files as placeholders
const publicDir = path.join(__dirname, '..', 'public');

const svg192 = createIcon(192);
const svg512 = createIcon(512);

fs.writeFileSync(path.join(publicDir, 'icon-192.svg'), svg192);
fs.writeFileSync(path.join(publicDir, 'icon-512.svg'), svg512);

console.log('Icon SVGs created. Please convert to PNG manually or use an online tool.');
console.log('For now, creating placeholder PNG files...');

// Create minimal valid PNG files (1x1 blue pixel)
const minimalPng = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
  0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
  0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
  0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
  0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D,
  0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
  0x44, 0xAE, 0x42, 0x60, 0x82
]);

fs.writeFileSync(path.join(publicDir, 'icon-192.png'), minimalPng);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), minimalPng);

console.log('Placeholder PNG files created successfully!');
