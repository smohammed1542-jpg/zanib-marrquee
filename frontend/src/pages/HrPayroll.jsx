import React, { useEffect, useMemo, useState } from 'react';
import { Download, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../api/client';
import { usePageTitle } from '../context/PageTitleContext';
import DataTable from '../components/ui/DataTable';
import SearchInput from '../components/SearchInput';
import AppLoader from '../components/AppLoader';
import { exportStaffCsv, staffDisplayName, staffPayrollTotal } from '../utils/staffHelpers';

const ROLE_LABELS = {
  ADMIN: 'Admin',
  MANAGER: 'Manage',
  HR: 'HR',
};

export default function HrPayroll() {
  usePageTitle('Payroll');
  const [staff, setStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');

  useEffect(() => {
    client.get('/auth/staff/')
      .then((response) => {
        const list = response.data.results || response.data || [];
        setStaff(Array.isArray(list) ? list : []);
      })
      .catch(() => toast.error('Failed to load payroll data'))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredStaff = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return staff.filter((member) => {
      const isActive = member.profile_status !== false && member.is_active !== false;
      if (statusFilter === 'active' && !isActive) return false;
      if (statusFilter === 'inactive' && isActive) return false;
      if (!q) return true;
      return (
        staffDisplayName(member).toLowerCase().includes(q)
        || (member.username || '').toLowerCase().includes(q)
        || (member.role || '').toLowerCase().includes(q)
      );
    });
  }, [staff, searchQuery, statusFilter]);

  const activePayroll = useMemo(
    () => staffPayrollTotal(staff.filter(
      (member) => member.profile_status !== false && member.is_active !== false,
    )),
    [staff],
  );

  const filteredPayroll = useMemo(() => staffPayrollTotal(filteredStaff), [filteredStaff]);

  const handleExport = () => {
    if (!filteredStaff.length) {
      toast.error('No employees to export');
      return;
    }
    exportStaffCsv(filteredStaff, 'payroll-export.csv');
    toast.success('Payroll exported');
  };

  if (isLoading) return <AppLoader message="Loading payroll…" />;

  return (
    <div className="staff-page animate-fade-in">
      <div className="page-header">
        <div>
          <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 800 }}>Payroll & Salaries</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Monthly salary overview for all active employees.
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={handleExport}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Download size={18} /> Export CSV
        </button>
      </div>

      <div className="staff-stats">
        <div className="staff-stats__card staff-stats__card--payroll">
          <span className="staff-stats__label">Active monthly payroll</span>
          <strong className="staff-stats__value">Rs {activePayroll.toLocaleString()}</strong>
        </div>
        <div className="staff-stats__card">
          <span className="staff-stats__label">Employees in view</span>
          <strong className="staff-stats__value">{filteredStaff.length}</strong>
        </div>
        <div className="staff-stats__card">
          <span className="staff-stats__label">Filtered payroll</span>
          <strong className="staff-stats__value">Rs {filteredPayroll.toLocaleString()}</strong>
        </div>
      </div>

      <div className="search-toolbar search-toolbar--compact staff-toolbar">
        <SearchInput
          variant="inset"
          placeholder="Search by name or username…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="staff-toolbar__select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <DataTable
          variant="erp"
          sortable
          showColumnChooser
          pageSize={25}
          emptyTitle="No payroll records"
          emptyDescription="Add employees with salary amounts to see payroll here."
          columns={[
            { key: 'name', label: 'Employee' },
            { key: 'role', label: 'Role', width: '100px' },
            { key: 'phone', label: 'Phone', width: '130px' },
            { key: 'salary', label: 'Salary (PKR)', width: '130px' },
            { key: 'joining_date', label: 'Joined', width: '120px' },
            { key: 'status', label: 'Status', width: '100px' },
          ]}
          data={filteredStaff}
          getSortValue={(row, key) => {
            if (key === 'name') return staffDisplayName(row);
            if (key === 'salary') return Number(row.salary) || 0;
            if (key === 'status') {
              return row.profile_status !== false && row.is_active !== false ? 'active' : 'inactive';
            }
            return row[key];
          }}
          renderCell={(member, key) => {
            if (key === 'name') {
              return (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                  <Wallet size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  {staffDisplayName(member)}
                </span>
              );
            }
            if (key === 'role') return ROLE_LABELS[member.role] || member.role || '—';
            if (key === 'phone') return member.phone || '—';
            if (key === 'salary') {
              return member.salary != null
                ? `Rs ${Number(member.salary).toLocaleString()}`
                : '—';
            }
            if (key === 'joining_date') {
              return member.joining_date
                ? new Date(member.joining_date).toLocaleDateString(undefined, { dateStyle: 'medium' })
                : '—';
            }
            if (key === 'status') {
              const active = member.profile_status !== false && member.is_active !== false;
              return (
                <span className={`staff-status-badge staff-status-badge--${active ? 'active' : 'inactive'}`}>
                  {active ? 'Active' : 'Inactive'}
                </span>
              );
            }
            return member[key] || '—';
          }}
        />
      </div>
    </div>
  );
}
