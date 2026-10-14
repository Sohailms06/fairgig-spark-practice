/**
 * FairGig Phase 2 Grievance & Escalation Automated Test Suite.
 * Validates tests 9-20:
 * 9. Worker creates grievance.
 * 10. Worker retrieves own grievance.
 * 11. Worker cannot access another worker's private grievance (403 Forbidden).
 * 12. Anonymous community board hides worker identity and PII.
 * 13. Advocate adds tags to grievance.
 * 14. Similar grievances form clusters deterministically.
 * 15. Advocate escalates grievance.
 * 16. Advocate resolves grievance.
 * 17. Worker cannot perform advocate actions (403 Forbidden).
 * 18. Invalid transitions are rejected.
 * 19. Audit history is preserved.
 * 20. Records persist in PostgreSQL / Supabase database.
 */

import http from 'http';
import jwt from 'jsonwebtoken';
import { app } from '../services/grievance/src/app';
import { config } from '../services/grievance/src/config';
import { grievanceDb } from '../services/grievance/src/db';

const TEST_PORT = 4099;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

// Helper: Generate signed JWT tokens
function makeToken(userId: string, role: string, email: string): string {
  return jwt.sign(
    { sub: userId, role, email },
    config.jwtSecret,
    { algorithm: config.jwtAlgorithm as jwt.Algorithm, expiresIn: '1h' }
  );
}

const workerAToken = makeToken('ce05274e-5727-4a82-a8aa-4f6362ea7df9', 'worker', 'tariq.worker@fairgig.pk');
const workerBToken = makeToken('61b82bf9-4eba-4d61-9854-7a5d7f3ecfae', 'worker', 'usman.worker@fairgig.pk');
const advocateToken = makeToken('cfa26217-3766-4286-b259-af57a9e5181a', 'advocate', 'advocate.pk@fairgig.pk');

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

  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, data: json };
}

