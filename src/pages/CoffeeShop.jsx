import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Coffee, Minus, Plus, RefreshCw, Search, ShoppingCart, Trash2 } from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import { supabase } from '../lib/supabase';

const PAYMENT_METHODS = ['Cash', 'bKash', 'Card'];
const money = (amount) => `৳${Number(amount || 0).toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;
const todayStart = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
};

export default function CoffeeShop() {
  const { shopProducts, refresh } = useGymData();
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState({});
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [saleError, setSaleError] = useState('');
  const [notice, setNotice] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);
  const [sales, setSales] = useState([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const [salesError, setSalesError] = useState('');
  const [loadingSales, setLoadingSales] = useState(true);

  const menuItems = useMemo(
    () => (shopProducts || [])
      .filter((product) => product.category === 'Cafe' && product.status === 'Active')
      .filter((product) => product.name.toLowerCase().includes(search.trim().toLowerCase())),
    [shopProducts, search],
  );

  const cartItems = useMemo(
    () => Object.entries(cart)
      .map(([id, quantity]) => {
        const product = menuItems.find((item) => String(item.id) === id)
          || (shopProducts || []).find((item) => String(item.id) === id);
        return product ? { product, quantity } : null;
      })
      .filter(Boolean),
    [cart, menuItems, shopProducts],
  );
  const cartTotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const lowStockCount = (shopProducts || []).filter(
    (product) => product.category === 'Cafe' && product.status === 'Active' && Number(product.stock) <= 10,
  ).length;

  const loadSales = useCallback(async (isCurrent = () => true) => {
    const [recentResult, todayResult] = await Promise.all([
      supabase.from('coffee_shop_sales').select('*').order('created_at', { ascending: false }).limit(30),
      supabase.from('coffee_shop_sales').select('total').gte('created_at', todayStart()),
    ]);

    if (!isCurrent()) return;
    if (recentResult.error || todayResult.error) {
      const error = recentResult.error || todayResult.error;
      setSalesError(error.message || 'Could not load coffee shop sales. Check that migration 009 is applied.');
    } else {
      setSalesError('');
      setSales(recentResult.data || []);
      setTodayTotal((todayResult.data || []).reduce((total, sale) => total + Number(sale.total || 0), 0));
    }
    setLoadingSales(false);
  }, []);

  useEffect(() => {
    let isCurrent = true;
    const loadInitialSales = async () => {
      await loadSales(() => isCurrent);
    };
    loadInitialSales();
    return () => {
      isCurrent = false;
    };
  }, [loadSales]);

  const changeQuantity = (product, delta) => {
    setCart((current) => {
      const key = String(product.id);
      const nextQuantity = (current[key] || 0) + delta;
      if (nextQuantity <= 0) {
        const next = { ...current };
        delete next[key];
        return next;
      }
      if (nextQuantity > Number(product.stock)) return current;
      return { ...current, [key]: nextQuantity };
    });
    setSaleError('');
    setNotice('');
  };

  const checkout = async () => {
    if (checkingOut || cartItems.length === 0) return;
    setCheckingOut(true);
    setSaleError('');
    setNotice('');
    try {
      const { data: saleId, error } = await supabase.rpc('complete_coffee_shop_sale', {
        p_items: cartItems.map(({ product, quantity }) => ({
          product_id: product.id,
          quantity,
        })),
        p_payment_method: paymentMethod,
        p_customer_name: customerName.trim() || 'Walk-in Customer',
      });
      if (error) throw error;

      setCart({});
      setCustomerName('');
      setNotice(`Sale #${saleId} recorded. Thank you!`);
      await Promise.all([refresh(), loadSales()]);
    } catch (error) {
      console.error('[CoffeeShop] checkout failed:', error);
      setSaleError(error.message || 'Could not record the sale. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  };

  const refreshPage = () => {
    setLoadingSales(true);
    refresh();
    loadSales();
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Coffee Shop</h1>
          <p className="page-subtitle">Walk-in sales are welcome — customers do not need a gym membership.</p>
        </div>
        <div className="page-actions">
          <Link className="btn btn-secondary" to="/gym-shop?category=Cafe">
            Manage menu &amp; stock
          </Link>
          <button className="btn btn-secondary" type="button" onClick={refreshPage}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-card-title">TODAY'S SALES</span>
          <div className="stat-card-value">{money(todayTotal)}</div>
          <span className="stat-card-label">Coffee shop revenue today</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-title">ACTIVE MENU ITEMS</span>
          <div className="stat-card-value">{menuItems.length}</div>
          <span className="stat-card-label">Cafe menu items available to sell</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-title">LOW / OUT OF STOCK</span>
          <div className="stat-card-value">{lowStockCount}</div>
          <span className="stat-card-label">Items with 10 or fewer units</span>
        </div>
      </div>

      {salesError && <div className="alert alert-danger" role="alert">{salesError}</div>}
      {notice && <div className="alert alert-success" role="status">{notice}</div>}

      <div className="coffee-shop-columns">
        <section className="activity-card">
          <div className="activity-header">
            <div>
              <strong>Menu</strong>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: 4 }}>
                Add or update cafe menu items and stock through Gym Shop → Cafe.
              </div>
            </div>
            <label className="search-box" style={{ maxWidth: 240 }}>
              <Search size={16} />
              <input
                type="search"
                aria-label="Search menu"
                placeholder="Search menu..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>
          {menuItems.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
              <Coffee size={32} style={{ marginBottom: 10 }} />
              <p>No active cafe menu items found.</p>
              <Link className="btn btn-primary btn-sm" to="/gym-shop?category=Cafe">Add menu items</Link>
            </div>
          ) : (
            <div className="coffee-menu-grid">
              {menuItems.map((product) => {
                const quantity = cart[String(product.id)] || 0;
                const available = Number(product.stock) > 0;
                return (
                  <button
                    className="coffee-menu-item"
                    type="button"
                    key={product.id}
                    disabled={!available}
                    onClick={() => changeQuantity(product, 1)}
                  >
                    <span className="coffee-menu-item-name">{product.name}</span>
                    {product.size && <span className="coffee-menu-item-meta">{product.size}</span>}
                    <span className="coffee-menu-item-price">{money(product.price)} / {product.unit}</span>
                    <span className="coffee-menu-item-meta">
                      {available ? `${product.stock} ${product.unit} in stock` : 'Out of stock'}
                      {quantity > 0 ? ` · ${quantity} in cart` : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="activity-card">
          <div className="activity-header">
            <strong><ShoppingCart size={17} style={{ verticalAlign: 'middle', marginRight: 8 }} />Current Sale</strong>
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{cartItems.length} items</span>
          </div>
          <div className="coffee-cart">
            {cartItems.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 8px' }}>
                Select menu items to start a sale.
              </p>
            ) : cartItems.map(({ product, quantity }) => (
              <div className="coffee-cart-row" key={product.id}>
                <div style={{ minWidth: 0 }}>
                  <strong>{product.name}</strong>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    {money(product.price)} × {quantity}
                  </div>
                </div>
                <div className="coffee-quantity-controls">
                  <button type="button" aria-label={`Remove one ${product.name}`} onClick={() => changeQuantity(product, -1)}>
                    <Minus size={14} />
                  </button>
                  <span>{quantity}</span>
                  <button
                    type="button"
                    aria-label={`Add one ${product.name}`}
                    disabled={quantity >= Number(product.stock)}
                    onClick={() => changeQuantity(product, 1)}
                  >
                    <Plus size={14} />
                  </button>
                  <button type="button" aria-label={`Remove ${product.name}`} onClick={() => changeQuantity(product, -quantity)}>
                    <Trash2 size={14} />
                  </button>
                </div>
                <strong>{money(product.price * quantity)}</strong>
              </div>
            ))}
          </div>

          <div className="coffee-checkout-fields">
            <label>
              Customer name <span style={{ color: 'var(--text-muted)' }}>(optional)</span>
              <input
                className="form-input"
                value={customerName}
                maxLength={100}
                placeholder="Walk-in Customer"
                onChange={(event) => setCustomerName(event.target.value)}
              />
            </label>
            <label>
              Payment method
              <select className="form-select" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                {PAYMENT_METHODS.map((method) => <option key={method} value={method}>{method}</option>)}
              </select>
            </label>
          </div>

          <div className="coffee-total">
            <span>Total</span>
            <strong>{money(cartTotal)}</strong>
          </div>
          {saleError && <p role="alert" style={{ color: 'var(--danger)', fontSize: 13 }}>{saleError}</p>}
          <button className="btn btn-primary coffee-checkout-button" type="button" disabled={checkingOut || cartItems.length === 0} onClick={checkout}>
            {checkingOut ? 'Recording sale…' : `Complete sale · ${money(cartTotal)}`}
          </button>
        </section>
      </div>

      <section className="activity-card">
        <div className="activity-header">
          <strong>Recent Sales</strong>
          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Latest 30 transactions</span>
        </div>
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr><th>Sale</th><th>Customer</th><th>Items</th><th>Payment</th><th>Total</th><th>Time</th></tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                  {loadingSales ? 'Loading sales…' : 'No coffee shop sales yet.'}
                </td></tr>
              ) : sales.map((sale) => (
                <tr key={sale.id}>
                  <td>#{sale.id}</td>
                  <td>{sale.customer_name}</td>
                  <td>{(sale.items || []).map((item) => `${item.name} × ${item.quantity}`).join(', ')}</td>
                  <td>{sale.payment_method}</td>
                  <td>{money(sale.total)}</td>
                  <td>{new Date(sale.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
