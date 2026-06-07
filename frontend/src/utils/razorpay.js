const API = 'https://e-commerse-backend-vxjn.onrender.com/api'

/** Load Razorpay checkout script once. */
export function loadRazorpayScript() {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined') {
            reject(new Error('No window'))
            return
        }
        if (window.Razorpay) {
            resolve(window.Razorpay)
            return
        }
        const existing = document.querySelector('script[data-razorpay-checkout]')
        if (existing) {
            existing.addEventListener('load', () => resolve(window.Razorpay))
            existing.addEventListener('error', reject)
            return
        }
        const s = document.createElement('script')
        s.src = 'https://checkout.razorpay.com/v1/checkout.js'
        s.async = true
        s.dataset.razorpayCheckout = '1'
        s.onload = () => resolve(window.Razorpay)
        s.onerror = () => reject(new Error('Failed to load Razorpay'))
        document.body.appendChild(s)
    })
}

/** POST /api/order/razorpay/create — returns { orderId, amount, currency, keyId } */
export async function createRazorpayOrder(payload) {
    const res = await fetch(`${API}/order/razorpay/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Failed to create Razorpay order')
    return data
}

/** POST /api/order/razorpay/verify — verifies signature and saves the order */
export async function verifyRazorpayCheckout(payload) {
    const res = await fetch(`${API}/order/razorpay/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Payment verification failed')
    return data
}
