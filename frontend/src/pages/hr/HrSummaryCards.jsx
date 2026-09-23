import React from 'react';

export default function HrSummaryCards({ summary, extra = [] }) {
  if (!summary) return null;
  const cards = [
    { label: 'Employees', value: summary.employee_count ?? 0 },
    { label: 'Labor workers', value: summary.labor_count ?? 0 },
    { label: 'Monthly payroll', value: `Rs ${Number(summary.monthly_payroll || 0).toLocaleString()}`, accent: true },
    { label: 'Pending advances', value: `Rs ${Number(summary.pending_advances || 0).toLocaleString()}` },
    ...extra,
  ];
  return (
    <div className="hr-stats">
      {cards.map((card) => (
        <div key={card.label} className={`hr-stats__card${card.accent ? ' hr-stats__card--accent' : ''}`}>
          <span className="hr-stats__label">{card.label}</span>
          <strong className="hr-stats__value">{card.value}</strong>
        </div>
      ))}
    </div>
  );
}
