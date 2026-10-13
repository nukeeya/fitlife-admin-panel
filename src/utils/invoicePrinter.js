const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

const formatMoney = (amount) => `৳${Number(amount || 0).toLocaleString()}`;

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value);
  return Number.isNaN(date.getTime())
    ? escapeHtml(value)
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

export function buildInvoiceHtml(invoice, branding = {}) {
  const rows = [
    ['Membership package', invoice.planName || 'Membership'],
    ['Base price', formatMoney(invoice.baseAmount)],
    ...(Number(invoice.discountAmount) > 0
      ? [['Discount', `- ${formatMoney(invoice.discountAmount)}${invoice.discountReason ? ` (${invoice.discountReason})` : ''}`]]
      : []),
    ...(Number(invoice.taxAmount) > 0 ? [['Tax / VAT', formatMoney(invoice.taxAmount)]] : []),
  ];
  const payments = Array.isArray(invoice.payments) ? invoice.payments : [];
  const recordedPaymentTotal = payments.reduce((total, payment) => total + Number(payment.amount || 0), 0);
  const ledgerPaidTotal = Number(invoice.paidAmount) || 0;
  const paymentRows = payments.length
    ? payments.map((payment) => `
        <tr>
          <td>${escapeHtml(formatDate(payment.date))}</td>
          <td>${escapeHtml(payment.method || '—')}</td>
          <td>${escapeHtml(payment.reference || '—')}</td>
          <td class="amount">${escapeHtml(formatMoney(payment.amount))}</td>
        </tr>`).join('')
    : `<tr><td colspan="4" class="empty">Individual payment transactions are not available for this invoice.</td></tr>`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Invoice ${escapeHtml(invoice.number)}</title>
    <style>
      * { box-sizing: border-box; }
      @page { size: A4; margin: 16mm; }
      body { margin: 0; color: #17202a; font: 13px Arial, Helvetica, sans-serif; line-height: 1.45; }
      main { width: 100%; max-width: 800px; margin: 0 auto; }
      header { display: flex; justify-content: space-between; gap: 24px; padding-bottom: 18px; border-bottom: 2px solid #17202a; }
      h1 { margin: 0 0 6px; font-size: 23px; }
      h2 { margin: 24px 0 10px; font-size: 14px; }
      p { margin: 3px 0; color: #4b5563; overflow-wrap: anywhere; }
      .invoice-title { text-align: right; }
      .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 20px 0; }
      table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
      thead { display: table-header-group; }
      tr { page-break-inside: avoid; break-inside: avoid; }
      th, td { padding: 9px 8px; border-bottom: 1px solid #d1d5db; text-align: left; vertical-align: top; overflow-wrap: anywhere; }
      th { background: #f3f4f6; }
      .amount { text-align: right; white-space: nowrap; }
      .summary { margin-top: 18px; width: min(100%, 380px); margin-left: auto; }
      .summary td { border-bottom: 0; }
      .summary td:last-child { text-align: right; white-space: nowrap; }
      .summary .total td { border-top: 2px solid #17202a; font-size: 15px; font-weight: 700; }
      .payment-heading { margin-top: 24px; }
      .payment-note { margin-top: 8px; font-size: 11px; }
      .empty { color: #6b7280; text-align: center; }
      .notes { margin-top: 20px; padding: 12px; border: 1px solid #d1d5db; white-space: pre-wrap; overflow-wrap: anywhere; }
      footer { margin-top: 36px; padding-top: 12px; border-top: 1px solid #d1d5db; color: #6b7280; font-size: 11px; text-align: center; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        a { color: inherit; text-decoration: none; }
      }
      @media screen {
        body { padding: 28px; background: #fff; }
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <div>
          <h1>${escapeHtml(branding.gymName || 'FitLife')}</h1>
          ${branding.address ? `<p>${escapeHtml(branding.address)}</p>` : ''}
          ${branding.phone ? `<p>${escapeHtml(branding.phone)}</p>` : ''}
          ${branding.email ? `<p>${escapeHtml(branding.email)}</p>` : ''}
        </div>
        <div class="invoice-title">
          <h1>INVOICE</h1>
          <p><strong>${escapeHtml(invoice.number || '—')}</strong></p>
          <p>Invoice date: ${escapeHtml(formatDate(invoice.date))}</p>
          ${invoice.dueDate ? `<p>Due date: ${escapeHtml(formatDate(invoice.dueDate))}</p>` : ''}
        </div>
      </header>
      <section class="meta">
        <div>
          <h2>Bill to</h2>
          <p><strong>${escapeHtml(invoice.memberName || 'Member')}</strong></p>
          <p>Member ID: ${escapeHtml(invoice.memberCode || '—')}</p>
          ${invoice.memberPhone ? `<p>${escapeHtml(invoice.memberPhone)}</p>` : ''}
          ${invoice.memberEmail ? `<p>${escapeHtml(invoice.memberEmail)}</p>` : ''}
        </div>
        <div>
          <h2>Invoice status</h2>
          <p>Status: <strong>${escapeHtml(invoice.status || 'Due')}</strong></p>
        </div>
      </section>
      <table>
        <thead><tr><th>Description</th><th class="amount">Amount</th></tr></thead>
        <tbody>
          ${rows.map(([label, value]) => `<tr><td>${escapeHtml(label)}</td><td class="amount">${escapeHtml(value)}</td></tr>`).join('')}
        </tbody>
      </table>
      <table class="summary">
        <tbody>
          <tr class="total"><td>Net payable</td><td>${escapeHtml(formatMoney(invoice.netPayable))}</td></tr>
          <tr><td>Total paid</td><td>${escapeHtml(formatMoney(invoice.paidAmount))}</td></tr>
          <tr><td>Balance due</td><td>${escapeHtml(formatMoney(invoice.dueAmount))}</td></tr>
        </tbody>
      </table>
      <h2 class="payment-heading">Payment transactions</h2>
      <table>
        <thead><tr><th>Date</th><th>Method</th><th>Reference</th><th class="amount">Amount</th></tr></thead>
        <tbody>${paymentRows}</tbody>
      </table>
      ${Math.abs(recordedPaymentTotal - ledgerPaidTotal) > 0.01
        ? `<p class="payment-note">The listed transactions do not fully match the invoice ledger's paid total. The ledger total is authoritative; older or unlinked payments may not appear above.</p>`
        : ''}
      ${invoice.notes ? `<section class="notes"><strong>Notes</strong><br>${escapeHtml(invoice.notes)}</section>` : ''}
      <footer>Thank you for choosing ${escapeHtml(branding.gymName || 'FitLife')}.</footer>
    </main>
  </body>
</html>`;
}

function printInFrame(invoiceHtml) {
  const frame = document.createElement('iframe');
  frame.title = 'Invoice print view';
  frame.setAttribute('aria-hidden', 'true');
  Object.assign(frame.style, {
    position: 'fixed',
    right: '0',
    bottom: '0',
    width: '0',
    height: '0',
    border: '0',
  });

  let fallbackTimer;
  const cleanup = () => {
    window.clearTimeout(fallbackTimer);
    frame.remove();
  };
  const handleReady = async () => {
    const printWindow = frame.contentWindow;
    if (!printWindow) {
      cleanup();
      window.alert('Could not prepare the invoice for printing. Please try Save PDF instead.');
      return;
    }

    try {
      await printWindow.document.fonts?.ready;
      printWindow.addEventListener('afterprint', cleanup, { once: true });
      printWindow.focus();
      printWindow.print();
      fallbackTimer = window.setTimeout(cleanup, 120000);
    } catch (error) {
      console.error('[invoicePrinter] Could not print invoice in the current window:', error);
      cleanup();
      window.alert('Could not start direct printing. Please try Save PDF instead.');
    }
  };

  frame.addEventListener('load', handleReady, { once: true });
  document.body.append(frame);
  frame.srcdoc = invoiceHtml;
  return true;
}

export function printInvoice(invoice, branding, output = 'print') {
  const invoiceHtml = buildInvoiceHtml(invoice, branding);
  if (output === 'print') return printInFrame(invoiceHtml);

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.alert('Please allow pop-ups to open the invoice for saving as PDF.');
    return false;
  }

  let fallbackTimer;
  const closeAfterPrint = () => {
    window.clearTimeout(fallbackTimer);
    if (!printWindow.closed) printWindow.close();
  };
  const handleReady = async () => {
    if (printWindow.closed) return;
    try {
      await printWindow.document.fonts?.ready;
    } catch {
      // Continue with the browser's available fonts if font readiness is unavailable.
    }
    if (printWindow.closed) return;
    try {
      printWindow.focus();
      printWindow.print();
      fallbackTimer = window.setTimeout(closeAfterPrint, 120000);
    } catch (error) {
      console.error('[invoicePrinter] Could not open the print dialog:', error);
      window.alert('The invoice opened, but the print dialog could not be started. Use the browser Print command to print or save as PDF.');
    }
  };

  printWindow.addEventListener('afterprint', closeAfterPrint, { once: true });
  printWindow.addEventListener('load', handleReady, { once: true });
  printWindow.document.open();
  printWindow.document.write(invoiceHtml);
  printWindow.document.close();
  return true;
}
