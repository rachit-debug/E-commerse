import { Link } from 'react-router-dom'
import './AuthLayout.css'

export default function AuthLayout({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  alternate,
}) {
  return (
    <div className="auth-page">
      <div className="auth-ambient auth-ambient--one" aria-hidden />
      <div className="auth-ambient auth-ambient--two" aria-hidden />
      <div className="auth-ambient auth-ambient--three" aria-hidden />

      <aside className="auth-showcase" aria-hidden={false}>
        <Link to="/" className="auth-showcase__brand">
          <span className="auth-showcase__mark">M</span>
          <span className="auth-showcase__name">Maison</span>
        </Link>
        <blockquote className="auth-showcase__quote">
          <p>Objects chosen with intention — where craft meets the everyday.</p>
        </blockquote>
        <ul className="auth-showcase__perks">
          <li>Complimentary shipping on first order</li>
          <li>Early access to seasonal edits</li>
          <li>Personalized wishlists</li>
        </ul>
        <div className="auth-showcase__grain" aria-hidden />
      </aside>

      <section className="auth-panel">
        <header className="auth-panel__header">
          {eyebrow ? <p className="auth-eyebrow">{eyebrow}</p> : null}
          <h1 className="auth-title">{title}</h1>
          {subtitle ? <p className="auth-subtitle">{subtitle}</p> : null}
        </header>

        <div className="auth-card">{children}</div>

        {footer ? <footer className="auth-panel__footer">{footer}</footer> : null}
        {alternate ? <p className="auth-alternate">{alternate}</p> : null}
      </section>
    </div>
  )
}
