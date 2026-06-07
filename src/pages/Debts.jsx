import { useEffect, useState } from 'react'
import { supabase } from '@/api/supabaseClient'
import { useAuth } from '@/lib/AuthContext'
import { CreditCard, CheckCircle2, Search, AlertCircle } from 'lucide-react'

export default function Debts() {
  const { user, role } = useAuth()
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  const fetchDebts = async () => {
    setLoading(true)
    let query = supabase
      .from('debts')
      .select('*, customers(name, phone)')
      .eq('paid', false)
      .order('created_at', { ascending: false })
    if (role === 'store_manager') query = query.eq('created_by', user.id)
    const { data } = await query
    setDebts(data || [])
    setLoading(false)
  }

  useEffect(() => { if (user) fetchDebts() }, [user, role])

  const markPaid = async (id) => {
    setUpdatingId(id)
    await supabase.from('debts').update({ paid: true, paid_at: new Date().toISOString() }).eq('id', id)
    setDebts((prev) => prev.filter((d) => d.id !== id))
    setUpdatingId(null)
  }

  const filtered = debts.filter((d) => !search || d.customers?.name?.includes(search))
  const total = filtered.reduce((s, d) => s + (d.amount || 0), 0)

  const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('he-IL') : ''

  return (
    <div className="flex flex-col h-full">
      <div className="bg-primary text-primary-foreground px-4 py-3">
        <h1 className="font-bold text-lg">חובות</h1>
      </div>

      {/* Summary */}
      <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
          <AlertCircle size={20} className="text-red-600" />
        </div>
        <div>
          <p className="text-xs text-red-600 font-medium">סה&quot;כ חובות פתוחים</p>
          <p className="text-2xl font-bold text-red-700">₪{total.toFixed(2)}</p>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center border border-border rounded-xl px-3 py-2 bg-background">
          <Search size={15} className="text-muted-foreground ml-2 shrink-0" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חפש לפי שם לקוח..."
            className="flex-1 bg-transparent outline-none text-sm" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse h-20" />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle2 size={40} className="mx-auto mb-3 text-green-400" />
            <p className="font-medium">אין חובות פתוחים</p>
          </div>
        ) : (
          filtered.map((d) => (
            <div key={d.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                <CreditCard size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{d.customers?.name || 'לא ידוע'}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(d.created_at)}
                  {d.note && ` · ${d.note}`}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <p className="font-bold text-sm text-red-600">₪{(d.amount || 0).toFixed(2)}</p>
                <button
                  onClick={() => markPaid(d.id)}
                  disabled={updatingId === d.id}
                  className="flex items-center gap-1 text-xs text-green-600 border border-green-200 bg-green-50 rounded-lg px-2 py-1 font-medium disabled:opacity-50"
                >
                  <CheckCircle2 size={12} />
                  שולם
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