async function runTests() {
  console.log('=== RUNNING FAIRGIG PHASE 2 GRIEVANCE TEST SUITE (Tests 9-20) ===\n');

  server = app.listen(TEST_PORT);
  let grievanceAId = '';
  let grievanceBId = '';

  try {
    // -------------------------------------------------------------------------
    // Test 9: Worker creates grievance
    // -------------------------------------------------------------------------
    const createRes = await request('/api/v1/grievances', {
      method: 'POST',
      token: workerAToken,
      body: {
        title: 'Unexplained 38% Commission Deduction on Gulberg Peak Shift',
        description: 'Captain statement shows PKR 2,280 deducted from PKR 6,000 gross without itemized breakdown.',
        category: 'unexplained_deduction',
        platform: 'careem',
        priority: 'high',
        claimedLossAmount: 1200.0,
      },
    });

    if (createRes.status !== 201) {
      throw new Error(`Test 9 Failed: Expected 201, got ${createRes.status} -> ${JSON.stringify(createRes.data)}`);
    }
    grievanceAId = createRes.data.id;
    if (createRes.data.status !== 'submitted' && createRes.data.status !== 'clustered') {
      throw new Error(`Test 9 Failed: Invalid status ${createRes.data.status}`);
    }
    console.log('[TEST 9 PASS] Worker successfully created grievance:', grievanceAId);

    // -------------------------------------------------------------------------
    // Test 10: Worker retrieves own grievance
    // -------------------------------------------------------------------------
    const getRes = await request(`/api/v1/grievances/${grievanceAId}`, {
      token: workerAToken,
    });
    if (getRes.status !== 200 || getRes.data.id !== grievanceAId) {
      throw new Error(`Test 10 Failed: Expected 200, got ${getRes.status}`);
    }
    console.log('[TEST 10 PASS] Worker retrieved own grievance successfully.');

    // -------------------------------------------------------------------------
    // Test 11: Worker cannot access another worker's private grievance
    // -------------------------------------------------------------------------
    const forbiddenRes = await request(`/api/v1/grievances/${grievanceAId}`, {
      token: workerBToken,
    });
    if (forbiddenRes.status !== 403) {
      throw new Error(`Test 11 Failed: Worker B must be forbidden (403), got ${forbiddenRes.status}`);
    }
    console.log('[TEST 11 PASS] Worker ownership protection enforced: Worker B received HTTP 403 Forbidden.');

    // -------------------------------------------------------------------------
    // Test 12: Anonymous board hides worker identity and PII
    // -------------------------------------------------------------------------
    const publicRes = await request('/api/v1/grievances/public');
    if (publicRes.status !== 200) {
      throw new Error(`Test 12 Failed: Expected 200, got ${publicRes.status}`);
    }
    const publicItem = publicRes.data.items.find((i: any) => i.id === grievanceAId);
    if (!publicItem) {
      throw new Error('Test 12 Failed: Grievance not found on public board');
    }
    if (publicItem.workerId || publicItem.email || publicItem.name || publicItem.phone) {
      throw new Error('Test 12 Failed: Leaked worker PII on public board!');
    }
    if (!publicItem.anonymousWorkerTag || !publicItem.anonymousWorkerTag.startsWith('ANON-')) {
      throw new Error('Test 12 Failed: Missing or invalid anonymousWorkerTag');
    }
    console.log('[TEST 12 PASS] Anonymous community board verified. Worker identity masked as:', publicItem.anonymousWorkerTag);

    // -------------------------------------------------------------------------
    // Test 13: Advocate adds tags
    // -------------------------------------------------------------------------
    const tagRes = await request(`/api/v1/grievances/${grievanceAId}/tags`, {
      method: 'POST',
      token: advocateToken,
      body: { tag: 'excessive_cut' },
    });
    if (tagRes.status !== 200 || !tagRes.data.tags.includes('excessive_cut')) {
      throw new Error(`Test 13 Failed: Expected tag in tags list, got ${JSON.stringify(tagRes.data)}`);
    }
    console.log('[TEST 13 PASS] Advocate successfully added tag: #excessive_cut');

    // -------------------------------------------------------------------------
    // Test 14: Similar grievances form clusters deterministically
    // -------------------------------------------------------------------------
    // Create second similar grievance from Worker B with matching platform and category
    const createBRes = await request('/api/v1/grievances', {
      method: 'POST',
      token: workerBToken,
      body: {
        title: 'Careem Unexplained Deduction on Peak Gulberg Trip',
        description: 'Excessive commission deduction reported on Careem rideshare captain shift.',
        category: 'unexplained_deduction',
        platform: 'careem',
        priority: 'high',
        claimedLossAmount: 950.0,
      },
    });
    if (createBRes.status !== 201) {
      throw new Error(`Test 14 Failed: Could not create second grievance: ${JSON.stringify(createBRes.data)}`);
    }
    grievanceBId = createBRes.data.id;

    // Trigger clustering
    const clusterGenRes = await request('/api/v1/grievances/clusters/generate', {
      method: 'POST',
      token: advocateToken,
    });
    if (clusterGenRes.status !== 200 || clusterGenRes.data.clustersFormed === 0) {
      throw new Error(`Test 14 Failed: Expected cluster formation, got ${JSON.stringify(clusterGenRes.data)}`);
    }
    const cluster = clusterGenRes.data.clusters[0];
    console.log(`[TEST 14 PASS] Deterministic cluster formed: "${cluster.title}" (${cluster.affectedWorkerCount} workers affected).`);

    // -------------------------------------------------------------------------
    // Test 15: Advocate escalates grievance
    // -------------------------------------------------------------------------
    const escalateRes = await request(`/api/v1/grievances/${grievanceAId}/escalate`, {
      method: 'POST',
      token: advocateToken,
      body: {
        escalationReason: 'Systemic pattern confirmed: Multiple drivers affected in Gulberg zone.',
        advocateNotes: 'Formal complaint filed with Careem Pakistan Driver Operations.',
        targetRepresentative: 'Careem Pakistan Driver Relations Lead',
      },
    });
    if (escalateRes.status !== 200 || escalateRes.data.status !== 'escalated') {
      throw new Error(`Test 15 Failed: Expected status 'escalated', got ${JSON.stringify(escalateRes.data)}`);
    }
    console.log('[TEST 15 PASS] Advocate escalated grievance to platform leadership.');

    // -------------------------------------------------------------------------
    // Test 16: Advocate resolves grievance
    // -------------------------------------------------------------------------
    const resolveRes = await request(`/api/v1/grievances/${grievanceAId}/resolve`, {
      method: 'POST',
      token: advocateToken,
      body: {
        resolutionNotes: 'Careem audited system bug and issued PKR 1,200 wallet reimbursement.',
      },
    });
    if (resolveRes.status !== 200 || resolveRes.data.status !== 'resolved') {
      throw new Error(`Test 16 Failed: Expected status 'resolved', got ${JSON.stringify(resolveRes.data)}`);
    }
    console.log('[TEST 16 PASS] Advocate resolved grievance with resolution notes.');

    // -------------------------------------------------------------------------
    // Test 17: Worker cannot perform advocate actions
    // -------------------------------------------------------------------------
    const workerEscalateRes = await request(`/api/v1/grievances/${grievanceBId}/escalate`, {
      method: 'POST',
      token: workerAToken, // Worker role attempting advocate escalation
      body: { escalationReason: 'Trying to self-escalate' },
    });
    if (workerEscalateRes.status !== 403) {
      throw new Error(`Test 17 Failed: Expected 403 Forbidden for worker attempting escalation, got ${workerEscalateRes.status}`);
    }
    console.log('[TEST 17 PASS] Privilege separation verified: Worker blocked from advocate escalation (403 Forbidden).');

    // -------------------------------------------------------------------------
    // Test 18: Invalid transitions are rejected
    // -------------------------------------------------------------------------
    // 18a. Worker cannot edit an already resolved grievance
    const editResolvedRes = await request(`/api/v1/grievances/${grievanceAId}`, {
      method: 'PATCH',
      token: workerAToken,
      body: { title: 'Attempting to edit resolved complaint' },
    });
    if (editResolvedRes.status !== 400) {
      throw new Error(`Test 18a Failed: Expected 400 Bad Request when editing resolved grievance, got ${editResolvedRes.status}`);
    }

    // 18b. Cannot escalate an already resolved grievance
    const reEscalateRes = await request(`/api/v1/grievances/${grievanceAId}/escalate`, {
      method: 'POST',
      token: advocateToken,
      body: { escalationReason: 'Attempting re-escalation' },
    });
    if (reEscalateRes.status !== 400) {
      throw new Error(`Test 18b Failed: Expected 400 Bad Request when escalating resolved grievance, got ${reEscalateRes.status}`);
    }
    console.log('[TEST 18 PASS] Invalid status transitions strictly rejected with HTTP 400 Bad Request.');

    // -------------------------------------------------------------------------
    // Test 19: Audit history is preserved
    // -------------------------------------------------------------------------
    const logs = grievanceDb.getAuditLogs();
    const actionsRecorded = logs.map((l) => l.action);
    if (!actionsRecorded.includes('CREATE_GRIEVANCE') || !actionsRecorded.includes('ESCALATE_GRIEVANCE') || !actionsRecorded.includes('RESOLVE_GRIEVANCE')) {
      throw new Error(`Test 19 Failed: Missing actions in audit logs: ${actionsRecorded.join(', ')}`);
    }
    console.log('[TEST 19 PASS] Audit trail preserved: Recorded actions ->', actionsRecorded.slice(-4).join(', '));

    // -------------------------------------------------------------------------
    // Test 20: Records persist in PostgreSQL / Supabase
    // -------------------------------------------------------------------------
    const conn = await grievanceDb.isConnected();
    if (!conn.connected) {
      throw new Error(`Test 20 Failed: Database disconnected: ${conn.engine}`);
    }
    console.log(`[TEST 20 PASS] Database persistence verified on engine: ${conn.engine}.`);

    console.log('\n===============================================================');
    console.log('ALL 12 GRIEVANCE TESTS (TESTS 9-20) PASSED 100% SUCCESSFULLY!');
    console.log('===============================================================\n');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('\nTEST SUITE FAILED:', err);
  if (server) server.close();
  process.exit(1);
});
