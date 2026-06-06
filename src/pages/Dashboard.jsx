import { TrendingUp, Users, ShoppingCart, Package } from 'lucide-react'

const stats = [
  { label: 'מכירות היום', value: '₪12,430', icon: TrendingUp, color: 'bg-blue-50 text-blue-600' },
  { label: 'לקוחות פעילים', value: '84', icon: Users, color: 'bg-green-50 text-green-600' },
  { label: 'הזמנות פתוחות', value: '17', icon: ShoppingCart, color: 'bg-orange-50 text-orange-600' },
  { label: 'מוצרים', value: '213', icon: Package, color: 'bg-purple-50 text-purple-600' },
]

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">שלום, סוכן</h1>
        <p className="text-slate-500 text-sm mt-0.5">סקירת פעילות יומית</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, icon: Icon, color }) => (
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
        <div className="flex flex-col gap-3">
          {[
            { text: 'הזמנה חדשה מ-סופרמרקט כהן', time: 'לפני 12 דקות', dot: 'bg-green-400' },
            { text: 'לקוח חדש נוסף: מאפיית לוי', time: 'לפני שעה', dot: 'bg-blue-400' },
            { text: 'הזמנה #1042 סגורה', time: 'לפני 3 שעות', dot: 'bg-slate-300' },
          ].map(({ text, time, dot }) => (
            <div key={text} className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dot}`} />
              <div>
                <p className="text-sm text-slate-700">{text}</p>
                <p className="text-xs text-slate-400">{time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
