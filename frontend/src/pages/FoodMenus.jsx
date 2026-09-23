import { useState, useEffect, useCallback } from 'react';
import { UtensilsCrossed, Trash2, Edit, X, Plus } from 'lucide-react';
import SearchInput from '../components/SearchInput';
import DataTable from '../components/ui/DataTable';
import ErpPageShell from '../components/ui/ErpPageShell';
import GhFilterSelect from '../components/guesthouse/GhFilterSelect';
import client from '../api/client';
import toast from 'react-hot-toast';
import AppLoader from '../components/AppLoader';
import {
  CATEGORY_LABELS,
  CATEGORY_STYLES,
  linesToItems,
  emptyFoodMenuForm,
  parseFoodMenuToForm,
} from '../utils/foodHelpers';
import { usePermissions } from '../hooks/usePermissions';
import { formatRs } from '../utils/currency';

const CATEGORY_FILTER_OPTIONS = [
  { value: '', label: 'All categories' },
  ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
];

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'true', label: 'Active only' },
  { value: 'false', label: 'Inactive' },
];

const FoodMenus = () => {
  const { canManage } = usePermissions();
  const [menus, setMenus] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [formData, setFormData] = useState(emptyFoodMenuForm);

  const fetchMenus = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterCategory) params.append('category', filterCategory);
      if (filterActive === 'true' || filterActive === 'false') params.append('is_active', filterActive);

      const qs = params.toString();
      const url = qs ? `/food/menus/?${qs}` : '/food/menus/';
      const response = await client.get(url);
      const data = response.data.results || response.data;
      setMenus(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load food menus');
      setMenus([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, filterCategory, filterActive]);

  useEffect(() => {
    void fetchMenus();
  }, [fetchMenus]);

  const openModal = (menu = null) => {
    if (!canManage) {
      toast.error('You do not have permission to modify food menus.');
      return;
    }
    if (menu) {
      setEditing(menu);
      setFormData(parseFoodMenuToForm(menu));
    } else {
      setEditing(null);
      setFormData(emptyFoodMenuForm);
    }
    setShowModal(true);
  };

  const parseError = (err) => {
    const d = err.response?.data;
    if (!d) return 'Could not save food menu';
    if (typeof d === 'string') return d;
    if (d.detail) return String(d.detail);
    const first = Object.entries(d).find(([, v]) => v != null);
    if (first) {
      const [k, v] = first;
      const msg = Array.isArray(v) ? v[0] : typeof v === 'object' ? JSON.stringify(v) : String(v);
      return `${k}: ${msg}`;
    }
    return 'Could not save food menu';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name.trim(),
      category: formData.category,
      description: formData.description.trim(),
      menu_items: linesToItems(formData.menu_lines),
      price_per_menu: parseFloat(formData.price_per_menu || 0) || 0,
      is_active: formData.is_active,
      display_order: parseInt(formData.display_order || 0, 10) || 0,
    };
    try {
      if (editing) {
        await client.put(`/food/menus/${editing.id}/`, payload);
        toast.success('Food menu updated');
      } else {
        await client.post('/food/menus/', payload);
        toast.success('Food menu created');
      }
      setShowModal(false);
      fetchMenus();
    } catch (err) {
      toast.error(parseError(err));
    }
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    if (!canManage) return;
    if (!window.confirm('Delete this food menu?')) return;
    try {
      await client.delete(`/food/menus/${id}/`);
      toast.success('Food menu deleted');
      fetchMenus();
    } catch {
      toast.error('Failed to delete food menu');
    }
  };

  return (
    <>
      <ErpPageShell
        description="Food quotation menus with dish list and price per menu."
        actions={canManage && (
          <button type="button" className="btn-primary" onClick={() => openModal()}>
            <Plus size={18} /> New food menu
          </button>
        )}
        toolbar={(
          <div className="search-filter-bar" style={{ margin: 0, flex: 1 }}>
            <div className="search-filter-bar__search">
              <SearchInput
                variant="inset"
                placeholder="Search food menus…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <GhFilterSelect
              value={filterCategory}
              onChange={setFilterCategory}
              options={CATEGORY_FILTER_OPTIONS}
              aria-label="Filter by category"
            />
            <GhFilterSelect
              value={filterActive}
              onChange={setFilterActive}
              options={STATUS_FILTER_OPTIONS}
              aria-label="Filter by status"
            />
          </div>
        )}
      >
        {isLoading ? (
          <AppLoader inline message="Loading food menus…" />
        ) : menus.length === 0 ? (
          <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <UtensilsCrossed size={40} style={{ margin: '0 auto 12px', opacity: 0.35 }} />
            <p style={{ fontSize: '15px', fontWeight: '600', margin: 0 }}>No food menus yet</p>
            <p style={{ fontSize: '13px', marginTop: '8px' }}>Add menus with price per menu for food quotations.</p>
          </div>
        ) : (
          <div className="erp-card erp-card--flat">
            <DataTable
              columns={[
                { key: 'name', label: 'Food menu' },
                { key: 'category', label: 'Category', width: '120px' },
                { key: 'items', label: 'Menu items' },
                { key: 'price', label: 'Price per menu', width: '140px' },
                { key: 'status', label: 'Status', width: '100px' },
              ]}
              data={menus}
              pageSize={12}
              emptyTitle="No menus match"
              onRowClick={(row) => canManage && openModal(row)}
              rowActions={canManage ? (row) => [
                { label: 'Edit', icon: <Edit size={14} />, onClick: () => openModal(row) },
                { label: 'Delete', icon: <Trash2 size={14} />, danger: true, onClick: () => handleDelete(row.id) },
              ] : undefined}
              renderCell={(row, key) => {
                if (key === 'name') {
                  return (
                    <div>
                      <p style={{ margin: 0, fontWeight: 700 }}>{row.name}</p>
                      {row.description ? (
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                          {row.description}
                        </p>
                      ) : null}
                    </div>
                  );
                }
                if (key === 'category') {
                  const style = CATEGORY_STYLES[row.category] || CATEGORY_STYLES.STANDARD;
                  return (
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 700,
                      background: style.bg,
                      color: style.color,
                    }}
                    >
                      {CATEGORY_LABELS[row.category] || row.category}
                    </span>
                  );
                }
                if (key === 'items') {
                  const items = Array.isArray(row.menu_items) ? row.menu_items : [];
                  if (!items.length) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
                  const preview = items.slice(0, 3).join(', ');
                  const extra = items.length > 3 ? ` +${items.length - 3}` : '';
                  return <span title={items.join(', ')}>{preview}{extra}</span>;
                }
                if (key === 'price') return <strong>{formatRs(row.price_per_menu)}</strong>;
                if (key === 'status') {
                  return (
                    <span style={{
                      fontWeight: 700,
                      color: row.is_active !== false ? '#166534' : '#94a3b8',
                    }}
                    >
                      {row.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  );
                }
                return row[key];
              }}
            />
          </div>
        )}
      </ErpPageShell>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="card animate-fade-in"
            style={{ width: '100%', maxWidth: 520, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                {editing ? 'Edit food menu' : 'New food menu'}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: 'transparent', color: 'var(--text-muted)', padding: 4 }} aria-label="Close">
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Food menu name</span>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Standard Wedding Menu"
                />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Category</span>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Price per menu (PKR)</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={formData.price_per_menu}
                    onChange={(e) => setFormData({ ...formData, price_per_menu: e.target.value })}
                    placeholder="0"
                  />
                </label>
              </div>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Menu items (one per line)</span>
                <textarea
                  rows={5}
                  value={formData.menu_lines}
                  onChange={(e) => setFormData({ ...formData, menu_lines: e.target.value })}
                  placeholder={'Chicken Karahi\nMutton Biryani\nSalad\nRaita\nDessert'}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Description</span>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional notes for this quotation menu"
                />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                Active (available for quotations)
              </label>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">{editing ? 'Save changes' : 'Create menu'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default FoodMenus;
