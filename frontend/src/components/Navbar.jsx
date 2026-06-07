import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
  const [user, setUser] = useState(null)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    fetch('https://e-commerse-frontend-5pni.onrender.com/api/user/get-user', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setUser(data.success ? data.user : null))
      .catch(() => setUser(null))
  }, [location.pathname])

  async function handleLogout() {
    await fetch('https://e-commerse-frontend-5pni.onrender.com/api/auth/logout', { method: 'POST', credentials: 'include' })
    setUser(null)
    navigate('/')
  }

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link to="/" className="navbar__brand">
          <span className="navbar__mark">M</span>
          <span className="navbar__name">Maison</span>
        </Link>

        <nav className="navbar__links" aria-label="Main">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'is-active' : '')}>
            Home
          </NavLink>
          <NavLink to="/products" className={({ isActive }) => (isActive ? 'is-active' : '')}>
            Products
          </NavLink>
          {user ? (
            <NavLink to="/orders" className={({ isActive }) => (isActive ? 'is-active' : '')}>
              Orders
            </NavLink>
          ) : null}
        </nav>

        <div className="navbar__actions">
          {user ? (
            <>
              <Link to="/cart" className="navbar__btn navbar__btn--ghost navbar__cart-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                Cart
              </Link>
              <span className="navbar__user">{user.name?.split(' ')[0]}</span>
              <button
                type="button"
                className="navbar__btn navbar__btn--ghost"
                onClick={handleLogout}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar__btn navbar__btn--ghost">
                Sign in
              </Link>
              <Link to="/register" className="navbar__btn navbar__btn--primary">
                Join
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
