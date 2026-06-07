import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import FormField from '../components/FormField'
import './auth.css'

const API = '/api'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [address, setAddress] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setMsg('')
    setLoading(true)

    try {
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password, contactNumber, address }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      navigate('/login')
    } catch (err) {
      setMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Join Maison"
      title="Create account"
      subtitle="Register to save favorites, track orders, and unlock member perks."
      alternate={
        <>
          Already a member? <Link to="/login">Sign in</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        {msg ? <p className="auth-msg">{msg}</p> : null}

        <div className="auth-form__grid">
          <FormField
            id="name"
            label="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alexandra Chen"
            autoComplete="name"
            wide
          />

          <FormField
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            wide
          />

          <FormField
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            wide
          />

          <FormField
            id="contactNumber"
            label="Phone"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            placeholder="9876543210"
            autoComplete="tel"
            inputMode="numeric"
          />

          <FormField
            id="address"
            label="Delivery address"
            as="textarea"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street, city, postal code"
            autoComplete="street-address"
            wide
          />
        </div>

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  )
}
