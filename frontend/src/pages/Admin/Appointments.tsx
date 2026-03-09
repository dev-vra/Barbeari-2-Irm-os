import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, CalendarDays, Search, Scissors, Clock, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { formatDateTime, formatCurrency, getStatusBadgeClass, getStatusLabel } from '../../lib/utils'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'CONFIRMED', label: 'Confirmado' },
  { value: 'PENDING_PAYMENT', label: 'Aguardando Pagamento' },
  { value: 'COMPLETED', label: 'Concluído' },
  { value: 'CANCELLED', label: 'Cancelado' },
  { value: 'NO_SHOW', label: 'Não Compareceu' },
]

export default function AdminAppointments() {
  const qc = useQueryClient()

  // Filters
  const [filterProfessional, setFilterProfessional] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [filterSearch, setFilterSearch] = useState('')

  // New appointment modal
  const [modalOpen, setModalOpen] = useState(false)
  const [newAppt, setNewAppt] = useState({
    clientId: '',
    professionalId: '',
    serviceId: '',
    date: '',
    slotStart: '',
  })

  // Queries
  const { data: apptData, isLoading } = useQuery({
    queryKey: ['admin-appointments', filterProfessional, filterStatus, filterDate, filterSearch],
    queryFn: async () => {
      const params: any = { limit: 50 }
      if (filterProfessional) params.professionalId = filterProfessional
      if (filterStatus) params.status = filterStatus
      if (filterDate) params.date = filterDate
      if (filterSearch) params.search = filterSearch
      const { data } = await api.get('/appointments', { params })
      return data
    },
  })

  const { data: professionals = [] } = useQuery({
    queryKey: ['professionals-appt'],
    queryFn: async () => { const { data } = await api.get('/professionals'); return data },
  })

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-appt'],
    queryFn: async () => {
      const { data } = await api.get('/users', { params: { role: 'CLIENT' } })
      return data?.data || data
    },
  })

  // Services for selected professional
  const selectedProf = professionals.find((p: any) => p.id === newAppt.professionalId)
  const profServices = selectedProf?.professionalServices?.map((ps: any) => ps.service) || []

  // Available slots
  const { data: slots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ['slots-admin', newAppt.professionalId, newAppt.serviceId, newAppt.date],
    enabled: !!(newAppt.professionalId && newAppt.serviceId && newAppt.date),
    queryFn: async () => {
      const { data } = await api.get('/appointments/slots', {
        params: {
          professionalId: newAppt.professionalId,
          serviceId: newAppt.serviceId,
          date: newAppt.date,
        },
      })
      return data
    },
  })

  const availableSlots = slots.filter((s: any) => s.available)

  const createMutation = useMutation({
    mutationFn: () => api.post('/appointments', {
      professionalId: newAppt.professionalId,
      serviceId: newAppt.serviceId,
      date: newAppt.date,
      slotStart: newAppt.slotStart,
      clientId: newAppt.clientId || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-appointments'] })
      setModalOpen(false)
      setNewAppt({ clientId: '', professionalId: '', serviceId: '', date: '', slotStart: '' })
      toast.success('Agendamento criado com sucesso!')
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Erro ao criar agendamento'),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/appointments/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-appointments'] })
      toast.success('Status atualizado!')
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Erro'),
  })

  const appointments = apptData?.data || []

  const handleProfChange = (profId: string) => {
    setNewAppt(prev => ({ ...prev, professionalId: profId, serviceId: '', slotStart: '' }))
  }
  const handleServiceChange = (svcId: string) => {
    setNewAppt(prev => ({ ...prev, serviceId: svcId, slotStart: '' }))
  }
  const handleDateChange = (date: string) => {
    setNewAppt(prev => ({ ...prev, date, slotStart: '' }))
  }

  const canCreate = !!(newAppt.professionalId && newAppt.serviceId && newAppt.date && newAppt.slotStart)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#f5f5f5]">Agendamentos</h1>
          <p className="text-[#888888] mt-1">Gerencie todos os agendamentos da barbearia</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Novo Agendamento
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555555]" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={filterSearch}
              onChange={e => setFilterSearch(e.target.value)}
              className="input pl-9 text-sm py-2"
            />
          </div>
          <select
            value={filterProfessional}
            onChange={e => setFilterProfessional(e.target.value)}
            className="input text-sm py-2"
          >
            <option value="">Todos os profissionais</option>
            {professionals.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="input text-sm py-2"
          >
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="input text-sm py-2"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12 text-[#555555]">
            <CalendarDays size={40} className="mx-auto mb-3 opacity-30" />
            <p>Nenhum agendamento encontrado</p>
          </div>
        ) : (
          <table className="w-full min-w-[750px]">
            <thead>
              <tr>
                {['Cliente', 'Profissional', 'Serviço', 'Data / Hora', 'Valor', 'Status', 'Ações'].map(h => (
                  <th key={h} className="text-left pb-4 text-xs font-medium text-[#555555] uppercase tracking-wider pr-3 last:pr-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {appointments.map((appt: any) => (
                <tr key={appt.id} className="hover:bg-[#1a1a1a]/50 transition-colors">
                  <td className="py-3.5 pr-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#d4a853]/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#d4a853] text-xs font-bold">{appt.client?.name?.[0]}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[#f5f5f5] text-sm font-medium truncate max-w-[120px]">{appt.client?.name}</p>
                        {appt.client?.phone && <p className="text-[#555555] text-xs">{appt.client.phone}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 pr-3 text-[#888888] text-sm">{appt.professional?.name}</td>
                  <td className="py-3.5 pr-3">
                    <div className="flex items-center gap-1.5 text-[#888888] text-sm">
                      <Scissors size={13} className="text-[#d4a853]" />
                      {appt.service?.name}
                    </div>
                  </td>
                  <td className="py-3.5 pr-3">
                    <div className="flex items-center gap-1.5 text-[#888888] text-sm">
                      <Clock size={13} />
                      {formatDateTime(appt.scheduledAt)}
                    </div>
                  </td>
                  <td className="py-3.5 pr-3 text-[#d4a853] font-semibold text-sm">
                    {formatCurrency(appt.service?.price)}
                  </td>
                  <td className="py-3.5 pr-3">
                    <span className={getStatusBadgeClass(appt.status)}>{getStatusLabel(appt.status)}</span>
                  </td>
                  <td className="py-3.5">
                    <div className="relative group">
                      <button className="flex items-center gap-1 text-xs text-[#888888] hover:text-[#f5f5f5] px-2 py-1.5 rounded-lg hover:bg-[#1f1f1f] transition-colors">
                        Alterar <ChevronDown size={12} />
                      </button>
                      <div className="absolute right-0 top-full z-10 hidden group-hover:block bg-[#111111] border border-[#1f1f1f] rounded-xl shadow-xl py-1 min-w-[160px]">
                        {['CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].map(s => (
                          <button
                            key={s}
                            disabled={appt.status === s || updateStatus.isPending}
                            onClick={() => updateStatus.mutate({ id: appt.id, status: s })}
                            className={`w-full text-left px-3 py-2 text-xs hover:bg-[#1a1a1a] transition-colors
                              ${appt.status === s ? 'text-[#d4a853] font-medium' : 'text-[#888888]'}
                              disabled:opacity-50`}
                          >
                            {getStatusLabel(s)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* New appointment modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo Agendamento" size="md">
        <div className="space-y-4">
          {/* Client */}
          <div>
            <label className="label">Cliente</label>
            <select
              value={newAppt.clientId}
              onChange={e => setNewAppt(prev => ({ ...prev, clientId: e.target.value }))}
              className="input"
            >
              <option value="">— Selecionar cliente —</option>
              {clients.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name} · {c.cpf}</option>
              ))}
            </select>
          </div>

          {/* Professional */}
          <div>
            <label className="label">Profissional *</label>
            <select
              value={newAppt.professionalId}
              onChange={e => handleProfChange(e.target.value)}
              className="input"
            >
              <option value="">— Selecionar profissional —</option>
              {professionals.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Service */}
          <div>
            <label className="label">Serviço *</label>
            <select
              value={newAppt.serviceId}
              onChange={e => handleServiceChange(e.target.value)}
              disabled={!newAppt.professionalId}
              className="input disabled:opacity-50"
            >
              <option value="">— Selecionar serviço —</option>
              {profServices.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name} — {formatCurrency(s.price)}</option>
              ))}
            </select>
            {newAppt.professionalId && profServices.length === 0 && (
              <p className="text-xs text-yellow-400 mt-1">Profissional sem serviços vinculados</p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="label">Data *</label>
            <input
              type="date"
              value={newAppt.date}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => handleDateChange(e.target.value)}
              disabled={!newAppt.serviceId}
              className="input disabled:opacity-50"
            />
          </div>

          {/* Time slot */}
          {newAppt.date && newAppt.serviceId && newAppt.professionalId && (
            <div>
              <label className="label">Horário *</label>
              {slotsLoading ? (
                <div className="flex items-center gap-2 text-[#888888] text-sm py-2">
                  <Spinner size="sm" /> Carregando horários...
                </div>
              ) : availableSlots.length === 0 ? (
                <p className="text-yellow-400 text-sm py-2">Nenhum horário disponível neste dia</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                  {availableSlots.map((slot: any) => (
                    <button
                      key={slot.start}
                      onClick={() => setNewAppt(prev => ({ ...prev, slotStart: slot.start }))}
                      className={`py-2 text-sm rounded-lg border transition-colors font-medium
                        ${newAppt.slotStart === slot.start
                          ? 'bg-[#d4a853] text-[#0a0a0a] border-[#d4a853]'
                          : 'border-[#1f1f1f] text-[#888888] hover:border-[#d4a853]/40 hover:text-[#d4a853]'}`}
                    >
                      {slot.start}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="pt-1 bg-[#1a1a1a] rounded-xl p-3 text-xs text-[#888888]">
            <p>ℹ️ Agendamentos criados pelo admin ficam como <strong className="text-[#f5f5f5]">Confirmados</strong> (pagamento presencial)</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancelar</button>
            <button
              onClick={() => createMutation.mutate()}
              disabled={!canCreate || createMutation.isPending}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Criando...' : 'Criar Agendamento'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
