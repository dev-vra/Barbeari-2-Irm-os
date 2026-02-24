import { useQuery } from '@tanstack/react-query'
import { DollarSign, CalendarDays, Users, TrendingUp, Scissors, Clock } from 'lucide-react'
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
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data } = await api.get('/reports/dashboard')
      return data
    },
  })

  const { data: recent = [], isLoading: recentLoading } = useQuery({
    queryKey: ['recent-appointments'],
    queryFn: async () => {
      const { data } = await api.get('/appointments', { params: { limit: 8 } })
      return data?.data || []
    },
  })

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#f5f5f5]">Dashboard</h1>
        <p className="text-[#888888] mt-1">Visão geral da barbearia</p>
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
