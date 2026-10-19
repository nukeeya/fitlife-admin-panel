/**
 * FitLife Enterprise Gym - Excel (.xlsx) Exporter
 * Generates genuine Microsoft Excel workbooks using SheetJS (xlsx)
 * Scope: FRONTEND DEMO ONLY
 */
import * as XLSX from 'xlsx';

/**
 * Exports tabular report data to an authentic .xlsx workbook
 *
 * @param {Object} options
 * @param {string} options.filename - Desired filename ending in .xlsx
 * @param {string} options.reportTitle - Main title shown in header
 * @param {string} options.dateRangeLabel - Selected date range description
 * @param {Array<{ key: string, label: string }>} options.columns - Column specifications
 * @param {Array<Object>} options.rows - Data objects matching column keys
 * @param {Object} [options.summaryTotals] - Optional key-value object of summary totals
 * @param {string} [options.sheetName] - Name of the worksheet tab
 */
export function exportReportToExcel({
  filename = 'gym-financial-report.xlsx',
  reportTitle = 'FitLife Financial Report',
  dateRangeLabel = 'All Dates',
  columns = [],
  rows = [],
  summaryTotals = null,
  sheetName = 'Report Data',
}) {
  try {
    const aoa = [];

    // 1. Header Metadata block
    aoa.push(['FITLIFE ENTERPRISE GYM — FINANCE & ACCOUNTS (DEMO)']);
    aoa.push([`Report: ${reportTitle}`]);
    aoa.push([`Reporting Scope: ${dateRangeLabel}`]);
    aoa.push([`Generated On: ${new Date().toLocaleString()} (Reference Date: 19 Oct 2026)`]);
    aoa.push(['Note: Management accounting demonstration dataset']);
    aoa.push([]); // blank separator row

    // 2. Column Headers
    const headerRow = columns.map((col) => col.label);
    aoa.push(headerRow);

    // 3. Data Rows
    rows.forEach((row) => {
      const dataRow = columns.map((col) => {
        const val = row[col.key];
        return val !== undefined && val !== null ? val : '—';
      });
      aoa.push(dataRow);
    });

    // 4. Summary Totals Footer
    if (summaryTotals && Object.keys(summaryTotals).length > 0) {
      aoa.push([]); // separator
      const summaryRow = columns.map((col, index) => {
        if (index === 0) return 'TOTAL SUMMARY';
        if (summaryTotals[col.key] !== undefined) {
          return summaryTotals[col.key];
        }
        return '';
      });
      aoa.push(summaryRow);
    }

    // 5. Build worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(aoa);

    // Auto-fit column widths
    const colWidths = columns.map((col, i) => {
      let maxLen = col.label.length;
      rows.forEach((r) => {
        const cellVal = String(r[col.key] || '');
        if (cellVal.length > maxLen) maxLen = cellVal.length;
      });
      return { wch: Math.min(Math.max(maxLen + 4, 12), 40) };
    });
    worksheet['!cols'] = colWidths;

    // 6. Create workbook and trigger download
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));

    const safeFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
    XLSX.writeFile(workbook, safeFilename);

    return { success: true, filename: safeFilename };
  } catch (error) {
    console.error('Excel export failed:', error);
    return { success: false, error };
  }
}
