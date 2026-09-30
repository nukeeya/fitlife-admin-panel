import { useMemo, useState } from 'react';
import {
  ShoppingBag,
  Plus,
  Pencil,
  Trash2,
  Search,
  Shirt,
  UtensilsCrossed,
  AlertTriangle,
  Package,
  Layers,
} from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';

const LOW_STOCK_THRESHOLD = 10;

const EMPTY_FORM = {
  name: '',
  category: 'Gym Wear',
  brand: '',
  price: '',
  cost: '',
  stock: '',
  unit: 'pcs',
  size: '',
  imageUrl: '',
  description: '',
  status: 'Active',
};

const fmtMoney = (n) => `৳${Math.round(Number(n) || 0).toLocaleString()}`;

export default function GymShop() {
  const { shopProducts, saveShopProduct, deleteShopProduct } = useGymData();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All'); // 'All' | 'Gym Wear' | 'Food'
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Active' | 'Draft' | 'Archived'

  // Add / Edit form state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const stats = useMemo(() => {
    const list = shopProducts || [];
    const units = list.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
    const costValue = list.reduce((sum, p) => sum + (Number(p.stock) || 0) * (Number(p.cost) || 0), 0);
    const retailValue = list.reduce((sum, p) => sum + (Number(p.stock) || 0) * (Number(p.price) || 0), 0);
    const lowStock = list.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD).length;
    const outOfStock = list.filter((p) => Number(p.stock) === 0).length;
    return { total: list.length, units, costValue, retailValue, lowStock, outOfStock };
  }, [shopProducts]);

  const categoryCounts = useMemo(() => {
    const list = shopProducts || [];
    return {
      All: list.length,
      'Gym Wear': list.filter((p) => p.category === 'Gym Wear').length,
      Food: list.filter((p) => p.category === 'Food').length,
    };
  }, [shopProducts]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return (shopProducts || []).filter((p) => {
      const matchesSearch =
        !q ||
        (p.name || '').toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q);
      const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [shopProducts, searchTerm, categoryFilter, statusFilter]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const openAdd = () => {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowFormModal(true);
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name || '',
      category: product.category === 'Food' ? 'Food' : 'Gym Wear',
      brand: product.brand || '',
      price: String(product.price ?? ''),
      cost: String(product.cost ?? ''),
      stock: String(product.stock ?? ''),
      unit: product.unit || 'pcs',
      size: product.size || '',
      imageUrl: product.imageUrl || '',
      description: product.description || '',
      status: product.status || 'Active',
    });
    setFormError('');
    setShowFormModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || isSaving) return;

    const payload = {
      ...form,
      name: form.name.trim(),
      price: Number(form.price) || 0,
      cost: Number(form.cost) || 0,
      stock: Number(form.stock) || 0,
    };
    if (editingProduct) payload.id = editingProduct.id;

    setIsSaving(true);
    setFormError('');
    try {
      const res = await saveShopProduct(payload);
      if (res?.error) {
        setFormError(`Could not save product: ${res.error.message}`);
      } else {
        setShowFormModal(false);
        setEditingProduct(null);
        setForm(EMPTY_FORM);
      }
    } catch (err) {
      setFormError(`Could not save product: ${err?.message || 'Unexpected error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteShopProduct(deleteTarget.id);
    } catch (err) {
      console.error('[GymShop] delete failed:', err);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const marginPct =
    Number(form.price) > 0
      ? Math.round(((Number(form.price) - Number(form.cost)) / Number(form.price)) * 100)
      : null;

  const stockBadge = (stock) => {
    if (Number(stock) === 0) return { cls: 'badge-danger', label: 'Out of Stock' };
    if (Number(stock) <= LOW_STOCK_THRESHOLD) return { cls: 'badge-warning', label: `Low · ${stock} left` };
    return { cls: 'badge-success', label: `In Stock · ${stock}` };
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Gym Shop — Wear & Nutrition</h1>
          <p className="page-subtitle">
            Manage gym apparel and food inventory: pricing, stock levels, product status and margins.
          </p>
        </div>

        <button type="button" className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} />
          + Add Product
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-card-title">TOTAL PRODUCTS</span>
          <div className="stat-card-value">{stats.total}</div>
          <span className="stat-card-label">
            {categoryCounts['Gym Wear']} apparel · {categoryCounts.Food} food items
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-card-title">UNITS IN STOCK</span>
          <div className="stat-card-value">{stats.units.toLocaleString()}</div>
          <span className="stat-card-label">Across all product listings</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-title">INVENTORY AT COST</span>
          <div className="stat-card-value">{fmtMoney(stats.costValue)}</div>
          <span className="stat-card-label">Total purchase value of stock</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-title">RETAIL VALUE</span>
          <div className="stat-card-value">{fmtMoney(stats.retailValue)}</div>
          <span className="stat-card-label">Potential revenue at full price</span>
        </div>
        <div className="stat-card" style={stats.lowStock + stats.outOfStock > 0 ? { borderLeft: '4px solid var(--warning)' } : undefined}>
          <span className="stat-card-title">LOW STOCK ALERTS</span>
          <div className="stat-card-value">{stats.lowStock + stats.outOfStock}</div>
          <span className="stat-card-label">
            {stats.outOfStock} out of stock · {stats.lowStock} running low
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="header-search" style={{ width: '300px' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search product name or brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>CATEGORY:</span>
          {['All', 'Gym Wear', 'Food'].map((c) => (
            <button
              key={c}
              type="button"
              className={`btn btn-sm ${categoryFilter === c ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCategoryFilter(c)}
            >
              {c} ({categoryCounts[c] ?? 0})
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>STATUS:</span>
          {['All', 'Active', 'Draft', 'Archived'].map((s) => (
            <button
              key={s}
              type="button"
              className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="activity-card">
        <div className="activity-header">
          <span style={{ fontWeight: 800 }}>Product Inventory</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {filtered.length} of {stats.total} products
          </span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <Package size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.5 }} />
            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-secondary)' }}>
              No products match your filter
            </div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              Try a different search, or click “+ Add Product” to stock the shop.
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px',
              padding: '20px',
            }}
          >
            {filtered.map((p) => {
              const stock = Number(p.stock) || 0;
              const badge = stockBadge(stock);
              const margin =
                Number(p.price) > 0
                  ? Math.round(((Number(p.price) - Number(p.cost)) / Number(p.price)) * 100)
                  : null;
              const CategoryIcon = p.category === 'Food' ? UtensilsCrossed : Shirt;

              return (
                <div
                  key={p.id}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-base)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Image */}
                  <div
                    style={{
                      height: '150px',
                      position: 'relative',
                      overflow: 'hidden',
                      background: 'var(--bg-card)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CategoryIcon size={44} color="var(--text-muted)" style={{ opacity: 0.4 }} />
                    {p.imageUrl && (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    )}
                    <span
                      className={`badge ${p.category === 'Food' ? 'badge-info' : 'badge-primary'}`}
                      style={{ position: 'absolute', top: '10px', left: '10px' }}
                    >
                      {p.category}
                    </span>
                    <span
                      className={`badge ${
                        p.status === 'Active'
                          ? 'badge-success'
                          : p.status === 'Draft'
                            ? 'badge-warning'
                            : 'badge-danger'
                      }`}
                      style={{ position: 'absolute', top: '10px', right: '10px' }}
                    >
                      {p.status}
                    </span>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        {p.name}
                      </h3>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {p.brand || 'No brand'}
                        {p.size ? ` · Size: ${p.size}` : ''} · per {p.unit}
                      </div>
                    </div>

                    <div
                      style={{
                        background: 'var(--bg-card)',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: '8px',
                        fontSize: '12px',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>PRICE</div>
                        <div style={{ fontWeight: 800, color: 'var(--primary)' }}>{fmtMoney(p.price)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>COST</div>
                        <div style={{ fontWeight: 700 }}>{fmtMoney(p.cost)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>MARGIN</div>
                        <div style={{ fontWeight: 700, color: margin !== null && margin >= 20 ? '#10B981' : 'var(--warning)' }}>
                          {margin !== null ? `${margin}%` : '—'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span className={`badge ${badge.cls}`}>{badge.label}</span>
                      {stock > 0 && stock <= LOW_STOCK_THRESHOLD && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--warning)', fontWeight: 700 }}>
                          <AlertTriangle size={12} /> Restock soon
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        onClick={() => openEdit(p)}
                      >
                        <Pencil size={13} /> Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          color: 'var(--danger)',
                          border: '1px solid var(--danger)',
                          background: 'transparent',
                        }}
                        onClick={() => setDeleteTarget(p)}
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={() => {
          if (!isSaving) {
            setShowFormModal(false);
            setFormError('');
          }
        }}
        title={editingProduct ? 'Edit Shop Product' : 'Add Shop Product'}
        subtitle={
          editingProduct
            ? 'Update pricing, stock levels and listing details'
            : 'List a new gym wear or food item in the shop inventory'
        }
        icon={ShoppingBag}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. FitLife Performance T-Shirt / Whey Protein 2lb"
                className="form-input"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  className="form-select"
                  value={form.category}
                  onChange={(e) => setField('category', e.target.value)}
                >
                  <option value="Gym Wear">Gym Wear</option>
                  <option value="Food">Food</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={(e) => setField('status', e.target.value)}
                >
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Brand</label>
                <input
                  type="text"
                  placeholder="e.g. FitLife / Optimum Nutrition"
                  className="form-input"
                  value={form.brand}
                  onChange={(e) => setField('brand', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{form.category === 'Food' ? 'Pack Size / Variant' : 'Size / Variant'}</label>
                <input
                  type="text"
                  placeholder={form.category === 'Food' ? 'e.g. 1kg / 12-pack' : 'e.g. M, L, XL'}
                  className="form-input"
                  value={form.size}
                  onChange={(e) => setField('size', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Selling Price (৳) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  className="form-input"
                  value={form.price}
                  onChange={(e) => setField('price', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cost Price (৳)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-input"
                  value={form.cost}
                  onChange={(e) => setField('cost', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Stock Quantity *</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  className="form-input"
                  value={form.stock}
                  onChange={(e) => setField('stock', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Unit</label>
                <input
                  type="text"
                  placeholder="pcs / kg / pack / jar"
                  className="form-input"
                  value={form.unit}
                  onChange={(e) => setField('unit', e.target.value)}
                />
              </div>
            </div>

            {marginPct !== null && (
              <div
                style={{
                  background: 'var(--bg-surface)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Layers size={14} color="var(--primary)" />
                <span>
                  Margin <strong style={{ color: 'var(--text-primary)' }}>{marginPct}%</strong> ·{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {fmtMoney((Number(form.price) || 0) - (Number(form.cost) || 0))}
                  </strong>{' '}
                  profit per {form.unit || 'unit'}
                </span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Image URL</label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                className="form-input"
                value={form.imageUrl}
                onChange={(e) => setField('imageUrl', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                rows="3"
                placeholder="Short product description shown to staff..."
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
              />
            </div>

            {formError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid var(--danger)',
                  color: 'var(--danger)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                {formError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={isSaving}
                onClick={() => {
                  setShowFormModal(false);
                  setFormError('');
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSaving}>
                {isSaving ? 'Saving...' : editingProduct ? 'Save Changes' : 'Add Product'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Shop Product"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}" from the shop inventory? This removes the product listing permanently and cannot be undone.`
            : ''
        }
        confirmText="Yes, Delete Product"
        cancelText="Keep Product"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
