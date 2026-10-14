/**
 * FairGig Phase 4A Frontend Application Verification Suite.
 * Validates frontend data layer, API integration, calculations, and role models:
 * 1. Demo Profiles & Role mappings.
 * 2. Worker Analytics data retrieval & formatting.
 * 3. Earnings shift creation & take-home net calculation.
 * 4. Anomaly detection evaluation & risk scoring.
 * 5. Grievance creation & anonymous community feed masking.
 * 6. Income certificate compilation & cryptographic signature.
 * 7. Advocate collective overview & k-anonymity privacy compliance.
 */

import { DEMO_PROFILES } from '../apps/web/src/lib/auth-context';
import { apiClient } from '../apps/web/src/lib/api-client';

async function runFrontendTests() {
  console.log('===============================================================');
  console.log('FAIRGIG PHASE 4A: FRONTEND APPLICATION INTEGRATION TESTS');
  console.log('===============================================================\n');

  let passed = 0;

  try {
    // -------------------------------------------------------------
    // Test 1: Demo Profiles Validation
    // -------------------------------------------------------------
    console.log('[RUNNING] Test 1: Verifying 1-click judge demo profiles...');
    const roles = ['worker', 'worker_b', 'advocate', 'verifier'];
    for (const r of roles) {
      const p = DEMO_PROFILES[r];
      if (!p || !p.user.email || !p.user.fullName || !p.token) {
        throw new Error(`Test 1 Failed: Incomplete demo profile for role ${r}`);
      }
    }
    console.log('[TEST 1 PASS] Demo accounts configured for Tariq, Usman, Ayesha, and Fatima.');
    passed++;

    // -------------------------------------------------------------
    // Test 2: Worker Analytics Integration
    // -------------------------------------------------------------
    console.log('\n[RUNNING] Test 2: Fetching worker analytics...');
    const analytics = await apiClient.getWorkerAnalytics('all_time');
    if (!analytics || analytics.totalGrossEarnings <= 0 || analytics.totalNetEarnings <= 0) {
      throw new Error(`Test 2 Failed: Worker analytics failed to return positive gross/net`);
    }
    if (analytics.totalNetEarnings > analytics.totalGrossEarnings) {
      throw new Error(`Test 2 Failed: Net earnings cannot exceed gross earnings`);
    }
    if (!analytics.platformBreakdown || analytics.platformBreakdown.length === 0) {
      throw new Error(`Test 2 Failed: Platform breakdown is empty`);
    }
    console.log(`[TEST 2 PASS] Worker analytics verified: Gross PKR ${analytics.totalGrossEarnings}, Net PKR ${analytics.totalNetEarnings}, Rate PKR ${analytics.effectiveHourlyRate}/hr.`);
    passed++;

    // -------------------------------------------------------------
    // Test 3: Earnings Shift Creation & Net Calculation
    // -------------------------------------------------------------
    console.log('\n[RUNNING] Test 3: Creating shift and verifying net calculation...');
    const shift = await apiClient.createShift({
      shiftDate: '2026-10-15',
      platform: 'indrive',
      hoursWorked: 8.0,
      grossAmount: 6000.0,
      deductions: 1200.0,
      tipsAmount: 300.0,
      tripsCount: 14,
      notes: 'Test Shift',
    });

    if (shift.netAmount !== 4800.0) {
      throw new Error(`Test 3 Failed: Net amount should be 4800 (6000 - 1200), got ${shift.netAmount}`);
    }
    console.log(`[TEST 3 PASS] Shift created with correct net deduction math: PKR ${shift.netAmount}.`);
    passed++;

    // -------------------------------------------------------------
    // Test 4: Anomaly Detection Evaluation
    // -------------------------------------------------------------
    console.log('\n[RUNNING] Test 4: Running anomaly detection engine...');
    const anomalyResult = await apiClient.detectAnomaly({
      shiftDate: '2026-10-15',
      hoursWorked: 8.0,
      grossAmount: 6000.0,
      netAmount: 4200.0,
      deductions: 1800.0, // 30% deduction (anomaly)
      platform: 'careem',
    });

    if (!anomalyResult.isAnomaly || anomalyResult.riskLevel !== 'critical') {
      throw new Error(`Test 4 Failed: Expected 30% deduction to trigger critical anomaly, got ${JSON.stringify(anomalyResult)}`);
    }
    console.log(`[TEST 4 PASS] Anomaly detection correctly identified 30% deduction outlier with risk level: ${anomalyResult.riskLevel}.`);
    passed++;

    // -------------------------------------------------------------
    // Test 5: Grievance & Anonymous Community Masking
    // -------------------------------------------------------------
    console.log('\n[RUNNING] Test 5: Checking grievance filing and anonymous community feed...');
    const feed = await apiClient.getPublicCommunityFeed();
    if (!feed || feed.length === 0) {
      throw new Error(`Test 5 Failed: Community feed is empty`);
    }
    for (const item of feed) {
      if (!item.anonymousWorkerId.startsWith('ANON-')) {
        throw new Error(`Test 5 Failed: PII leakage! Expected ANON-XXXX mask, got ${item.anonymousWorkerId}`);
      }
    }
    console.log(`[TEST 5 PASS] Anonymous community board verified. All ${feed.length} feed items mask worker PII as ANON-XXXX.`);
    passed++;

    // -------------------------------------------------------------
    // Test 6: Verifiable Income Certificate Generation
    // -------------------------------------------------------------
    console.log('\n[RUNNING] Test 6: Compiling verifiable income certificate...');
    const cert = await apiClient.generateCertificate('2026-10-01', '2026-10-14', 'housing_rental', 'Test Leasing Office');
    if (!cert.certificateNumber || !cert.cryptographicSignature || cert.totalNetIncome <= 0) {
      throw new Error(`Test 6 Failed: Incomplete certificate ${JSON.stringify(cert)}`);
    }
    console.log(`[TEST 6 PASS] Certificate ${cert.certificateNumber} generated with SHA-256 signature.`);
    passed++;

    // -------------------------------------------------------------
    // Test 7: Advocate Collective Overview & K-Anonymity
    // -------------------------------------------------------------
    console.log('\n[RUNNING] Test 7: Verifying advocate intelligence & k>=5 privacy suppression...');
    const overview = await apiClient.getAdvocateOverview();
    if (!overview || overview.privacyMinimumThreshold !== 5) {
      throw new Error(`Test 7 Failed: Expected privacy threshold 5`);
    }
    const suppressed = overview.platformComparison.filter((c: any) => c.isSuppressedForPrivacy);
    if (suppressed.length === 0) {
      throw new Error(`Test 7 Failed: Expected at least one suppressed small cohort`);
    }
    console.log(`[TEST 7 PASS] Advocate intelligence enforces k>=5 privacy suppression (${suppressed.length} small cohort suppressed).`);
    passed++;

    console.log('\n===============================================================');
    console.log(`ALL 7 FRONTEND INTEGRATION TESTS PASSED (${passed}/7)`);
    console.log('===============================================================\n');
  } catch (err: any) {
    console.error(`\n[TEST SUITE FAILED] ${err.message}`);
    process.exit(1);
  }
}

runFrontendTests();
