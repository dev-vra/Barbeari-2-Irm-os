import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Filter, Scissors, Clock, CheckCircle, XCircle } from 'lucide-react'
import api from '../../lib/api'
import { formatCurrency, formatDateTime, getStatusBadgeClass, getStatusLabel } from '../../lib/utils'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'PENDING_PAYMENT', label: 'Aguard. Pagamento' },
  { value: 'CONFIRMED', label: 'Confirmados' },
  { value: 'COMPLETED', label: 'Concluídos' },
  { value: 'CANCELLED', label: 'Cancelados' },
]

export default function AdminSchedule() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [date, setDate] = useState('')
  const [professionalId, setProfessionalId] = useState('')

  const { data: professionals = [] } = useQuery({
    queryKey: ['professionals-admin'],
    queryFn: async () => { const { data } = await api.get('/professionals'); return data },
  })

  const { data, isLoading } = useQuery({
    queryKey: ['appointments-admin', search, status, date, professionalId],
    queryFn: async () => {
      const { data } = await api.get('/appointments', {
        params: { search: search || undefined, status: status || undefined, date: date || undefined, professionalId: professionalId || undefined, limit: 50 },
      })
      return data
    },
  })

  const appointments = data?.data || []

  const completeMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/appointments/${id}/status`, { status: 'COMPLETED' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments-admin'] }); toast.success('Agendamento concluído!') },
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/appointments/${id}/status`, { status: 'CANCELLED' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments-admin'] }); toast.success('Agendamento cancelado') },
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#f5f5f5]">Agenda</h1>
        <p className="text-[#888888] mt-1">Gerenciamento de agendamentos</p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555555]" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              className="input pl-9" placeholder="Nome ou CPF do cliente..."
            />
          </div>
          <select value={professionalId} onChange={e => setProfessionalId(e.target.value)} className="input">
            <option value="">Todos profissionais</option>
            {professionals.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={status} onChange={e => setStatus(e.target.value)} className="input">
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input
            type="date" value={date} onChange={e => setDate(e.target.value)}
            className="input"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : appointments.length === 0 ? (
        <EmptyState icon={Filter} title="Nenhum agendamento encontrado" description="Tente ajustar os filtros" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr>
                {['Cliente', 'Profissional', 'Serviço', 'Data / Hora', 'Valor', 'Status', 'Ações'].map(h => (
                  <th key={h} className="text-left pb-4 text-xs font-medium text-[#555555] uppercase tracking-wider pr-4 last:pr-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {appointments.map((appt: any) => (
                <tr key={appt.id} className="hover:bg-[#1a1a1a]/50 transition-colors">
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#d4a853]/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#d4a853] text-xs font-bold">{appt.client?.name?.[0]}</span>
                      </div>
                      <div>
                        <p className="text-[#f5f5f5] text-sm font-medium">{appt.client?.name}</p>
                        <p className="text-[#555555] text-xs">{appt.client?.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 pr-4 text-[#888888] text-sm">{appt.professional?.name}</td>
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-1.5 text-[#888888] text-sm">
                      <Scissors size={13} className="text-[#d4a853]" />{appt.service?.name}
                    </div>
                    <div className="flex items-center gap-1 text-[#555555] text-xs mt-0.5">
                      <Clock size={11} />{appt.service?.durationMin} min
                    </div>
                  </td>
                  <td className="py-3.5 pr-4 text-[#888888] text-sm">{formatDateTime(appt.scheduledAt)}</td>
                  <td className="py-3.5 pr-4 text-[#d4a853] font-semibold text-sm">{formatCurrency(appt.service?.price)}</td>
                  <td className="py-3.5 pr-4">
                    <span className={getStatusBadgeClass(appt.status)}>{getStatusLabel(appt.status)}</span>
                  </td>
                  <td className="py-3.5">
                    {appt.status === 'CONFIRMED' && (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => completeMutation.mutate(appt.id)}
                          title="Marcar como concluído"
                          className="p-1.5 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors">
                          <CheckCircle size={16} />
                        </button>
                        <button onClick={() => cancelMutation.mutate(appt.id)}
                          title="Cancelar"
                          className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                          <XCircle size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
