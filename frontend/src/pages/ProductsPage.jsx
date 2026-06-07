import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import './ProductsPage.css'

const API = '/api'
const CLIENT_LIMIT = 4 // for "All" client-side pagination

function StarRating({ rating }) {
  return (
    <span className="prod-card__stars" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= Math.round(rating) ? 'star star--on' : 'star'}>★</span>
      ))}
    </span>
  )
}

export default function ProductsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [allProducts, setAllProducts] = useState([])   // full list for "All"
  const [products, setProducts] = useState([])          // current page products
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all')
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [addingId, setAddingId] = useState(null)
  const [toastMsg, setToastMsg] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Fetch categories + auth once
  useEffect(() => {
    Promise.all([
      fetch(`${API}/user/get-user`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`${API}/category/get-all-categories`).then((r) => r.json()),
    ]).then(([userData, catData]) => {
      setIsLoggedIn(userData.success && !!userData.user)
      setCategories(catData.categories || [])
    }).catch(() => {})
  }, [])

  // Fetch products whenever category or page changes
  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        if (selectedCategory === 'all') {
          // Fetch all once, paginate client-side
          const res = await fetch(`${API}/product/get-all-products`, { credentials: 'include' })
          const data = await res.json()
          if (!res.ok) throw new Error(data.message || 'Failed to load products')
          setAllProducts(data.products || [])
          setProducts([])       // derived via filtered below
          setTotalPages(1)      // will be overridden in render
        } else {
          // Server-side pagination per category
          const res = await fetch(
            `${API}/product/get-product-by-category/${selectedCategory}?page=${page}`,
            { credentials: 'include' }
          )
          const data = await res.json()
          if (!res.ok) throw new Error(data.message || 'Failed to load products')
          setProducts(data.products || [])
          setTotalPages(data.totalPages || 1)
          setAllProducts([])
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [selectedCategory, page])

  function showToast(msg) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 2500)
  }

  async function addToCart(productId) {
    if (!isLoggedIn) { navigate('/login'); return }
    setAddingId(productId)
    try {
      const res = await fetch(`${API}/cart/add-to-cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ product: productId, quantity: 1 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to add to cart')
      showToast('Added to cart')
    } catch (err) {
      showToast(err.message)
    } finally {
      setAddingId(null)
    }
  }

  function getCategoryName(categoryId) {
    const cat = categories.find((c) => c._id === categoryId || c._id === categoryId?._id)
    return cat?.title || ''
  }

  function selectCategory(catId) {
    setSelectedCategory(catId)
    setPage(1)
    const params = catId !== 'all' ? { category: catId } : {}
    if (searchQuery) params.search = searchQuery
    setSearchParams(params)
  }

  function goToPage(p) {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // For "All": apply search filter + client-side pagination
  const filteredAll = allProducts.filter((p) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      p.title?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      getCategoryName(p.category)?.toLowerCase().includes(q)
    )
  })
  const allTotalPages = Math.max(1, Math.ceil(filteredAll.length / CLIENT_LIMIT))
  const safePage = Math.min(page, allTotalPages)
  const pagedAll = filteredAll.slice((safePage - 1) * CLIENT_LIMIT, safePage * CLIENT_LIMIT)

  // For category view: apply search filter on current page results
  const filteredCat = products.filter((p) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      p.title?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      getCategoryName(p.category)?.toLowerCase().includes(q)
    )
  })

  const displayProducts = selectedCategory === 'all' ? pagedAll : filteredCat
  const displayTotal    = selectedCategory === 'all' ? filteredAll.length : filteredCat.length
  const activeTotalPages = selectedCategory === 'all' ? allTotalPages : totalPages
  const activePage = selectedCategory === 'all' ? safePage : page

  // Build page number array (show at most 5 page buttons)
  function pageNumbers(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    const pages = []
    pages.push(1)
    if (current > 3) pages.push('…')
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i)
    }
    if (current < total - 2) pages.push('…')
    pages.push(total)
    return pages
  }

  return (
    <div className="products-page">
      {toastMsg ? <div className="products-toast">{toastMsg}</div> : null}

      <header className="products-page__header">
        <div>
          <p className="products-eyebrow">Store</p>
          <h1>All products</h1>
          <p className="products-subtitle">
            {loading ? 'Loading…' : `${displayTotal} item${displayTotal !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link to="/cart" className="products-cart-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          View cart
        </Link>
      </header>

      {/* Search */}
      <form className="products-search" role="search" onSubmit={(e) => e.preventDefault()}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="search"
          className="products-search__input"
          placeholder="Search products, brands…"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setPage(1)
            const params = {}
            if (e.target.value) params.search = e.target.value
            if (selectedCategory !== 'all') params.category = selectedCategory
            setSearchParams(params)
          }}
          aria-label="Search products"
        />
        {searchQuery && (
          <button
            type="button"
            className="products-search__clear"
            onClick={() => {
              setSearchQuery('')
              setPage(1)
              setSearchParams(selectedCategory !== 'all' ? { category: selectedCategory } : {})
            }}
            aria-label="Clear search"
          >✕</button>
        )}
      </form>

      {/* Category filter pills */}
      {categories.length > 0 ? (
        <div className="products-filters" role="group" aria-label="Filter by category">
          <button
            type="button"
            className={`products-filter-btn${selectedCategory === 'all' ? ' is-active' : ''}`}
            onClick={() => selectCategory('all')}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              type="button"
              className={`products-filter-btn${selectedCategory === cat._id ? ' is-active' : ''}`}
              onClick={() => selectCategory(cat._id)}
            >
              {cat.title}
            </button>
          ))}
        </div>
      ) : null}

      {/* Products grid */}
      {loading ? (
        <div className="products-state">
          <div className="products-spinner" aria-label="Loading" />
        </div>
      ) : error ? (
        <div className="products-state">
          <p className="products-error">{error}</p>
        </div>
      ) : displayProducts.length === 0 ? (
        <div className="products-state">
          <p className="products-empty">No products found.</p>
        </div>
      ) : (
        <ul className="products-grid" role="list">
          {displayProducts.map((product) => (
            <li key={product._id} className="prod-card">
              <div className="prod-card__media">
                {product.imageUrls?.[0] ? (
                  <img src={product.imageUrls[0]} alt={product.title} className="prod-card__img" />
                ) : (
                  <div className="prod-card__img-placeholder" aria-hidden>
                    {product.title?.charAt(0) || '?'}
                  </div>
                )}
                {product.mrpPrice > product.sellingPrice ? (
                  <span className="prod-card__badge">
                    {Math.round(((product.mrpPrice - product.sellingPrice) / product.mrpPrice) * 100)}% off
                  </span>
                ) : null}
              </div>

              <div className="prod-card__body">
                <p className="prod-card__category">{getCategoryName(product.category)}</p>
                <h2 className="prod-card__title">{product.title}</h2>
                <p className="prod-card__brand">{product.brand}</p>
                {product.rating > 0 ? (
                  <div className="prod-card__rating">
                    <StarRating rating={product.rating} />
                    <span className="prod-card__rating-count">({product.noOfRatings})</span>
                  </div>
                ) : null}
                <div className="prod-card__pricing">
                  <span className="prod-card__price">₹{product.sellingPrice.toLocaleString('en-IN')}</span>
                  {product.mrpPrice > product.sellingPrice ? (
                    <span className="prod-card__mrp">₹{product.mrpPrice.toLocaleString('en-IN')}</span>
                  ) : null}
                </div>
                <p className="prod-card__stock">
                  {product.stockQty > 0
                    ? product.stockQty <= 5
                      ? `Only ${product.stockQty} left`
                      : 'In stock'
                    : 'Out of stock'}
                </p>
              </div>

              <button
                type="button"
                className="prod-card__cta"
                onClick={() => addToCart(product._id)}
                disabled={addingId === product._id || product.stockQty === 0}
              >
                {addingId === product._id
                  ? 'Adding…'
                  : product.stockQty === 0
                  ? 'Out of stock'
                  : isLoggedIn
                  ? 'Add to cart'
                  : 'Sign in to buy'}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      {!loading && !error && activeTotalPages > 1 && (
        <nav className="products-pagination" aria-label="Page navigation">
          <button
            type="button"
            className="pg-btn pg-btn--arrow"
            onClick={() => goToPage(activePage - 1)}
            disabled={activePage === 1}
            aria-label="Previous page"
          >
            ‹
          </button>

          {pageNumbers(activePage, activeTotalPages).map((p, i) =>
            p === '…' ? (
              <span key={`ellipsis-${i}`} className="pg-ellipsis">…</span>
            ) : (
              <button
                key={p}
                type="button"
                className={`pg-btn${p === activePage ? ' pg-btn--active' : ''}`}
                onClick={() => goToPage(p)}
                aria-label={`Page ${p}`}
                aria-current={p === activePage ? 'page' : undefined}
              >
                {p}
              </button>
            )
          )}

          <button
            type="button"
            className="pg-btn pg-btn--arrow"
            onClick={() => goToPage(activePage + 1)}
            disabled={activePage === activeTotalPages}
            aria-label="Next page"
          >
            ›
          </button>
        </nav>
      )}
    </div>
  )
}
