import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Home, Users, ShoppingCart, Menu, X, Package, CreditCard, Target, Navigation, Tag, Settings, ChevronLeft } from 'lucide-react'
import { useState } from 'react'

const BOTTOM_NAV = [
  { to: '/',          label: 'בית',     icon: Home,         end: true },
  { to: '/orders',    label: 'הזמנות',  icon: ShoppingCart },
  { to: '/customers', label: 'לקוחות', icon: Users },
  { to: '/products',  label: 'מוצרים',  icon: Package },
]

const MORE_ITEMS = [
  { to: '/debts',        label: 'חובות',        icon: CreditCard,  desc: 'מעקב אחר יתרות ותשלומים' },
  { to: '/targets',      label: 'יעדים',        icon: Target,      desc: 'יעדי מכירות חודשיים' },
  { to: '/visit-routes', label: 'מסלולי ביקור', icon: Navigation,  desc: 'תכנון ביקורי לקוחות' },
  { to: '/promotions',   label: 'מבצעים',       icon: Tag,         desc: 'ניהול מבצעים והנחות' },
  { to: '/settings',     label: 'הגדרות',       icon: Settings,    desc: 'הגדרות חשבון ומערכת' },
]

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const isMoreActive = MORE_ITEMS.some((item) => location.pathname.startsWith(item.to))

  const handleMoreNavigate = (to) => {
    setMenuOpen(false)
    navigate(to)
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 right-0 left-0 bg-card border-t border-border z-40">
        <div className="flex items-stretch">
          {BOTTOM_NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* More button */}
          <button
            onClick={() => setMenuOpen(true)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors ${
              isMoreActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Menu size={22} strokeWidth={isMoreActive ? 2.5 : 1.8} />
            <span>עוד</span>
          </button>
        </div>
      </nav>

      {/* More sheet */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed bottom-0 right-0 left-0 bg-card rounded-t-3xl z-50 shadow-2xl">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h3 className="font-bold text-base">תפריט נוסף</h3>
              <button onClick={() => setMenuOpen(false)} className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <X size={16} />
              </button>
            </div>
            <div className="px-4 pb-8 pt-1 flex flex-col gap-1">
              {MORE_ITEMS.map(({ to, label, icon: Icon, desc }) => {
                const isActive = location.pathname.startsWith(to)
                return (
                  <button
                    key={to}
                    onClick={() => handleMoreNavigate(to)}
                    className={`flex items-center gap-4 px-3 py-3.5 rounded-2xl text-right transition ${
                      isActive ? 'bg-primary/10' : 'hover:bg-muted'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                    }`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 text-right">
                      <p className={`text-sm font-semibold ${isActive ? 'text-primary' : ''}`}>{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <ChevronLeft size={16} className="text-muted-foreground shrink-0" />
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
