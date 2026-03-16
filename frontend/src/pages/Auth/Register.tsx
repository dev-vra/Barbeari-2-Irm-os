import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Scissors, Eye, EyeOff, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { useAuthStore } from '../../store/auth.store'
import MaskedInput from '../../components/ui/MaskedInput'
import { maskCpf, maskPhone, maskDate, dateDisplayToIso, digitsOnly } from '../../lib/masks'

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  cpf: z
    .string()
    .refine(v => v.replace(/\D/g, '').length === 11, 'CPF deve ter 11 dígitos'),
  phone: z.string().optional(),
  birthdate: z
    .string()
    .optional()
    .refine(v => !v || v.length === 0 || /^\d{2}\/\d{2}\/\d{4}$/.test(v), 'Data inválida (dd/mm/aaaa)'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function Register() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        name: data.name,
        email: data.email,
        cpf: digitsOnly(data.cpf),
        password: data.password,
        phone: data.phone || undefined,
        birthdate: data.birthdate ? dateDisplayToIso(data.birthdate) : undefined,
      }
      const res = await api.post('/auth/register', payload)
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken)
      toast.success(`Bem-vindo, ${res.data.user.name.split(' ')[0]}!`)
      navigate('/client')
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erro ao criar conta'
      toast.error(Array.isArray(msg) ? msg[0] : msg)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-12">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-[#d4a853]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="p-2 bg-[#d4a853] rounded-xl">
              <Scissors size={24} className="text-[#0a0a0a]" />
            </div>
            <div className="text-left">
              <div className="text-[#d4a853] font-black text-lg leading-none">BARBEARIA</div>
              <div className="text-[#f5f5f5] font-black text-lg leading-none">PAI E FILHO</div>
            </div>
          </Link>
        </div>

        <div className="card border border-[#1f1f1f]">
          <h1 className="text-2xl font-bold text-[#f5f5f5] mb-1">Criar conta</h1>
          <p className="text-[#888888] text-sm mb-8">Preencha seus dados para se cadastrar</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div>
              <label className="label">Nome completo *</label>
              <input {...register('name')} className="input" placeholder="João da Silva" autoComplete="name" />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="label">E-mail *</label>
              <input {...register('email')} type="email" className="input" placeholder="joao@email.com" autoComplete="email" />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* CPF + Phone row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">CPF *</label>
                <MaskedInput
                  mask={maskCpf}
                  registration={register('cpf')}
                  className="input"
                  placeholder="000.000.000-00"
                  autoComplete="off"
                  inputMode="numeric"
                />
                {errors.cpf && <p className="text-red-400 text-xs mt-1">{errors.cpf.message}</p>}
              </div>
              <div>
                <label className="label">Telefone</label>
                <MaskedInput
                  mask={maskPhone}
                  registration={register('phone')}
                  className="input"
                  placeholder="(65) 9 9999-9999"
                  autoComplete="tel"
                  inputMode="numeric"
                />
              </div>
            </div>

            {/* Birthdate */}
            <div>
              <label className="label">Data de nascimento</label>
              <MaskedInput
                mask={maskDate}
                registration={register('birthdate')}
                className="input"
                placeholder="dd/mm/aaaa"
                inputMode="numeric"
              />
              {errors.birthdate && <p className="text-red-400 text-xs mt-1">{errors.birthdate.message}</p>}
              <p className="text-[#555555] text-xs mt-1">Usada para recuperação de senha</p>
            </div>

            {/* Password */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Senha *</label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className="input pr-11"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555555] hover:text-[#888888]">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
              </div>
              <div>
                <label className="label">Confirmar senha *</label>
                <div className="relative">
                  <input
                    {...register('confirmPassword')}
                    type={showConfirm ? 'text' : 'password'}
                    className="input pr-11"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555555] hover:text-[#888888]">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2"
            >
              {isSubmitting ? 'Criando conta...' : <><UserPlus size={18} /> Criar conta</>}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#1f1f1f] flex items-center justify-between text-sm">
            <Link to="/login" className="text-[#888888] hover:text-[#d4a853] transition-colors">
              Já tenho conta →
            </Link>
            <Link to="/" className="text-[#555555] hover:text-[#888888] transition-colors">
              ← Início
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
