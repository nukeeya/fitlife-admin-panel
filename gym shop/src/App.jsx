import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownWideNarrow,
  ArrowRight,
  Check,
  ChevronDown,
  Dumbbell,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  X,
} from 'lucide-react';
import { supabase } from './supabase';

const PRODUCT_COLUMNS = 'id,name,category,brand,price,stock,unit,size,image_url,description,status';
const EMPTY_FORM = { name: '', phone: '', email: '', address: '', note: '' };
const money = (amount) => `৳${Number(amount || 0).toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;

function mapProduct(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    brand: row.brand || '',
    price: Number(row.price) || 0,
    stock: Number(row.stock) || 0,
    unit: row.unit || 'pcs',
    size: row.size || '',
    imageUrl: row.image_url || '',
    description: row.description || '',
  };
}

function ProductCard({ product, onAdd }) {
  const isAvailable = product.stock > 0;

  return (
    <article className="product-card">
      <div className="product-image">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} loading="lazy" />
        ) : (
          <div className="image-placeholder"><Dumbbell size={38} /></div>
        )}
        <span className="product-category">{product.category}</span>
        {!isAvailable && <span className="stock-pill sold-out">Sold out</span>}
        {isAvailable && product.stock <= 5 && (
          <span className="stock-pill low-stock">Only {product.stock} left</span>
        )}
      </div>
      <div className="product-info">
        <div className="product-brand">{product.brand || 'FITLIFE'}</div>
        <h3>{product.name}</h3>
        {product.description && <p className="product-description">{product.description}</p>}
        <div className="product-meta">
          {product.size && <span>{product.size}</span>}
          <span>Sold per {product.unit}</span>
        </div>
        <div className="product-buy-row">
          <strong>{money(product.price)}</strong>
          <button
            className="add-button"
            type="button"
            onClick={() => onAdd(product)}
            disabled={!isAvailable}
            aria-label={`Add ${product.name} to bag`}
          >
            <Plus size={16} />
            <span>{isAvailable ? 'Add to bag' : 'Unavailable'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

function BagPanel({ cart, products, onClose, onQuantityChange, onCheckout }) {
  const lines = cart
    .map(({ id, quantity }) => ({ product: products.find((p) => p.id === id), quantity }))
    .filter((line) => line.product);
  const total = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);

  return (
    <>
      <button className="drawer-scrim" onClick={onClose} aria-label="Close shopping bag" />
      <aside className="bag-panel" aria-label="Shopping bag">
        <div className="bag-header">
          <div>
            <span className="eyebrow">YOUR SELECTION</span>
            <h2>Shopping bag</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close shopping bag">
            <X size={20} />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="bag-empty">
            <ShoppingBag size={34} />
            <h3>Your bag is empty</h3>
            <p>Find something that keeps you moving.</p>
            <button className="text-button" type="button" onClick={onClose}>Explore the shop <ArrowRight size={15} /></button>
          </div>
        ) : (
          <>
            <div className="bag-lines">
              {lines.map(({ product, quantity }) => (
                <div className="bag-line" key={product.id}>
                  <div className="bag-line-image">
                    {product.imageUrl
                      ? <img src={product.imageUrl} alt="" />
                      : <Dumbbell size={22} />}
                  </div>
                  <div className="bag-line-info">
                    <strong>{product.name}</strong>
                    <span>{money(product.price)} · {product.size || product.unit}</span>
                    <div className="quantity-control">
                      <button
                        type="button"
                        onClick={() => onQuantityChange(product, quantity - 1)}
                        aria-label={`Remove one ${product.name}`}
                      ><Minus size={13} /></button>
                      <span>{quantity}</span>
                      <button
                        type="button"
                        onClick={() => onQuantityChange(product, quantity + 1)}
                        disabled={quantity >= product.stock}
                        aria-label={`Add one ${product.name}`}
                      ><Plus size={13} /></button>
                    </div>
                  </div>
                  <strong className="line-total">{money(product.price * quantity)}</strong>
                </div>
              ))}
            </div>
            <div className="bag-summary">
              <div className="subtotal-row"><span>Subtotal</span><strong>{money(total)}</strong></div>
              <p>Delivery and payment are confirmed by the gym after you submit your request.</p>
              <button className="checkout-button" type="button" onClick={onCheckout}>
                Continue to details <ArrowRight size={17} />
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function CheckoutDialog({ form, setForm, onClose, onSubmit, isSubmitting, error }) {
  return (
    <div className="modal-scrim" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isSubmitting) onClose();
    }}>
      <section className="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
        <div className="checkout-heading">
          <div>
            <span className="eyebrow">ALMOST THERE</span>
            <h2 id="checkout-title">Delivery details</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} disabled={isSubmitting} aria-label="Close checkout">
            <X size={20} />
          </button>
        </div>
        <p className="checkout-intro">Send an order request. Our team will contact you to confirm availability, delivery, and payment.</p>
        <form onSubmit={onSubmit} className="checkout-form">
          <label>
            Full name
            <input required minLength="2" maxLength="100" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <div className="form-two-col">
            <label>
              Phone number
              <input required minLength="6" maxLength="30" autoComplete="tel" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>
            <label>
              Email <span className="optional-label">Optional</span>
              <input maxLength="254" autoComplete="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
          </div>
          <label>
            Delivery address
            <textarea required minLength="4" maxLength="500" rows="3" autoComplete="street-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </label>
          <label>
            Note <span className="optional-label">Optional</span>
            <textarea maxLength="1000" rows="2" placeholder="Size, preferred time, or anything else we should know" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </label>
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="checkout-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending request…' : 'Submit order request'}
            {!isSubmitting && <ArrowRight size={17} />}
          </button>
          <p className="privacy-note">Submitting this request does not charge you or confirm the order.</p>
        </form>
      </section>
    </div>
  );
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(Boolean(supabase));
  const [loadError, setLoadError] = useState(
    supabase ? '' : 'The shop is not configured yet. Please try again later.',
  );
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('featured');
  const [cart, setCart] = useState([]);
  const [isBagOpen, setIsBagOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    if (!supabase) return undefined;

    let mounted = true;
    const loadProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('shop_products')
          .select(PRODUCT_COLUMNS)
          .eq('status', 'Active')
          .order('id', { ascending: false });

        if (!mounted) return;
        if (error) {
          console.error('[GymShop storefront] product load failed:', error);
          setLoadError('We could not load the shop right now. Please try again.');
        } else {
          setProducts((data || []).map(mapProduct));
          setLoadError('');
        }
      } catch (error) {
        console.error('[GymShop storefront] product load failed:', error);
        if (mounted) setLoadError('We could not load the shop right now. Please try again.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadProducts();
    const channel = supabase
      .channel('public-shop-products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shop_products' }, () => {
        loadProducts();
      })
      .subscribe();
    const refreshTimer = window.setInterval(() => loadProducts(), 60_000);

    return () => {
      mounted = false;
      window.clearInterval(refreshTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  const categories = useMemo(
    () => ['All', ...new Set(products.map((product) => product.category).filter(Boolean))],
    [products],
  );
  const visibleProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    const list = products.filter((product) => {
      const matchesCategory = category === 'All' || product.category === category;
      const matchesQuery = !term || [product.name, product.brand, product.description]
        .some((value) => String(value || '').toLowerCase().includes(term));
      return matchesCategory && matchesQuery;
    });
    if (sort === 'price-low') list.sort((a, b) => a.price - b.price);
    if (sort === 'price-high') list.sort((a, b) => b.price - a.price);
    return list;
  }, [products, category, query, sort]);
  const bagCount = cart.reduce((sum, line) => sum + line.quantity, 0);

  const addToBag = (product) => {
    setCart((current) => {
      const line = current.find((item) => item.id === product.id);
      if (!line) return [...current, { id: product.id, quantity: 1 }];
      return current.map((item) => item.id === product.id
        ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
        : item);
    });
    setIsBagOpen(true);
  };

  const updateQuantity = (product, quantity) => {
    if (quantity < 1) {
      setCart((current) => current.filter((item) => item.id !== product.id));
      return;
    }
    setCart((current) => current.map((item) => item.id === product.id
      ? { ...item, quantity: Math.min(quantity, product.stock) }
      : item));
  };

  const submitOrder = async (event) => {
    event.preventDefault();
    if (!supabase || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const { data, error } = await supabase.rpc('submit_shop_order', {
        p_customer_name: form.name.trim(),
        p_phone: form.phone.trim(),
        p_email: form.email.trim() || null,
        p_delivery_address: form.address.trim(),
        p_customer_note: form.note.trim() || null,
        p_items: cart.map(({ id, quantity }) => ({ product_id: id, quantity })),
      });
      if (error) {
        setSubmitError(error.message || 'We could not submit your request. Please try again.');
        return;
      }
      setCart([]);
      setForm(EMPTY_FORM);
      setIsCheckoutOpen(false);
      setIsBagOpen(false);
      setOrderId(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('[GymShop storefront] order submission failed:', error);
      setSubmitError('We could not submit your request. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="storefront">
      <div className="announcement"><span>TRAIN WITH INTENTION. SHOW UP STRONG.</span><span>FITLIFE GYM · DHAKA</span></div>
      <header className="store-header">
        <a className="wordmark" href="/" aria-label="FitLife Shop home">
          <span className="wordmark-icon"><Dumbbell size={19} /></span>
          <span>FIT<span>LIFE</span><small>TRAINING GOODS</small></span>
        </a>
        <nav className="desktop-nav" aria-label="Shop sections">
          <a href="#shop">Shop all</a>
          <a href="#shop" onClick={() => setCategory('Gym Wear')}>Apparel</a>
          <a href="#shop" onClick={() => setCategory('Food')}>Nutrition</a>
        </nav>
        <button className="bag-trigger" type="button" onClick={() => setIsBagOpen(true)}>
          <ShoppingBag size={18} />
          <span>Bag</span>
          <span className="bag-count">{bagCount}</span>
        </button>
      </header>

      <main>
        {orderId && (
          <section className="order-success" role="status">
            <div className="success-icon"><Check size={22} /></div>
            <div><strong>Request received</strong><p>Your request #{orderId} is with our team. We’ll contact you to confirm the details.</p></div>
            <button className="icon-button" type="button" aria-label="Dismiss confirmation" onClick={() => setOrderId(null)}><X size={18} /></button>
          </section>
        )}
        <section className="hero">
          <div className="hero-content">
            <span className="hero-label"><span /> FITLIFE GYM SHOP</span>
            <h1>BUILT FOR<br /><em>THE WORK.</em></h1>
            <p>Gear and good fuel for the days you show up. Find your next training essential.</p>
            <a href="#shop" className="hero-button">Shop the collection <ArrowDownWideNarrow size={16} /></a>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="hero-orbit orbit-one" />
            <div className="hero-orbit orbit-two" />
            <div className="hero-figure"><Dumbbell size={158} strokeWidth={1.1} /></div>
            <span className="hero-art-caption">MOVE WITH PURPOSE<br />EST. EVERY DAY</span>
            <span className="hero-serial">FL / 001</span>
          </div>
          <div className="hero-index">01 — TRAINING ESSENTIALS</div>
        </section>

        <section className="shop-section" id="shop">
          <div className="section-heading">
            <div>
              <span className="eyebrow">THE FITLIFE EDIT</span>
              <h2>Find your <em>gear.</em></h2>
              <p>Curated essentials to keep your training moving.</p>
            </div>
            <div className="result-count">{visibleProducts.length} PRODUCTS <span>·</span> UPDATED LIVE</div>
          </div>

          <div className="shop-toolbar">
            <div className="category-tabs" aria-label="Product categories">
              {categories.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={category === item ? 'category-tab active' : 'category-tab'}
                  onClick={() => setCategory(item)}
                >{item === 'Food' ? 'Nutrition' : item === 'Gym Wear' ? 'Apparel' : 'All goods'}</button>
              ))}
            </div>
            <div className="toolbar-controls">
              <label className="search-field">
                <Search size={16} />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products" aria-label="Search products" />
              </label>
              <label className="sort-field">
                <span>Sort</span>
                <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort products">
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                </select>
                <ChevronDown size={14} />
              </label>
            </div>
          </div>

          {loadError ? (
            <div className="state-panel">
              <h3>Shop temporarily unavailable</h3>
              <p>{loadError}</p>
              <button className="secondary-button" type="button" onClick={() => window.location.reload()}>Try again</button>
            </div>
          ) : isLoading ? (
            <div className="state-panel"><div className="loader" /><p>Finding your training essentials…</p></div>
          ) : visibleProducts.length === 0 ? (
            <div className="state-panel">
              <h3>{products.length ? 'No products found' : 'The collection is on its way'}</h3>
              <p>{products.length ? 'Try another search or category.' : 'Check back soon for the latest gear.'}</p>
            </div>
          ) : (
            <div className="product-grid">
              {visibleProducts.map((product) => <ProductCard key={product.id} product={product} onAdd={addToBag} />)}
            </div>
          )}
        </section>

        <section className="shop-note">
          <span className="note-mark"><Dumbbell size={20} /></span>
          <div><strong>Good gear. Better sessions.</strong><p>Submit an order request and our gym team will confirm availability, delivery, and payment directly with you.</p></div>
          <a href="#shop">Explore the shop <ArrowRight size={16} /></a>
        </section>
      </main>

      <footer className="store-footer">
        <a className="wordmark footer-wordmark" href="#"><span className="wordmark-icon"><Dumbbell size={17} /></span><span>FIT<span>LIFE</span><small>TRAINING GOODS</small></span></a>
        <span>© {new Date().getFullYear()} FITLIFE GYM. TRAIN WITH PURPOSE.</span>
        <a href="#shop">Back to top ↑</a>
      </footer>

      {isBagOpen && (
        <BagPanel
          cart={cart}
          products={products}
          onClose={() => setIsBagOpen(false)}
          onQuantityChange={updateQuantity}
          onCheckout={() => { setSubmitError(''); setIsCheckoutOpen(true); }}
        />
      )}
      {isCheckoutOpen && (
        <CheckoutDialog
          form={form}
          setForm={setForm}
          onClose={() => setIsCheckoutOpen(false)}
          onSubmit={submitOrder}
          isSubmitting={isSubmitting}
          error={submitError}
        />
      )}
    </div>
  );
}
