import { config } from './config';

export interface ShiftRecord {
  id: string;
  worker_id: string;
  platform_id?: string;
  platform?: string;
  shift_date: string;
  hours_worked: number;
  gross_amount: number;
  net_amount: number;
  deductions: number;
  tips_amount?: number;
  verification_status: string;
  notes?: string;
}

export interface IncomeCertificateRecord {
  id: string;
  certificateNumber: string;
  workerId: string;
  workerName: string;
  purpose: string;
  recipientName?: string | null;
  periodStartDate: string;
  periodEndDate: string;
  totalGrossIncome: number;
  totalNetIncome: number;
  totalDeductions: number;
  totalHoursWorked: number;
  averageMonthlyIncome: number;
  verifiedShiftsCount: number;
  unverifiedShiftsCount: number;
  verificationPercentage: number;
  cryptographicSignature: string;
  publicVerificationUrl: string;
  publicVerificationToken: string;
  issuedAt: string;
  expiresAt: string;
  platformBreakdown?: Array<{
    platform: string;
    shiftsCount: number;
    hoursWorked: number;
    grossAmount: number;
    deductions: number;
    netAmount: number;
  }>;
}

export const PLATFORM_SLUGS: Record<string, string> = {
  '10000000-0000-0000-0000-000000000001': 'bykea',
  '10000000-0000-0000-0000-000000000002': 'foodpanda',
  '10000000-0000-0000-0000-000000000003': 'indrive',
  '10000000-0000-0000-0000-000000000004': 'careem',
  '10000000-0000-0000-0000-000000000005': 'yango',
  '10000000-0000-0000-0000-000000000006': 'cheetay',
  '10000000-0000-0000-0000-000000000007': 'other',
};

// In-memory fallback ledger
class MemoryCertStore {
  certificates = new Map<string, IncomeCertificateRecord>();
  byNumber = new Map<string, IncomeCertificateRecord>();
}

const memoryStore = new MemoryCertStore();

