import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Scissors } from 'lucide-react'
import api from '../../lib/api'
import { formatCurrency, formatDateTime, getStatusLabel, getStatusBadgeClass } from '../../lib/utils'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import { Link } from 'react-router-dom'

export default function ClientAppointments() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['my-appointments'],
    queryFn: async () => {
      const { data } = await api.get('/appointments/my')
      return data
    },
  })

  const upcoming = data.filter((a: any) => ['CONFIRMED', 'PENDING_PAYMENT'].includes(a.status))
  const past = data.filter((a: any) => !['CONFIRMED', 'PENDING_PAYMENT'].includes(a.status))

  const AppointmentCard = ({ appt }: { appt: any }) => (
    <div className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-[#d4a853]/10 flex items-center justify-center flex-shrink-0">
          <Scissors size={20} className="text-[#d4a853]" />
        </div>
        <div>
          <p className="text-[#f5f5f5] font-semibold">{appt.service?.name}</p>
          <p className="text-[#888888] text-sm mt-0.5">
            {appt.professional?.name}
          </p>
          <p className="text-[#555555] text-xs mt-0.5">
            {formatDateTime(appt.scheduledAt)}
            {appt.service?.durationMin && ` · ${appt.service.durationMin} min`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-[#d4a853] font-bold">{formatCurrency(appt.service?.price)}</span>
        <span className={getStatusBadgeClass(appt.status)}>{getStatusLabel(appt.status)}</span>
      </div>
    </div>
  )

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#f5f5f5]">Meus Agendamentos</h1>
        <p className="text-[#888888] mt-1">Histórico completo de serviços</p>
      </div>

      {data.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Nenhum agendamento encontrado"
          description="Que tal agendar seu primeiro horário?"
          action={<Link to="/client/booking" className="btn-primary">Agendar Agora</Link>}
        />
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[#d4a853] uppercase tracking-wider mb-3">
                Próximos ({upcoming.length})
              </h2>
              <div className="space-y-3">
                {upcoming.map((a: any) => <AppointmentCard key={a.id} appt={a} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[#555555] uppercase tracking-wider mb-3">
                Histórico ({past.length})
              </h2>
              <div className="space-y-3">
                {past.map((a: any) => <AppointmentCard key={a.id} appt={a} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
