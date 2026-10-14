/**
 * FairGig Phase 3 Income Certificate Automated Test Suite.
 * Validates Tests 11-16:
 * 11. Certificate includes verified earnings only.
 * 12. Certificate excludes unverified earnings from verified totals.
 * 13. Worker cannot access another worker's private certificate (403 Forbidden).
 * 14. Printable HTML contains appropriate print CSS (@media print, @page, disclaimers).
 * 15. Empty date range is handled gracefully without errors.
 * 16. Certificate totals match live database values and cryptographic signature validates.
 */

import http from 'http';
import jwt from 'jsonwebtoken';
import { app } from '../services/certificate/src/app';
import { config } from '../services/certificate/src/config';
import { certDb } from '../services/certificate/src/db';

const TEST_PORT = 4098;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

function makeToken(userId: string, role: string, email: string): string {
  return jwt.sign(
    { sub: userId, role, email },
    config.jwtSecret,
    { algorithm: config.jwtAlgorithm as jwt.Algorithm, expiresIn: '1h' }
  );
}

const WORKER_A_ID = 'ce05274e-5727-4a82-a8aa-4f6362ea7df9';
const WORKER_B_ID = '61b82bf9-4eba-4d61-9854-7a5d7f3ecfae';
const ADVOCATE_ID = 'cfa26217-3766-4286-b259-af57a9e5181a';

const workerAToken = makeToken(WORKER_A_ID, 'worker', 'tariq.worker@fairgig.pk');
const workerBToken = makeToken(WORKER_B_ID, 'worker', 'usman.worker@fairgig.pk');
const advocateToken = makeToken(ADVOCATE_ID, 'advocate', 'advocate.pk@fairgig.pk');

let server: http.Server;

async function request(path: string, options: { method?: string; body?: any; token?: string } = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const json = await res.json();
    return { status: res.status, json, text: '' };
  } else {
    const text = await res.text();
    return { status: res.status, json: null, text };
  }
}

