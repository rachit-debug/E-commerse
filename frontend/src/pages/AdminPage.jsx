import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import FormField from '../components/FormField'
import './AdminPage.css'

const API = 'https://e-commerse-backend-vxjn.onrender.com/api'

const emptyCategoryForm = {
  title: '',
  description: '',
  imageUrl: '',
  isActive: true,
}

const emptyProductForm = {
  title: '',
  description: '',
  mrpPrice: '',
  sellingPrice: '',
  imageUrls: '',
  category: '',
  stockQty: '',
  brand: '',
  rating: '0',
  noOfRatings: '0',
  isActive: true,
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'orders', label: 'Orders' },
  { id: 'categories', label: 'Categories' },
  { id: 'products', label: 'Products' },
]

const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function shortId(id) {
  return id?.slice(-8).toUpperCase() || '—'
}

function parseImageUrls(text) {
  return text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function categoryLabel(categories, id) {
  const cat = categories.find((c) => c._id === id || c._id === id?._id)
  return cat?.title || '—'
}

export default function AdminPage() {
  const [authState, setAuthState] = useState('loading')
  const [tab, setTab] = useState('overview')
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])

  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm)
  const [editingCategoryId, setEditingCategoryId] = useState(null)
  const [categoryMsg, setCategoryMsg] = useState('')
  const [categorySuccess, setCategorySuccess] = useState('')
  const [categoryLoading, setCategoryLoading] = useState(false)
  const [categoriesLoading, setCategoriesLoading] = useState(false)

  const [productForm, setProductForm] = useState(emptyProductForm)
  const [editingProductId, setEditingProductId] = useState(null)
  const [productMsg, setProductMsg] = useState('')
  const [productSuccess, setProductSuccess] = useState('')
  const [productLoading, setProductLoading] = useState(false)
  const [productsLoading, setProductsLoading] = useState(false)

  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState('')
  const [orderFilter, setOrderFilter] = useState('all')
  const [statusUpdating, setStatusUpdating] = useState({})
  const [statusFeedback, setStatusFeedback] = useState({})
  const [expandedOrderId, setExpandedOrderId] = useState(null)

  async function fetchCategories() {
    setCategoriesLoading(true)
    try {
      const res = await fetch(`${API}/category/get-all-categories`, { credentials: 'include' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to load categories')
      setCategories(data.categories || [])
    } catch (err) {
      setCategoryMsg(err.message)
    } finally {
      setCategoriesLoading(false)
    }
  }

  async function fetchProducts() {
    setProductsLoading(true)
    try {
      const res = await fetch(`${API}/product/get-all-products`, { credentials: 'include' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to load products')
      setProducts(data.products || [])
    } catch (err) {
      setProductMsg(err.message)
    } finally {
      setProductsLoading(false)
    }
  }

  async function fetchOrders() {
    setOrdersLoading(true)
    setOrdersError('')
    try {
      const res = await fetch(`${API}/order/get-all-orders`, { credentials: 'include' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to load orders')
      const sorted = (data.orders || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      )
      setOrders(sorted)
    } catch (err) {
      setOrdersError(err.message)
    } finally {
      setOrdersLoading(false)
    }
  }

  async function handleStatusChange(orderId, newStatus) {
    setStatusUpdating((prev) => ({ ...prev, [orderId]: true }))
    setStatusFeedback((prev) => ({ ...prev, [orderId]: null }))
    try {
      const res = await fetch(`${API}/order/update-order-status/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Update failed')
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
      )
      setStatusFeedback((prev) => ({ ...prev, [orderId]: { type: 'success', msg: 'Status updated' } }))
      setTimeout(
        () => setStatusFeedback((prev) => ({ ...prev, [orderId]: null })),
        2000
      )
    } catch (err) {
      setStatusFeedback((prev) => ({ ...prev, [orderId]: { type: 'error', msg: err.message } }))
    } finally {
      setStatusUpdating((prev) => ({ ...prev, [orderId]: false }))
    }
  }

  async function loadDashboardData() {
    await Promise.all([fetchCategories(), fetchProducts(), fetchOrders()])
  }

  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await fetch(`${API}/user/get-user`, { credentials: 'include' })
        const data = await res.json()
        if (!res.ok) {
          setAuthState('guest')
          return
        }
        if (data.user?.role !== 'admin') {
          setAuthState('forbidden')
          return
        }
        setAuthState('admin')
        await loadDashboardData()
      } catch {
        setAuthState('guest')
      }
    }
    checkAdmin()
  }, [])

  function resetCategoryForm() {
    setCategoryForm(emptyCategoryForm)
    setEditingCategoryId(null)
    setCategoryMsg('')
    setCategorySuccess('')
  }

  function startEditCategory(category) {
    setEditingCategoryId(category._id)
    setCategoryForm({
      title: category.title || '',
      description: category.description || '',
      imageUrl: category.imageUrl || '',
      isActive: category.isActive !== false,
    })
    setCategoryMsg('')
    setCategorySuccess('')
    setTab('categories')
  }

  async function handleCategorySubmit(e) {
    e.preventDefault()
    setCategoryMsg('')
    setCategorySuccess('')
    setCategoryLoading(true)

    try {
      if (editingCategoryId) {
        const res = await fetch(`${API}/category/update/${editingCategoryId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            title: categoryForm.title.trim(),
            description: categoryForm.description.trim() || undefined,
            imageUrl: categoryForm.imageUrl.trim() || undefined,
            isActive: categoryForm.isActive,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Update failed')
        setCategorySuccess(data.message || 'Category updated')
        resetCategoryForm()
      } else {
        const res = await fetch(`${API}/category/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            title: categoryForm.title.trim(),
            description: categoryForm.description.trim() || undefined,
            imageUrl: categoryForm.imageUrl.trim() || undefined,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Create failed')
        setCategorySuccess(data.message || 'Category created')
        setCategoryForm(emptyCategoryForm)
      }
      await fetchCategories()
    } catch (err) {
      setCategoryMsg(err.message)
    } finally {
      setCategoryLoading(false)
    }
  }

  function resetProductForm() {
    setProductForm(emptyProductForm)
    setEditingProductId(null)
    setProductMsg('')
    setProductSuccess('')
  }

  function startEditProduct(product) {
    const categoryId =
      typeof product.category === 'object' ? product.category?._id : product.category

    setEditingProductId(product._id)
    setProductForm({
      title: product.title || '',
      description: product.description || '',
      mrpPrice: String(product.mrpPrice ?? ''),
      sellingPrice: String(product.sellingPrice ?? ''),
      imageUrls: (product.imageUrls || []).join('\n'),
      category: categoryId || '',
      stockQty: String(product.stockQty ?? ''),
      brand: product.brand || '',
      rating: String(product.rating ?? 0),
      noOfRatings: String(product.noOfRatings ?? 0),
      isActive: product.isActive !== false,
    })
    setProductMsg('')
    setProductSuccess('')
    setTab('products')
  }

  function buildProductPayload() {
    return {
      title: productForm.title.trim(),
      description: productForm.description.trim() || undefined,
      mrpPrice: Number(productForm.mrpPrice),
      sellingPrice: Number(productForm.sellingPrice),
      imageUrls: parseImageUrls(productForm.imageUrls),
      category: productForm.category,
      stockQty: Number(productForm.stockQty),
      brand: productForm.brand.trim(),
      rating: Number(productForm.rating),
      noOfRatings: Number(productForm.noOfRatings),
      isActive: productForm.isActive,
    }
  }

  async function handleProductSubmit(e) {
    e.preventDefault()
    setProductMsg('')
    setProductSuccess('')
    setProductLoading(true)

    const payload = buildProductPayload()

    try {
      if (editingProductId) {
        const res = await fetch(`${API}/product/update/${editingProductId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Update failed')
        setProductSuccess(data.message || 'Product updated')
        resetProductForm()
      } else {
        const { isActive: _, ...createPayload } = payload
        const res = await fetch(`${API}/product/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(createPayload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Create failed')
        setProductSuccess(data.message || 'Product created')
        setProductForm(emptyProductForm)
      }
      await fetchProducts()
    } catch (err) {
      setProductMsg(err.message)
    } finally {
      setProductLoading(false)
    }
  }

  if (authState === 'loading') {
    return (
      <div className="admin-page">
        <p className="admin-page__status">Checking access…</p>
      </div>
    )
  }

  if (authState === 'guest') {
    return (
      <div className="admin-page">
        <div className="admin-page__gate">
          <h1>Admin dashboard</h1>
          <p>Sign in with an admin account to manage the store.</p>
          <Link to="/login" className="admin-page__btn">
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  if (authState === 'forbidden') {
    return (
      <div className="admin-page">
        <div className="admin-page__gate">
          <h1>Access denied</h1>
          <p>This area is restricted to administrators.</p>
          <Link to="/" className="admin-page__btn admin-page__btn--ghost">
            Back to home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <aside className="admin-dash__sidebar">
        <div className="admin-dash__brand">
          <span className="admin-dash__mark">M</span>
          <div>
            <span className="admin-dash__brand-name">Maison</span>
            <span className="admin-dash__brand-role">Admin</span>
          </div>
        </div>

        <nav className="admin-dash__nav" aria-label="Admin sections">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`admin-dash__nav-item${tab === item.id ? ' is-active' : ''}`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <Link to="/" className="admin-dash__back">
          ← Storefront
        </Link>
      </aside>

      <div className="admin-dash__main">
        <header className="admin-dash__top">
          <div>
            <p className="admin-page__eyebrow">Dashboard</p>
            <h1>
              {tab === 'overview' && 'Overview'}
              {tab === 'orders' && 'Orders'}
              {tab === 'categories' && 'Categories'}
              {tab === 'products' && 'Products'}
            </h1>
          </div>
          <button
            type="button"
            className="admin-page__btn admin-page__btn--ghost admin-page__btn--sm"
            onClick={loadDashboardData}
            disabled={categoriesLoading || productsLoading || ordersLoading}
          >
            {categoriesLoading || productsLoading || ordersLoading ? 'Refreshing…' : 'Refresh all'}
          </button>
        </header>

        {tab === 'overview' && (
          <div className="admin-dash__overview">
            <div className="admin-stats">
              <article className="admin-stat">
                <p className="admin-stat__label">Orders</p>
                <p className="admin-stat__value">{orders.length}</p>
                <button type="button" className="admin-stat__link" onClick={() => setTab('orders')}>
                  Manage →
                </button>
              </article>
              <article className="admin-stat">
                <p className="admin-stat__label">Pending</p>
                <p className="admin-stat__value">
                  {orders.filter((o) => o.status === 'pending').length}
                </p>
                <button type="button" className="admin-stat__link" onClick={() => { setOrderFilter('pending'); setTab('orders') }}>
                  View →
                </button>
              </article>
              <article className="admin-stat">
                <p className="admin-stat__label">Products</p>
                <p className="admin-stat__value">{products.length}</p>
                <button type="button" className="admin-stat__link" onClick={() => setTab('products')}>
                  Manage →
                </button>
              </article>
              <article className="admin-stat">
                <p className="admin-stat__label">Categories</p>
                <p className="admin-stat__value">{categories.length}</p>
                <button type="button" className="admin-stat__link" onClick={() => setTab('categories')}>
                  Manage →
                </button>
              </article>
            </div>

            <div className="admin-overview__panels">
              <section className="admin-panel">
                <div className="admin-panel__head">
                  <h2>Recent orders</h2>
                  <button type="button" className="admin-stat__link" onClick={() => setTab('orders')}>
                    View all →
                  </button>
                </div>
                {orders.length === 0 ? (
                  <p className="admin-page__empty">No orders yet.</p>
                ) : (
                  <ul className="admin-list admin-list--compact">
                    {orders.slice(0, 5).map((order) => {
                      const customer = order.userId
                      return (
                        <li key={order._id} className="admin-list__item">
                          <div className="admin-list__main">
                            <div>
                              <h3>#{shortId(order._id)}</h3>
                              <p className="admin-list__meta">
                                {customer?.name || 'Unknown'} · ₹{order.totalAmount?.toLocaleString('en-IN')}
                              </p>
                            </div>
                          </div>
                          <span className={`admin-overview__status admin-overview__status--${order.status}`}>
                            {STATUS_LABELS[order.status]}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>

              <section className="admin-panel">
                <div className="admin-panel__head">
                  <h2>Recent products</h2>
                  <button type="button" className="admin-stat__link" onClick={() => setTab('products')}>
                    View all →
                  </button>
                </div>
                {products.length === 0 ? (
                  <p className="admin-page__empty">No active products yet.</p>
                ) : (
                  <ul className="admin-list admin-list--compact">
                    {products.slice(0, 5).map((p) => (
                      <li key={p._id} className="admin-list__item">
                        <div className="admin-list__main">
                          <ProductThumb product={p} />
                          <div>
                            <h3>{p.title}</h3>
                            <p className="admin-list__meta">
                              {p.brand} · ₹{p.sellingPrice} · Stock {p.stockQty}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="admin-page__btn admin-page__btn--ghost admin-page__btn--sm"
                          onClick={() => startEditProduct(p)}
                        >
                          Edit
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        )}

        {tab === 'orders' && (
          <div className="admin-orders">
            {/* Status filter pills */}
            <div className="admin-orders__filters">
              {['all', ...ORDER_STATUSES].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`admin-orders__filter-btn${orderFilter === s ? ' is-active' : ''}`}
                  onClick={() => setOrderFilter(s)}
                >
                  {s === 'all' ? 'All' : STATUS_LABELS[s]}
                  <span className="admin-orders__filter-count">
                    {s === 'all' ? orders.length : orders.filter((o) => o.status === s).length}
                  </span>
                </button>
              ))}
              <button
                type="button"
                className="admin-page__btn admin-page__btn--ghost admin-page__btn--sm"
                onClick={fetchOrders}
                disabled={ordersLoading}
                style={{ marginLeft: 'auto' }}
              >
                {ordersLoading ? '…' : 'Refresh'}
              </button>
            </div>

            {ordersError ? (
              <p className="admin-form__msg admin-form__msg--error">{ordersError}</p>
            ) : null}

            {ordersLoading && orders.length === 0 ? (
              <p className="admin-page__empty">Loading orders…</p>
            ) : (
              (() => {
                const filtered =
                  orderFilter === 'all'
                    ? orders
                    : orders.filter((o) => o.status === orderFilter)

                if (filtered.length === 0) {
                  return (
                    <p className="admin-page__empty">
                      No {orderFilter === 'all' ? '' : orderFilter} orders found.
                    </p>
                  )
                }

                return (
                  <ul className="admin-orders__list">
                    {filtered.map((order) => {
                      const isExpanded = expandedOrderId === order._id
                      const customer = order.userId
                      const items = (order.products || []).filter(
                        (item) => item.product && typeof item.product === 'object'
                      )
                      const fb = statusFeedback[order._id]

                      return (
                        <li key={order._id} className="admin-order-card">
                          {/* Card header row */}
                          <div className="admin-order-card__row">
                            <div className="admin-order-card__left">
                              <span className="admin-order-card__id">#{shortId(order._id)}</span>
                              <span className="admin-order-card__date">{formatDate(order.createdAt)}</span>
                            </div>

                            <div className="admin-order-card__customer">
                              <span className="admin-order-card__name">
                                {customer?.name || 'Unknown'}
                              </span>
                              <span className="admin-order-card__email">
                                {customer?.email || ''}
                              </span>
                            </div>

                            <div className="admin-order-card__right">
                              <span className="admin-order-card__total">
                                ₹{order.totalAmount?.toLocaleString('en-IN')}
                              </span>
                              <span className="admin-order-card__payment">{order.paymentMethod}</span>

                              {/* Inline status selector */}
                              <div className="admin-order-card__status-wrap">
                                <select
                                  className={`admin-order-status-select admin-order-status-select--${order.status}`}
                                  value={order.status}
                                  onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                  disabled={statusUpdating[order._id]}
                                >
                                  {ORDER_STATUSES.map((s) => (
                                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                                  ))}
                                </select>
                                {statusUpdating[order._id] ? (
                                  <span className="admin-order-card__status-spinner" aria-hidden />
                                ) : null}
                                {fb ? (
                                  <span
                                    className={`admin-order-card__status-msg${fb.type === 'error' ? ' is-error' : ''}`}
                                  >
                                    {fb.msg}
                                  </span>
                                ) : null}
                              </div>

                              <button
                                type="button"
                                className="admin-page__btn admin-page__btn--ghost admin-page__btn--sm"
                                onClick={() =>
                                  setExpandedOrderId((prev) =>
                                    prev === order._id ? null : order._id
                                  )
                                }
                                aria-expanded={isExpanded}
                              >
                                {isExpanded ? 'Hide' : 'Items'}
                              </button>
                            </div>
                          </div>

                          {/* Expanded items */}
                          {isExpanded ? (
                            <div className="admin-order-card__items">
                              {items.length === 0 ? (
                                <p className="admin-page__empty">Item details unavailable.</p>
                              ) : (
                                <ul className="admin-order-items">
                                  {items.map((item) => {
                                    const p = item.product
                                    return (
                                      <li key={item._id} className="admin-order-item">
                                        {p.imageUrls?.[0] ? (
                                          <img
                                            src={p.imageUrls[0]}
                                            alt=""
                                            className="admin-list__thumb"
                                          />
                                        ) : (
                                          <div className="admin-list__thumb admin-list__thumb--placeholder" aria-hidden>
                                            {p.title?.charAt(0) || '?'}
                                          </div>
                                        )}
                                        <div className="admin-order-item__info">
                                          <p className="admin-order-item__title">{p.title}</p>
                                          <p className="admin-order-item__brand">{p.brand}</p>
                                        </div>
                                        <div className="admin-order-item__right">
                                          <span>Qty: {item.quantity}</span>
                                          <span className="admin-order-item__price">
                                            ₹{(p.sellingPrice * item.quantity).toLocaleString('en-IN')}
                                          </span>
                                        </div>
                                      </li>
                                    )
                                  })}
                                </ul>
                              )}
                              <div className="admin-order-card__summary">
                                <span>Order total</span>
                                <span>₹{order.totalAmount?.toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                          ) : null}
                        </li>
                      )
                    })}
                  </ul>
                )
              })()
            )}
          </div>
        )}

        {tab === 'categories' && (
          <div className="admin-dash__section">
            <section className="admin-panel">
              <h2>{editingCategoryId ? 'Edit category' : 'New category'}</h2>
              <form className="admin-form" onSubmit={handleCategorySubmit}>
                {categoryMsg ? (
                  <p className="admin-form__msg admin-form__msg--error">{categoryMsg}</p>
                ) : null}
                {categorySuccess ? (
                  <p className="admin-form__msg admin-form__msg--success">{categorySuccess}</p>
                ) : null}

                <FormField
                  id="cat-title"
                  label="Title"
                  hint="3–50 characters"
                  value={categoryForm.title}
                  onChange={(e) => setCategoryForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Evening wear"
                  wide
                />
                <FormField
                  id="cat-desc"
                  label="Description"
                  hint="Optional, 5–200 characters if provided"
                  as="textarea"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Short description"
                  wide
                />
                <FormField
                  id="cat-image"
                  label="Image URL"
                  value={categoryForm.imageUrl}
                  onChange={(e) => setCategoryForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="https://…"
                  wide
                />

                {editingCategoryId ? (
                  <label className="admin-form__check">
                    <input
                      type="checkbox"
                      checked={categoryForm.isActive}
                      onChange={(e) =>
                        setCategoryForm((f) => ({ ...f, isActive: e.target.checked }))
                      }
                    />
                    <span>Active on storefront</span>
                  </label>
                ) : null}

                <div className="admin-form__actions">
                  {editingCategoryId ? (
                    <button
                      type="button"
                      className="admin-page__btn admin-page__btn--ghost"
                      onClick={resetCategoryForm}
                    >
                      Cancel
                    </button>
                  ) : null}
                  <button type="submit" className="admin-page__btn" disabled={categoryLoading}>
                    {categoryLoading ? 'Saving…' : editingCategoryId ? 'Save changes' : 'Add category'}
                  </button>
                </div>
              </form>
            </section>

            <section className="admin-panel">
              <div className="admin-panel__head">
                <h2>All categories</h2>
                <button
                  type="button"
                  className="admin-page__btn admin-page__btn--ghost admin-page__btn--sm"
                  onClick={fetchCategories}
                  disabled={categoriesLoading}
                >
                  {categoriesLoading ? '…' : 'Refresh'}
                </button>
              </div>
              {categories.length === 0 ? (
                <p className="admin-page__empty">No active categories yet.</p>
              ) : (
                <ul className="admin-list">
                  {categories.map((cat) => (
                    <li key={cat._id} className="admin-list__item">
                      <div className="admin-list__main">
                        {cat.imageUrl ? (
                          <img src={cat.imageUrl} alt="" className="admin-list__thumb" />
                        ) : (
                          <div className="admin-list__thumb admin-list__thumb--placeholder" aria-hidden>
                            {cat.title?.charAt(0) || '?'}
                          </div>
                        )}
                        <div>
                          <h3>{cat.title}</h3>
                          {cat.description ? <p>{cat.description}</p> : null}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="admin-page__btn admin-page__btn--ghost admin-page__btn--sm"
                        onClick={() => startEditCategory(cat)}
                      >
                        Edit
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}

        {tab === 'products' && (
          <div className="admin-dash__section">
            <section className="admin-panel admin-panel--form">
              <h2>{editingProductId ? 'Edit product' : 'New product'}</h2>

              {categories.length === 0 ? (
                <p className="admin-form__msg admin-form__msg--error">
                  Add at least one category before creating products.
                </p>
              ) : null}

              <form className="admin-form" onSubmit={handleProductSubmit}>
                {productMsg ? (
                  <p className="admin-form__msg admin-form__msg--error">{productMsg}</p>
                ) : null}
                {productSuccess ? (
                  <p className="admin-form__msg admin-form__msg--success">{productSuccess}</p>
                ) : null}

                <div className="admin-form__grid">
                  <FormField
                    id="prod-title"
                    label="Title"
                    hint="3–50 characters"
                    value={productForm.title}
                    onChange={(e) => setProductForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Product name"
                    wide
                  />
                  <FormField
                    id="prod-brand"
                    label="Brand"
                    value={productForm.brand}
                    onChange={(e) => setProductForm((f) => ({ ...f, brand: e.target.value }))}
                    placeholder="Brand name"
                  />
                  <div className="field field--wide">
                    <label htmlFor="prod-category">
                      <span className="label-text">Category</span>
                    </label>
                    <select
                      id="prod-category"
                      className="admin-select"
                      value={productForm.category}
                      onChange={(e) => setProductForm((f) => ({ ...f, category: e.target.value }))}
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <FormField
                    id="prod-mrp"
                    label="MRP"
                    type="number"
                    value={productForm.mrpPrice}
                    onChange={(e) => setProductForm((f) => ({ ...f, mrpPrice: e.target.value }))}
                    placeholder="0"
                    inputMode="decimal"
                  />
                  <FormField
                    id="prod-price"
                    label="Selling price"
                    type="number"
                    value={productForm.sellingPrice}
                    onChange={(e) => setProductForm((f) => ({ ...f, sellingPrice: e.target.value }))}
                    placeholder="0"
                    inputMode="decimal"
                  />
                  <FormField
                    id="prod-stock"
                    label="Stock quantity"
                    type="number"
                    value={productForm.stockQty}
                    onChange={(e) => setProductForm((f) => ({ ...f, stockQty: e.target.value }))}
                    placeholder="0"
                    inputMode="numeric"
                  />
                  <FormField
                    id="prod-rating"
                    label="Rating"
                    hint="0–5"
                    type="number"
                    value={productForm.rating}
                    onChange={(e) => setProductForm((f) => ({ ...f, rating: e.target.value }))}
                    placeholder="0"
                    inputMode="decimal"
                  />
                  <FormField
                    id="prod-ratings-count"
                    label="Number of ratings"
                    type="number"
                    value={productForm.noOfRatings}
                    onChange={(e) => setProductForm((f) => ({ ...f, noOfRatings: e.target.value }))}
                    placeholder="0"
                    inputMode="numeric"
                  />
                </div>

                <FormField
                  id="prod-desc"
                  label="Description"
                  hint="Optional, 5–200 characters if provided"
                  as="textarea"
                  value={productForm.description}
                  onChange={(e) => setProductForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Product details"
                  wide
                />

                <FormField
                  id="prod-images"
                  label="Image URLs"
                  hint="One per line or comma-separated"
                  as="textarea"
                  value={productForm.imageUrls}
                  onChange={(e) => setProductForm((f) => ({ ...f, imageUrls: e.target.value }))}
                  placeholder="https://…"
                  wide
                  rows={3}
                />

                {editingProductId ? (
                  <label className="admin-form__check">
                    <input
                      type="checkbox"
                      checked={productForm.isActive}
                      onChange={(e) =>
                        setProductForm((f) => ({ ...f, isActive: e.target.checked }))
                      }
                    />
                    <span>Active on storefront</span>
                  </label>
                ) : null}

                <div className="admin-form__actions">
                  {editingProductId ? (
                    <button
                      type="button"
                      className="admin-page__btn admin-page__btn--ghost"
                      onClick={resetProductForm}
                    >
                      Cancel
                    </button>
                  ) : null}
                  <button
                    type="submit"
                    className="admin-page__btn"
                    disabled={productLoading || categories.length === 0}
                  >
                    {productLoading ? 'Saving…' : editingProductId ? 'Save product' : 'Add product'}
                  </button>
                </div>
              </form>
            </section>

            <section className="admin-panel">
              <div className="admin-panel__head">
                <h2>All products</h2>
                <button
                  type="button"
                  className="admin-page__btn admin-page__btn--ghost admin-page__btn--sm"
                  onClick={fetchProducts}
                  disabled={productsLoading}
                >
                  {productsLoading ? '…' : 'Refresh'}
                </button>
              </div>
              {products.length === 0 ? (
                <p className="admin-page__empty">No active products yet.</p>
              ) : (
                <ul className="admin-list">
                  {products.map((p) => (
                    <li key={p._id} className="admin-list__item">
                      <div className="admin-list__main">
                        <ProductThumb product={p} />
                        <div>
                          <h3>{p.title}</h3>
                          <p className="admin-list__meta">
                            {p.brand} · {categoryLabel(categories, p.category)} · ₹{p.sellingPrice}{' '}
                            · Stock {p.stockQty}
                          </p>
                          {p.description ? <p>{p.description}</p> : null}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="admin-page__btn admin-page__btn--ghost admin-page__btn--sm"
                        onClick={() => startEditProduct(p)}
                      >
                        Edit
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

function ProductThumb({ product }) {
  const url = product.imageUrls?.[0]
  if (url) {
    return <img src={url} alt="" className="admin-list__thumb" />
  }
  return (
    <div className="admin-list__thumb admin-list__thumb--placeholder" aria-hidden>
      {product.title?.charAt(0) || '?'}
    </div>
  )
}
