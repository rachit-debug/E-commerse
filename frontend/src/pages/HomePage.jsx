import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './HomePage.css'

const CATEGORY_ICONS = {
  'for you':    '⭐',
  fashion:      '👗',
  mobiles:      '📱',
  beauty:       '💄',
  electronics:  '💻',
  home:         '🏠',
  appliances:   '🍳',
  toys:         '🧸',
  'food':       '🍕',
  auto:         '🚗',
  '2 wheelers': '🛵',
  sports:       '⚽',
  books:        '📚',
  furniture:    '🛋️',
  clothing:     '👕',
  footwear:     '👟',
  grocery:      '🛒',
  jewelry:      '💍',
  watches:      '⌚',
  gaming:       '🎮',
  fitness:      '🏋️',
  kids:         '🧒',
  travel:       '✈️',
  music:        '🎵',
  cameras:      '📷',
  default:      '🛍️',
}

function getCategoryIcon(title = '') {
  const key = title.toLowerCase()
  for (const [k, v] of Object.entries(CATEGORY_ICONS)) {
    if (key.includes(k)) return v
  }
  return CATEGORY_ICONS.default
}

const HERO_SLIDES = [
  {
    id: 1,
    eyebrow: 'New Season',
    title: 'Summer Styles Are Here',
    sub: 'Up to 50% off on Fashion & Accessories',
    cta: 'Shop Fashion',
    href: '/products',
    gradient: 'linear-gradient(120deg, #1e3a5f 0%, #2563eb 50%, #60a5fa 100%)',
    accent: '#93c5fd',
    emoji: '👗',
  },
  {
    id: 2,
    eyebrow: 'Best Deals',
    title: 'Electronics Bonanza',
    sub: 'Flagship mobiles, laptops & more — lowest prices guaranteed',
    cta: 'Explore Electronics',
    href: '/products',
    gradient: 'linear-gradient(120deg, #1a1a2e 0%, #7c3aed 55%, #a78bfa 100%)',
    accent: '#c4b5fd',
    emoji: '📱',
  },
  {
    id: 3,
    eyebrow: 'Home Refresh',
    title: 'Transform Your Space',
    sub: 'Furniture, décor & appliances — curated for modern living',
    cta: 'Shop Home',
    href: '/products',
    gradient: 'linear-gradient(120deg, #064e3b 0%, #059669 55%, #6ee7b7 100%)',
    accent: '#a7f3d0',
    emoji: '🛋️',
  },
  {
    id: 4,
    eyebrow: 'Flash Sale',
    title: 'Beauty & Wellness',
    sub: 'Premium skincare, makeup & more — up to 40% off today only',
    cta: 'Grab Deals',
    href: '/products',
    gradient: 'linear-gradient(120deg, #831843 0%, #db2777 55%, #f9a8d4 100%)',
    accent: '#fbcfe8',
    emoji: '💄',
  },
]

