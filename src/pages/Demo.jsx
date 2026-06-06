import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/api/supabaseClient'
import { ShoppingCart, Users, Package, TrendingUp, Tag, Map, CreditCard, Target, LogIn, Zap } from 'lucide-react'

const DEMO_EMAIL = 'demo@vendisto.app'
const DEMO_PASSWORD = 'Demo1234!'

const FEATURES = [
  { icon: ShoppingCart, title: 'יצירת הזמנות', desc: 'קטלוג מוצרים נוח עם חיפוש וסינון לפי קטגוריה' },
  { icon: Users, title: 'ניהול לקוחות', desc: 'מאגר לקוחות מלא עם כתובות ופרטי קשר' },
  { icon: Package, title: 'קטלוג מוצרים', desc: 'ניהול מוצרים, קטגוריות ומחירים בזמן אמת' },
  { icon: CreditCard, title: 'מעקב חובות', desc: 'ניהול יתרות ותשלומים ללקוחות' },
  { icon: Target, title: 'יעדי מכירות', desc: 'מעקב אחר יעדים חודשיים וביצועים' },
  { icon: Map, title: 'מסלולי ביקור', desc: 'תכנון ומעקב אחר ביקורי לקוחות' },
  { icon: Tag, title: 'מבצעים', desc: 'ניהול הנחות ומבצעים עונתיים' },
  { icon: TrendingUp, title: 'דשבורד חכם', desc: 'סיכום פעילות יומי ומדדים עיקריים' },
]

export default function Demo() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDemoLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const { error: err } = await supabase.auth.signInWithPassword({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      })
      if (err) throw err
      navigate('/', { replace: true })
    } catch (e) {
      setError('חשבון הדמו אינו זמין כרגע. נסה שוב מאוחר יותר.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* Hero */}
      <div className="px-6 pt-16 pb-10 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-3xl mb-6 backdrop-blur">
          <span className="text-4xl font-black text-white">V</span>
        </div>
        <h1 className="text-4xl font-black mb-3 leading-tight">Vendisto</h1>
        <p className="text-white/70 text-base leading-relaxed max-w-xs mx-auto">
          מערכת ניהול מכירות חכמה לסוכנים.<br />
          ניהול הזמנות, לקוחות ויעדים — מכל מקום.
        </p>
      </div>

      {/* CTA */}
      <div className="px-6 pb-10">
        {error && (
          <div className="bg-red-500/20 border border-red-400/30 text-red-200 text-sm rounded-xl p-3 mb-4 text-center">
            {error}
          </div>
        )}
        <button
          onClick={handleDemoLogin}
          disabled={loading}
          className="w-full bg-white text-slate-900 font-bold rounded-2xl py-4 text-base flex items-center justify-center gap-2 disabled:opacity-60 shadow-xl hover:bg-slate-50 transition"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
          ) : (
            <>
              <Zap size={20} className="text-yellow-500" />
              כנס לדמו עכשיו
            </>
          )}
        </button>
        <p className="text-center text-white/40 text-xs mt-3">
          כניסה אוטומטית · demo@vendisto.app
        </p>

        <div className="flex items-center gap-3 mt-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/40 text-xs">יש לך חשבון?</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <button
          onClick={() => navigate('/login')}
          className="w-full mt-4 border border-white/20 text-white font-semibold rounded-2xl py-3 text-sm flex items-center justify-center gap-2 hover:bg-white/5 transition"
        >
          <LogIn size={18} />
          כניסה עם חשבון קיים
        </button>
      </div>

      {/* Features */}
      <div className="px-6 pb-16">
        <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-4 text-center">מה כולל המערכת</p>
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur">
              <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center mb-3">
                <Icon size={18} className="text-white/80" />
              </div>
              <p className="font-semibold text-sm text-white mb-1">{title}</p>
              <p className="text-xs text-white/50 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
