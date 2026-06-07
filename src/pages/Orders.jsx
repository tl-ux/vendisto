import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/api/supabaseClient'
import { useAuth } from '@/lib/AuthContext'
import { Plus, Search, Clock, CheckCircle2, XCircle, Truck, MoreVertical, Trash2, X } from 'lucide-react'

const STATUS = {
  pending:   { label: 'ממתין',  color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  confirmed: { label: 'אושר',   color: 'bg-blue-100 text-blue-700',    icon: CheckCircle2 },
  delivered: { label: 'נמסר',  color: 'bg-green-100 text-green-700',  icon: Truck },
  cancelled: { label: 'בוטל',  color: 'bg-red-100 text-red-700',      icon: XCircle },
}

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.pending
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${s.color}`}>
      {s.label}
    </span>
  )
}

function OrderSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 animate-pulse">
      <div className="h-4 bg-muted rounded w-1/3 mb-2" />
      <div className="h-3 bg-muted rounded w-1/2 mb-3" />
      <div className="flex justify-between">
        <div className="h-3 bg-muted rounded w-16" />
        <div className="h-5 bg-muted rounded-full w-14" />
      </div>
    </div>
  )
}

export default function Orders() {
  const navigate = useNavigate()
  const { user, role } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [actionOrder, setActionOrder] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)

  const fetchOrders = async () => {
    setLoading(true)
    let query = supabase
      .from('orders')
      .select('*, customers!customer_id(name, phone)')
      .order('created_at', { ascending: false })
      .limit(100)
    if (role === 'store_manager') query = query.eq('agent_id', user.id)
    const { data, error } = await query
    if (error) console.error('orders fetch:', error)
    setOrders(data || [])
    setLoading(false)
  }

  useEffect(() => { if (user) fetchOrders() }, [user, role])

  const updateStatus = async (id, status) => {
    setBusy(true)
    const { error } = await supabase.from('orders').update({ status }).eq('id', id)
    if (!error) setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
    setActionOrder(null)
    setBusy(false)
  }

  const deleteOrder = async (id) => {
    setBusy(true)
    await supabase.from('order_items').delete().eq('order_id', id)
    const { error } = await supabase.from('orders').delete().eq('id', id)
    if (!error) setOrders(prev => prev.filter(o => o.id !== id))
    setActionOrder(null)
    setConfirmDelete(false)
    setBusy(false)
  }

  const openAction = (e, order) => {
    e.stopPropagation()
    setConfirmDelete(false)
    setActionOrder(order)
  }

  const filtered = orders.filter((o) => {
    const matchSearch = !search || o.customers?.name?.includes(search)
    const matchStatus = filterStatus === 'all' || o.status === filterStatus
    return matchSearch && matchStatus
  })

  const formatDate = (iso) => {
    const d = new Date(iso)
    return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-primary text-primary-foreground px-4 py-3">
        <h1 className="font-bold text-lg">הזמנות</h1>
      </div>

      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center border border-border rounded-xl px-3 py-2 bg-background">
          <Search size={15} className="text-muted-foreground ml-2 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חפש לפי שם לקוח..."
            className="flex-1 bg-transparent outline-none text-sm"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {[['all', 'הכל'], ...Object.entries(STATUS).map(([k, v]) => [k, v.label])].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${filterStatus === key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24 flex flex-col gap-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <OrderSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-medium">אין הזמנות</p>
          </div>
        ) : (
          filtered.map((o) => (
            <div key={o.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{o.customers?.name || 'לקוח לא ידוע'}</p>
                <p className="text-xs text-muted-foreground">{formatDate(o.created_at)}</p>
                {o.note && <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">{o.note}</p>}
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className="font-bold text-sm">₪{(o.total || 0).toFixed(2)}</span>
                <StatusBadge status={o.status} />
              </div>
              <button
                onClick={(e) => openAction(e, o)}
                className="p-1 text-muted-foreground hover:text-foreground shrink-0"
              >
                <MoreVertical size={18} />
              </button>
            </div>
          ))
        )}
      </div>

      <button
        onClick={() => navigate('/orders/new')}
        className="fixed bottom-20 left-4 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center"
      >
        <Plus size={26} />
      </button>

      {/* Action sheet */}
      {actionOrder && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setActionOrder(null)} />
          <div className="fixed bottom-0 right-0 left-0 bg-card rounded-t-3xl z-50 shadow-2xl">
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <div>
                <p className="font-bold text-base">{actionOrder.customers?.name || 'הזמנה'}</p>
                <p className="text-xs text-muted-foreground">₪{(actionOrder.total || 0).toFixed(2)}</p>
              </div>
              <button onClick={() => setActionOrder(null)} className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <X size={16} />
              </button>
            </div>

            {!confirmDelete ? (
              <div className="px-5 pb-8 flex flex-col gap-3">
                <p className="text-xs font-semibold text-muted-foreground">שינוי סטטוס</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(STATUS).map(([key, { label, color }]) => (
                    <button
                      key={key}
                      onClick={() => updateStatus(actionOrder.id, key)}
                      disabled={busy || actionOrder.status === key}
                      className={`py-2.5 rounded-xl text-xs font-semibold transition disabled:opacity-50 ${
                        actionOrder.status === key ? color : 'bg-muted text-foreground hover:bg-muted/80'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 text-red-600 font-medium text-sm mt-1"
                >
                  <Trash2 size={16} />
                  מחק הזמנה
                </button>
              </div>
            ) : (
              <div className="px-5 pb-8 flex flex-col gap-3">
                <p className="text-sm text-center text-muted-foreground">האם למחוק את ההזמנה? לא ניתן לשחזר.</p>
                <button
                  onClick={() => deleteOrder(actionOrder.id)}
                  disabled={busy}
                  className="w-full py-3 rounded-xl bg-red-600 text-white font-semibold text-sm disabled:opacity-50"
                >
                  {busy ? 'מוחק...' : 'כן, מחק'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="w-full py-3 rounded-xl bg-muted text-foreground font-medium text-sm"
                >
                  ביטול
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
