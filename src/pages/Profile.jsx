import { useAuth } from '../lib/AuthContext'
import { LogOut, User } from 'lucide-react'

export default function Profile() {
  const { user, logout } = useAuth()

  return (
    <div className="p-4 flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-slate-800">פרופיל</h1>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[hsl(215_85%_35%)] flex items-center justify-center">
          <User size={28} className="text-white" />
        </div>
        <div>
          <p className="font-semibold text-slate-800">{user?.email}</p>
          <p className="text-sm text-slate-500">סוכן מכירות</p>
        </div>
      </div>

      <button
        onClick={logout}
        className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl py-3 text-sm transition"
      >
        <LogOut size={18} />
        התנתק
      </button>
    </div>
  )
}
