import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Mail, Phone, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/auth.store'
import { formatCpf } from '../../lib/utils'

const schema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  phone: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function ClientProfile() {
  const { user } = useAuthStore()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name || '', phone: '' },
  })

  const onSubmit = async (_data: FormData) => {
    toast.success('Perfil atualizado!')
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#f5f5f5]">Meu Perfil</h1>
        <p className="text-[#888888] mt-1">Seus dados cadastrais</p>
      </div>

      {/* Avatar */}
      <div className="card mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-[#d4a853]/10 border-2 border-[#d4a853]/30 flex items-center justify-center flex-shrink-0">
          <span className="text-3xl font-bold text-[#d4a853]">{user?.name?.[0]?.toUpperCase()}</span>
        </div>
        <div>
          <p className="text-[#f5f5f5] font-semibold text-lg">{user?.name}</p>
          <p className="text-[#888888] text-sm">{user?.email}</p>
        </div>
      </div>

      {/* Info readonly */}
      <div className="card mb-6 space-y-4">
        <h2 className="text-[#f5f5f5] font-semibold mb-4">Informações da Conta</h2>
        {[
          { icon: Mail, label: 'E-mail', value: user?.email },
          { icon: User, label: 'CPF', value: user?.cpf ? formatCpf(user.cpf) : '—' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3">
            <div className="p-2 bg-[#1a1a1a] rounded-lg flex-shrink-0">
              <Icon size={16} className="text-[#555555]" />
            </div>
            <div>
              <p className="text-[#555555] text-xs">{label}</p>
              <p className="text-[#f5f5f5] text-sm font-medium">{value || '—'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Edit form */}
      <div className="card">
        <h2 className="text-[#f5f5f5] font-semibold mb-6">Editar Dados</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Nome completo</label>
            <input {...register('name')} className="input" />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Telefone / WhatsApp</label>
            <input {...register('phone')} className="input" placeholder="(65) 99999-9999" />
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>
      </div>
    </div>
  )
}
