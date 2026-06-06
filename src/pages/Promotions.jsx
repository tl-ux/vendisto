import { useEffect, useState } from 'react'
import { supabase } from '@/api/supabaseClient'
import { Tag, Clock, CheckCircle2, XCircle, Plus, X, Percent, BadgeDollarSign } from 'lucide-react'

const STATUS_MAP = {
  active:   { label: 'פעיל',    color: 'bg-green-100 text-green-700' },
  upcoming: { label: 'עתידי',   color: 'bg-blue-100 text-blue-700' },
  expired:  { label: 'פג תוקף', color: 'bg-muted text-muted-foreground' },
}

function getStatus(promo) {
  const now = new Date()
  const start = promo.start_date ? new Date(promo.start_date) : null
  const end = promo.end_date ? new Date(promo.end_date) : null
  if (end && end < now) return 'expired'
  if (start && start > now) return 'upcoming'
  return 'active'
}

function PromoForm({ onSave, onClose }) {
  const [form, setForm] = useState({ name: '', description: '', discount_type: 'percent', discount_value: '', start_date: '', end_date: '' })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    await supabase.from('promotions').insert({
      name: form.name,
      description: form.description,
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value) || 0,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    })
    setSaving(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center gap-3 p-4 border-b">
        <button onClick={onClose}><X size={22} /></button>
        <h2 className="font-bold text-base flex-1">מבצע חדש</h2>
        <button onClick={handleSave} disabled={saving || !form.name.trim()} className="text-primary font-semibold text-sm disabled:opacity-40">
          {saving ? '...' : 'שמור'}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">שם המבצע *</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="למשל: מבצע קיץ"
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">תיאור</label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} placeholder="פרטי המבצע..."
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background resize-none outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">סוג הנחה</label>
            <select value={form.discount_type} onChange={(e) => set('discount_type', e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background outline-none">
              <option value="percent">אחוז (%)</option>
              <option value="fixed">קבוע (₪)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">ערך הנחה</label>
            <input type="number" value={form.discount_value} onChange={(e) => set('discount_value', e.target.value)}
              placeholder={form.discount_type === 'percent' ? '10' : '5.00'}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30" dir="ltr" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">תאריך התחלה</label>
            <input type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background outline-none" dir="ltr" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">תאריך סיום</label>
            <input type="date" value={form.end_date} onChange={(e) => set('end_date', e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background outline-none" dir="ltr" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Promotions() {
  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('active')
  const [showForm, setShowForm] = useState(false)

  const fetch = async () => {
    setLoading(true)
    const { data } = await supabase.from('promotions').select('*').order('created_at', { ascending: false })
    setPromotions(data || [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  const filtered = promotions.filter((p) => getStatus(p) === filter)

  const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('he-IL') : '—'

  return (
    <div className="flex flex-col h-full">
      <div className="bg-primary text-primary-foreground px-4 py-3">
        <h1 className="font-bold text-lg">מבצעים</h1>
      </div>

      <div className="flex gap-2 px-4 pt-4">
        {Object.entries(STATUS_MAP).map(([key, { label }]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${filter === key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-24 flex flex-col gap-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 animate-pulse h-24" />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Tag size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">אין מבצעים {STATUS_MAP[filter]?.label}</p>
          </div>
        ) : (
          filtered.map((p) => {
            const status = getStatus(p)
            const statusInfo = STATUS_MAP[status]
            return (
              <div key={p.id} className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-semibold text-sm">{p.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>
                {p.description && <p className="text-xs text-muted-foreground mb-3">{p.description}</p>}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground bg-muted rounded-lg px-2 py-1">
                    {p.discount_type === 'percent' ? <Percent size={12} /> : <BadgeDollarSign size={12} />}
                    {p.discount_type === 'percent' ? `${p.discount_value}%` : `₪${p.discount_value}`}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock size={12} />
                    {formatDate(p.start_date)} – {formatDate(p.end_date)}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <button onClick={() => setShowForm(true)}
        className="fixed bottom-20 left-4 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center">
        <Plus size={26} />
      </button>

      {showForm && <PromoForm onSave={() => { setShowForm(false); fetch() }} onClose={() => setShowForm(false)} />}
    </div>
  )
}