export default function HomePage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [recentProducts, setRecentProducts] = useState([])
  const [carouselIdx, setCarouselIdx] = useState(0)
  const [heroIdx, setHeroIdx] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIdx((i) => (i + 1) % HERO_SLIDES.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetch('https://e-commerse-backend-vxjn.onrender.com/api/category/get-all-categories', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {})

    fetch('https://e-commerse-backend-vxjn.onrender.com/api/product/get-recent-products')
      .then((r) => r.json())
      .then((data) => setRecentProducts(data.products || []))
      .catch(() => {})
  }, [])

  function handleSearch(e) {
    e.preventDefault()
    const q = query.trim()
    if (q) navigate(`/products?search=${encodeURIComponent(q)}`)
    else navigate('/products')
  }

  function handleCategoryClick(catId) {
    setActiveCategory(catId)
    navigate(`/products?category=${catId}`)
  }

  return (
    <div className="home">
      <div className="home-ambient home-ambient--one" aria-hidden />
      <div className="home-ambient home-ambient--two" aria-hidden />

      {/* ── Search bar ── */}
      <section className="home-search-wrap">
        <form className="home-search" onSubmit={handleSearch} role="search">
          <svg className="home-search__icon" width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="home-search__input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for Products, Brands and More"
            aria-label="Search products"
          />
          <button type="submit" className="home-search__btn">Search</button>
        </form>
      </section>

      {/* ── Category icon strip ── */}
      {categories.length > 0 && (
        <section className="home-cats" aria-label="Shop by category">
          <div className="home-cats__track">
            <button
              type="button"
              className={`home-cat-pill${activeCategory === null ? ' home-cat-pill--active' : ''}`}
              onClick={() => { setActiveCategory(null); navigate('/products') }}
            >
              <span className="home-cat-pill__icon">⭐</span>
              <span className="home-cat-pill__label">For You</span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                type="button"
                className={`home-cat-pill${activeCategory === cat._id ? ' home-cat-pill--active' : ''}`}
                onClick={() => handleCategoryClick(cat._id)}
              >
                <span className="home-cat-pill__icon">{getCategoryIcon(cat.title)}</span>
                <span className="home-cat-pill__label">{cat.title}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Hero banner carousel ── */}
      <section className="hero-carousel" aria-label="Featured offers">
        <div className="hero-carousel__track" style={{ transform: `translateX(-${heroIdx * 100}%)` }}>
          {HERO_SLIDES.map((slide) => (
            <div
              key={slide.id}
              className="hero-slide"
              style={{ background: slide.gradient }}
            >
              <div className="hero-slide__content">
                <p className="hero-slide__eyebrow" style={{ color: slide.accent }}>{slide.eyebrow}</p>
                <h2 className="hero-slide__title">{slide.title}</h2>
                <p className="hero-slide__sub">{slide.sub}</p>
                <button
                  type="button"
                  className="hero-slide__cta"
                  style={{ '--slide-accent': slide.accent }}
                  onClick={() => navigate(slide.href)}
                >
                  {slide.cta} →
                </button>
              </div>
              <div className="hero-slide__visual" aria-hidden>
                <span className="hero-slide__emoji">{slide.emoji}</span>
              </div>
            </div>
          ))}
        </div>

        {/* arrows */}
        <button
          type="button"
          className="hero-carousel__arrow hero-carousel__arrow--prev"
          aria-label="Previous slide"
          onClick={() => setHeroIdx((i) => (i - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
        >‹</button>
        <button
          type="button"
          className="hero-carousel__arrow hero-carousel__arrow--next"
          aria-label="Next slide"
          onClick={() => setHeroIdx((i) => (i + 1) % HERO_SLIDES.length)}
        >›</button>

        {/* dots */}
        <div className="hero-carousel__dots">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`hero-carousel__dot${i === heroIdx ? ' hero-carousel__dot--active' : ''}`}
              aria-label={`Slide ${i + 1}`}
              onClick={() => setHeroIdx(i)}
            />
          ))}
        </div>
      </section>

      {/* ── Suggested for You carousel ── */}
      {recentProducts.length > 0 && (
        <section className="home-suggested">
          <div className="home-suggested__head">
            <div>
              <p className="home-eyebrow">Just added</p>
              <h2 className="home-suggested__title">Suggested for you</h2>
            </div>
            <div className="home-suggested__nav">
              <button
                type="button"
                className="home-sugg-arrow"
                aria-label="Previous"
                disabled={carouselIdx === 0}
                onClick={() => setCarouselIdx((i) => Math.max(0, i - 1))}
              >
                ‹
              </button>
              <button
                type="button"
                className="home-sugg-arrow"
                aria-label="Next"
                disabled={carouselIdx >= recentProducts.length - 1}
                onClick={() => setCarouselIdx((i) => Math.min(recentProducts.length - 1, i + 1))}
              >
                ›
              </button>
            </div>
          </div>

          <div className="home-carousel__viewport">
            <ul
              className="home-carousel__track"
              style={{ transform: `translateX(calc(-${carouselIdx} * (var(--card-w) + var(--card-gap))))` }}
            >
              {recentProducts.map((p) => {
                const discount = p.mrpPrice > p.sellingPrice
                  ? Math.round(((p.mrpPrice - p.sellingPrice) / p.mrpPrice) * 100)
                  : 0
                const catId = typeof p.category === 'object' ? p.category?._id : p.category
                const categoryTitle = categories.find((c) => c._id === catId)?.title || ''
                return (
                  <li key={p._id} className="home-prod-card">
                    <div className="home-prod-card__media">
                      {p.imageUrls?.[0] ? (
                        <img src={p.imageUrls[0]} alt={p.title} className="home-prod-card__img" />
                      ) : (
                        <div className="home-prod-card__placeholder">
                          {getCategoryIcon(categoryTitle)}
                        </div>
                      )}
                      {discount > 0 && (
                        <span className="home-prod-card__badge">{discount}% off</span>
                      )}
                    </div>
                    <div className="home-prod-card__body">
                      {categoryTitle && (
                        <p className="home-prod-card__cat">{categoryTitle}</p>
                      )}
                      <h3 className="home-prod-card__name">{p.title}</h3>
                      <p className="home-prod-card__brand">{p.brand}</p>
                      {p.rating > 0 && (
                        <div className="home-prod-card__stars" aria-label={`${p.rating} out of 5`}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span key={s} className={s <= Math.round(p.rating) ? 'hstar hstar--on' : 'hstar'}>★</span>
                          ))}
                          <span className="home-prod-card__nratings">({p.noOfRatings})</span>
                        </div>
                      )}
                      <div className="home-prod-card__pricing">
                        <span className="home-prod-card__price">₹{p.sellingPrice.toLocaleString('en-IN')}</span>
                        {discount > 0 && (
                          <span className="home-prod-card__mrp">₹{p.mrpPrice.toLocaleString('en-IN')}</span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="home-prod-card__cta"
                      onClick={() => navigate('/products')}
                    >
                      View product
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="home-carousel__dots">
            {recentProducts.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`home-carousel__dot${i === carouselIdx ? ' home-carousel__dot--active' : ''}`}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setCarouselIdx(i)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Hero ── */}
      <section className="home-hero">
        <div className="home-hero__copy">
          <p className="home-eyebrow">Spring / Summer 2026</p>
          <h1 className="home-title">
            Curated pieces for
            <span className="home-title__accent"> considered living</span>
          </h1>
          <p className="home-lead">
            Discover artisan homeware, wardrobe essentials, and limited editions —
            each selected for quality, story, and timeless design.
          </p>
          <div className="home-hero__cta">
            <Link to="/products" className="home-btn home-btn--primary">
              Shop now
            </Link>
            <Link to="/register" className="home-btn home-btn--ghost">
              Create account
            </Link>
          </div>
        </div>

        <div className="home-hero__visual" aria-hidden>
          <div className="home-visual__frame">
            <div className="home-visual__orb" />
            <div className="home-visual__card home-visual__card--back" />
            <div className="home-visual__card home-visual__card--front">
              <span className="home-visual__tag">New arrival</span>
              <p className="home-visual__piece">Ceramic vessels</p>
              <p className="home-visual__meta">Hand-glazed · Edition of 120</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Highlights strip ── */}
      <section className="home-strip" aria-label="Highlights">
        {[
          { label: 'Free returns', detail: '30-day policy' },
          { label: 'Ethically sourced', detail: 'Verified partners' },
          { label: 'Member pricing', detail: 'After sign-in' },
        ].map((item) => (
          <div key={item.label} className="home-strip__item">
            <span className="home-strip__label">{item.label}</span>
            <span className="home-strip__detail">{item.detail}</span>
          </div>
        ))}
      </section>
    </div>
  )
}
