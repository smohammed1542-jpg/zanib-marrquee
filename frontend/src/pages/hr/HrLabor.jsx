import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  createLaborWorker,
  deleteLaborWorker,
  getHrSummary,
  listLaborWorkers,
  updateLaborWorker,
} from '../../api/hr';
import { usePageTitle } from '../../context/PageTitleContext';
import { usePermissions } from '../../hooks/usePermissions';
import DataTable from '../../components/ui/DataTable';
import SearchInput from '../../components/SearchInput';
import AppLoader from '../../components/AppLoader';
import { DEPARTMENT_LABELS, DEPARTMENT_OPTIONS, PAY_TYPE_LABELS } from '../../constants/hrConstants';
import HrSummaryCards from './HrSummaryCards';
import './hr.css';

const emptyForm = {
  full_name: '',
  phone: '',
  cnic: '',
  pay_type: 'DAILY',
  monthly_salary: '',
  daily_rate: '',
  department: 'OTHER',
  designation: '',
  is_active: true,
  joining_date: '',
  notes: '',
};

export default function HrLabor() {
  usePageTitle('Labor Management');
  const { canWriteStaff } = usePermissions();
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const [list, sum] = await Promise.all([listLaborWorkers(), getHrSummary()]);
      setRows(list);
      setSummary(sum);
    } catch {
      toast.error('Failed to load labor workers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = rows.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return r.full_name.toLowerCase().includes(q) || (r.phone || '').includes(q);
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModal(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      full_name: row.full_name,
      phone: row.phone || '',
      cnic: row.cnic || '',
      pay_type: row.pay_type || 'DAILY',
      monthly_salary: row.monthly_salary ?? '',
      daily_rate: row.daily_rate ?? '',
      department: row.department || 'OTHER',
      designation: row.designation || '',
      is_active: row.is_active !== false,
      joining_date: row.joining_date || '',
      notes: row.notes || '',
    });
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      monthly_salary: form.monthly_salary === '' ? 0 : form.monthly_salary,
      daily_rate: form.daily_rate === '' ? 0 : form.daily_rate,
      joining_date: form.joining_date || null,
    };
    try {
      if (editing) await updateLaborWorker(editing.id, payload);
      else await createLaborWorker(payload);
      toast.success(editing ? 'Labor worker updated' : 'Labor worker added');
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this labor worker?')) return;
    try {
      await deleteLaborWorker(id);
      toast.success('Removed');
      load();
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <AppLoader message="Loading labor…" />;

  return (
    <div className="hr-page animate-fade-in">
      <div className="page-header">
        <div>
          <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 800 }}>Labor Management</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Manage daily/monthly labor workers without system login accounts.
          </p>
        </div>
        {canWriteStaff && (
          <button type="button" className="btn-primary" onClick={openCreate}>
            <Plus size={18} style={{ marginRight: 8 }} /> Add Labor
          </button>
        )}
      </div>

      <HrSummaryCards summary={summary} />

      <div className="hr-toolbar">
        <SearchInput variant="inset" placeholder="Search labor…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <DataTable
          variant="erp"
          sortable
          pageSize={25}
          columns={[
            { key: 'full_name', label: 'Name' },
            { key: 'department', label: 'Department', width: '120px' },
            { key: 'pay_type', label: 'Pay type', width: '120px' },
            { key: 'daily_rate', label: 'Daily rate', width: '110px' },
            { key: 'monthly_salary', label: 'Monthly', width: '110px' },
            { key: 'phone', label: 'Phone', width: '130px' },
            { key: 'is_active', label: 'Status', width: '90px' },
          ]}
          data={filtered}
          rowActions={canWriteStaff ? (row) => [
            { label: 'Edit', onClick: () => openEdit(row) },
            { label: 'Delete', danger: true, onClick: () => handleDelete(row.id) },
          ] : undefined}
          renderCell={(row, key) => {
            if (key === 'department') return DEPARTMENT_LABELS[row.department] || row.department;
            if (key === 'pay_type') return PAY_TYPE_LABELS[row.pay_type] || row.pay_type;
            if (key === 'daily_rate') return row.pay_type === 'DAILY' ? `Rs ${Number(row.daily_rate || 0).toLocaleString()}` : '—';
            if (key === 'monthly_salary') return row.pay_type === 'MONTHLY' ? `Rs ${Number(row.monthly_salary || 0).toLocaleString()}` : '—';
            if (key === 'is_active') {
              return <span className={`hr-badge hr-badge--${row.is_active ? 'paid' : 'draft'}`}>{row.is_active ? 'Active' : 'Inactive'}</span>;
            }
            return row[key] || '—';
          }}
        />
      </div>

      {modal && createPortal(
        <div className="modal-overlay hr-modal-overlay" onClick={() => setModal(false)}>
          <div className="card modal-panel hr-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>{editing ? 'Edit Labor Worker' : 'Add Labor Worker'}</h3>
              <button type="button" onClick={() => setModal(false)} aria-label="Close"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="staff-modal__form">
              <div className="input-group">
                <label>Full name</label>
                <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div className="form-grid-2">
                <div className="input-group">
                  <label>Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="input-group">
                  <label>CNIC</label>
                  <input value={form.cnic} onChange={(e) => setForm({ ...form, cnic: e.target.value })} />
                </div>
              </div>
              <div className="form-grid-2">
                <div className="input-group">
                  <label>Pay type</label>
                  <select value={form.pay_type} onChange={(e) => setForm({ ...form, pay_type: e.target.value })}>
                    <option value="DAILY">Daily wage</option>
                    <option value="MONTHLY">Monthly salary</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Department</label>
                  <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                    {DEPARTMENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="input-group">
                <label>Designation</label>
                <input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="e.g. Cleaner, Guard" />
              </div>
              <div className="form-grid-2">
                {form.pay_type === 'DAILY' ? (
                  <div className="input-group">
                    <label>Daily rate (PKR)</label>
                    <input type="number" min="0" value={form.daily_rate} onChange={(e) => setForm({ ...form, daily_rate: e.target.value })} />
                  </div>
                ) : (
                  <div className="input-group">
                    <label>Monthly salary (PKR)</label>
                    <input type="number" min="0" value={form.monthly_salary} onChange={(e) => setForm({ ...form, monthly_salary: e.target.value })} />
                  </div>
                )}
                <div className="input-group">
                  <label>Joining date</label>
                  <input type="date" value={form.joining_date} onChange={(e) => setForm({ ...form, joining_date: e.target.value })} />
                </div>
              </div>
              <div className="input-group">
                <label className="staff-modal__check">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                  Active worker
                </label>
              </div>
              <div className="input-group">
                <label>Notes</label>
                <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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
