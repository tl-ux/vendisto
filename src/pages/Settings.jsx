import { useEffect, useState } from 'react'
import { supabase } from '@/api/supabaseClient'
import { useAuth } from '@/lib/AuthContext'
import { User, Bell, LogOut, Save, ChevronLeft } from 'lucide-react'

function ToggleRow({ label, description, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`w-11 h-6 rounded-full transition-colors shrink-0 mr-3 relative ${value ? 'bg-primary' : 'bg-muted'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${value ? 'right-0.5' : 'right-5'}`} />
      </button>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-4 py-2.5 bg-muted/50 border-b border-border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
      </div>
      <div className="px-4">{children}</div>
    </div>
  )
}

export default function Settings() {
  const { user, logout } = useAuth()
  const [profile, setProfile] = useState({ full_name: '', phone: '', company: '' })
  const [notifications, setNotifications] = useState({ new_order: true, daily_summary: true, target_alerts: false })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.from('app_settings').select('*').eq('user_id', user?.id).single()
      .then(({ data }) => {
        if (data) {
          setProfile({ full_name: data.full_name || '', phone: data.phone || '', company: data.company || '' })
          if (data.notifications) setNotifications(data.notifications)
        }
      })
  }, [user])

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('app_settings').upsert({
      user_id: user?.id,
      full_name: profile.full_name,
      phone: profile.phone,
      company: profile.company,
      notifications,
    }, { onConflict: 'user_id' })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-primary text-primary-foreground px-4 py-3">
        <h1 className="font-bold text-lg">הגדרות</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 pb-24">
        {/* Profile */}
        <div className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <User size={28} className="text-primary" />
          </div>
          <div>
            <p className="font-semibold">{profile.full_name || user?.email}</p>
            <p className="text-xs text-muted-foreground" dir="ltr">{user?.email}</p>
          </div>
        </div>

        <Section title="פרופיל">
          {[
            { key: 'full_name', label: 'שם מלא', placeholder: 'ישראל ישראלי' },
            { key: 'phone', label: 'טלפון', placeholder: '05X-XXXXXXX', type: 'tel', dir: 'ltr' },
            { key: 'company', label: 'חברה / עסק', placeholder: 'שם החברה' },
          ].map(({ key, label, placeholder, type, dir }) => (
            <div key={key} className="py-3 border-b border-border/50 last:border-0">
              <label className="text-xs text-muted-foreground block mb-1">{label}</label>
              <input
                type={type || 'text'}
                value={profile[key]}
                onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                dir={dir}
                className="w-full bg-transparent outline-none text-sm border-b border-transparent focus:border-primary transition-colors py-0.5"
              />
            </div>
          ))}
        </Section>

        <Section title="התראות">
          <ToggleRow
            label="הזמנה חדשה"
            description="קבל התראה בכל הזמנה חדשה"
            value={notifications.new_order}
            onChange={(v) => setNotifications((p) => ({ ...p, new_order: v }))}
          />
          <ToggleRow
            label="סיכום יומי"
            description="סיכום מכירות בסוף כל יום"
            value={notifications.daily_summary}
            onChange={(v) => setNotifications((p) => ({ ...p, daily_summary: v }))}
          />
          <ToggleRow
            label="התראות יעד"
            description="עדכון על התקדמות ביעדים"
            value={notifications.target_alerts}
            onChange={(v) => setNotifications((p) => ({ ...p, target_alerts: v }))}
          />
        </Section>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary text-primary-foreground font-semibold rounded-xl py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
          {saved ? 'נשמר!' : 'שמור הגדרות'}
        </button>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl py-3 text-sm transition"
        >
          <LogOut size={18} />
          התנתק
        </button>

        <p className="text-center text-xs text-muted-foreground">Vendisto v1.0.0</p>
      </div>
    </div>
  )
}
