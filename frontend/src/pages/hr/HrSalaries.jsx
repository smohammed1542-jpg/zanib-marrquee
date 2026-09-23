import React, { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../../api/client';
import { getHrSummary } from '../../api/hr';
import { usePageTitle } from '../../context/PageTitleContext';
import { usePermissions } from '../../hooks/usePermissions';
import DataTable from '../../components/ui/DataTable';
import SearchInput from '../../components/SearchInput';
import AppLoader from '../../components/AppLoader';
import { DEPARTMENT_LABELS, PAY_TYPE_LABELS } from '../../constants/hrConstants';
import { exportStaffCsv, isStaffActive, staffDisplayName } from '../../utils/staffHelpers';
import HrSummaryCards from './HrSummaryCards';
import './hr.css';

export default function HrSalaries() {
  usePageTitle('Salaries');
  const { isHr } = usePermissions();
  const [staff, setStaff] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [payFilter, setPayFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const [staffRes, summaryData] = await Promise.all([
        client.get('/auth/staff/'),
        getHrSummary(),
      ]);
      const list = staffRes.data.results || staffRes.data || [];
      setStaff(Array.isArray(list) ? list : []);
      setSummary(summaryData);
    } catch {
      toast.error('Failed to load salaries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => staff.filter((m) => {
    if (payFilter !== 'all' && (m.pay_type || 'MONTHLY') !== payFilter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return staffDisplayName(m).toLowerCase().includes(q) || (m.username || '').toLowerCase().includes(q);
  }), [staff, search, payFilter]);

  const monthlyTotal = useMemo(
    () => filtered.filter((m) => (m.pay_type || 'MONTHLY') === 'MONTHLY' && isStaffActive(m))
      .reduce((s, m) => s + (Number(m.salary) || 0), 0),
    [filtered],
  );

  const dailyWorkers = filtered.filter((m) => m.pay_type === 'DAILY');

  if (loading) return <AppLoader message="Loading salaries…" />;

  return (
    <div className="hr-page animate-fade-in">
      <div className="page-header">
        <div>
          <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 800 }}>
            {isHr ? 'Salaries' : 'Salary Overview'}
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Monthly payroll and daily wage rates for all employees.
          </p>
        </div>
        <button type="button" className="btn-secondary" onClick={() => { exportStaffCsv(filtered, 'salaries.csv'); toast.success('Exported'); }}>
          <Download size={18} style={{ marginRight: 8 }} /> Export
        </button>
      </div>

      <HrSummaryCards summary={summary} extra={[
        { label: 'Filtered monthly total', value: `Rs ${monthlyTotal.toLocaleString()}`, accent: true },
        { label: 'Daily wage staff', value: dailyWorkers.length },
      ]} />

      <div className="hr-toolbar">
        <SearchInput variant="inset" placeholder="Search employee…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="hr-toolbar__select" value={payFilter} onChange={(e) => setPayFilter(e.target.value)}>
          <option value="all">All pay types</option>
          <option value="MONTHLY">Monthly salary</option>
          <option value="DAILY">Daily wage</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <DataTable
          variant="erp"
          sortable
          pageSize={25}
          columns={[
            { key: 'name', label: 'Employee' },
            { key: 'pay_type', label: 'Pay type', width: '120px' },
            { key: 'department', label: 'Department', width: '120px' },
            { key: 'salary', label: 'Monthly (PKR)', width: '130px' },
            { key: 'daily_rate', label: 'Daily rate', width: '120px' },
            { key: 'status', label: 'Status', width: '100px' },
          ]}
          data={filtered}
          getSortValue={(row, key) => {
            if (key === 'name') return staffDisplayName(row);
            if (key === 'salary') return Number(row.salary) || 0;
            if (key === 'daily_rate') return Number(row.daily_rate) || 0;
            return row[key];
          }}
          renderCell={(row, key) => {
            if (key === 'name') return <strong>{staffDisplayName(row)}</strong>;
            if (key === 'pay_type') return PAY_TYPE_LABELS[row.pay_type || 'MONTHLY'];
            if (key === 'department') return DEPARTMENT_LABELS[row.department] || row.department || '—';
            if (key === 'salary') return row.pay_type === 'DAILY' ? '—' : `Rs ${Number(row.salary || 0).toLocaleString()}`;
            if (key === 'daily_rate') return row.pay_type === 'DAILY' ? `Rs ${Number(row.daily_rate || 0).toLocaleString()}` : '—';
            if (key === 'status') {
              const active = isStaffActive(row);
              return <span className={`hr-badge hr-badge--${active ? 'paid' : 'draft'}`}>{active ? 'Active' : 'Inactive'}</span>;
            }
            return row[key] || '—';
          }}
        />
      </div>
    </div>
  );
}