async function supabaseFetch(method: string, path: string, body?: any): Promise<any> {
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    return null;
  }
  const url = `${config.supabaseUrl.replace(/\/+$/, '')}${path}`;
  const headers: Record<string, string> = {
    apikey: config.supabaseServiceRoleKey,
    Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
    'Content-Type': 'application/json',
  };
  if (method === 'POST') {
    headers['Prefer'] = 'return=representation';
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      return null;
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export class CertificateDatabaseManager {
  async getWorkerProfile(workerId: string): Promise<{ id: string; fullName: string; email: string }> {
    const res = await supabaseFetch('GET', `/rest/v1/profiles?id=eq.${workerId}&select=*`);
    if (res && res.length > 0) {
      return {
        id: res[0].id,
        fullName: res[0].full_name || 'Tariq Mehmood',
        email: res[0].email || '',
      };
    }
    return {
      id: workerId,
      fullName: 'Tariq Mehmood',
      email: 'tariq.worker@fairgig.pk',
    };
  }

  async getWorkerShifts(
    workerId: string,
    startDate: string,
    endDate: string,
    includePlatforms?: string[]
  ): Promise<ShiftRecord[]> {
    let path = `/rest/v1/earnings_shifts?worker_id=eq.${workerId}&shift_date=gte.${startDate}&shift_date=lte.${endDate}&select=*`;
    const res = await supabaseFetch('GET', path);
    let shifts: ShiftRecord[] = [];

    if (res && Array.isArray(res)) {
      shifts = res.map((s: any) => {
        const platSlug = PLATFORM_SLUGS[s.platform_id] || s.platform || 'other';
        return {
          id: s.id,
          worker_id: s.worker_id,
          platform_id: s.platform_id,
          platform: platSlug,
          shift_date: s.shift_date,
          hours_worked: Number(s.hours_worked || 0),
          gross_amount: Number(s.gross_amount || 0),
          net_amount: Number(s.net_amount || 0),
          deductions: Number(s.deductions || 0),
          tips_amount: Number(s.tips_amount || 0),
          verification_status: s.verification_status,
          notes: s.notes,
        };
      });
    }

    // Filter by includePlatforms if specified
    if (includePlatforms && includePlatforms.length > 0) {
      shifts = shifts.filter((s) => includePlatforms.includes(s.platform || 'other'));
    }

    return shifts;
  }

  async saveCertificate(cert: IncomeCertificateRecord): Promise<void> {
    memoryStore.certificates.set(cert.id, cert);
    memoryStore.byNumber.set(cert.certificateNumber, cert);

    // Save to Supabase PostgreSQL table income_certificates
    const payload = {
      id: cert.id,
      certificate_number: cert.certificateNumber,
      worker_id: cert.workerId,
      purpose: cert.purpose,
      recipient_name: cert.recipientName || null,
      period_start_date: cert.periodStartDate,
      period_end_date: cert.periodEndDate,
      total_gross_income: cert.totalGrossIncome,
      total_net_income: cert.totalNetIncome,
      total_deductions: cert.totalDeductions,
      total_hours_worked: cert.totalHoursWorked,
      verified_shifts_count: cert.verifiedShiftsCount,
      unverified_shifts_count: cert.unverifiedShiftsCount,
      verification_percentage: cert.verificationPercentage,
      signature_hash: cert.cryptographicSignature,
      public_verification_token: cert.publicVerificationToken,
      issued_at: cert.issuedAt,
      expires_at: cert.expiresAt,
    };

    await supabaseFetch('POST', '/rest/v1/income_certificates', payload);
  }

  async getCertificateById(id: string): Promise<IncomeCertificateRecord | null> {
    if (memoryStore.certificates.has(id)) {
      return memoryStore.certificates.get(id)!;
    }

    const res = await supabaseFetch('GET', `/rest/v1/income_certificates?id=eq.${id}&select=*,profiles(full_name)`);
    if (res && res.length > 0) {
      const row = res[0];
      const cert: IncomeCertificateRecord = {
        id: row.id,
        certificateNumber: row.certificate_number,
        workerId: row.worker_id,
        workerName: row.profiles?.full_name || 'Worker',
        purpose: row.purpose,
        recipientName: row.recipient_name,
        periodStartDate: row.period_start_date,
        periodEndDate: row.period_end_date,
        totalGrossIncome: Number(row.total_gross_income),
        totalNetIncome: Number(row.total_net_income),
        totalDeductions: Number(row.total_deductions),
        totalHoursWorked: Number(row.total_hours_worked),
        averageMonthlyIncome: Number(row.total_net_income),
        verifiedShiftsCount: row.verified_shifts_count,
        unverifiedShiftsCount: row.unverified_shifts_count,
        verificationPercentage: Number(row.verification_percentage),
        cryptographicSignature: row.signature_hash,
        publicVerificationToken: row.public_verification_token,
        publicVerificationUrl: `${config.frontendUrl}/verify/${row.certificate_number}?token=${row.public_verification_token}`,
        issuedAt: row.issued_at,
        expiresAt: row.expires_at,
      };
      memoryStore.certificates.set(cert.id, cert);
      memoryStore.byNumber.set(cert.certificateNumber, cert);
      return cert;
    }

    return null;
  }

  async getCertificateByNumberAndToken(
    certNumber: string,
    token: string
  ): Promise<IncomeCertificateRecord | null> {
    const memoryMatch = memoryStore.byNumber.get(certNumber);
    if (memoryMatch && memoryMatch.publicVerificationToken === token) {
      return memoryMatch;
    }

    const res = await supabaseFetch(
      'GET',
      `/rest/v1/income_certificates?certificate_number=eq.${certNumber}&public_verification_token=eq.${token}&select=*,profiles(full_name)`
    );
    if (res && res.length > 0) {
      const row = res[0];
      return {
        id: row.id,
        certificateNumber: row.certificate_number,
        workerId: row.worker_id,
        workerName: row.profiles?.full_name || 'Worker',
        purpose: row.purpose,
        recipientName: row.recipient_name,
        periodStartDate: row.period_start_date,
        periodEndDate: row.period_end_date,
        totalGrossIncome: Number(row.total_gross_income),
        totalNetIncome: Number(row.total_net_income),
        totalDeductions: Number(row.total_deductions),
        totalHoursWorked: Number(row.total_hours_worked),
        averageMonthlyIncome: Number(row.total_net_income),
        verifiedShiftsCount: row.verified_shifts_count,
        unverifiedShiftsCount: row.unverified_shifts_count,
        verificationPercentage: Number(row.verification_percentage),
        cryptographicSignature: row.signature_hash,
        publicVerificationToken: row.public_verification_token,
        publicVerificationUrl: `${config.frontendUrl}/verify/${row.certificate_number}?token=${row.public_verification_token}`,
        issuedAt: row.issued_at,
        expiresAt: row.expires_at,
      };
    }

    return null;
  }
}

export const certDb = new CertificateDatabaseManager();
