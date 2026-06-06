import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/api/supabaseClient'
import { Search, Plus, Package, X } from 'lucide-react'

const EMPTY = { name: '', price: '', unit: 'יח׳', stock: '', category_id: '', active: true }

function ProductForm({ initial, categories, onSave, onClose }) {
  const [form, setForm] = useState(initial ? { ...initial, price: initial.price ?? '', stock: initial.stock ?? '' } : EMPTY)
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    const payload = {
      name: form.name,
      price: parseFloat(form.price) || 0,
      unit: form.unit,
      stock: form.stock !== '' ? parseInt(form.stock) : null,
      category_id: form.category_id || null,
      active: form.active,
    }
    try {
      if (form.id) await supabase.from('products').update(payload).eq('id', form.id)
      else await supabase.from('products').insert(payload)
      onSave()
    } catch (e) {
      alert('שגיאה: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center gap-3 p-4 border-b">
        <button onClick={onClose}><X size={22} /></button>
        <h2 className="font-bold text-base flex-1">{form.id ? 'עריכת מוצר' : 'מוצר חדש'}</h2>
        <button onClick={handleSave} disabled={saving || !form.name.trim()} className="text-primary font-semibold text-sm disabled:opacity-40">
          {saving ? '...' : 'שמור'}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">שם מוצר *</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="שם המוצר"
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">מחיר (₪)</label>
            <input type="number" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="0.00" step="0.01"
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30" dir="ltr" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">יחידה</label>
            <select value={form.unit} onChange={(e) => set('unit', e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30">
              {['יח׳', 'ק"ג', 'ליטר', 'קרטון', 'חבילה', 'מגש'].map((u) => <option key={u}>{u}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">מלאי</label>
            <input type="number" value={form.stock} onChange={(e) => set('stock', e.target.value)} placeholder="ריק = ללא מעקב"
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30" dir="ltr" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">קטגוריה</label>
            <select value={form.category_id} onChange={(e) => set('category_id', e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">ללא קטגוריה</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between border border-border rounded-xl px-3 py-3">
          <span className="text-sm font-medium">מוצר פעיל</span>
          <button
            onClick={() => set('active', !form.active)}
            className={`w-11 h-6 rounded-full transition-colors ${form.active ? 'bg-primary' : 'bg-muted'}`}
          >
            <span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform mx-0.5 ${form.active ? 'translate-x-[-20px]' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)

  const fetch = async () => {
    setLoading(true)
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from('products').select('*, categories(name)').order('name'),
      supabase.from('categories').select('*').order('name'),
    ])
    setProducts(prods || [])
    setCategories(cats || [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  const filtered = useMemo(() => {
    let list = products
    if (activeCategory !== 'all') list = list.filter((p) => p.category_id === activeCategory)
    if (search) list = list.filter((p) => p.name?.includes(search))
    return list
  }, [products, activeCategory, search])

  const openEdit = (p) => { setEditing(p); setShowForm(true) }
  const openNew = () => { setEditing(null); setShowForm(true) }
  const handleSaved = () => { setShowForm(false); fetch() }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-primary text-primary-foreground px-4 py-3">
        <h1 className="font-bold text-lg">מוצרים</h1>
      </div>

      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center border border-border rounded-xl px-3 py-2 bg-background">
          <Search size={15} className="text-muted-foreground ml-2 shrink-0" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חפש מוצר..."
            className="flex-1 bg-transparent outline-none text-sm" />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          <button onClick={() => setActiveCategory('all')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${activeCategory === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            הכל
          </button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => setActiveCategory(c.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${activeCategory === c.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24 flex flex-col gap-2">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse h-16" />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">אין מוצרים</p>
          </div>
        ) : (
          filtered.map((p) => (
            <button key={p.id} onClick={() => openEdit(p)}
              className="bg-card border border-border rounded-xl p-3.5 flex items-center gap-3 text-right w-full">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Package size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {p.categories?.name && <span className="ml-2">{p.categories.name}</span>}
                  {p.unit}
                  {p.stock !== null && <span className="mr-2">• מלאי: {p.stock}</span>}
                </p>
              </div>
              <div className="text-left shrink-0">
                <p className="font-bold text-sm">₪{(p.price || 0).toFixed(2)}</p>
                {!p.active && <span className="text-xs text-muted-foreground">לא פעיל</span>}
              </div>
            </button>
          ))
        )}
      </div>

      <button onClick={openNew}
        className="fixed bottom-20 left-4 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center">
        <Plus size={26} />
      </button>

      {showForm && <ProductForm initial={editing} categories={categories} onSave={handleSaved} onClose={() => setShowForm(false)} />}
    </div>
  )
}
