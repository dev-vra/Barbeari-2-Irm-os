import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { format, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Scissors, Clock, ChevronRight, ChevronLeft, Check, CalendarCheck, CreditCard, Smartphone, X, Copy } from 'lucide-react'
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
}

const STEPS = ['Profissional', 'Serviço', 'Horário', 'Confirmação']

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

// ── Step 4: Success ────────────────────────────────────────────────────────
function PixQRModal({ amount, onClose }: { amount: string; onClose: () => void }) {
  const pixKey = '00020126580014br.gov.bcb.pix0136aabbccdd-1234-5678-9012-abcdefabcdef5204000053039865802BR5925BARBEARIA PAI E FILHO6006CUIABA62070503***6304'
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(pixKey)
    setCopied(true)
    toast.success('Código PIX copiado!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-6 max-w-sm w-full relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-[#1f1f1f] transition-colors">
          <X size={18} className="text-[#888888]" />
        </button>

        <div className="text-center mb-4">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#00b4d8]/10 flex items-center justify-center">
            <Smartphone size={24} className="text-[#00b4d8]" />
          </div>
          <h3 className="text-[#f5f5f5] font-bold text-lg">Pagamento PIX</h3>
          <p className="text-[#888888] text-sm">Escaneie o QR Code ou copie o código</p>
        </div>

        <div className="bg-white rounded-xl p-4 mx-auto w-fit mb-4">
          <svg viewBox="0 0 256 256" width="200" height="200" xmlns="http://www.w3.org/2000/svg">
            {/* Generic QR code pattern */}
            <rect width="256" height="256" fill="white"/>
            {/* Position detection patterns (corners) */}
            <rect x="8" y="8" width="56" height="56" fill="black"/>
            <rect x="16" y="16" width="40" height="40" fill="white"/>
            <rect x="24" y="24" width="24" height="24" fill="black"/>
            <rect x="192" y="8" width="56" height="56" fill="black"/>
            <rect x="200" y="16" width="40" height="40" fill="white"/>
            <rect x="208" y="24" width="24" height="24" fill="black"/>
            <rect x="8" y="192" width="56" height="56" fill="black"/>
            <rect x="16" y="200" width="40" height="40" fill="white"/>
            <rect x="24" y="208" width="24" height="24" fill="black"/>
            {/* Data modules (random-looking pattern) */}
            {[72,80,88,96,104,112,120,128,136,144,152,160,168,176].map(x =>
              [8,16,24,32,40,48,56,64,72,80,88,96,104,112,120,128,136,144,152,160,168,176,184,192,200,208,216,224,232,240].map(y => {
                const show = ((x * 7 + y * 13 + 37) % 3) !== 0
                if (!show) return null
                if (x < 72 && y < 72) return null
                if (x > 184 && y < 72) return null
                if (x < 72 && y > 184) return null
                return <rect key={`${x}-${y}`} x={x} y={y} width="8" height="8" fill="black"/>
              })
            )}
          </svg>
        </div>

        <div className="text-center mb-4">
          <p className="text-[#d4a853] font-bold text-2xl">{amount}</p>
          <p className="text-[#555555] text-xs mt-1">Valor do serviço</p>
        </div>

        <button onClick={handleCopy}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] hover:border-[#00b4d8]/50 transition-all text-sm">
          <Copy size={16} className={copied ? 'text-green-500' : 'text-[#00b4d8]'} />
          <span className={copied ? 'text-green-500 font-medium' : 'text-[#f5f5f5]'}>
            {copied ? 'Copiado!' : 'Copiar código PIX'}
          </span>
        </button>

        <p className="text-[#444444] text-xs text-center mt-3">
          Após o pagamento, a confirmação é automática
        </p>
      </div>
    </div>
  )
}

