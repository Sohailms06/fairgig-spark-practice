const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Ensure output directories exist
const publicDir = path.join(__dirname, '..', 'public');
const iconsDir = path.join(publicDir, 'icons');

if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

// CRC32 implementation for PNG chunks
function makeCrcTable() {
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    crcTable[n] = c;
  }
  return crcTable;
}
const crcTable = makeCrcTable();
function crc32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  return (crc ^ (-1)) >>> 0;
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type);
  const crcBuf = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgbaBuffer) {
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // 8-bit depth
  ihdr[9] = 6;  // RGBA
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // filter none
  ihdr[12] = 0; // non-interlaced

  const rowSize = width * 4;
  const rawData = Buffer.alloc(height * (rowSize + 1));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowSize + 1);
    rawData[rowOffset] = 0; // Filter None
    rgbaBuffer.copy(rawData, rowOffset + 1, y * rowSize, (y + 1) * rowSize);
  }

  const idatData = zlib.deflateSync(rawData, { level: 9 });
  return Buffer.concat([
    header,
    createChunk('IHDR', ihdr),
    createChunk('IDAT', idatData),
    createChunk('IEND', Buffer.alloc(0))
  ]);
}

// Signed Distance Field helpers
function sdBox(px, py, bx, by) {
  const dx = Math.abs(px) - bx;
  const dy = Math.abs(py) - by;
  return Math.max(dx, dy);
}

function sdRoundedBox(px, py, bx, by, r) {
  const qx = Math.abs(px) - bx + r;
  const qy = Math.abs(py) - by + r;
  return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - r;
}

// Distance to the FairGig "FG" monogram
function distMonogram(x, y, scale = 1.0) {
  const sx = x / scale;
  const sy = y / scale;

  // Letter F
  const stem = sdBox(sx - (-0.36), sy, 0.05, 0.30);
  const topBar = sdBox(sx - (-0.23), sy - 0.25, 0.18, 0.05);
  const midBar = sdBox(sx - (-0.26), sy - (-0.01), 0.15, 0.05);
  const distF = Math.min(stem, topBar, midBar);

  // Letter G
  const gOuter = sdRoundedBox(sx - 0.26, sy, 0.24, 0.30, 0.16);
  const gInner = sdRoundedBox(sx - 0.26, sy, 0.14, 0.20, 0.08);
  const gRing = Math.max(gOuter, -gInner);
  const gOpening = sdBox(sx - 0.36, sy - 0.13, 0.16, 0.14);
  const gBar = sdBox(sx - 0.32, sy - (-0.01), 0.14, 0.05);
  const gSpur = sdBox(sx - 0.45, sy - (-0.14), 0.05, 0.16);
  const distG = Math.min(Math.max(gRing, -gOpening), gBar, gSpur);

  return Math.min(distF, distG) * scale;
}

// Generate icon image buffer with anti-aliasing
function renderIcon(size, options = {}) {
  const {
    isMaskable = false,
    hasRoundedCorners = false,
    cornerRadius = 0.2,
    monogramScale = 1.0
  } = options;

  const buf = Buffer.alloc(size * size * 4);
  const pixelSize = 2.0 / size; // size in [-1, 1] units
  const subpixelStep = pixelSize / 4;

  // Colors
  const bgR = 27, bgG = 67, bgB = 50;     // #1B4332
  const borderR = 45, borderG = 106, borderB = 79; // #2D6A4F
  const fgR = 250, fgG = 249, fgB = 245;  // #FAF9F5

  for (let y = 0; y < size; y++) {
    const py = 1.0 - (y + 0.5) * pixelSize; // y ranges from 1 (top) to -1 (bottom)

    for (let x = 0; x < size; x++) {
      const px = -1.0 + (x + 0.5) * pixelSize; // x ranges from -1 (left) to 1 (right)

      // 4x4 subpixel super-sampling for anti-aliasing
      let fgCoverage = 0;
      let bgCoverage = 0;
      let borderCoverage = 0;

      for (let sy = -1.5; sy <= 1.5; sy += 1.0) {
        const subY = py + sy * subpixelStep;
        for (let sx = -1.5; sx <= 1.5; sx += 1.0) {
          const subX = px + sx * subpixelStep;

          // Background containment
          let insideBg = true;
          if (hasRoundedCorners && !isMaskable) {
            const distBg = sdRoundedBox(subX, subY, 0.94, 0.94, cornerRadius);
            insideBg = distBg <= 0;
            // Check border
            if (distBg <= 0 && distBg >= -0.02) {
              borderCoverage += 1 / 16;
            }
          }

          if (insideBg) {
            bgCoverage += 1 / 16;
            const d = distMonogram(subX, subY, monogramScale);
            if (d <= 0) {
              fgCoverage += 1 / 16;
            }
          }
        }
      }

      const idx = (y * size + x) * 4;

      if (bgCoverage === 0) {
        // Transparent
        buf[idx] = 0;
        buf[idx + 1] = 0;
        buf[idx + 2] = 0;
        buf[idx + 3] = 0;
      } else {
        // Blend foreground monogram over background
        let r = bgR;
        let g = bgG;
        let b = bgB;

        if (borderCoverage > 0) {
          r = Math.round(r * (1 - borderCoverage) + borderR * borderCoverage);
          g = Math.round(g * (1 - borderCoverage) + borderG * borderCoverage);
          b = Math.round(b * (1 - borderCoverage) + borderB * borderCoverage);
        }

        if (fgCoverage > 0) {
          r = Math.round(r * (1 - fgCoverage) + fgR * fgCoverage);
          g = Math.round(g * (1 - fgCoverage) + fgG * fgCoverage);
          b = Math.round(b * (1 - fgCoverage) + fgB * fgCoverage);
        }

        buf[idx] = r;
        buf[idx + 1] = g;
        buf[idx + 2] = b;
        buf[idx + 3] = Math.round(bgCoverage * 255);
      }
    }
  }

  return buf;
}

