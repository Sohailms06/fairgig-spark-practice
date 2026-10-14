import { IncomeCertificateRecord } from './db';

function formatCurrency(amount: number): string {
  return 'PKR ' + amount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return isoStr;
  }
}

export function renderCertificateHtml(cert: IncomeCertificateRecord): string {
  const effectiveHourlyRate =
    cert.totalHoursWorked > 0 ? (cert.totalNetIncome / cert.totalHoursWorked).toFixed(2) : '0.00';

  const breakdownRows = (cert.platformBreakdown || [])
    .map((p) => {
      const rate = p.hoursWorked > 0 ? (p.netAmount / p.hoursWorked).toFixed(2) : '0.00';
      const dedPct = p.grossAmount > 0 ? ((p.deductions / p.grossAmount) * 100).toFixed(1) : '0.0';
      return `
        <tr>
          <td style="font-weight: 600; text-transform: capitalize;">${p.platform}</td>
          <td style="text-align: center;">${p.shiftsCount}</td>
          <td style="text-align: right;">${p.hoursWorked.toFixed(1)} hrs</td>
          <td style="text-align: right;">${formatCurrency(p.grossAmount)}</td>
          <td style="text-align: right; color: #b91c1c;">-${formatCurrency(p.deductions)} (${dedPct}%)</td>
          <td style="text-align: right; font-weight: 600;">${formatCurrency(p.netAmount)}</td>
          <td style="text-align: right;">PKR ${rate}/hr</td>
        </tr>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FairGig Income Certificate - ${cert.certificateNumber}</title>
  <style>
    /* Reset & Typography */
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background-color: #f8fafc;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }

    /* Screen Action Bar (hidden in print) */
    .screen-toolbar {
      position: sticky;
      top: 0;
      background: #0f172a;
      color: #ffffff;
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.15);
      z-index: 1000;
    }
    .screen-toolbar h1 {
      font-size: 15px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .toolbar-actions {
      display: flex;
      gap: 12px;
    }
    .btn {
      padding: 8px 18px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-primary {
      background: #2563eb;
      color: #ffffff;
    }
    .btn-primary:hover {
      background: #1d4ed8;
    }
    .btn-secondary {
      background: #334155;
      color: #ffffff;
    }
    .btn-secondary:hover {
      background: #475569;
    }

    /* Document Sheet (A4 Dimensions) */
    .sheet-wrapper {
      padding: 32px 16px;
      display: flex;
      justify-content: center;
    }
    .certificate-sheet {
      width: 210mm;
      min-height: 297mm;
      background: #ffffff;
      padding: 20mm;
      box-shadow: 0 4px 25px rgba(0,0,0,0.08);
      position: relative;
      border-top: 6px solid #2563eb;
    }

    /* Document Header */
    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .brand-subtitle {
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 2px;
    }
    .cert-meta-badge {
      text-align: right;
    }
    .cert-badge {
      display: inline-block;
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 4px 10px;
      border-radius: 9999px;
      margin-bottom: 6px;
    }
    .cert-number {
      font-family: monospace;
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
    }

    /* Worker & Request Information Grid */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
    }
    .info-item {
      display: flex;
      flex-direction: column;
    }
    .info-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      font-weight: 600;
      margin-bottom: 2px;
    }
    .info-value {
      font-size: 14px;
      color: #0f172a;
      font-weight: 600;
    }

    /* Financial Stat Cards */
    .stats-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 28px;
    }
    .stat-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px;
      background: #ffffff;
      text-align: center;
    }
    .stat-card.highlight {
      background: #f0fdf4;
      border-color: #bbf7d0;
    }
    .stat-label {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 600;
      color: #64748b;
      margin-bottom: 6px;
    }
    .stat-value {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
    }
    .stat-card.highlight .stat-value {
      color: #15803d;
    }
    .stat-subtext {
      font-size: 10px;
      color: #64748b;
      margin-top: 4px;
    }

    /* Tables */
    .section-title {
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #334155;
      margin-bottom: 10px;
    }
    .table-container {
      width: 100%;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 28px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    th {
      background: #f1f5f9;
      color: #475569;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.5px;
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }
    tr:last-child td {
      border-bottom: none;
    }

    /* Verification & Ledger Section */
    .verification-box {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 14px 16px;
      background: #f8fafc;
      margin-bottom: 24px;
    }
    .v-row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      margin-bottom: 6px;
    }
    .v-row:last-child {
      margin-bottom: 0;
    }
    .v-label {
      color: #64748b;
      font-weight: 600;
    }
    .v-hash {
      font-family: monospace;
      color: #0f172a;
      word-break: break-all;
    }

    /* Disclaimer Box */
    .disclaimer-box {
      border-left: 4px solid #f59e0b;
      background: #fffbeb;
      padding: 12px 16px;
      border-radius: 0 6px 6px 0;
      font-size: 11px;
      color: #92400e;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .disclaimer-title {
      font-weight: 700;
      text-transform: uppercase;
      margin-bottom: 4px;
      font-size: 11px;
    }

    /* Signatures / Stamp */
    .doc-footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      font-size: 11px;
      color: #64748b;
    }

    /* PRINT STYLES - CRITICAL REQUIREMENT */
    @media print {
      @page {
        size: A4 portrait;
        margin: 15mm 20mm;
      }
      body {
        background: #ffffff !important;
        color: #000000 !important;
      }
      .screen-toolbar, .no-print {
        display: none !important;
      }
      .sheet-wrapper {
        padding: 0 !important;
      }
      .certificate-sheet {
        width: 100% !important;
        min-height: auto !important;
        padding: 0 !important;
        box-shadow: none !important;
        border-top: 4px solid #000000 !important;
      }
      .stat-card, .table-container, .verification-box, .disclaimer-box {
        page-break-inside: avoid;
      }
      a {
        text-decoration: none;
        color: inherit;
      }
    }
  </style>
</head>
<body>

  <!-- Screen Toolbar -->
  <div class="screen-toolbar no-print">
    <div>
      <h1>FairGig Income Certificate #${cert.certificateNumber}</h1>
    </div>
    <div class="toolbar-actions">
      <button class="btn btn-secondary" onclick="navigator.clipboard.writeText('${cert.publicVerificationUrl}').then(() => alert('Verification Link copied to clipboard!'))">
        Copy Verification Link
      </button>
      <button class="btn btn-primary" onclick="window.print()">
        Print / Save PDF
      </button>
    </div>
  </div>

  <!-- Document Sheet -->
  <div class="sheet-wrapper">
    <div class="certificate-sheet">

      <!-- Header -->
      <div class="doc-header">
        <div>
          <div class="brand-title">FAIRGIG PLATFORM</div>
          <div class="brand-subtitle">Verified Gig Worker Income Statement</div>
        </div>
        <div class="cert-meta-badge">
          <div class="cert-badge">Ledger Verified</div>
          <div class="cert-number">${cert.certificateNumber}</div>
        </div>
      </div>

      <!-- Information Grid -->
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Worker Name</span>
          <span class="info-value">${cert.workerName}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Statement Period</span>
          <span class="info-value">${formatDate(cert.periodStartDate)} – ${formatDate(cert.periodEndDate)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Certificate Purpose</span>
          <span class="info-value" style="text-transform: capitalize;">${cert.purpose.replace(/_/g, ' ')}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Prepared For / Recipient</span>
          <span class="info-value">${cert.recipientName || 'To Whom It May Concern'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Date of Issuance</span>
          <span class="info-value">${formatDate(cert.issuedAt)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Valid Through</span>
          <span class="info-value">${formatDate(cert.expiresAt)}</span>
        </div>
      </div>

      <!-- Financial Stat Cards -->
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-label">Verified Gross</div>
          <div class="stat-value">${formatCurrency(cert.totalGrossIncome)}</div>
          <div class="stat-subtext">Before deductions</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Platform Deductions</div>
          <div class="stat-value" style="color: #b91c1c;">-${formatCurrency(cert.totalDeductions)}</div>
          <div class="stat-subtext">Fees & commissions</div>
        </div>
        <div class="stat-card highlight">
          <div class="stat-label">Verified Net Income</div>
          <div class="stat-value">${formatCurrency(cert.totalNetIncome)}</div>
          <div class="stat-subtext">Take-home earnings</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Hours / Rate</div>
          <div class="stat-value">${cert.totalHoursWorked.toFixed(1)} hrs</div>
          <div class="stat-subtext">PKR ${effectiveHourlyRate}/hr net</div>
        </div>
      </div>

      <!-- Platform Breakdown Table -->
      <div class="section-title">Verified Platform Breakdown</div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th style="text-align: left;">Platform</th>
              <th style="text-align: center;">Verified Shifts</th>
              <th style="text-align: right;">Hours Worked</th>
              <th style="text-align: right;">Gross Earnings</th>
              <th style="text-align: right;">Deductions</th>
              <th style="text-align: right;">Net Earnings</th>
              <th style="text-align: right;">Effective Rate</th>
            </tr>
          </thead>
          <tbody>
            ${
              breakdownRows ||
              `<tr><td colspan="7" style="text-align: center; color: #64748b; padding: 20px;">No verified shifts recorded in this date range.</td></tr>`
            }
          </tbody>
        </table>
      </div>

      <!-- Verification & Integrity Box -->
      <div class="section-title">Cryptographic Integrity & Verification</div>
      <div class="verification-box">
        <div class="v-row">
          <span class="v-label">Verification Scope:</span>
          <span>100% of reported figures derive strictly from auditor-verified shifts (${cert.verifiedShiftsCount} shifts verified).</span>
        </div>
        <div class="v-row">
          <span class="v-label">SHA-256 Ledger Signature:</span>
          <span class="v-hash">${cert.cryptographicSignature}</span>
        </div>
        <div class="v-row">
          <span class="v-label">Public Verification URL:</span>
          <span class="v-hash"><a href="${cert.publicVerificationUrl}" target="_blank">${cert.publicVerificationUrl}</a></span>
        </div>
      </div>

      <!-- Prominent Legal Disclaimer -->
      <div class="disclaimer-box">
        <div class="disclaimer-title">Official Verification Disclaimer</div>
        This document is an automated platform-generated statement derived solely from cryptographically verified shift records on the FairGig gig-work transparency ledger. It does NOT constitute a government-issued tax certificate, statutory proof of permanent employment, or a bank guarantee. Third-party verifiers, lenders, and landlords can independently authenticate the cryptographic validity of this record at any time via the URL above.
      </div>

      <!-- Footer -->
      <div class="doc-footer">
        <div>
          <strong>FairGig Transparency Network</strong> &bull; Karachi &bull; Lahore &bull; Islamabad &bull; Rawalpindi
        </div>
        <div>
          Generated on ${new Date(cert.issuedAt).toUTCString()}
        </div>
      </div>

    </div>
  </div>

</body>
</html>
`;
}
