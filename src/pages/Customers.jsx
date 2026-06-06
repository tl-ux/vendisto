import { useEffect, useState } from 'react'
import { supabase } from '@/api/supabaseClient'
import { Search, Plus, Phone, MapPin, X, ChevronLeft } from 'lucide-react'

const EMPTY_FORM = { name: '', phone: '', address: '', notes: '' }

function CustomerForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (form.id) {
        await supabase.from('customers').update({ name: form.name, phone: form.phone, address: form.address, notes: form.notes }).eq('id', form.id)
      } else {
        await supabase.from('customers').insert({ name: form.name, phone: form.phone, address: form.address, notes: form.notes })
      }
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
        <h2 className="font-bold text-base flex-1">{form.id ? 'עריכת לקוח' : 'לקוח חדש'}</h2>
        <button onClick={handleSave} disabled={saving || !form.name.trim()} className="text-primary font-semibold text-sm disabled:opacity-40">
          {saving ? '...' : 'שמור'}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {[
          { key: 'name', label: 'שם עסק / לקוח', placeholder: 'שם מלא', required: true },
          { key: 'phone', label: 'טלפון', placeholder: '05X-XXXXXXX', type: 'tel' },
          { key: 'address', label: 'כתובת', placeholder: 'רחוב, עיר' },
          { key: 'notes', label: 'הערות', placeholder: 'מידע נוסף...', multiline: true },
        ].map(({ key, label, placeholder, required, type, multiline }) => (
          <div key={key}>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
              {label}{required && ' *'}
            </label>
            {multiline ? (
              <textarea
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
                rows={3}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background resize-none outline-none focus:ring-2 focus:ring-primary/30"
              />
            ) : (
              <input
                type={type || 'text'}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
                dir={type === 'tel' ? 'ltr' : 'rtl'}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 animate-pulse">
      <div className="h-4 bg-muted rounded w-1/3 mb-2" />
      <div className="h-3 bg-muted rounded w-1/4" />
    </div>
  )
}

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)

  const fetch = async () => {
    setLoading(true)
    const { data } = await supabase.from('customers').select('*').order('name')
    setCustomers(data || [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  const filtered = customers.filter((c) => !search || c.name?.includes(search) || c.phone?.includes(search))

  const openEdit = (c) => { setEditing(c); setShowForm(true) }
  const openNew = () => { setEditing(null); setShowForm(true) }
  const handleSaved = () => { setShowForm(false); fetch() }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-primary text-primary-foreground px-4 py-3">
        <h1 className="font-bold text-lg">לקוחות</h1>
      </div>

      <div className="p-4">
        <div className="flex items-center border border-border rounded-xl px-3 py-2 bg-background">
          <Search size={15} className="text-muted-foreground ml-2 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חפש לקוח לפי שם או טלפון..."
            className="flex-1 bg-transparent outline-none text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24 flex flex-col gap-2">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-3">👤</p>
            <p className="font-medium">אין לקוחות</p>
          </div>
        ) : (
          filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => openEdit(c)}
              className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 text-right w-full"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base shrink-0">
                {c.name?.[0] || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{c.name}</p>
                {c.phone && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5" dir="ltr">
                    <Phone size={11} /> {c.phone}
                  </p>
                )}
                {c.address && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin size={11} /> {c.address}
                  </p>
                )}
              </div>
              <ChevronLeft size={16} className="text-muted-foreground shrink-0" />
            </button>
          ))
        )}
      </div>

      <button
        onClick={openNew}
        className="fixed bottom-20 left-4 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center"
      >
        <Plus size={26} />
      </button>

      {showForm && (
        <CustomerForm
          initial={editing}
          onSave={handleSaved}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
