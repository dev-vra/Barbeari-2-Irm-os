import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DollarSign, CalendarDays, Users, TrendingUp, Scissors, Clock, Filter, X } from 'lucide-react'
import api from '../../lib/api'
import { formatCurrency, formatDateTime, getStatusBadgeClass, getStatusLabel } from '../../lib/utils'
import Spinner from '../../components/ui/Spinner'

function StatCard({ label, value, icon: Icon, color, sub }: any) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={22} className="text-[#d4a853]" />
      </div>
      <div>
        <p className="text-[#888888] text-sm">{label}</p>
        <p className="text-2xl font-bold text-[#f5f5f5] mt-0.5">{value}</p>
        {sub && <p className="text-[#555555] text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [professionalId, setProfessionalId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const hasFilter = !!(professionalId || serviceId || startDate || endDate)

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats', professionalId, serviceId, startDate, endDate],
    queryFn: async () => {
      const params: any = {}
      if (professionalId) params.professionalId = professionalId
      if (serviceId) params.serviceId = serviceId
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate
      const { data } = await api.get('/reports/dashboard', { params })
      return data
    },
  })

  const { data: professionals = [] } = useQuery({
    queryKey: ['professionals-filter'],
    queryFn: async () => { const { data } = await api.get('/professionals'); return data },
  })

  const { data: services = [] } = useQuery({
    queryKey: ['services-filter'],
    queryFn: async () => { const { data } = await api.get('/services'); return data?.data || data },
  })

  const { data: recent = [], isLoading: recentLoading } = useQuery({
    queryKey: ['recent-appointments'],
    queryFn: async () => {
      const { data } = await api.get('/appointments', { params: { limit: 8 } })
      return data?.data || []
    },
  })

  const clearFilters = () => {
    setProfessionalId('')
    setServiceId('')
    setStartDate('')
    setEndDate('')
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#f5f5f5]">Dashboard</h1>
        <p className="text-[#888888] mt-1">Visão geral da barbearia</p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} className="text-[#d4a853]" />
          <span className="text-[#f5f5f5] font-medium text-sm">Filtros</span>
          {hasFilter && (
            <button onClick={clearFilters} className="ml-auto text-xs text-[#888888] hover:text-red-400 flex items-center gap-1 transition-colors">
              <X size={12} /> Limpar filtros
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="label text-xs">Profissional</label>
            <select
              value={professionalId}
              onChange={e => setProfessionalId(e.target.value)}
              className="input text-sm py-2"
            >
              <option value="">Todos</option>
              {professionals.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label text-xs">Serviço</label>
            <select
              value={serviceId}
              onChange={e => setServiceId(e.target.value)}
              className="input text-sm py-2"
            >
              <option value="">Todos</option>
              {services.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label text-xs">Data início</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="input text-sm py-2"
            />
          </div>
          <div>
            <label className="label text-xs">Data fim</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="input text-sm py-2"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      {statsLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Receita do Mês"
            value={formatCurrency(stats?.monthRevenue || 0)}
            icon={DollarSign}
            color="bg-[#d4a853]/10"
            sub={`${stats?.monthAppointments || 0} atendimentos`}
          />
          <StatCard
            label="Agendamentos Hoje"
            value={stats?.todayAppointments || 0}
            icon={CalendarDays}
            color="bg-[#d4a853]/10"
            sub={`${stats?.todayPending || 0} aguardando pagamento`}
          />
          <StatCard
            label="Total de Clientes"
            value={stats?.totalClients || 0}
            icon={Users}
            color="bg-[#d4a853]/10"
            sub="Clientes cadastrados"
          />
          <StatCard
            label="Comissões do Mês"
            value={formatCurrency(stats?.monthCommissions || 0)}
            icon={TrendingUp}
            color="bg-[#d4a853]/10"
            sub="A pagar aos profissionais"
          />
        </div>
      )}

      {/* Recent appointments */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[#f5f5f5] font-semibold text-lg">Agendamentos Recentes</h2>
        </div>
        {recentLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : recent.length === 0 ? (
          <div className="text-center py-8 text-[#555555]">Nenhum agendamento encontrado</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  {['Cliente', 'Profissional', 'Serviço', 'Data / Hora', 'Valor', 'Status'].map(h => (
                    <th key={h} className="pb-3 text-xs font-medium text-[#555555] uppercase tracking-wider pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {recent.map((appt: any) => (
                  <tr key={appt.id} className="hover:bg-[#1a1a1a]/50 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#d4a853]/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-[#d4a853] text-xs font-bold">{appt.client?.name?.[0]}</span>
                        </div>
                        <span className="text-[#f5f5f5] text-sm font-medium truncate max-w-[120px]">{appt.client?.name}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-[#888888] text-sm">{appt.professional?.name}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1.5 text-[#888888] text-sm">
                        <Scissors size={13} className="text-[#d4a853]" />
                        {appt.service?.name}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1.5 text-[#888888] text-sm">
                        <Clock size={13} />
                        {formatDateTime(appt.scheduledAt)}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-[#d4a853] font-semibold text-sm">
                      {formatCurrency(appt.service?.price)}
                    </td>
                    <td className="py-3">
                      <span className={getStatusBadgeClass(appt.status)}>{getStatusLabel(appt.status)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
