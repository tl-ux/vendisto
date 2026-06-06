import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/api/supabaseClient'
import { useAuth } from '@/lib/AuthContext'
import { Search, Plus, Minus, ShoppingCart, ChevronRight, X, Check } from 'lucide-react'

function CustomerSearch({ value, onChange }) {
  const [query, setQuery] = useState('')
  const [customers, setCustomers] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (query.length < 1) { setCustomers([]); return }
    setLoading(true)
    supabase
      .from('customers')
      .select('id, name, phone')
      .ilike('name', `%${query}%`)
      .limit(8)
      .then(({ data }) => { setCustomers(data || []); setLoading(false) })
  }, [query])

  return (
    <div className="relative">
      <div
        className="flex items-center border border-border rounded-xl px-3 py-2.5 bg-background cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <Search size={16} className="text-muted-foreground ml-2 shrink-0" />
        <span className={value ? 'text-foreground text-sm' : 'text-muted-foreground text-sm'}>
          {value?.name || 'בחר לקוח...'}
        </span>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          <div className="flex items-center gap-2 p-4 border-b">
            <button onClick={() => setOpen(false)} className="text-muted-foreground">
              <ChevronRight size={22} />
            </button>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="חפש לקוח לפי שם..."
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading && <p className="text-center text-muted-foreground text-sm p-4">מחפש...</p>}
            {customers.map((c) => (
              <button
                key={c.id}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 text-right border-b border-border/50"
                onClick={() => { onChange(c); setOpen(false); setQuery('') }}
              >
                <div>
                  <p className="font-medium text-sm">{c.name}</p>
                  {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
                </div>
                {value?.id === c.id && <Check size={16} className="text-primary" />}
              </button>
            ))}
            {!loading && query.length > 0 && customers.length === 0 && (
              <p className="text-center text-muted-foreground text-sm p-4">לא נמצאו לקוחות</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function NewOrder() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [customer, setCustomer] = useState(null)
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [cart, setCart] = useState({})
  const [search, setSearch] = useState('')
  const [showCart, setShowCart] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [note, setNote] = useState('')

  useEffect(() => {
    supabase.from('categories').select('id, name').order('name').then(({ data }) => setCategories(data || []))
    supabase.from('products').select('id, name, price, unit, category_id, stock').eq('active', true).order('name')
      .then(({ data }) => setProducts(data || []))
  }, [])

  const filtered = useMemo(() => {
    let list = products
    if (activeCategory !== 'all') list = list.filter((p) => p.category_id === activeCategory)
    if (search) list = list.filter((p) => p.name.includes(search))
    return list
  }, [products, activeCategory, search])

  const cartTotal = useMemo(() =>
    Object.entries(cart).reduce((sum, [id, qty]) => {
      const p = products.find((x) => x.id === id)
      return sum + (p ? p.price * qty : 0)
    }, 0), [cart, products])

  const cartCount = useMemo(() => Object.values(cart).reduce((s, v) => s + v, 0), [cart])

  const setQty = (id, delta) => {
    setCart((prev) => {
      const next = { ...prev }
      const cur = next[id] || 0
      const updated = cur + delta
      if (updated <= 0) delete next[id]
      else next[id] = updated
      return next
    })
  }

  const handleSubmit = async () => {
    if (!customer) return
    if (cartCount === 0) return
    setSubmitting(true)
    try {
      const { data: order, error } = await supabase.from('orders').insert({
        customer_id: customer.id,
        agent_id: user.id,
        total: cartTotal,
        status: 'pending',
        note,
        created_at: new Date().toISOString(),
      }).select().single()
      if (error) throw error
      const items = Object.entries(cart).map(([product_id, quantity]) => {
        const p = products.find((x) => x.id === product_id)
        return { order_id: order.id, product_id, quantity, unit_price: p?.price || 0 }
      })
      await supabase.from('order_items').insert(items)
      navigate('/orders', { replace: true })
    } catch (e) {
      alert('שגיאה ביצירת הזמנה: ' + e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)}><ChevronRight size={22} /></button>
        <h1 className="font-bold text-lg flex-1">הזמנה חדשה</h1>
        {cartCount > 0 && (
          <button onClick={() => setShowCart(true)} className="relative">
            <ShoppingCart size={22} />
            <span className="absolute -top-1.5 -left-1.5 bg-white text-primary text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {cartCount}
            </span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Customer */}
        <div className="p-4 border-b">
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">לקוח</label>
          <CustomerSearch value={customer} onChange={setCustomer} />
        </div>

        {/* Search */}
        <div className="px-4 pt-3">
          <div className="flex items-center border border-border rounded-xl px-3 py-2 bg-background">
            <Search size={15} className="text-muted-foreground ml-2 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חפש מוצר..."
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 px-4 py-3 overflow-x-auto">
          <button
            onClick={() => setActiveCategory('all')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${activeCategory === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
          >
            הכל
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${activeCategory === c.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Products */}
        <div className="px-4 flex flex-col gap-2 pb-4">
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">לא נמצאו מוצרים</p>
          )}
          {filtered.map((p) => (
            <div key={p.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  ₪{(p.price || 0).toFixed(2)} / {p.unit || 'יח׳'}
                  {p.stock !== null && <span className="mr-2 text-muted-foreground/70">מלאי: {p.stock}</span>}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {cart[p.id] ? (
                  <>
                    <button onClick={() => setQty(p.id, -1)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-bold w-5 text-center">{cart[p.id]}</span>
                    <button onClick={() => setQty(p.id, 1)} className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Plus size={14} />
                    </button>
                  </>
                ) : (
                  <button onClick={() => setQty(p.id, 1)} className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Plus size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart footer */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 right-0 left-0 bg-background border-t border-border p-4">
          <button
            onClick={() => setShowCart(true)}
            className="w-full bg-primary text-primary-foreground font-semibold rounded-xl py-3 flex items-center justify-between px-4 text-sm"
          >
            <span className="bg-white/20 rounded-lg px-2 py-0.5">{cartCount}</span>
            <span>צפה בעגלה</span>
            <span>₪{cartTotal.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Cart sheet */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          <div className="flex items-center gap-3 p-4 border-b">
            <button onClick={() => setShowCart(false)}><X size={22} /></button>
            <h2 className="font-bold text-base flex-1">סל הזמנה</h2>
            <span className="text-sm text-muted-foreground">{cartCount} פריטים</span>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
            {Object.entries(cart).map(([id, qty]) => {
              const p = products.find((x) => x.id === id)
              if (!p) return null
              return (
                <div key={id} className="flex items-center gap-3 border border-border rounded-xl p-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">₪{(p.price || 0).toFixed(2)} / {p.unit || 'יח׳'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setQty(id, -1)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-bold w-5 text-center">{qty}</span>
                    <button onClick={() => setQty(id, 1)} className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Plus size={14} />
                    </button>
                  </div>
                  <p className="text-sm font-semibold w-16 text-left">₪{((p.price || 0) * qty).toFixed(2)}</p>
                </div>
              )
            })}
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="הערה להזמנה (אופציונלי)..."
              rows={2}
              className="mt-2 w-full border border-border rounded-xl px-3 py-2 text-sm bg-background resize-none outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="p-4 border-t">
            <div className="flex justify-between text-sm mb-3">
              <span className="text-muted-foreground">סה&quot;כ להזמנה</span>
              <span className="font-bold text-lg">₪{cartTotal.toFixed(2)}</span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting || !customer}
              className="w-full bg-primary text-primary-foreground font-semibold rounded-xl py-3 text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              {!customer ? 'בחר לקוח קודם' : 'שלח הזמנה'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
