import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './OrdersPage.css'

const API = 'https://e-commerse-backend-vxjn.onrender.com/api'

const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function shortId(id) {
  return id?.slice(-8).toUpperCase() || '—'
}

export default function OrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    async function init() {
      const userRes = await fetch(`${API}/user/get-user`, { credentials: 'include' })
      const userData = await userRes.json()
      if (!userData.success || !userData.user) {
        navigate('/login')
        return
      }
      await loadOrders()
    }
    init()
  }, [])

  async function loadOrders() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/order/get-all-orders-for-user`, { credentials: 'include' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to load orders')
      // Sort newest first
      const sorted = (data.orders || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      )
      setOrders(sorted)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function toggleExpand(id) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  if (loading) {
    return (
      <div className="orders-page">
        <div className="orders-state">
          <div className="orders-spinner" aria-label="Loading" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="orders-page">
        <div className="orders-state">
          <p className="orders-error">{error}</p>
          <button type="button" className="orders-btn" onClick={loadOrders}>Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="orders-page">
      <header className="orders-page__header">
        <div>
          <p className="orders-eyebrow">Account</p>
          <h1>My orders</h1>
          <p className="orders-subtitle">
            {orders.length === 0
              ? 'No orders placed yet'
              : `${orders.length} order${orders.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link to="/products" className="orders-shop-link">Browse products →</Link>
      </header>

      {orders.length === 0 ? (
        <div className="orders-empty">
          <div className="orders-empty__icon" aria-hidden>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <p>You haven't placed any orders yet.</p>
          <Link to="/products" className="orders-btn">Start shopping</Link>
        </div>
      ) : (
        <ul className="orders-list" role="list">
          {orders.map((order) => {
            const isExpanded = expandedId === order._id
            const items = (order.products || []).filter(
              (item) => item.product && typeof item.product === 'object'
            )

            return (
              <li key={order._id} className="order-card">
                <button
                  type="button"
                  className="order-card__head"
                  onClick={() => toggleExpand(order._id)}
                  aria-expanded={isExpanded}
                >
                  <div className="order-card__meta">
                    <span className="order-card__id">#{shortId(order._id)}</span>
                    <span className="order-card__date">{formatDate(order.createdAt)}</span>
                  </div>

                  <div className="order-card__info">
                    <span className={`order-card__status order-card__status--${order.status}`}>
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                    <span className="order-card__payment">{order.paymentMethod}</span>
                    <span className="order-card__total">
                      ₹{order.totalAmount?.toLocaleString('en-IN')}
                    </span>
                    <span className="order-card__toggle" aria-hidden>
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </div>
                </button>

                {isExpanded ? (
                  <div className="order-card__body">
                    {items.length === 0 ? (
                      <p className="order-card__empty">Item details unavailable.</p>
                    ) : (
                      <ul className="order-items" role="list">
                        {items.map((item) => {
                          const p = item.product
                          return (
                            <li key={item._id} className="order-item">
                              <div className="order-item__media">
                                {p.imageUrls?.[0] ? (
                                  <img src={p.imageUrls[0]} alt={p.title} className="order-item__img" />
                                ) : (
                                  <div className="order-item__img-placeholder" aria-hidden>
                                    {p.title?.charAt(0) || '?'}
                                  </div>
                                )}
                              </div>
                              <div className="order-item__info">
                                <p className="order-item__title">{p.title}</p>
                                <p className="order-item__brand">{p.brand}</p>
                              </div>
                              <div className="order-item__right">
                                <p className="order-item__qty">Qty: {item.quantity}</p>
                                <p className="order-item__price">
                                  ₹{(p.sellingPrice * item.quantity).toLocaleString('en-IN')}
                                </p>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    )}

                    <div className="order-card__footer">
                      <div className="order-card__footer-row">
                        <span>Payment</span>
                        <span>{order.paymentMethod}</span>
                      </div>
                      <div className="order-card__footer-row order-card__footer-row--total">
                        <span>Order total</span>
                        <span>₹{order.totalAmount?.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
