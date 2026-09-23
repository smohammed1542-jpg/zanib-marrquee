import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  createSalaryAdvance,
  deleteSalaryAdvance,
  getHrSummary,
  getHrWorkerOptions,
  listSalaryAdvances,
  updateSalaryAdvance,
} from '../../api/hr';
import { usePageTitle } from '../../context/PageTitleContext';
import { usePermissions } from '../../hooks/usePermissions';
import DataTable from '../../components/ui/DataTable';
import AppLoader from '../../components/AppLoader';
import { ADVANCE_STATUS_LABELS } from '../../constants/hrConstants';
import HrSummaryCards from './HrSummaryCards';
import './hr.css';

const emptyForm = {
  worker_kind: 'staff',
  staff_profile: '',
  labor_worker: '',
  amount: '',
  advance_date: new Date().toISOString().slice(0, 10),
  reason: '',
  status: 'PENDING',
  repaid_amount: '0',
};

export default function HrAdvances() {
  usePageTitle('Salary Advances');
  const { canWriteStaff } = usePermissions();
  const [rows, setRows] = useState([]);
  const [options, setOptions] = useState({ staff: [], labor: [] });
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const [list, opts, sum] = await Promise.all([
        listSalaryAdvances(),
        getHrWorkerOptions(),
        getHrSummary(),
      ]);
      setRows(list);
      setOptions(opts);
      setSummary(sum);
    } catch {
      toast.error('Failed to load advances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

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
      amount: row.amount,
      advance_date: row.advance_date,
      reason: row.reason || '',
      status: row.status,
      repaid_amount: row.repaid_amount || '0',
    });
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      amount: form.amount,
      advance_date: form.advance_date,
      reason: form.reason,
      status: form.status,
      repaid_amount: form.repaid_amount || 0,
      staff_profile: form.worker_kind === 'staff' ? form.staff_profile : null,
      labor_worker: form.worker_kind === 'labor' ? form.labor_worker : null,
    };
    try {
      if (editing) await updateSalaryAdvance(editing.id, payload);
      else await createSalaryAdvance(payload);
      toast.success(editing ? 'Advance updated' : 'Advance recorded');
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save advance');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this advance record?')) return;
    try {
      await deleteSalaryAdvance(id);
      toast.success('Advance deleted');
      load();
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <AppLoader message="Loading advances…" />;

  return (
    <div className="hr-page animate-fade-in">
      <div className="page-header">
        <div>
          <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 800 }}>Salary Advances</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Track employee and labor salary advances.</p>
        </div>
        {canWriteStaff && (
          <button type="button" className="btn-primary" onClick={openCreate}>
            <Plus size={18} style={{ marginRight: 8 }} /> Record Advance
          </button>
        )}
      </div>

      <HrSummaryCards summary={summary} />

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <DataTable
          variant="erp"
          sortable
          pageSize={25}
          columns={[
            { key: 'advance_date', label: 'Date', width: '110px' },
            { key: 'worker_name', label: 'Worker' },
            { key: 'amount', label: 'Amount', width: '120px' },
            { key: 'balance', label: 'Balance', width: '120px' },
            { key: 'status', label: 'Status', width: '130px' },
            { key: 'reason', label: 'Reason' },
          ]}
          data={rows}
          rowActions={canWriteStaff ? (row) => [
            { label: 'Edit', onClick: () => openEdit(row) },
            { label: 'Delete', danger: true, onClick: () => handleDelete(row.id) },
          ] : undefined}
          renderCell={(row, key) => {
            if (key === 'amount' || key === 'balance') return `Rs ${Number(row[key] || 0).toLocaleString()}`;
            if (key === 'status') {
              const cls = row.status === 'PENDING' ? 'pending' : row.status === 'REPAID' ? 'paid' : 'deducted';
              return <span className={`hr-badge hr-badge--${cls}`}>{ADVANCE_STATUS_LABELS[row.status]}</span>;
            }
            return row[key] || '—';
          }}
        />
      </div>

      {modal && createPortal(
        <div className="modal-overlay hr-modal-overlay" onClick={() => setModal(false)}>
          <div className="card modal-panel hr-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>{editing ? 'Edit Advance' : 'Record Advance'}</h3>
              <button type="button" onClick={() => setModal(false)} aria-label="Close"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="staff-modal__form">
              <div className="input-group">
                <label>Worker type</label>
                <select value={form.worker_kind} onChange={(e) => setForm({ ...form, worker_kind: e.target.value })}>
                  <option value="staff">Employee (login account)</option>
                  <option value="labor">Labor worker</option>
                </select>
              </div>
              <div className="input-group">
                <label>{form.worker_kind === 'staff' ? 'Employee' : 'Labor worker'}</label>
                <select
                  required
                  value={form.worker_kind === 'staff' ? form.staff_profile : form.labor_worker}
                  onChange={(e) => setForm(form.worker_kind === 'staff'
                    ? { ...form, staff_profile: e.target.value }
                    : { ...form, labor_worker: e.target.value })}
                >
                  <option value="">Select…</option>
                  {(form.worker_kind === 'staff' ? options.staff : options.labor).map((w) => (
                    <option key={w.id} value={w.id}>{w.label || w.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-grid-2">
                <div className="input-group">
                  <label>Amount (PKR)</label>
                  <input type="number" min="0" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div className="input-group">
                  <label>Date</label>
                  <input type="date" required value={form.advance_date} onChange={(e) => setForm({ ...form, advance_date: e.target.value })} />
                </div>
              </div>
              <div className="form-grid-2">
                <div className="input-group">
                  <label>Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {Object.entries(ADVANCE_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Repaid amount</label>
                  <input type="number" min="0" value={form.repaid_amount} onChange={(e) => setForm({ ...form, repaid_amount: e.target.value })} />
                </div>
              </div>
              <div className="input-group">
                <label>Reason</label>
                <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Optional note" />
              </div>
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
