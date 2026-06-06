import { useEffect, useState } from 'react'
import { supabase } from '@/api/supabaseClient'
import { useAuth } from '@/lib/AuthContext'
import { MapPin, CheckCircle2, Circle, ChevronDown, ChevronUp, Plus, Navigation } from 'lucide-react'

export default function VisitRoutes() {
  const { user } = useAuth()
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})
  const [updatingStop, setUpdatingStop] = useState(null)

  const fetch = async () => {
    setLoading(true)
    const today = new Date().toISOString().slice(0, 10)
    const { data } = await supabase
      .from('visit_routes')
      .select('*, route_stops(id, order_num, visited, customers(id, name, address, phone))')
      .eq('agent_id', user?.id)
      .gte('route_date', today)
      .order('route_date')
      .order('order_num', { foreignTable: 'route_stops' })
    setRoutes(data || [])
    setLoading(false)
  }

  useEffect(() => { if (user) fetch() }, [user])

  const toggleExpand = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }))

  const markVisited = async (stopId, visited) => {
    setUpdatingStop(stopId)
    await supabase.from('route_stops').update({ visited: !visited, visited_at: !visited ? new Date().toISOString() : null }).eq('id', stopId)
    setRoutes((prev) => prev.map((r) => ({
      ...r,
      route_stops: r.route_stops?.map((s) => s.id === stopId ? { ...s, visited: !visited } : s),
    })))
    setUpdatingStop(null)
  }

  const formatDate = (iso) => new Date(iso).toLocaleDateString('he-IL', { weekday: 'long', day: '2-digit', month: '2-digit' })

  return (
    <div className="flex flex-col h-full">
      <div className="bg-primary text-primary-foreground px-4 py-3">
        <h1 className="font-bold text-lg">מסלולי ביקור</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 pb-24">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 animate-pulse h-20" />
          ))
        ) : routes.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Navigation size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">אין מסלולים מתוכננים</p>
            <p className="text-sm mt-1">מסלולים יופיעו כאן לאחר שיתוזמנו</p>
          </div>
        ) : (
          routes.map((route) => {
            const stops = route.route_stops || []
            const visitedCount = stops.filter((s) => s.visited).length
            const isOpen = expanded[route.id]

            return (
              <div key={route.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                <button
                  className="w-full flex items-center gap-3 p-4 text-right"
                  onClick={() => toggleExpand(route.id)}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{route.name || formatDate(route.route_date)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(route.route_date)} · {visitedCount}/{stops.length} ביקורים
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs font-bold text-muted-foreground">{visitedCount}/{stops.length}</span>
                    </div>
                    {isOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                  </div>
                </button>

                {/* Progress bar */}
                <div className="h-1 bg-muted mx-4 mb-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: stops.length > 0 ? `${(visitedCount / stops.length) * 100}%` : '0%' }}
                  />
                </div>

                {isOpen && (
                  <div className="border-t border-border">
                    {stops.length === 0 ? (
                      <p className="text-center text-muted-foreground text-sm p-4">אין עצירות במסלול</p>
                    ) : (
                      stops.map((stop, idx) => (
                        <div key={stop.id} className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0">
                          <button
                            onClick={() => markVisited(stop.id, stop.visited)}
                            disabled={updatingStop === stop.id}
                            className="shrink-0"
                          >
                            {stop.visited
                              ? <CheckCircle2 size={22} className="text-green-500" />
                              : <Circle size={22} className="text-muted-foreground" />
                            }
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${stop.visited ? 'line-through text-muted-foreground' : ''}`}>
                              {idx + 1}. {stop.customers?.name || 'לקוח לא ידוע'}
                            </p>
                            {stop.customers?.address && (
                              <p className="text-xs text-muted-foreground truncate">{stop.customers.address}</p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
