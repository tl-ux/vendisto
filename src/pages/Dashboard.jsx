import { useEffect, useState } from 'react'
import { TrendingUp, Users, ShoppingCart, Package } from 'lucide-react'
import { supabase } from '@/api/supabaseClient'
import { useAuth } from '@/lib/AuthContext'

const STATUS_DOT = {
  pending:   'bg-yellow-400',
  confirmed: 'bg-blue-400',
  delivered: 'bg-green-400',
  cancelled: 'bg-red-300',
}

function StatSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-slate-100 mb-3" />
      <div className="h-7 bg-slate-100 rounded w-2/3 mb-1.5" />
      <div className="h-3 bg-slate-100 rounded w-1/2" />
    </div>
  )
}

function formatRelativeTime(iso) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1)  return 'עכשיו'
  if (mins < 60) return `לפני ${mins} דק׳`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `לפני ${hours} שעות`
  return `לפני ${Math.floor(hours / 24)} ימים`
}

export default function Dashboard() {
  const { user, role } = useAuth()
  const [stats, setStats] = useState(null)
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)

  const isStoreManager = role === 'store_manager'

  useEffect(() => {
    if (!user) return

    const fetchAll = async () => {
      setLoading(true)

      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date(todayStart)
      todayEnd.setDate(todayEnd.getDate() + 1)

      const applyAgentFilter = (q) =>
        isStoreManager ? q.eq('agent_id', user.id) : q

      const [salesRes, openRes, customersRes, productsRes, activityRes] = await Promise.all([
        applyAgentFilter(
          supabase.from('orders')
            .select('total')
            .gte('created_at', todayStart.toISOString())
            .lt('created_at', todayEnd.toISOString())
        ),
        applyAgentFilter(
          supabase.from('orders')
            .select('*', { count: 'exact', head: true })
            .in('status', ['pending', 'confirmed'])
        ),
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('active', true),
        applyAgentFilter(
          supabase.from('orders')
            .select('id, created_at, status, total, customers!customer_id(name)')
            .order('created_at', { ascending: false })
            .limit(5)
        ),
      ])

      const todaySales = (salesRes.data || []).reduce((s, o) => s + (o.total || 0), 0)

      setStats({
        todaySales,
        openOrders: openRes.count ?? 0,
        customers:  customersRes.count ?? 0,
        products:   productsRes.count ?? 0,
      })
      setActivity(activityRes.data || [])
      setLoading(false)
    }

    fetchAll()
  }, [user, role])

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'סוכן'

  const statCards = stats
    ? [
        { label: 'מכירות היום',    value: `₪${stats.todaySales.toLocaleString('he-IL', { maximumFractionDigits: 0 })}`, icon: TrendingUp, color: 'bg-blue-50 text-blue-600' },
        { label: 'לקוחות',         value: stats.customers.toLocaleString(),  icon: Users,        color: 'bg-green-50 text-green-600' },
        { label: 'הזמנות פתוחות', value: stats.openOrders.toLocaleString(), icon: ShoppingCart, color: 'bg-orange-50 text-orange-600' },
        { label: 'מוצרים פעילים', value: stats.products.toLocaleString(),   icon: Package,      color: 'bg-purple-50 text-purple-600' },
      ]
    : []

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">שלום, {displayName}</h1>
        <p className="text-slate-500 text-sm mt-0.5">סקירת פעילות יומית</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          : statCards.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                  <Icon size={20} />
                </div>
                <p className="text-2xl font-bold text-slate-800">{value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h2 className="font-semibold text-slate-800 mb-3">פעילות אחרונה</h2>

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="w-2 h-2 rounded-full mt-1.5 bg-slate-100 flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-3 bg-slate-100 rounded w-3/4 mb-1.5" />
                  <div className="h-2.5 bg-slate-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : activity.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">אין פעילות אחרונה</p>
        ) : (
          <div className="flex flex-col gap-3">
            {activity.map((o) => (
              <div key={o.id} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${STATUS_DOT[o.status] || 'bg-slate-300'}`} />
                <div>
                  <p className="text-sm text-slate-700">
                    הזמנה מ-{o.customers?.name || 'לקוח לא ידוע'}
                    {' · '}
                    <span className="font-medium">₪{(o.total || 0).toFixed(0)}</span>
                  </p>
                  <p className="text-xs text-slate-400">{formatRelativeTime(o.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
