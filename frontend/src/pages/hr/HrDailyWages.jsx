import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  createDailyWage,
  deleteDailyWage,
  getHrWorkerOptions,
  listDailyWages,
  updateDailyWage,
} from '../../api/hr';
import { usePageTitle } from '../../context/PageTitleContext';
import { usePermissions } from '../../hooks/usePermissions';
import DataTable from '../../components/ui/DataTable';
import AppLoader from '../../components/AppLoader';
import { WAGE_STATUS_LABELS } from '../../constants/hrConstants';
import './hr.css';

const emptyForm = {
  worker_kind: 'labor',
  staff_profile: '',
  labor_worker: '',
  work_date: new Date().toISOString().slice(0, 10),
  days: '1',
  daily_rate: '',
  notes: '',
  status: 'DRAFT',
};

export default function HrDailyWages() {
  usePageTitle('Daily Wages');
  const { canWriteStaff } = usePermissions();
  const [rows, setRows] = useState([]);
  const [options, setOptions] = useState({ staff: [], labor: [] });
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const [list, opts] = await Promise.all([
        listDailyWages(dateFilter ? { work_date: dateFilter } : {}),
        getHrWorkerOptions(),
      ]);
      setRows(list);
      setOptions(opts);
    } catch {
      toast.error('Failed to load daily wages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [dateFilter]);

  const totalPaid = useMemo(
    () => rows.filter((r) => r.status === 'PAID').reduce((s, r) => s + (Number(r.amount) || 0), 0),
    [rows],
  );

  const pickRate = (workerKind, id) => {
    if (workerKind === 'staff') {
      const w = options.staff.find((s) => String(s.id) === String(id));
      return w?.daily_rate || w?.monthly_salary || '';
    }
    const w = options.labor.find((l) => String(l.id) === String(id));
    return w?.daily_rate || '';
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModal(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      worker_kind: row.staff_profile ? 'staff' : 'labor',
      staff_profile: row.staff_profile || '',
      labor_worker: row.labor_worker || '',
      work_date: row.work_date,
      days: row.days,
      daily_rate: row.daily_rate,
      notes: row.notes || '',
      status: row.status,
    });
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      work_date: form.work_date,
      days: form.days,
      daily_rate: form.daily_rate,
      notes: form.notes,
      status: form.status,
      staff_profile: form.worker_kind === 'staff' ? form.staff_profile : null,
      labor_worker: form.worker_kind === 'labor' ? form.labor_worker : null,
    };
    try {
      if (editing) await updateDailyWage(editing.id, payload);
      else await createDailyWage(payload);
      toast.success(editing ? 'Entry updated' : 'Daily wage recorded');
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save entry');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this daily wage entry?')) return;
    try {
      await deleteDailyWage(id);
      toast.success('Entry deleted');
      load();
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <AppLoader message="Loading daily wages…" />;

  return (
    <div className="hr-page animate-fade-in">
      <div className="page-header">
        <div>
          <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 800 }}>Daily Wage Register</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Record daily attendance-based pay for labor and daily-wage staff.
          </p>
        </div>
        {canWriteStaff && (
          <button type="button" className="btn-primary" onClick={openCreate}>
            <Plus size={18} style={{ marginRight: 8 }} /> Add Entry
          </button>
        )}
      </div>

      <div className="hr-stats">
        <div className="hr-stats__card hr-stats__card--accent">
          <span className="hr-stats__label">Paid total (view)</span>
          <strong className="hr-stats__value">Rs {totalPaid.toLocaleString()}</strong>
        </div>
        <div className="hr-stats__card">
          <span className="hr-stats__label">Entries</span>
          <strong className="hr-stats__value">{rows.length}</strong>
        </div>
      </div>

      <div className="hr-toolbar">
        <input type="date" className="hr-toolbar__select" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        {dateFilter && (
          <button type="button" className="btn-secondary" onClick={() => setDateFilter('')}>Clear date</button>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <DataTable
          variant="erp"
          sortable
          pageSize={25}
          columns={[
            { key: 'work_date', label: 'Date', width: '110px' },
            { key: 'worker_name', label: 'Worker' },
            { key: 'days', label: 'Days', width: '80px' },
            { key: 'daily_rate', label: 'Rate', width: '110px' },
            { key: 'amount', label: 'Amount', width: '120px' },
            { key: 'status', label: 'Status', width: '100px' },
          ]}
          data={rows}
          rowActions={canWriteStaff ? (row) => [
            { label: 'Edit', onClick: () => openEdit(row) },
            { label: 'Delete', danger: true, onClick: () => handleDelete(row.id) },
          ] : undefined}
          renderCell={(row, key) => {
            if (key === 'daily_rate' || key === 'amount') return `Rs ${Number(row[key] || 0).toLocaleString()}`;
            if (key === 'status') {
              return <span className={`hr-badge hr-badge--${row.status === 'PAID' ? 'paid' : 'draft'}`}>{WAGE_STATUS_LABELS[row.status]}</span>;
            }
            return row[key] ?? '—';
          }}
        />
      </div>

      {modal && createPortal(
        <div className="modal-overlay hr-modal-overlay" onClick={() => setModal(false)}>
          <div className="card modal-panel hr-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>{editing ? 'Edit Daily Wage' : 'Add Daily Wage'}</h3>
              <button type="button" onClick={() => setModal(false)} aria-label="Close"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="staff-modal__form">
              <div className="input-group">
                <label>Worker type</label>
                <select value={form.worker_kind} onChange={(e) => setForm({ ...form, worker_kind: e.target.value })}>
                  <option value="labor">Labor worker</option>
                  <option value="staff">Employee (daily wage)</option>
                </select>
              </div>
              <div className="input-group">
                <label>Worker</label>
                <select
                  required
                  value={form.worker_kind === 'staff' ? form.staff_profile : form.labor_worker}
                  onChange={(e) => {
                    const id = e.target.value;
                    const rate = pickRate(form.worker_kind, id);
                    setForm(form.worker_kind === 'staff'
                      ? { ...form, staff_profile: id, daily_rate: rate || form.daily_rate }
                      : { ...form, labor_worker: id, daily_rate: rate || form.daily_rate });
                  }}
                >
                  <option value="">Select…</option>
                  {(form.worker_kind === 'staff'
                    ? options.staff.filter((s) => s.pay_type === 'DAILY')
                    : options.labor.filter((l) => l.pay_type === 'DAILY')
                  ).map((w) => (
                    <option key={w.id} value={w.id}>{w.label || w.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-grid-2">
                <div className="input-group">
                  <label>Work date</label>
                  <input type="date" required value={form.work_date} onChange={(e) => setForm({ ...form, work_date: e.target.value })} />
                </div>
                <div className="input-group">
                  <label>Days (1 = full, 0.5 = half)</label>
                  <input type="number" min="0.5" step="0.5" required value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} />
                </div>
              </div>
              <div className="form-grid-2">
                <div className="input-group">
                  <label>Daily rate (PKR)</label>
                  <input type="number" min="0" required value={form.daily_rate} onChange={(e) => setForm({ ...form, daily_rate: e.target.value })} />
                </div>
                <div className="input-group">
                  <label>Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {Object.entries(WAGE_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="input-group">
                <label>Notes</label>
                <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Amount: Rs {(Number(form.days || 0) * Number(form.daily_rate || 0)).toLocaleString()}
              </p>
              <div className="staff-modal__actions">
                <button type="button" className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
