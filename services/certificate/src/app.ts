import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { GenerateCertificateRequestSchema } from '@fairgig/contracts';
import { config } from './config';
import { AuthenticatedRequest, requireAuth, requireRole } from './auth';
import { certDb, IncomeCertificateRecord } from './db';
import { renderCertificateHtml } from './renderer';

export const app = express();

app.use(express.json());

// CORS Configuration
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

// Helper: Mask worker name for public privacy
function maskName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts
    .map((p) => {
      if (p.length <= 2) return p;
      return p[0] + '*'.repeat(p.length - 2) + p[p.length - 1];
    })
    .join(' ');
}

// Generate unique certificate reference number
function generateCertNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `FG-2026-${rand}`;
}

// ========================================================
// 1. Generate Verifiable Income Certificate
// ========================================================
app.post(
  '/api/v1/certificates/generate',
  requireAuth,
  requireRole(['worker', 'advocate', 'admin']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const parseResult = GenerateCertificateRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(422).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Input payload failed validation rules.',
            details: parseResult.error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
              code: e.code,
            })),
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const { startDate, endDate, purpose, recipientName, includePlatforms } = parseResult.data;

      if (new Date(endDate) < new Date(startDate)) {
        res.status(422).json({
          success: false,
          error: {
            code: 'INVALID_DATE_RANGE',
            message: 'endDate must be greater than or equal to startDate.',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Determine worker id: worker generates for self; advocate/admin can pass body.workerId
      const targetWorkerId =
        req.user!.role === 'worker' ? req.user!.id : req.body.workerId || req.user!.id;

      // 1. Fetch profile
      const profile = await certDb.getWorkerProfile(targetWorkerId);

      // 2. Fetch all shifts in period
      const allShifts = await certDb.getWorkerShifts(targetWorkerId, startDate, endDate, includePlatforms);

      // 3. Strictly filter ONLY verified earnings
      const verifiedShifts = allShifts.filter((s) => s.verification_status === 'verified');
      const unverifiedShifts = allShifts.filter((s) => s.verification_status !== 'verified');

      // 4. Calculate verified totals with round-to-2 decimals
      let totalGross = 0;
      let totalNet = 0;
      let totalDeductions = 0;
      let totalHours = 0;

      const platformMap = new Map<
        string,
        {
          platform: string;
          shiftsCount: number;
          hoursWorked: number;
          grossAmount: number;
          deductions: number;
          netAmount: number;
        }
      >();

      for (const s of verifiedShifts) {
        totalGross += s.gross_amount;
        totalNet += s.net_amount;
        totalDeductions += s.deductions;
        totalHours += s.hours_worked;

        const plat = s.platform || 'other';
        const p = platformMap.get(plat) || {
          platform: plat,
          shiftsCount: 0,
          hoursWorked: 0,
          grossAmount: 0,
          deductions: 0,
          netAmount: 0,
        };
        p.shiftsCount += 1;
        p.hoursWorked += s.hours_worked;
        p.grossAmount += s.gross_amount;
        p.deductions += s.deductions;
        p.netAmount += s.net_amount;
        platformMap.set(plat, p);
      }

      totalGross = Math.round(totalGross * 100) / 100;
      totalNet = Math.round(totalNet * 100) / 100;
      totalDeductions = Math.round(totalDeductions * 100) / 100;
      totalHours = Math.round(totalHours * 100) / 100;

      // Compute verification percentage
      const totalShiftsCount = verifiedShifts.length + unverifiedShifts.length;
      const verificationPercentage =
        totalShiftsCount > 0
          ? Math.round((verifiedShifts.length / totalShiftsCount) * 1000) / 10
          : 100.0;

      // Certificate ID & References
      const certId = crypto.randomUUID();
      const certNumber = generateCertNumber();
      const pubToken = 'pub_tok_' + crypto.randomBytes(8).toString('hex');
      const issuedAt = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 days validity

      // 5. Compute cryptographic SHA-256 signature hash of canonical payload
      const canonicalString = `${certNumber}|${targetWorkerId}|${totalNet.toFixed(2)}|${startDate}|${endDate}|${pubToken}`;
      const signatureHash = crypto
        .createHmac('sha256', config.jwtSecret)
        .update(canonicalString)
        .digest('hex');

      const certRecord: IncomeCertificateRecord = {
        id: certId,
        certificateNumber: certNumber,
        workerId: targetWorkerId,
        workerName: profile.fullName,
        purpose,
        recipientName: recipientName || null,
        periodStartDate: startDate,
        periodEndDate: endDate,
        totalGrossIncome: totalGross,
        totalNetIncome: totalNet,
        totalDeductions: totalDeductions,
        totalHoursWorked: totalHours,
        averageMonthlyIncome: totalNet,
        verifiedShiftsCount: verifiedShifts.length,
        unverifiedShiftsCount: unverifiedShifts.length,
        verificationPercentage,
        cryptographicSignature: signatureHash,
        publicVerificationUrl: `${config.frontendUrl}/verify/${certNumber}?token=${pubToken}`,
        publicVerificationToken: pubToken,
        issuedAt,
        expiresAt,
        platformBreakdown: Array.from(platformMap.values()),
      };

      // 6. Save in database ledger
      await certDb.saveCertificate(certRecord);

      res.status(201).json({
        id: certRecord.id,
        certificateNumber: certRecord.certificateNumber,
        workerId: certRecord.workerId,
        workerName: certRecord.workerName,
        purpose: certRecord.purpose,
        recipientName: certRecord.recipientName,
        periodStartDate: certRecord.periodStartDate,
        periodEndDate: certRecord.periodEndDate,
        totalGrossIncome: certRecord.totalGrossIncome,
        totalNetIncome: certRecord.totalNetIncome,
        totalDeductions: certRecord.totalDeductions,
        totalHoursWorked: certRecord.totalHoursWorked,
        averageMonthlyIncome: certRecord.averageMonthlyIncome,
        verifiedShiftsCount: certRecord.verifiedShiftsCount,
        unverifiedShiftsCount: certRecord.unverifiedShiftsCount,
        verificationPercentage: certRecord.verificationPercentage,
        cryptographicSignature: certRecord.cryptographicSignature,
        publicVerificationUrl: certRecord.publicVerificationUrl,
        issuedAt: certRecord.issuedAt,
        expiresAt: certRecord.expiresAt,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: err.message || 'Failed to generate income certificate',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

// ========================================================
// 2. Render Printable HTML Certificate
// ========================================================
app.get(
  ['/api/v1/certificates/:id/render-html', '/api/v1/certificates/print/:id'],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const certId = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
      const cert = await certDb.getCertificateById(certId);

      if (!cert) {
        res.status(404).send('<h1>404 - Income Certificate Not Found</h1>');
        return;
      }

      // Check access: Bearer token or public verification token query param
      const authHeader = req.headers.authorization;
      const queryToken = req.query.token as string | undefined;

      let isAuthorized = false;

      if (queryToken && queryToken === cert.publicVerificationToken) {
        isAuthorized = true;
      } else if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const decoded = (await require('jsonwebtoken').verify(
            authHeader.split(' ')[1],
            config.jwtSecret
          )) as any;
          if (decoded.role === 'advocate' || decoded.role === 'admin' || decoded.sub === cert.workerId) {
            isAuthorized = true;
          }
        } catch {
          // Token verification failed
        }
      }

      if (!isAuthorized) {
        res.status(403).send('<h1>403 - Forbidden: You do not have permission to view this certificate</h1>');
        return;
      }

      const html = renderCertificateHtml(cert);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (err: any) {
      res.status(500).send(`<h1>500 - Error: ${err.message}</h1>`);
    }
  }
);

// ========================================================
// 3. Public Verification Endpoint (Landlords, Banks, Consulates)
// ========================================================
app.get('/api/v1/certificates/public-verify', async (req: Request, res: Response): Promise<void> => {
  const certNumber = req.query.certificateNumber as string | undefined;
  const token = req.query.token as string | undefined;

  if (!certNumber || !token) {
    res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_PARAMETERS',
        message: 'certificateNumber and token query parameters are required.',
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  const cert = await certDb.getCertificateByNumberAndToken(certNumber, token);
  if (!cert) {
    res.status(200).json({
      isValid: false,
      certificate: null,
      message: 'Certificate not found or verification token is invalid.',
      verifiedAt: new Date().toISOString(),
    });
    return;
  }

  // Re-verify HMAC cryptographic signature
  const canonicalString = `${cert.certificateNumber}|${cert.workerId}|${cert.totalNetIncome.toFixed(2)}|${cert.periodStartDate}|${cert.periodEndDate}|${cert.publicVerificationToken}`;
  const expectedHash = crypto
    .createHmac('sha256', config.jwtSecret)
    .update(canonicalString)
    .digest('hex');

  const isSigValid = expectedHash === cert.cryptographicSignature;

  res.status(200).json({
    isValid: isSigValid,
    certificate: {
      certificateNumber: cert.certificateNumber,
      workerName: maskName(cert.workerName),
      purpose: cert.purpose,
      periodStartDate: cert.periodStartDate,
      periodEndDate: cert.periodEndDate,
      totalNetIncome: cert.totalNetIncome,
      totalHoursWorked: cert.totalHoursWorked,
      verificationPercentage: cert.verificationPercentage,
      cryptographicSignature: cert.cryptographicSignature,
      issuedAt: cert.issuedAt,
      expiresAt: cert.expiresAt,
    },
    message: isSigValid
      ? 'Certificate signature verified against FairGig PostgreSQL cryptographic ledger.'
      : 'Tamper warning: Certificate cryptographic signature mismatch.',
    verifiedAt: new Date().toISOString(),
  });
});

// ========================================================
// 4. System Probes
// ========================================================
app.get(['/health', '/api/v1/health'], (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: config.serviceName,
    version: config.version,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get(['/ready', '/api/v1/ready'], (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ready',
    service: config.serviceName,
    database: config.supabaseUrl ? 'supabase-cloud' : 'in-memory',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    service: 'FairGig Income Certificate Service',
    health: '/health',
    ready: '/ready',
    docs: '/docs',
  });
});