// Generate ICO format from PNG buffer
function createIco(pngBuffer, size = 32) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // image type 1 (icon)
  header.writeUInt16LE(1, 4); // 1 image

  const dirEntry = Buffer.alloc(16);
  dirEntry.writeUInt8(size, 0);        // width
  dirEntry.writeUInt8(size, 1);        // height
  dirEntry.writeUInt8(0, 2);           // palette count
  dirEntry.writeUInt8(0, 3);           // reserved
  dirEntry.writeUInt16LE(1, 4);        // color planes
  dirEntry.writeUInt16LE(32, 6);       // bits per pixel
  dirEntry.writeUInt32LE(pngBuffer.length, 8); // image size
  dirEntry.writeUInt32LE(22, 12);      // offset (6 + 16 = 22)

  return Buffer.concat([header, dirEntry, pngBuffer]);
}

// Generate Vector SVG
function generateSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1E4A37"/>
      <stop offset="100%" stop-color="#1B4332"/>
    </linearGradient>
  </defs>
  <!-- Background Container -->
  <rect width="512" height="512" rx="104" fill="url(#bgGrad)"/>
  <rect x="12" y="12" width="488" height="488" rx="94" fill="none" stroke="#2D6A4F" stroke-width="2.5" stroke-opacity="0.5"/>

  <!-- Monogram FG in Warm Ivory -->
  <g fill="#FAF9F5">
    <!-- Letter F -->
    <path d="M 138 152 H 242 V 186 H 180 V 238 H 234 V 272 H 180 V 360 H 138 Z"/>

    <!-- Letter G -->
    <path d="M 284 256 C 284 186 314 152 376 152 C 418 152 444 176 452 208 L 414 220 C 408 198 394 186 376 186 C 338 186 324 214 324 256 C 324 298 338 326 376 326 C 400 326 414 312 416 288 H 368 V 256 H 454 V 292 C 448 336 418 360 376 360 C 314 360 284 326 284 256 Z"/>
  </g>
</svg>
`;
}

console.log('Generating FairGig PWA icon assets...');

// 1. Vector SVG
const svgContent = generateSvg();
fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgContent, 'utf8');
console.log('✓ Wrote apps/web/public/icons/icon.svg');

// 2. 512x512 standard icon
const buf512 = renderIcon(512, { hasRoundedCorners: true, cornerRadius: 0.22, monogramScale: 0.95 });
const png512 = encodePNG(512, 512, buf512);
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), png512);
console.log('✓ Wrote apps/web/public/icons/icon-512.png (512x512)');

// 3. 512x512 maskable icon (safe 65% area, full solid background)
const bufMaskable512 = renderIcon(512, { isMaskable: true, hasRoundedCorners: false, monogramScale: 0.72 });
const pngMaskable512 = encodePNG(512, 512, bufMaskable512);
fs.writeFileSync(path.join(iconsDir, 'icon-maskable-512.png'), pngMaskable512);
console.log('✓ Wrote apps/web/public/icons/icon-maskable-512.png (512x512 maskable)');

// 4. 192x192 standard icon
const buf192 = renderIcon(192, { hasRoundedCorners: true, cornerRadius: 0.22, monogramScale: 0.95 });
const png192 = encodePNG(192, 192, buf192);
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), png192);
console.log('✓ Wrote apps/web/public/icons/icon-192.png (192x192)');

// 5. 180x180 Apple Touch Icon (solid background, centered monogram)
const buf180 = renderIcon(180, { isMaskable: true, hasRoundedCorners: false, monogramScale: 0.85 });
const png180 = encodePNG(180, 180, buf180);
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), png180);
console.log('✓ Wrote apps/web/public/icons/apple-touch-icon.png (180x180)');

// 6. 32x32 Favicon PNG & ICO
const buf32 = renderIcon(32, { hasRoundedCorners: true, cornerRadius: 0.25, monogramScale: 0.95 });
const png32 = encodePNG(32, 32, buf32);
fs.writeFileSync(path.join(iconsDir, 'icon-32.png'), png32);
const ico32 = createIco(png32, 32);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), ico32);
console.log('✓ Wrote apps/web/public/favicon.ico and icons/icon-32.png (32x32)');

console.log('All FairGig PWA application icons generated successfully.');
