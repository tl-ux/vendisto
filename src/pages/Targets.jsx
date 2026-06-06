import { useEffect, useState } from 'react'
import { supabase } from '@/api/supabaseClient'
import { useAuth } from '@/lib/AuthContext'
import { Target, TrendingUp, Calendar } from 'lucide-react'

function ProgressBar({ value, max, color = 'bg-primary' }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function MetricCard({ label, current, target, unit = '₪', color }) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  }
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colorMap[color] || colorMap.blue}`}>{pct}%</span>
      </div>
      <ProgressBar value={current} max={target} color={pct >= 100 ? 'bg-green-500' : 'bg-primary'} />
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span>{unit !== '₪' ? '' : '₪'}{current.toLocaleString('he-IL')}{unit === 'יח׳' ? ` ${unit}` : ''}</span>
        <span>מתוך {unit !== '₪' ? '' : '₪'}{target.toLocaleString('he-IL')}{unit === 'יח׳' ? ` ${unit}` : ''}</span>
      </div>
    </div>
  )
}

export default function Targets() {
  const { user } = useAuth()
  const [targets, setTargets] = useState([])
  const [loading, setLoading] = useState(true)

  const now = new Date()
  const monthLabel = now.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })

  useEffect(() => {
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    supabase
      .from('targets')
      .select('*')
      .eq('month', month)
      .eq('agent_id', user?.id)
      .then(({ data }) => { setTargets(data || []); setLoading(false) })
  }, [user])

  const getTarget = (type) => targets.find((t) => t.type === type)

  const salesTarget = getTarget('sales')
  const ordersTarget = getTarget('orders')
  const customersTarget = getTarget('new_customers')

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysPassed = now.getDate()
  const paceLabel = `יום ${daysPassed} מתוך ${daysInMonth}`

  return (
    <div className="flex flex-col h-full">
      <div className="bg-primary text-primary-foreground px-4 py-3">
        <h1 className="font-bold text-lg">יעדים</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Month header */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Calendar size={20} className="text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">{monthLabel}</p>
            <p className="text-xs text-muted-foreground">{paceLabel}</p>
          </div>
          <div className="mr-auto">
            <ProgressBar value={daysPassed} max={daysInMonth} color="bg-primary/50" />
            <p className="text-xs text-muted-foreground mt-1 text-left">{Math.round((daysPassed / daysInMonth) * 100)}% מהחודש</p>
          </div>
        </div>

        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 animate-pulse h-24" />
          ))
        ) : (
          <>
            {salesTarget ? (
              <MetricCard label="יעד מכירות" current={salesTarget.current || 0} target={salesTarget.target || 0} unit="₪" color="blue" />
            ) : (
              <div className="bg-card border border-dashed border-border rounded-2xl p-6 text-center text-muted-foreground">
                <Target size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">יעד מכירות לא הוגדר לחודש זה</p>
              </div>
            )}
            {ordersTarget && (
              <MetricCard label="יעד הזמנות" current={ordersTarget.current || 0} target={ordersTarget.target || 0} unit="יח׳" color="orange" />
            )}
            {customersTarget && (
              <MetricCard label="לקוחות חדשים" current={customersTarget.current || 0} target={customersTarget.target || 0} unit="יח׳" color="green" />
            )}
          </>
        )}

        {/* Tips */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <div className="flex gap-2">
            <TrendingUp size={16} className="text-blue-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-blue-700 mb-1">טיפ לביצועים</p>
              <p className="text-xs text-blue-600">כדי לעמוד ביעד המכירות, שאף ל-{Math.ceil((daysInMonth - daysPassed) > 0 ? ((salesTarget?.target || 0) - (salesTarget?.current || 0)) / (daysInMonth - daysPassed) : 0).toLocaleString('he-IL')} ₪ ביום בממוצע.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
