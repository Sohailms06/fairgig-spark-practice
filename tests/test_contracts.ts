/**
 * FairGig Contracts Validation Test
 * Validates that all Zod schemas parse and validate expected sample payloads.
 */

import {
  RegisterRequestSchema,
  CreateEarningRecordSchema,
  CsvImportRequestSchema,
  PresignedUploadRequestSchema,
  SubmitVerificationReviewSchema,
  AnalyzeAnomalyRequestSchema,
  CreateGrievanceRequestSchema,
  GenerateCertificateRequestSchema,
  WorkerAnalyticsSummarySchema,
  AdvocateAnalyticsOverviewSchema,
} from '../packages/contracts/src';

function runContractTests() {
  console.log('Testing FairGig Contract Schemas...\n');

  // 1. Worker Registration
  const regResult = RegisterRequestSchema.safeParse({
    email: 'worker.maria@example.com',
    password: 'Password123',
    fullName: 'Maria Santos',
    primaryPlatform: 'uber',
  });
  console.log('1. RegisterRequestSchema:', regResult.success ? 'PASS' : regResult.error);
  if (!regResult.success) throw new Error('RegisterRequestSchema failed');

  // 2. Earnings Record
  const earnResult = CreateEarningRecordSchema.safeParse({
    platform: 'uber',
    shiftDate: '2026-10-13',
    hoursWorked: 8.0,
    grossAmount: 210.5,
    netAmount: 168.4,
    deductions: 42.1,
    tipsAmount: 35.0,
    tripsCount: 14,
  });
  console.log('2. CreateEarningRecordSchema:', earnResult.success ? 'PASS' : earnResult.error);
  if (!earnResult.success) throw new Error('CreateEarningRecordSchema failed');

  // 3. CSV Import
  const csvResult = CsvImportRequestSchema.safeParse({
    csvContent: 'platform,shiftDate,hoursWorked,grossAmount,netAmount\nuber,2026-10-10,5.0,120,100',
    hasHeader: true,
  });
  console.log('3. CsvImportRequestSchema:', csvResult.success ? 'PASS' : csvResult.error);
  if (!csvResult.success) throw new Error('CsvImportRequestSchema failed');

  // 4. Presigned Upload
  const uploadResult = PresignedUploadRequestSchema.safeParse({
    earningId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    filename: 'statement.png',
    contentType: 'image/png',
    fileSizeBytes: 1048576,
  });
  console.log('4. PresignedUploadRequestSchema:', uploadResult.success ? 'PASS' : uploadResult.error);
  if (!uploadResult.success) throw new Error('PresignedUploadRequestSchema failed');

  // 5. Verification Review
  const reviewResult = SubmitVerificationReviewSchema.safeParse({
    earningId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    decision: 'approve',
    notes: 'Verified against pay stub statement.',
  });
  console.log('5. SubmitVerificationReviewSchema:', reviewResult.success ? 'PASS' : reviewResult.error);
  if (!reviewResult.success) throw new Error('SubmitVerificationReviewSchema failed');

  // 6. Anomaly Request
  const anomalyResult = AnalyzeAnomalyRequestSchema.safeParse({
    targetShift: {
      shiftDate: '2026-10-13',
      hoursWorked: 8,
      grossAmount: 160,
      netAmount: 88,
      deductions: 72,
    },
    historicalShifts: [],
    platform: 'uber',
  });
  console.log('6. AnalyzeAnomalyRequestSchema:', anomalyResult.success ? 'PASS' : anomalyResult.error);
  if (!anomalyResult.success) throw new Error('AnalyzeAnomalyRequestSchema failed');

  // 7. Grievance Request
  const grievanceResult = CreateGrievanceRequestSchema.safeParse({
    title: 'Unexplained $42 fee deducted from earnings',
    description: 'On October 13 shift, platform deducted $72 total including an unannounced fee.',
    category: 'unexplained_deduction',
    platform: 'uber',
    claimedLossAmount: 42,
  });
  console.log('7. CreateGrievanceRequestSchema:', grievanceResult.success ? 'PASS' : grievanceResult.error);
  if (!grievanceResult.success) throw new Error('CreateGrievanceRequestSchema failed');

  // 8. Certificate Request
  const certResult = GenerateCertificateRequestSchema.safeParse({
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    purpose: 'housing_rental',
    recipientName: 'Cascade Ridge Apartments',
  });
  console.log('8. GenerateCertificateRequestSchema:', certResult.success ? 'PASS' : certResult.error);
  if (!certResult.success) throw new Error('GenerateCertificateRequestSchema failed');

  console.log('\nALL CONTRACT SCHEMAS VALIDATED SUCCESSFULLY!');
}

runContractTests();
