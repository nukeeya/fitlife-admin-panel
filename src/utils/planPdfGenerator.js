/**
 * Professional A4 Fitness Report & PDF Generator
 * 
 * Generates high-resolution, vector-sharp printable A4 fitness dossiers
 * formatted with the gym's custom branding, member credentials, nutritional breakdown,
 * periodized workout architectures, progressive overload rules, and scientific bibliography.
 */

export function generateFitnessPlanPDF({
  type = 'complete', // 'diet' | 'workout' | 'complete'
  profile = {},
  metrics = {},
  dietPlan = null,
  workoutPlan = null,
  researchSources = [],
  branding = {},
}) {
  const gymName = branding?.gymName || 'FitLife';
  const gymTagline = branding?.tagline || 'Next-Gen Evidence-Based Fitness Administration';
  const logoUrl = branding?.logoUrl || '';

  const memberName = profile.name || 'Member Client';
  const memberCode = profile.code || `FLM-${Math.floor(1000 + Math.random() * 9000)}`;
  const dateStr = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  const reviewDateStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  const titleMap = {
    diet: `${gymName} — Personalized Clinical Nutrition Protocol`,
    workout: `${gymName} — Periodized Progressive Overload Program`,
    complete: `${gymName} — Comprehensive Athletic Dossier & Protocol`,
  };

  const documentTitle = titleMap[type] || titleMap.complete;

  // Build HTML Content
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${documentTitle} - ${memberName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 14mm 16mm 14mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1a1a1a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 11pt;
      line-height: 1.45;
    }

    /* Print Header & Branding */
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2.5pt solid #10b981;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .brand-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-logo-img {
      width: 48px;
      height: 48px;
      object-fit: contain;
      border-radius: 8px;
    }
    .brand-logo-fallback {
      width: 44px;
      height: 44px;
      background: #10b981;
      color: #ffffff;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      font-weight: 900;
    }
    .brand-text h1 {
      margin: 0;
      font-size: 18pt;
      font-weight: 900;
      letter-spacing: 0.5px;
      color: #0f172a;
    }
    .brand-text p {
      margin: 2px 0 0 0;
      font-size: 9pt;
      color: #64748b;
    }
    .meta-box {
      text-align: right;
      font-size: 8.5pt;
      color: #475569;
    }
    .meta-box strong {
      color: #0f172a;
    }

    /* Member Snapshot Bar */
    .snapshot-bar {
      background: #f8fafc;
      border: 1pt solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 14px;
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 8px;
      margin-bottom: 18px;
      font-size: 9pt;
    }
    .snapshot-item {
      display: flex;
      flex-direction: column;
    }
    .snapshot-label {
      font-size: 7.5pt;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .snapshot-val {
      font-weight: 800;
      color: #0f172a;
      margin-top: 2px;
    }

    /* Section Headings */
    .section-title {
      font-size: 12pt;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-left: 4pt solid #10b981;
      padding-left: 8px;
      margin: 18px 0 10px 0;
    }

    /* Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 16px;
    }
    .metric-card {
      background: #f8fafc;
      border: 1pt solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 10px;
      text-align: center;
    }
    .metric-card.highlight {
      background: #ecfdf5;
      border-color: #a7f3d0;
    }
    .metric-num {
      font-size: 14pt;
      font-weight: 900;
      color: #0f172a;
    }
    .metric-num.green {
      color: #059669;
    }
    .metric-sub {
      font-size: 7.5pt;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
      margin-top: 2px;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 8.5pt;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 7.5pt;
      letter-spacing: 0.5px;
      padding: 6px 8px;
      border: 1pt solid #cbd5e1;
      text-align: left;
    }
    td {
      padding: 6px 8px;
      border: 1pt solid #e2e8f0;
      color: #1e293b;
    }
    tr:nth-child(even) td {
      background: #fafafa;
    }

    .badge-pill {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 7.5pt;
      font-weight: 700;
      background: #e2e8f0;
      color: #334155;
    }
    .badge-pill.green {
      background: #d1fae5;
      color: #065f46;
    }

    /* Page Breaks */
    .page-break {
      page-break-before: always;
      margin-top: 20px;
    }

    /* Research Box */
    .research-card {
      border: 1pt solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 10px;
      margin-bottom: 8px;
      background: #fcfcfd;
      font-size: 8pt;
    }
    .research-title {
      font-weight: 800;
      color: #0f172a;
    }
    .research-source {
      color: #2563eb;
      font-size: 7.5pt;
      text-decoration: underline;
    }

    /* Disclaimer Footer */
    .disclaimer-box {
      margin-top: 20px;
      padding: 8px 12px;
      background: #fffbeb;
      border: 1pt solid #fef3c7;
      border-radius: 6px;
      font-size: 7.5pt;
      color: #92400e;
      line-height: 1.4;
    }

    .footer-bar {
      margin-top: 14px;
      border-top: 1pt solid #e2e8f0;
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      font-size: 7.5pt;
      color: #94a3b8;
    }
  </style>
</head>
<body>

  <!-- HEADER -->
  <div class="report-header">
    <div class="brand-group">
      ${logoUrl ? `<img src="${logoUrl}" class="brand-logo-img" alt="Logo" />` : `<div class="brand-logo-fallback">${gymName.charAt(0)}</div>`}
      <div class="brand-text">
        <h1>${gymName}</h1>
        <p>${gymTagline}</p>
      </div>
    </div>
    <div class="meta-box">
      <div><strong>CLIENT ID:</strong> ${memberCode}</div>
      <div><strong>DATE:</strong> ${dateStr}</div>
      <div><strong>REVIEW DATE:</strong> ${reviewDateStr}</div>
    </div>
  </div>

  <!-- SNAPSHOT BAR -->
  <div class="snapshot-bar">
    <div class="snapshot-item">
      <span class="snapshot-label">Client Name</span>
      <span class="snapshot-val">${memberName}</span>
    </div>
    <div class="snapshot-item">
      <span class="snapshot-label">Age / Sex</span>
      <span class="snapshot-val">${profile.age || 28} Yrs • ${profile.gender || 'Male'}</span>
    </div>
    <div class="snapshot-item">
      <span class="snapshot-label">Height / Weight</span>
      <span class="snapshot-val">${profile.heightCm || 175} cm • ${profile.weightKg || 75} kg</span>
    </div>
    <div class="snapshot-item">
      <span class="snapshot-label">Target Weight</span>
      <span class="snapshot-val">${profile.targetWeightKg || 70} kg</span>
    </div>
    <div class="snapshot-item">
      <span class="snapshot-label">Primary Goal</span>
      <span class="snapshot-val" style="color: #059669;">${profile.primaryGoal || 'Fat Loss'}</span>
    </div>
    <div class="snapshot-item">
      <span class="snapshot-label">Activity Level</span>
      <span class="snapshot-val">${metrics.activityMultiplier ? `${metrics.activityMultiplier}x BMR` : 'Moderate'}</span>
    </div>
  </div>

  <!-- SCIENTIFIC METRICS -->
  <div class="section-title">1. Anthropometric & Daily Caloric Architecture</div>
  <div class="metrics-grid">
    <div class="metric-card">
      <div class="metric-num">${metrics.bmr || 1650} kcal</div>
      <div class="metric-sub">Basal Metabolic Rate (BMR)</div>
    </div>
    <div class="metric-card">
      <div class="metric-num">${metrics.tdee || 2400} kcal</div>
      <div class="metric-sub">Maintenance TDEE</div>
    </div>
    <div class="metric-card highlight">
      <div class="metric-num green">${metrics.targetCalories || 1950} kcal</div>
      <div class="metric-sub">Prescribed Daily Calories</div>
    </div>
    <div class="metric-card">
      <div class="metric-num">${metrics.waterLiters || 3.2} L</div>
      <div class="metric-sub">Daily Water Target</div>
    </div>
  </div>

  <div class="metrics-grid">
    <div class="metric-card">
      <div class="metric-num" style="color: #2563eb;">${metrics.proteinGrams || 155}g</div>
      <div class="metric-sub">Protein Target (4 kcal/g)</div>
    </div>
    <div class="metric-card">
      <div class="metric-num">${metrics.carbGrams || 210}g</div>
      <div class="metric-sub">Carbohydrates (4 kcal/g)</div>
    </div>
    <div class="metric-card">
      <div class="metric-num">${metrics.fatGrams || 52}g</div>
      <div class="metric-sub">Dietary Fat (9 kcal/g)</div>
    </div>
    <div class="metric-card">
      <div class="metric-num">${metrics.fiberGrams || 28}g</div>
      <div class="metric-sub">Dietary Fiber Target</div>
    </div>
  </div>

  ${(type === 'diet' || type === 'complete') && dietPlan ? `
  <!-- DIET PROTOCOL SECTION -->
  <div class="section-title">2. Evidence-Based Daily Nutrition & Meal Protocol (Bangladesh Focus)</div>
  <table>
    <thead>
      <tr>
        <th style="width: 14%;">Meal / Time</th>
        <th style="width: 32%;">Prescribed Food & Local Serving</th>
        <th style="width: 10%;">Calories</th>
        <th style="width: 8%;">Protein</th>
        <th style="width: 8%;">Carbs</th>
        <th style="width: 8%;">Fats</th>
        <th style="width: 20%;">Smart Local Substitutions</th>
      </tr>
    </thead>
    <tbody>
      ${(dietPlan.meals || []).map(m => `
        <tr>
          <td><strong>${m.time || m.name}</strong><br><span style="font-size: 7pt; color: #64748b;">${m.name}</span></td>
          <td>${m.foodName || m.detail || m.meal}</td>
          <td><strong>${m.calories || '—'}</strong></td>
          <td>${m.protein || '—'}</td>
          <td>${m.carbs || '—'}</td>
          <td>${m.fat || '—'}</td>
          <td style="font-size: 7.5pt; color: #475569;">${m.alternatives || 'Rui Fish / Atta Roti / Tok Doi'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}

  ${(type === 'complete') ? '<div class="page-break"></div>' : ''}

  ${(type === 'workout' || type === 'complete') && workoutPlan ? `
  <!-- WORKOUT SECTION -->
  <div class="section-title">3. Periodized Progressive Overload Program</div>
  <p style="font-size: 8.5pt; color: #475569; margin: 0 0 10px 0;">
    <strong>Progression Engine:</strong> ${workoutPlan.progressionRule || 'Double Progression: When hitting max rep ceiling for all sets with target RPE, increase load by 2.5 kg.'}
  </p>

  ${(workoutPlan.splits || []).map(split => `
    <div style="background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-size: 8.5pt; font-weight: 800; color: #0f172a; margin: 8px 0 4px 0;">
      ${split.day} • Target Duration: ${split.duration || '45 Mins'}
    </div>
    <table>
      <thead>
        <tr>
          <th style="width: 30%;">Exercise</th>
          <th style="width: 20%;">Target Sets & Reps</th>
          <th style="width: 12%;">Rest Interval</th>
          <th style="width: 14%;">Intensity (RPE/RIR)</th>
          <th style="width: 24%;">Form & Execution Cue</th>
        </tr>
      </thead>
      <tbody>
        ${(split.exercises || []).map(ex => `
          <tr>
            <td><strong>${ex.name}</strong><br><span style="font-size: 7pt; color: #64748b;">${ex.muscle || ''}</span></td>
            <td><strong>${ex.sets}</strong> × ${ex.reps}</td>
            <td>${ex.rest || '60s'}</td>
            <td><span class="badge-pill ${ex.rpe?.includes('8') ? 'green' : ''}">${ex.rpe || 'RPE 8 (2 RIR)'}</span></td>
            <td style="font-size: 7.5pt;">${ex.techniqueCue || 'Control eccentric tempo smoothly.'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `).join('')}
  ` : ''}

  <!-- RESEARCH & CITATIONS SECTION -->
  ${(researchSources && researchSources.length > 0) ? `
  <div class="section-title">4. Peer-Reviewed Evidence & Scientific Bibliography</div>
  <div>
    ${researchSources.map(r => `
      <div class="research-card">
        <div class="research-title">${r.title}</div>
        <div style="font-size: 7.5pt; color: #64748b; margin: 2px 0;">
          ${r.authors} • <em>${r.journal} (${r.year})</em> — <strong>${r.tier}</strong>
        </div>
        <div style="font-size: 7.5pt; color: #334155; margin-top: 3px;">
          <strong>Clinical Takeaway:</strong> ${r.keyTakeaway}
        </div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  <!-- MEDICAL DISCLAIMER -->
  <div class="disclaimer-box">
    <strong>Clinical & Exercise Science Disclaimer:</strong> This dossier is an algorithmic, evidence-based physical conditioning and nutritional framework tailored from anthropometric parameters. It is intended for educational and fitness conditioning purposes and does not constitute medical diagnosis, personalized clinical dietetics, or prescription. Consult a licensed physician or registered sports dietitian before commencing aggressive exercise or caloric restriction.
  </div>

  <!-- FOOTER -->
  <div class="footer-bar">
    <span>${gymName} Digital Performance System</span>
    <span>Evidence-Based Plan • Generated for ${memberName} (${memberCode})</span>
    <span>Page 1 of 1</span>
  </div>

</body>
</html>
  `;

  // Open print dialog in hidden printable window
  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    // Trigger print dialog once loaded
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  } else {
    // Fallback: If popup blocker prevents window.open, use hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    iframe.contentWindow.focus();
    setTimeout(() => {
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 2000);
    }, 500);
  }
}
