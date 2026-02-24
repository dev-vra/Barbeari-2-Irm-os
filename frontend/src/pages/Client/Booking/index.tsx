import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { format, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Scissors, Clock, ChevronRight, ChevronLeft, Check, ExternalLink, User } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../../lib/api'
import { formatCurrency } from '../../../lib/utils'
import Spinner from '../../../components/ui/Spinner'

interface BookingState {
  professional?: any
  service?: any
  date?: string
  slot?: { start: string; end: string }
  appointmentId?: string
  initPoint?: string
  sandboxInitPoint?: string
}

const STEPS = ['Profissional', 'Serviço', 'Horário', 'Pagamento']

// ── Step 1: Select Professional ────────────────────────────────────────────
function StepProfessional({ onSelect }: { onSelect: (p: any) => void }) {
  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ['professionals-public'],
    queryFn: async () => { const { data } = await api.get('/professionals'); return data },
  })

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>

  return (
    <div>
      <h2 className="text-xl font-bold text-[#f5f5f5] mb-2">Escolha o Profissional</h2>
      <p className="text-[#888888] text-sm mb-6">Selecione com quem deseja ser atendido</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {professionals.map((prof: any) => (
          <button key={prof.id} onClick={() => onSelect(prof)}
            className="card text-left hover:border-[#d4a853]/50 transition-all group flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#d4a853]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#d4a853]/20 transition-colors">
              {prof.photoUrl ? (
                <img src={prof.photoUrl} alt={prof.name} className="w-14 h-14 rounded-xl object-cover" />
              ) : (
                <span className="text-2xl font-bold text-[#d4a853]">{prof.name[0]}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#f5f5f5] font-semibold">{prof.name}</p>
              {prof.description && (
                <p className="text-[#888888] text-xs mt-1 line-clamp-2">{prof.description}</p>
              )}
              <div className="flex flex-wrap gap-1 mt-2">
                {prof.professionalServices?.slice(0, 2).map((ps: any) => (
                  <span key={ps.serviceId} className="badge-gold text-xs">{ps.service?.name}</span>
                ))}
              </div>
            </div>
            <ChevronRight size={16} className="text-[#555555] group-hover:text-[#d4a853] mt-1 flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Step 2: Select Service ─────────────────────────────────────────────────
function StepService({ professional, onSelect, onBack }: { professional: any; onSelect: (s: any) => void; onBack: () => void }) {
  const services = professional?.professionalServices?.map((ps: any) => ps.service) || []

  return (
    <div>
      <h2 className="text-xl font-bold text-[#f5f5f5] mb-2">Escolha o Serviço</h2>
      <p className="text-[#888888] text-sm mb-6">
        Profissional: <span className="text-[#d4a853]">{professional?.name}</span>
      </p>
      <div className="space-y-3 mb-8">
        {services.map((svc: any) => (
          <button key={svc.id} onClick={() => onSelect(svc)}
            className="card w-full text-left hover:border-[#d4a853]/50 transition-all group flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-[#d4a853]/10 rounded-lg group-hover:bg-[#d4a853]/20 transition-colors">
                <Scissors size={18} className="text-[#d4a853]" />
              </div>
              <div>
                <p className="text-[#f5f5f5] font-semibold">{svc.name}</p>
                {svc.description && <p className="text-[#888888] text-xs mt-0.5">{svc.description}</p>}
                <div className="flex items-center gap-1.5 text-[#555555] text-xs mt-1">
                  <Clock size={11} /> {svc.durationMin} minutos
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#d4a853] font-bold">{formatCurrency(svc.price)}</span>
              <ChevronRight size={16} className="text-[#555555] group-hover:text-[#d4a853]" />
            </div>
          </button>
        ))}
      </div>
      <button onClick={onBack} className="btn-ghost flex items-center gap-1">
        <ChevronLeft size={16} /> Voltar
      </button>
    </div>
  )
}

// ── Step 3: Pick Slot ──────────────────────────────────────────────────────
function StepSlot({ booking, onSelect, onBack }: {
  booking: BookingState; onSelect: (date: string, slot: any) => void; onBack: () => void
}) {
  const [selectedDate, setSelectedDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'))
  const [selectedSlot, setSelectedSlot] = useState<any>(null)

  const days = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i + 1))

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['slots', booking.professional?.id, booking.service?.id, selectedDate],
    queryFn: async () => {
      const { data } = await api.get('/appointments/slots', {
        params: {
          professionalId: booking.professional?.id,
          serviceId: booking.service?.id,
          date: selectedDate,
        },
      })
      return data
    },
    enabled: !!booking.professional && !!booking.service,
    staleTime: 30_000,
  })

  return (
    <div>
      <h2 className="text-xl font-bold text-[#f5f5f5] mb-2">Escolha Data e Horário</h2>
      <p className="text-[#888888] text-sm mb-6">
        Serviço: <span className="text-[#d4a853]">{booking.service?.name}</span>
        {' · '}{booking.service?.durationMin} min
      </p>

      {/* Date scroller */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        {days.map((date) => {
          const formatted = format(date, 'yyyy-MM-dd')
          const active = selectedDate === formatted
          return (
            <button key={formatted} onClick={() => { setSelectedDate(formatted); setSelectedSlot(null) }}
              className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-center transition-all min-w-[60px]
                ${active ? 'bg-[#d4a853] text-[#0a0a0a]' : 'bg-[#1a1a1a] text-[#888888] hover:bg-[#2a2a2a]'}`}>
              <div className="text-xs font-medium capitalize">{format(date, 'EEE', { locale: ptBR })}</div>
              <div className="text-sm font-bold mt-0.5">{format(date, 'dd')}</div>
            </button>
          )
        })}
      </div>

      {/* Slots grid */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : slots.length === 0 ? (
        <div className="text-center py-8 text-[#555555]">
          Nenhum horário disponível para este dia
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-8">
          {slots.map((slot: any) => (
            <button key={slot.start} disabled={!slot.available}
              onClick={() => setSelectedSlot(slot)}
              className={`py-2.5 rounded-xl text-sm font-medium transition-all
                ${!slot.available
                  ? 'bg-[#111111] text-[#333333] cursor-not-allowed'
                  : selectedSlot?.start === slot.start
                    ? 'bg-[#d4a853] text-[#0a0a0a]'
                    : 'bg-[#1a1a1a] text-[#888888] hover:bg-[#2a2a2a] hover:text-[#f5f5f5]'
                }`}>
              {slot.start}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-ghost flex items-center gap-1">
          <ChevronLeft size={16} /> Voltar
        </button>
        <button
          disabled={!selectedSlot}
          onClick={() => selectedSlot && onSelect(selectedDate, selectedSlot)}
          className="btn-primary flex items-center gap-2 disabled:opacity-40">
          Confirmar Horário <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

// ── Step 4: Payment ────────────────────────────────────────────────────────
function StepPayment({ booking, onBack }: { booking: BookingState; onBack: () => void }) {
  const navigate = useNavigate()
  const isDev = import.meta.env.DEV

  const paymentUrl = isDev
    ? booking.sandboxInitPoint || booking.initPoint
    : booking.initPoint

  return (
    <div>
      <h2 className="text-xl font-bold text-[#f5f5f5] mb-2">Pagamento</h2>
      <p className="text-[#888888] text-sm mb-8">
        Você tem <span className="text-[#d4a853] font-semibold">15 minutos</span> para concluir o pagamento.
        O horário ficará reservado durante esse período.
      </p>

      {/* Summary */}
      <div className="card mb-6 space-y-3">
        <h3 className="text-[#f5f5f5] font-semibold mb-4">Resumo do Agendamento</h3>
        {[
          { label: 'Profissional', value: booking.professional?.name },
          { label: 'Serviço', value: booking.service?.name },
          { label: 'Duração', value: `${booking.service?.durationMin} minutos` },
          { label: 'Data', value: booking.date ? format(new Date(booking.date + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : '—' },
          { label: 'Horário', value: booking.slot?.start },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-[#888888]">{label}</span>
            <span className="text-[#f5f5f5] font-medium">{value}</span>
          </div>
        ))}
        <div className="border-t border-[#1f1f1f] pt-3 flex justify-between">
          <span className="text-[#f5f5f5] font-semibold">Total</span>
          <span className="text-[#d4a853] font-bold text-lg">{formatCurrency(booking.service?.price)}</span>
        </div>
      </div>

      {paymentUrl ? (
        <a href={paymentUrl} target="_blank" rel="noopener noreferrer"
          className="btn-primary w-full flex items-center justify-center gap-2 py-3 mb-4">
          <ExternalLink size={18} /> Pagar com Mercado Pago
        </a>
      ) : (
        <div className="text-center text-[#555555] py-4">Link de pagamento não disponível</div>
      )}

      <button onClick={() => navigate('/client/appointments')} className="btn-secondary w-full text-sm mb-3">
        Ver meus agendamentos
      </button>

      <div className="flex justify-start">
        <button onClick={onBack} className="btn-ghost flex items-center gap-1">
          <ChevronLeft size={16} /> Voltar
        </button>
      </div>
    </div>
  )
}

// ── Main Booking Flow ──────────────────────────────────────────────────────
export default function BookingFlow() {
  const [step, setStep] = useState(0)
  const [booking, setBooking] = useState<BookingState>({})

  const update = (partial: Partial<BookingState>) =>
    setBooking(prev => ({ ...prev, ...partial }))
  const next = () => setStep(s => s + 1)
  const back = () => setStep(s => s - 1)

  // Create appointment + payment preference when slot is confirmed
  const createAppointmentMutation = useMutation({
    mutationFn: async ({ date, slot }: { date: string; slot: any }) => {
      // 1. Create appointment
      const { data: appt } = await api.post('/appointments', {
        professionalId: booking.professional?.id,
        serviceId: booking.service?.id,
        date,                  // YYYY-MM-DD
        slotStart: slot.start, // HH:MM
      })
      // 2. Create payment preference
      const { data: payment } = await api.post('/payments/create-preference', {
        appointmentId: appt.id,
      })
      return { appt, payment }
    },
    onSuccess: ({ appt, payment }) => {
      update({
        appointmentId: appt.id,
        initPoint: payment.initPoint,
        sandboxInitPoint: payment.sandboxInitPoint,
      })
      next()
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Erro ao criar agendamento')
    },
  })

  const handleSlotConfirm = (date: string, slot: any) => {
    update({ date, slot })
    createAppointmentMutation.mutate({ date, slot })
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#f5f5f5]">Agendar Horário</h1>
        <p className="text-[#888888] mt-1">Siga os passos para concluir seu agendamento</p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center mb-10">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                ${i < step ? 'bg-[#d4a853] border-[#d4a853] text-[#0a0a0a]' :
                  i === step ? 'border-[#d4a853] text-[#d4a853] bg-transparent' :
                    'border-[#2a2a2a] text-[#555555] bg-transparent'}`}>
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              <span className={`text-xs mt-1.5 hidden sm:block transition-colors
                ${i <= step ? 'text-[#d4a853]' : 'text-[#555555]'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-2 sm:mx-3 transition-all ${i < step ? 'bg-[#d4a853]' : 'bg-[#1f1f1f]'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="card">
        {createAppointmentMutation.isPending && (
          <div className="absolute inset-0 bg-[#111111]/80 flex items-center justify-center rounded-xl z-10">
            <div className="text-center">
              <Spinner size="lg" className="mx-auto mb-3" />
              <p className="text-[#888888] text-sm">Criando agendamento...</p>
            </div>
          </div>
        )}

        {step === 0 && (
          <StepProfessional onSelect={(p) => { update({ professional: p }); next() }} />
        )}
        {step === 1 && (
          <StepService professional={booking.professional} onSelect={(s) => { update({ service: s }); next() }} onBack={back} />
        )}
        {step === 2 && (
          <StepSlot booking={booking} onSelect={handleSlotConfirm} onBack={back} />
        )}
        {step === 3 && (
          <StepPayment booking={booking} onBack={back} />
        )}
      </div>
    </div>
  )
}