async function runTests() {
  console.log('===============================================================');
  console.log('FAIRGIG PHASE 3: CERTIFICATE SERVICE INTEGRATION TESTS (11-16)');
  console.log('===============================================================\n');

  let passed = 0;
  let certAId = '';
  let certANumber = '';
  let certAPubToken = '';

  try {
    // -------------------------------------------------------------
    // Test 11: Certificate includes verified earnings only
    // -------------------------------------------------------------
    console.log('[RUNNING] Test 11: Generate certificate with verified earnings only...');
    const genRes = await request('/api/v1/certificates/generate', {
      method: 'POST',
      token: workerAToken,
      body: {
        startDate: '2026-10-01',
        endDate: '2026-10-14',
        purpose: 'housing_rental',
        recipientName: 'Cascade Ridge Apartments Leasing Office',
      },
    });

    if (genRes.status !== 201) {
      throw new Error(`Test 11 Failed: Expected status 201, got ${genRes.status}: ${JSON.stringify(genRes.json)}`);
    }

    const cert = genRes.json;
    certAId = cert.id;
    certANumber = cert.certificateNumber;
    certAPubToken = cert.publicVerificationUrl.split('token=')[1];

    if (!cert.id || !cert.certificateNumber || cert.workerId !== WORKER_A_ID) {
      throw new Error(`Test 11 Failed: Invalid certificate structure ${JSON.stringify(cert)}`);
    }
    if (cert.totalGrossIncome <= 0 || cert.totalNetIncome <= 0 || cert.verifiedShiftsCount <= 0) {
      throw new Error(`Test 11 Failed: Certificate has zero verified earnings`);
    }
    console.log(`[TEST 11 PASS] Certificate ${cert.certificateNumber} generated: Gross PKR ${cert.totalGrossIncome}, Net PKR ${cert.totalNetIncome}, Verified Shifts: ${cert.verifiedShiftsCount}.`);
    passed++;

    // -------------------------------------------------------------
    // Test 12: Certificate excludes unverified earnings
    // -------------------------------------------------------------
    console.log('\n[RUNNING] Test 12: Ensure certificate excludes unverified earnings...');
    // Fetch all shifts in period from DB to verify verified-only arithmetic
    const dbShifts = await certDb.getWorkerShifts(WORKER_A_ID, '2026-10-01', '2026-10-14');
    const verifiedDbShifts = dbShifts.filter((s) => s.verification_status === 'verified');
    const unverifiedDbShifts = dbShifts.filter((s) => s.verification_status !== 'verified');

    const expectedGross = verifiedDbShifts.reduce((acc, s) => acc + s.gross_amount, 0);
    const expectedNet = verifiedDbShifts.reduce((acc, s) => acc + s.net_amount, 0);

    if (Math.abs(cert.totalGrossIncome - Math.round(expectedGross * 100) / 100) > 0.05) {
      throw new Error(`Test 12 Failed: Certificate gross ${cert.totalGrossIncome} does not match verified-only DB gross ${expectedGross}`);
    }
    if (Math.abs(cert.totalNetIncome - Math.round(expectedNet * 100) / 100) > 0.05) {
      throw new Error(`Test 12 Failed: Certificate net ${cert.totalNetIncome} does not match verified-only DB net ${expectedNet}`);
    }
    if (cert.unverifiedShiftsCount !== unverifiedDbShifts.length) {
      throw new Error(`Test 12 Failed: Expected unverified count ${unverifiedDbShifts.length}, got ${cert.unverifiedShiftsCount}`);
    }
    console.log(`[TEST 12 PASS] Verified-only isolation verified: unverified shifts (${cert.unverifiedShiftsCount}) excluded from financial totals.`);
    passed++;

    // -------------------------------------------------------------
    // Test 13: Worker cannot access another worker's certificate
    // -------------------------------------------------------------
    console.log('\n[RUNNING] Test 13: Worker ownership security check (403 Forbidden)...');
    // Worker B attempts to render Worker A's certificate
    const unauthorizedRes = await request(`/api/v1/certificates/${certAId}/render-html`, {
      method: 'GET',
      token: workerBToken,
    });

    if (unauthorizedRes.status !== 403) {
      throw new Error(`Test 13 Failed: Expected 403 Forbidden for cross-worker access, got ${unauthorizedRes.status}`);
    }

    // Worker A accesses own certificate -> 200 OK
    const authorizedRes = await request(`/api/v1/certificates/${certAId}/render-html`, {
      method: 'GET',
      token: workerAToken,
    });
    if (authorizedRes.status !== 200) {
      throw new Error(`Test 13 Failed: Owner should access own certificate, got ${authorizedRes.status}`);
    }

    // Advocate accesses certificate -> 200 OK
    const advocateRes = await request(`/api/v1/certificates/${certAId}/render-html`, {
      method: 'GET',
      token: advocateToken,
    });
    if (advocateRes.status !== 200) {
      throw new Error(`Test 13 Failed: Advocate should access certificate, got ${advocateRes.status}`);
    }
    console.log(`[TEST 13 PASS] Cross-worker certificate access prevented with HTTP 403 Forbidden.`);
    passed++;

    // -------------------------------------------------------------
    // Test 14: Printable HTML contains appropriate print CSS
    // -------------------------------------------------------------
    console.log('\n[RUNNING] Test 14: Validating print CSS and disclaimers in rendered HTML...');
    const html = authorizedRes.text;

    if (!html.includes('@media print')) {
      throw new Error(`Test 14 Failed: Rendered HTML missing '@media print' CSS rules`);
    }
    if (!html.includes('@page') || !html.includes('A4')) {
      throw new Error(`Test 14 Failed: Rendered HTML missing A4 @page CSS setup`);
    }
    if (!html.includes('no-print') || !html.includes('display: none !important')) {
      throw new Error(`Test 14 Failed: Missing print concealment rules for toolbar`);
    }
    if (!html.includes('Official Verification Disclaimer') || !html.includes('does NOT constitute a government-issued')) {
      throw new Error(`Test 14 Failed: Missing mandatory legal disclaimer`);
    }
    console.log(`[TEST 14 PASS] Rendered HTML contains proper A4 @media print CSS, hidden toolbars, and official disclaimer.`);
    passed++;

    // -------------------------------------------------------------
    // Test 15: Empty date range handled correctly
    // -------------------------------------------------------------
    console.log('\n[RUNNING] Test 15: Empty date range handled gracefully...');
    const emptyRes = await request('/api/v1/certificates/generate', {
      method: 'POST',
      token: workerAToken,
      body: {
        startDate: '2029-01-01',
        endDate: '2029-01-31',
        purpose: 'personal_record',
      },
    });

    if (emptyRes.status !== 201) {
      throw new Error(`Test 15 Failed: Expected 201 for empty date range, got ${emptyRes.status}`);
    }
    const emptyCert = emptyRes.json;
    if (emptyCert.totalGrossIncome !== 0 || emptyCert.totalNetIncome !== 0 || emptyCert.verifiedShiftsCount !== 0) {
      throw new Error(`Test 15 Failed: Empty range should yield 0 totals`);
    }
    console.log(`[TEST 15 PASS] Empty date range handled gracefully: 0 shifts, 0.00 gross/net without crashes.`);
    passed++;

    // -------------------------------------------------------------
    // Test 16: Certificate totals match DB & Public Verification
    // -------------------------------------------------------------
    console.log('\n[RUNNING] Test 16: Cryptographic signature & public verification...');
    const verifyRes = await request(
      `/api/v1/certificates/public-verify?certificateNumber=${certANumber}&token=${certAPubToken}`
    );

    if (verifyRes.status !== 200) {
      throw new Error(`Test 16 Failed: Expected 200, got ${verifyRes.status}`);
    }
    const verifyData = verifyRes.json;
    if (!verifyData.isValid || !verifyData.certificate) {
      throw new Error(`Test 16 Failed: Certificate failed cryptographic validation: ${JSON.stringify(verifyData)}`);
    }
    if (verifyData.certificate.totalNetIncome !== cert.totalNetIncome) {
      throw new Error(`Test 16 Failed: Net income mismatch in public verification`);
    }
    if (!verifyData.certificate.workerName.includes('*')) {
      throw new Error(`Test 16 Failed: Worker name was not masked for public privacy`);
    }
    console.log(`[TEST 16 PASS] Cryptographic signature validated against ledger. Privacy masking applied: ${verifyData.certificate.workerName}.`);
    passed++;

    console.log('\n===============================================================');
    console.log(`ALL 6 PHASE 3 CERTIFICATE TESTS PASSED (${passed}/6)`);
    console.log('===============================================================\n');
  } catch (err: any) {
    console.error(`\n[TEST SUITE FAILED] ${err.message}`);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

// Start ephemeral server and execute test suite
server = app.listen(TEST_PORT, () => {
  runTests();
});
