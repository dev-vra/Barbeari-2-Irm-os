import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Scissors, LayoutDashboard, CalendarDays, Clock, User,
  LogOut, Menu, X, ChevronRight,
} from 'lucide-react'
import { useAuthStore } from '../../store/auth.store'
import toast from 'react-hot-toast'

const NAV = [
  { to: '/client', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/client/booking', label: 'Agendar', icon: CalendarDays },
  { to: '/client/appointments', label: 'Meus Agendamentos', icon: Clock },
  { to: '/client/profile', label: 'Perfil', icon: User },
]

export default function ClientLayout() {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to)

  const handleLogout = async () => {
    await logout()
    navigate('/')
    toast.success('Até logo!')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[#1f1f1f]">
        <div className="p-1.5 bg-[#d4a853] rounded-lg">
          <Scissors size={18} className="text-[#0a0a0a]" />
        </div>
        <div className="leading-tight">
          <div className="text-[#d4a853] font-bold text-xs tracking-widest">BARBEARIA</div>
          <div className="text-[#f5f5f5] font-bold text-xs tracking-widest">2 IRMÃOS</div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-[#1f1f1f]">
        <div className="flex items-center gap-3 px-3 py-2.5 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a]">
          <div className="w-9 h-9 rounded-full bg-[#d4a853]/20 flex items-center justify-center flex-shrink-0 border border-[#d4a853]/30">
            <span className="text-[#d4a853] font-bold text-sm">
              {user?.name?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[#f5f5f5] text-sm font-medium truncate">{user?.name}</p>
            <p className="text-[#555555] text-xs truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon, exact }) => (
          <Link key={to} to={to} onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${isActive(to, exact)
                ? 'bg-[#d4a853]/10 text-[#d4a853] border border-[#d4a853]/20'
                : 'text-[#888888] hover:text-[#f5f5f5] hover:bg-[#1a1a1a] border border-transparent'
              }`}>
            <Icon size={18} />
            {label}
            {isActive(to, exact) && <ChevronRight size={14} className="ml-auto" />}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-4 py-4 border-t border-[#1f1f1f]">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#888888] hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 border border-transparent">
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#0d0d0d] border-r border-[#1f1f1f] fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
              className="absolute left-0 top-0 bottom-0 w-72 bg-[#0d0d0d] border-r border-[#1f1f1f] z-50"
            >
              <div className="flex justify-end p-4">
                <button onClick={() => setSidebarOpen(false)} className="p-2 text-[#888888] hover:text-[#f5f5f5] transition-colors">
                  <X size={20} />
                </button>
              </div>
              <SidebarContent />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-4 px-4 py-3 bg-[#0d0d0d] border-b border-[#1f1f1f] sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-[#888888] hover:text-[#f5f5f5] transition-colors">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1 bg-[#d4a853] rounded-md">
              <Scissors size={14} className="text-[#0a0a0a]" />
            </div>
            <span className="text-[#f5f5f5] font-bold text-sm tracking-wide">Barbearia Pai e Filho</span>
          </div>
        </header>

        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="flex-1 p-4 sm:p-6 lg:p-8"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  )
}
