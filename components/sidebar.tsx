'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  CalendarDays,
  Store,
  Tag,
  Upload,
  Users,
  LogOut,
} from 'lucide-react'

const NAV = [
  { href: '/',         label: 'Dashboard', icon: LayoutDashboard },
  { href: '/monthly',  label: 'Monthly',   icon: CalendarDays },
  { href: '/outlet',   label: 'Outlet',    icon: Store },
  { href: '/brand',    label: 'Brand',     icon: Tag },
  { href: '/upload',   label: 'Upload',    icon: Upload },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAdmin(user?.app_metadata?.role === 'admin')
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const nav = isAdmin ? [...NAV, { href: '/members', label: 'Members', icon: Users }] : NAV

  return (
    <aside className="flex flex-col w-60 bg-slate-900 min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-slate-800">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600 shrink-0">
          <span className="text-white font-bold text-base">P</span>
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-tight">Pott Glasses</p>
          <p className="text-slate-400 text-xs">Sales Dashboard</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5 border-t border-slate-800 pt-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
