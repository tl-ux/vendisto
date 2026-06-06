import { useEffect, useState, useMemo, useRef } from 'react'
import { supabase } from '@/api/supabaseClient'
import { Search, Plus, Package, X, Image as ImageIcon, Play, ExternalLink } from 'lucide-react'

const EMPTY = {
  name: '', price: '', unit: 'יח׳', stock: '', category_id: '', active: true,
  images: [], youtube_url: '', gdrive_url: '',
}

async function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const MAX = 1200
      const scale = Math.min(1, MAX / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })),
        'image/jpeg',
        0.8
      )
    }
    img.src = URL.createObjectURL(file)
  })
}

async function uploadImages(files, productId) {
  const urls = []
  for (const file of files) {
    const compressed = await compressImage(file)
    const path = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
    const { error } = await supabase.storage.from('product-images').upload(path, compressed)
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path)
      urls.push(publicUrl)
    }
  }
  return urls
}

function getPlayEmbed(url) {
  if (!url) return null
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m ? `https://www.youtube.com/embed/${m[1]}` : null
}

function ProductForm({ initial, categories, onSave, onClose }) {
  const [form, setForm] = useState(
    initial
      ? {
          ...initial,
          price: initial.price ?? '',
          stock: initial.stock ?? '',
          images: initial.images || [],
          youtube_url: initial.youtube_url || '',
          gdrive_url: initial.gdrive_url || '',
        }
      : EMPTY
  )
  const [newFiles, setNewFiles] = useState([])
  const [newPreviews, setNewPreviews] = useState([])
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setNewFiles((prev) => [...prev, ...files])
    setNewPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))])
    e.target.value = ''
  }

  const removeExisting = (idx) => set('images', form.images.filter((_, i) => i !== idx))

  const removeNew = (idx) => {
    URL.revokeObjectURL(newPreviews[idx])
    setNewFiles((p) => p.filter((_, i) => i !== idx))
    setNewPreviews((p) => p.filter((_, i) => i !== idx))
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        price: parseFloat(form.price) || 0,
        unit: form.unit,
        stock: form.stock !== '' ? parseInt(form.stock) : null,
        category_id: form.category_id || null,
        active: form.active,
        youtube_url: form.youtube_url.trim() || null,
        gdrive_url: form.gdrive_url.trim() || null,
      }

      let productId = form.id
      if (productId) {
        await supabase.from('products').update(payload).eq('id', productId)
      } else {
        const { data, error } = await supabase.from('products').insert(payload).select().single()
        if (error) throw error
        productId = data.id
      }

      const uploaded = newFiles.length > 0 ? await uploadImages(newFiles, productId) : []
      await supabase.from('products').update({ images: [...form.images, ...uploaded] }).eq('id', productId)

      onSave()
    } catch (e) {
      alert('שגיאה: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const embedUrl = getPlayEmbed(form.youtube_url)

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

        {/* Image gallery */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-2 block">תמונות</label>
          <div className="flex flex-wrap gap-2">
            {form.images.map((url, i) => (
              <div key={url + i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button onClick={() => removeExisting(i)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center">
                  <X size={11} />
                </button>
              </div>
            ))}
            {newPreviews.map((url, i) => (
              <div key={url} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-primary/50">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button onClick={() => removeNew(i)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center">
                  <X size={11} />
                </button>
              </div>
            ))}
            <button onClick={() => fileRef.current?.click()}
              className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground gap-1 hover:border-primary/40 transition-colors">
              <ImageIcon size={20} />
              <span className="text-xs">הוסף</span>
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
        </div>

        {/* YouTube */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <Play size={13} />
            קישור YouTube (אופציונלי)
          </label>
          <input value={form.youtube_url} onChange={(e) => set('youtube_url', e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30" dir="ltr" />
          {embedUrl && (
            <div className="mt-2 rounded-xl overflow-hidden aspect-video">
              <iframe src={embedUrl} className="w-full h-full" allowFullScreen title="YouTube preview" />
            </div>
          )}
        </div>

        {/* Google Drive */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <ExternalLink size={13} />
            קישור Google Drive (אופציונלי)
          </label>
          <input value={form.gdrive_url} onChange={(e) => set('gdrive_url', e.target.value)}
            placeholder="https://drive.google.com/..."
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30" dir="ltr" />
        </div>

        {/* Active toggle */}
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

  const loadData = async () => {
    setLoading(true)
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from('products').select('*, categories(name)').order('name'),
      supabase.from('categories').select('*').order('name'),
    ])
    setProducts(prods || [])
    setCategories(cats || [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const filtered = useMemo(() => {
    let list = products
    if (activeCategory !== 'all') list = list.filter((p) => p.category_id === activeCategory)
    if (search) list = list.filter((p) => p.name?.includes(search))
    return list
  }, [products, activeCategory, search])

  const openEdit = (p) => { setEditing(p); setShowForm(true) }
  const openNew = () => { setEditing(null); setShowForm(true) }
  const handleSaved = () => { setShowForm(false); loadData() }

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
              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
                {p.images?.length > 0 ? (
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/10 text-primary flex items-center justify-center">
                    <Package size={18} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                  {p.categories?.name && <span>{p.categories.name}</span>}
                  <span>{p.unit}</span>
                  {p.stock !== null && <span>• מלאי: {p.stock}</span>}
                  {p.youtube_url && <Play size={11} className="inline" />}
                  {p.gdrive_url && <ExternalLink size={11} className="inline" />}
                </p>
              </div>
              <div className="text-left shrink-0">
                <p className="font-bold text-sm">₪{(p.price || 0).toFixed(2)}</p>
                {!p.active && <span className="text-xs text-muted-foreground">לא פעיל</span>}
                {p.stock === 0 && <span className="text-xs text-destructive block">אזל</span>}
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
