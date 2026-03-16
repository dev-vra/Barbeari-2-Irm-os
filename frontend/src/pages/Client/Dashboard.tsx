import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { CalendarDays, Clock, CheckCircle2, ChevronRight, Scissors } from 'lucide-react'
import { useAuthStore } from '../../store/auth.store'
import api from '../../lib/api'
import { formatCurrency, formatDateTime, getStatusLabel, getStatusBadgeClass } from '../../lib/utils'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'

export default function ClientDashboard() {
  const { user } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['my-appointments'],
    queryFn: async () => {
      const { data } = await api.get('/appointments/my')
      return data
    },
  })

  const upcoming = (data || []).filter((a: any) =>
    ['CONFIRMED', 'PENDING_PAYMENT'].includes(a.status)
  ).slice(0, 3)

  const completed = (data || []).filter((a: any) => a.status === 'COMPLETED').length
  const confirmed = (data || []).filter((a: any) => a.status === 'CONFIRMED').length
  const pending = (data || []).filter((a: any) => a.status === 'PENDING_PAYMENT').length

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#f5f5f5]">
          Olá, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-[#888888] mt-1">Bem-vindo à Barbearia Pai e Filho</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Confirmados', value: confirmed, icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Aguard. Pagamento', value: pending, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { label: 'Concluídos', value: completed, icon: Scissors, color: 'text-[#d4a853]', bg: 'bg-[#d4a853]/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`p-3 rounded-xl ${bg}`}>
              <Icon size={22} className={color} />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#f5f5f5]">{value}</p>
              <p className="text-[#888888] text-sm">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="card border border-[#d4a853]/30 bg-gradient-to-r from-[#d4a853]/5 to-transparent mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-[#f5f5f5] font-semibold text-lg">Pronto para um novo visual?</h2>
            <p className="text-[#888888] text-sm mt-1">Agende seu horário com nossos profissionais</p>
          </div>
          <Link to="/client/booking" className="btn-primary whitespace-nowrap flex items-center gap-2">
            <CalendarDays size={18} /> Agendar Agora
          </Link>
        </div>
      </div>

      {/* Upcoming appointments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[#f5f5f5] font-semibold text-lg">Próximos Agendamentos</h2>
          <Link to="/client/appointments" className="text-sm text-[#d4a853] hover:underline flex items-center gap-1">
            Ver todos <ChevronRight size={14} />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : upcoming.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Nenhum agendamento próximo"
            description="Agende seu horário e apareça aqui"
            action={<Link to="/client/booking" className="btn-primary">Agendar Agora</Link>}
          />
        ) : (
          <div className="space-y-3">
            {upcoming.map((appt: any) => (
              <div key={appt.id} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#d4a853]/10 flex items-center justify-center flex-shrink-0">
                    <Scissors size={18} className="text-[#d4a853]" />
                  </div>
                  <div>
                    <p className="text-[#f5f5f5] font-medium">{appt.service?.name}</p>
                    <p className="text-[#888888] text-sm">
                      {appt.professional?.name} · {formatDateTime(appt.scheduledAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#d4a853] font-semibold">{formatCurrency(appt.service?.price)}</span>
                  <span className={getStatusBadgeClass(appt.status)}>{getStatusLabel(appt.status)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
