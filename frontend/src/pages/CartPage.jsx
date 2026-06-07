import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loadRazorpayScript, createRazorpayOrder, verifyRazorpayCheckout } from '../utils/razorpay'
import './CartPage.css'

const API = 'https://e-commerse-backend-vxjn.onrender.com/api'

export default function CartPage() {
  const navigate = useNavigate()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ordering, setOrdering] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')
  const [addressError, setAddressError] = useState('')

  useEffect(() => {
    async function checkAuthAndLoadCart() {
      const userRes = await fetch(`${API}/user/get-user`, { credentials: 'include' })
      const userData = await userRes.json()
      if (!userData.success || !userData.user) {
        navigate('/login')
        return
      }
      await loadCart()
    }
    checkAuthAndLoadCart()
  }, [])

  async function loadCart() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/cart/get-cart`, { credentials: 'include' })
      const data = await res.json()
      if (!res.ok) {
        // No cart yet is a normal state
        if (res.status === 400) {
          setCart(null)
        } else {
          throw new Error(data.message || 'Failed to load cart')
        }
        return
      }
      setCart(data.cart)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Derive items and total from cart, filtering out any un-populated products
  const items = (cart?.products || []).filter((item) => item.product && typeof item.product === 'object')
  const subtotal = items.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0)
  const savings = items.reduce(
    (sum, item) => sum + (item.product.mrpPrice - item.product.sellingPrice) * item.quantity,
    0
  )

  async function syncCart(updatedItems) {
    const totalAmount = updatedItems.reduce(
      (sum, item) => sum + item.product.sellingPrice * item.quantity,
      0
    )
    const payload = {
      products: updatedItems.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
      })),
      totalAmount,
      totalItems: updatedItems.length,
    }
    const res = await fetch(`${API}/cart/update-cart`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Update failed')
    // Re-fetch to get fresh populated data
    await loadCart()
  }

  async function changeQty(itemId, delta) {
    const updated = items
      .map((item) =>
        item._id === itemId ? { ...item, quantity: item.quantity + delta } : item
      )
      .filter((item) => item.quantity > 0)
    await syncCart(updated)
  }

  async function removeItem(itemId) {
    const updated = items.filter((item) => item._id !== itemId)
    await syncCart(updated)
  }

  function validateAddress() {
    if (!shippingAddress.trim()) {
      setAddressError('Please enter a shipping address before placing the order.')
      return false
    }
    setAddressError('')
    return true
  }

  async function clearCartOnServer() {
    await fetch(`${API}/cart/update-cart`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ products: [], totalAmount: 0, totalItems: 0 }),
    })
  }

  async function placeOrder() {
    if (!validateAddress()) return
    setOrdering(true)
    setOrderError('')
    try {
      const payload = {
        products: items.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
        })),
        totalAmount: subtotal,
        paymentMethod: 'COD',
        shippingAddress,
      }
      const res = await fetch(`${API}/order/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Order failed')
      await clearCartOnServer()
      setCart(null)
      setOrderSuccess(true)
    } catch (err) {
      setOrderError(err.message)
    } finally {
      setOrdering(false)
    }
  }

  async function handleRazorpay() {
    if (!validateAddress()) return
    setOrdering(true)
    setOrderError('')

    const cartPayload = items.map((item) => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.product.sellingPrice,
    }))

    try {
      const rp = await createRazorpayOrder({ items: cartPayload })
      const RazorpayCtor = await loadRazorpayScript()

      await new Promise((resolve, reject) => {
        const options = {
          key: rp.keyId,
          amount: rp.amount,
          currency: rp.currency || 'INR',
          order_id: rp.orderId,
          name: 'Maison Store',
          description: 'Order payment',
          handler: async (response) => {
            try {
              await verifyRazorpayCheckout({
                items: cartPayload,
                shippingAddress,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              })
              setCart(null)
              setOrderSuccess(true)
              resolve()
            } catch (err) {
              reject(err)
            }
          },
          modal: {
            ondismiss: () => reject(new Error('Payment cancelled')),
          },
          theme: { color: '#c9a86a' },
        }
        const rz = new RazorpayCtor(options)
        rz.on('payment.failed', () => reject(new Error('Payment failed')))
        rz.open()
      })
    } catch (e) {
      if (e.message && !e.message.includes('cancelled')) {
        setOrderError(e.message || 'Payment error')
      }
    } finally {
      setOrdering(false)
    }
  }

  if (loading) {
    return (
      <div className="cart-page">
        <div className="cart-state">
          <div className="cart-spinner" aria-label="Loading" />
        </div>
      </div>
    )
  }

  if (orderSuccess) {
    return (
      <div className="cart-page">
        <div className="cart-success">
          <div className="cart-success__icon" aria-hidden>✓</div>
          <h1>Order placed!</h1>
          <p>Thank you for your purchase. Your order has been received and is being processed.</p>
          <div className="cart-success__actions">
            <Link to="/orders" className="cart-btn">View my orders</Link>
            <Link to="/products" className="cart-btn cart-btn--ghost">Continue shopping</Link>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="cart-page">
        <div className="cart-state">
          <p className="cart-error">{error}</p>
          <button type="button" className="cart-btn" onClick={loadCart}>Retry</button>
        </div>
      </div>
    )
  }

  if (!cart || items.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-empty">
          <div className="cart-empty__icon" aria-hidden>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </div>
          <h1>Your cart is empty</h1>
          <p>Looks like you haven't added anything yet.</p>
          <Link to="/products" className="cart-btn">Browse products</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <header className="cart-page__header">
        <div>
          <p className="cart-eyebrow">Shopping</p>
          <h1>Your cart</h1>
          <p className="cart-subtitle">{items.length} item{items.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/products" className="cart-continue">← Continue shopping</Link>
      </header>

      <div className="cart-layout">
        <section className="cart-items">
          {items.map((item) => {
            const p = item.product
            return (
              <div key={item._id} className="cart-item">
                <div className="cart-item__media">
                  {p.imageUrls?.[0] ? (
                    <img src={p.imageUrls[0]} alt={p.title} className="cart-item__img" />
                  ) : (
                    <div className="cart-item__img-placeholder" aria-hidden>
                      {p.title?.charAt(0) || '?'}
                    </div>
                  )}
                </div>

                <div className="cart-item__info">
                  <h2 className="cart-item__title">{p.title}</h2>
                  <p className="cart-item__brand">{p.brand}</p>
                  <div className="cart-item__pricing">
                    <span className="cart-item__price">₹{p.sellingPrice.toLocaleString('en-IN')}</span>
                    {p.mrpPrice > p.sellingPrice ? (
                      <span className="cart-item__mrp">₹{p.mrpPrice.toLocaleString('en-IN')}</span>
                    ) : null}
                  </div>
                </div>

                <div className="cart-item__controls">
                  <div className="cart-qty">
                    <button
                      type="button"
                      className="cart-qty__btn"
                      onClick={() => changeQty(item._id, -1)}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="cart-qty__val">{item.quantity}</span>
                    <button
                      type="button"
                      className="cart-qty__btn"
                      onClick={() => changeQty(item._id, 1)}
                      disabled={item.quantity >= p.stockQty}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <p className="cart-item__subtotal">
                    ₹{(p.sellingPrice * item.quantity).toLocaleString('en-IN')}
                  </p>
                  <button
                    type="button"
                    className="cart-item__remove"
                    onClick={() => removeItem(item._id)}
                    aria-label="Remove item"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )
          })}
        </section>

        <aside className="cart-summary">
          <h2>Order summary</h2>

          <div className="cart-summary__lines">
            <div className="cart-summary__row">
              <span>Subtotal ({items.length} items)</span>
              <span>₹{(subtotal + savings).toLocaleString('en-IN')}</span>
            </div>
            {savings > 0 ? (
              <div className="cart-summary__row cart-summary__row--savings">
                <span>Discount</span>
                <span>− ₹{savings.toLocaleString('en-IN')}</span>
              </div>
            ) : null}
            <div className="cart-summary__row">
              <span>Shipping</span>
              <span className="cart-summary__free">Free</span>
            </div>
          </div>

          <div className="cart-summary__total">
            <span>Total</span>
            <span>₹{subtotal.toLocaleString('en-IN')}</span>
          </div>

          {savings > 0 ? (
            <p className="cart-summary__savings-tag">
              You're saving ₹{savings.toLocaleString('en-IN')} on this order
            </p>
          ) : null}

          {/* Shipping address */}
          <div className="cart-address">
            <label className="cart-address__label" htmlFor="shipping-address">
              Delivery address
            </label>
            <textarea
              id="shipping-address"
              className={`cart-address__input${addressError ? ' cart-address__input--err' : ''}`}
              rows={3}
              placeholder="Enter your full delivery address…"
              value={shippingAddress}
              onChange={(e) => { setShippingAddress(e.target.value); setAddressError('') }}
            />
            {addressError ? <p className="cart-address__err">{addressError}</p> : null}
          </div>

          {orderError ? (
            <p className="cart-summary__error">{orderError}</p>
          ) : null}

          {/* Razorpay — primary */}
          <button
            type="button"
            className="cart-btn cart-btn--full cart-btn--razorpay"
            onClick={handleRazorpay}
            disabled={ordering}
          >
            {ordering ? (
              'Processing…'
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
                Pay with Razorpay
              </>
            )}
          </button>

          {/* COD — secondary */}
          <button
            type="button"
            className="cart-btn cart-btn--full cart-btn--ghost"
            onClick={placeOrder}
            disabled={ordering}
          >
            Cash on delivery (COD)
          </button>

          <p className="cart-summary__note">
            Secured payments · Free returns within 30 days
          </p>
        </aside>
      </div>
    </div>
  )
}
