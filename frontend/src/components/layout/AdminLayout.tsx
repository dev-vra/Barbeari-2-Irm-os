import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Scissors, LayoutDashboard, CalendarDays, Users, Briefcase,
  Package, FileText, LogOut, Menu, X, ChevronRight, Wrench,
} from 'lucide-react'
import { useAuthStore } from '../../store/auth.store'
import toast from 'react-hot-toast'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/schedule', label: 'Agenda', icon: CalendarDays },
  { to: '/admin/professionals', label: 'Profissionais', icon: Briefcase },
  { to: '/admin/services', label: 'Serviços', icon: Wrench },
  { to: '/admin/products', label: 'Produtos', icon: Package },
  { to: '/admin/clients', label: 'Clientes', icon: Users },
  { to: '/admin/reports', label: 'Relatórios', icon: FileText },
]

export default function AdminLayout() {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
    toast.success('Até logo!')
  }

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-[#1f1f1f]">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-1.5 bg-[#d4a853] rounded-lg">
            <Scissors size={18} className="text-[#0a0a0a]" />
          </div>
          <div className="leading-tight">
            <div className="text-[#d4a853] font-bold text-xs">BARBEARIA</div>
            <div className="text-[#f5f5f5] font-bold text-xs">DO GUSTAVO</div>
          </div>
        </div>
        <span className="text-[#555555] text-xs">Painel Administrativo</span>
      </div>

      {/* Admin info */}
      <div className="px-4 py-4 border-b border-[#1f1f1f]">
        <div className="flex items-center gap-3 px-3 py-2.5 bg-[#d4a853]/5 border border-[#d4a853]/20 rounded-xl">
          <div className="w-9 h-9 rounded-full bg-[#d4a853] flex items-center justify-center flex-shrink-0">
            <span className="text-[#0a0a0a] font-bold text-sm">
              {user?.name?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[#f5f5f5] text-sm font-medium truncate">{user?.name}</p>
            <p className="text-[#d4a853] text-xs">Administrador</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon, exact }) => (
          <Link key={to} to={to} onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
              ${isActive(to, exact)
                ? 'bg-[#d4a853]/10 text-[#d4a853] border border-[#d4a853]/20'
                : 'text-[#888888] hover:text-[#f5f5f5] hover:bg-[#1a1a1a]'
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
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#888888] hover:text-red-400 hover:bg-red-500/10 transition-all">
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
        <Sidebar />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-[#0d0d0d] border-r border-[#1f1f1f] z-50">
            <div className="flex justify-end p-4">
              <button onClick={() => setSidebarOpen(false)} className="p-2 text-[#888888] hover:text-[#f5f5f5]">
                <X size={20} />
              </button>
            </div>
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-4 px-4 py-3 bg-[#0d0d0d] border-b border-[#1f1f1f] sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-[#888888]">
            <Menu size={22} />
          </button>
          <span className="text-[#f5f5f5] font-bold text-sm">Admin</span>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