function StepSuccess({ booking }: { booking: BookingState }) {
  const navigate = useNavigate()
  const [showPixQR, setShowPixQR] = useState(false)

  const payMutation = useMutation({
    mutationFn: async (paymentMethod: 'card' | 'pix') => {
      const { data } = await api.post('/payments/create-session', {
        appointmentId: booking.appointmentId,
        paymentMethod,
      })
      return data as { sessionUrl: string }
    },
    onSuccess: ({ sessionUrl }) => {
      window.location.href = sessionUrl
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Erro ao iniciar pagamento')
    },
  })

  const isPending = payMutation.isPending

  return (
    <div className="text-center">
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 rounded-full bg-[#d4a853]/10 flex items-center justify-center">
          <CalendarCheck size={40} className="text-[#d4a853]" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-[#f5f5f5] mb-2">Horário Reservado!</h2>
      <p className="text-[#888888] text-sm mb-8">
        Seu agendamento foi confirmado. Até lá!
      </p>

      {/* Summary card */}
      <div className="card mb-6 text-left space-y-3">
        {[
          { label: 'Profissional', value: booking.professional?.name },
          { label: 'Serviço',      value: booking.service?.name },
          { label: 'Duração',      value: `${booking.service?.durationMin} minutos` },
          { label: 'Data',         value: booking.date ? format(new Date(booking.date + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : '—' },
          { label: 'Horário',      value: booking.slot?.start },
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

      {/* Online payment options */}
      <p className="text-[#888888] text-xs mb-3 text-left">Pagar antecipado online:</p>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* PIX */}
        <button
          onClick={() => setShowPixQR(true)}
          disabled={isPending}
          className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[#1f1f1f]
            bg-[#111111] hover:border-[#d4a853]/50 hover:bg-[#1a1a1a]
            disabled:opacity-40 disabled:cursor-not-allowed transition-all group">
          <div className="w-10 h-10 rounded-full bg-[#00b4d8]/10 flex items-center justify-center group-hover:bg-[#00b4d8]/20 transition-colors">
            {isPending
              ? <Spinner size="sm" />
              : <Smartphone size={20} className="text-[#00b4d8]" />}
          </div>
          <div>
            <p className="text-[#f5f5f5] text-sm font-semibold">PIX</p>
            <p className="text-[#555555] text-xs">Instantâneo</p>
          </div>
        </button>

        {/* Card */}
        <button
          onClick={() => payMutation.mutate('card')}
          disabled={isPending}
          className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[#1f1f1f]
            bg-[#111111] hover:border-[#d4a853]/50 hover:bg-[#1a1a1a]
            disabled:opacity-40 disabled:cursor-not-allowed transition-all group">
          <div className="w-10 h-10 rounded-full bg-[#d4a853]/10 flex items-center justify-center group-hover:bg-[#d4a853]/20 transition-colors">
            {isPending
              ? <Spinner size="sm" />
              : <CreditCard size={20} className="text-[#d4a853]" />}
          </div>
          <div>
            <p className="text-[#f5f5f5] text-sm font-semibold">Cartão</p>
            <p className="text-[#555555] text-xs">Crédito / Débito</p>
          </div>
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-[#1f1f1f]" />
        <span className="text-[#444444] text-xs">ou</span>
        <div className="flex-1 h-px bg-[#1f1f1f]" />
      </div>

      <button onClick={() => navigate('/client/appointments')}
        className="btn-secondary w-full text-sm mb-3">
        Pagar no local · Ver meus agendamentos
      </button>

      <button onClick={() => navigate('/client')}
        className="btn-ghost w-full text-sm">
        Voltar ao início
      </button>

      {showPixQR && (
        <PixQRModal
          amount={formatCurrency(booking.service?.price)}
          onClose={() => setShowPixQR(false)}
        />
      )}
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

  // Create appointment when slot is confirmed
  const createAppointmentMutation = useMutation({
    mutationFn: async ({ date, slot }: { date: string; slot: any }) => {
      const { data: appt } = await api.post('/appointments', {
        professionalId: booking.professional?.id,
        serviceId: booking.service?.id,
        date,                  // YYYY-MM-DD
        slotStart: slot.start, // HH:MM
      })
      return appt
    },
    onSuccess: (appt) => {
      update({ appointmentId: appt.id })
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
          <StepSuccess booking={booking} />
        )}
      </div>
    </div>
  )
}
