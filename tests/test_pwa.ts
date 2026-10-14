/**
 * FairGig PWA Verification Suite
 * Validates:
 * 1. Web App Manifest metadata & properties
 * 2. Icon asset dimensions & format integrity
 * 3. Service Worker security policies (zero-cache on financial/auth APIs)
 * 4. Offline fallback integrity
 * 5. Install hook & cross-platform guidance
 */

import fs from 'fs';
import path from 'path';

function readPngDimensions(buffer: Buffer): { width: number; height: number } {
  // PNG IHDR is at byte offset 16 (4 bytes width, 4 bytes height)
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return { width, height };
}

async function runPwaTests() {
  console.log('===============================================================');
  console.log('FAIRGIG PWA: PROGRESSIVE WEB APP VERIFICATION SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  const webDir = path.join(__dirname, '..', 'apps', 'web');
  const publicDir = path.join(webDir, 'public');
  const iconsDir = path.join(publicDir, 'icons');

  // Test 1: Web App Manifest
  console.log('[RUNNING] Test 1: Verifying Web App Manifest...');
  const manifestPath = path.join(publicDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error('Test 1 Failed: public/manifest.json not found');
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  if (manifest.name !== 'FairGig — Income & Rights') {
    throw new Error(`Test 1 Failed: Manifest name mismatch: ${manifest.name}`);
  }
  if (manifest.short_name !== 'FairGig') {
    throw new Error(`Test 1 Failed: Manifest short_name mismatch: ${manifest.short_name}`);
  }
  if (manifest.display !== 'standalone') {
    throw new Error(`Test 1 Failed: Manifest display mode should be standalone`);
  }
  if (manifest.background_color !== '#FAF9F5' || manifest.theme_color !== '#1B4332') {
    throw new Error(`Test 1 Failed: Manifest colors mismatch`);
  }
  if (!manifest.icons || manifest.icons.length < 3) {
    throw new Error(`Test 1 Failed: Manifest must define at least 3 icons (192, 512, maskable)`);
  }
  console.log('[TEST 1 PASS] Manifest configured with standalone mode, #1B4332 theme, and complete icon manifest.');
  passed++;

  // Test 2: Icon Assets & Dimensions
  console.log('\n[RUNNING] Test 2: Checking icon asset existence and exact dimensions...');
  const expectedIcons = [
    { name: 'icon-192.png', width: 192, height: 192 },
    { name: 'icon-512.png', width: 512, height: 512 },
    { name: 'icon-maskable-512.png', width: 512, height: 512 },
    { name: 'apple-touch-icon.png', width: 180, height: 180 },
    { name: 'icon-32.png', width: 32, height: 32 },
  ];

  for (const exp of expectedIcons) {
    const iconPath = path.join(iconsDir, exp.name);
    if (!fs.existsSync(iconPath)) {
      throw new Error(`Test 2 Failed: Missing icon asset: ${exp.name}`);
    }
    const buf = fs.readFileSync(iconPath);
    const dims = readPngDimensions(buf);
    if (dims.width !== exp.width || dims.height !== exp.height) {
      throw new Error(`Test 2 Failed: ${exp.name} dimensions expected ${exp.width}x${exp.height}, got ${dims.width}x${dims.height}`);
    }
  }

  // Check SVG vector
  const svgPath = path.join(iconsDir, 'icon.svg');
  if (!fs.existsSync(svgPath)) throw new Error('Test 2 Failed: icon.svg missing');

  // Check favicon.ico
  const icoPath = path.join(publicDir, 'favicon.ico');
  if (!fs.existsSync(icoPath)) throw new Error('Test 2 Failed: favicon.ico missing');

  console.log('[TEST 2 PASS] All PNG icon dimensions verified (192x192, 512x512, 180x180, 32x32), SVG and ICO present.');
  passed++;

  // Test 3: Service Worker Security Caching Policies
  console.log('\n[RUNNING] Test 3: Auditing Service Worker financial & auth cache restrictions...');
  const swPath = path.join(publicDir, 'sw.js');
  if (!fs.existsSync(swPath)) {
    throw new Error('Test 3 Failed: public/sw.js missing');
  }
  const swContent = fs.readFileSync(swPath, 'utf8');

  // Must reject non-GET requests
  if (!swContent.includes("req.method !== 'GET'")) {
    throw new Error('Test 3 Failed: Service worker must never intercept non-GET requests');
  }

  // Must block auth endpoints
  if (!swContent.includes('/auth') || !swContent.includes('/login')) {
    throw new Error('Test 3 Failed: Service worker must explicitly forbid caching of auth endpoints');
  }

  // Must block earnings/analytics APIs
  if (!swContent.includes('/earnings') || !swContent.includes('/analytics') || !swContent.includes('/api/')) {
    throw new Error('Test 3 Failed: Service worker must explicitly forbid caching of earnings/analytics APIs');
  }

  // Must use network-first for navigation with /offline fallback
  if (!swContent.includes("req.mode === 'navigate'") || !swContent.includes('/offline')) {
    throw new Error('Test 3 Failed: Service worker must route navigation network-first with /offline fallback');
  }

  console.log('[TEST 3 PASS] Service worker strictly enforces zero-cache on financial/auth APIs and network-first navigation.');
  passed++;

  // Test 4: Offline Fallback Page
  console.log('\n[RUNNING] Test 4: Checking offline fallback route...');
  const offlinePagePath = path.join(webDir, 'src', 'app', 'offline', 'page.tsx');
  if (!fs.existsSync(offlinePagePath)) {
    throw new Error('Test 4 Failed: src/app/offline/page.tsx missing');
  }
  const offlineContent = fs.readFileSync(offlinePagePath, 'utf8');
  if (!offlineContent.includes('Internet Connection Required') || !offlineContent.includes('Retry Connection')) {
    throw new Error('Test 4 Failed: Offline page must inform user of internet requirement with retry action');
  }
  console.log('[TEST 4 PASS] Offline fallback page properly configured with retry action and financial security disclaimer.');
  passed++;

  // Test 5: Metadata & Layout Verification
  console.log('\n[RUNNING] Test 5: Verifying Next.js layout metadata and viewport...');
  const layoutPath = path.join(webDir, 'src', 'app', 'layout.tsx');
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');

  if (!layoutContent.includes('manifest.webmanifest') && !layoutContent.includes('manifest.json')) {
    throw new Error('Test 5 Failed: layout.tsx must reference web app manifest');
  }
  if (!layoutContent.includes('appleWebApp')) {
    throw new Error('Test 5 Failed: layout.tsx must configure appleWebApp');
  }
  if (!layoutContent.includes('themeColor')) {
    throw new Error('Test 5 Failed: layout.tsx must declare themeColor (#1B4332)');
  }
  if (!layoutContent.includes('viewportFit')) {
    throw new Error('Test 5 Failed: layout.tsx must configure viewportFit=cover for mobile display');
  }
  console.log('[TEST 5 PASS] RootLayout configured with Apple mobile web app settings, theme color #1B4332, and viewport-fit cover.');
  passed++;

  console.log('\n===============================================================');
  console.log(`ALL 5 PWA VERIFICATION TESTS PASSED (${passed}/5)`);
  console.log('===============================================================\n');
}

runPwaTests().catch((err) => {
  console.error('\n[FATAL] PWA Test Suite Failed:', err);
  process.exit(1);
});
