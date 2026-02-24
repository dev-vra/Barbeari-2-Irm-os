import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Scissors, Eye, EyeOff, KeyRound, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  cpf: z
    .string()
    .transform(v => v.replace(/\D/g, ''))
    .pipe(z.string().length(11, 'CPF deve ter 11 dígitos')),
  birthdate: z.string().min(1, 'Data de nascimento obrigatória'),
  newPassword: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [done, setDone] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await api.post('/auth/reset-password', {
        email: data.email,
        cpf: data.cpf,
        birthdate: data.birthdate,
        newPassword: data.newPassword,
      })
      setDone(true)
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erro ao redefinir senha'
      toast.error(Array.isArray(msg) ? msg[0] : msg)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-[#d4a853]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="p-2 bg-[#d4a853] rounded-xl">
              <Scissors size={24} className="text-[#0a0a0a]" />
            </div>
            <div className="text-left">
              <div className="text-[#d4a853] font-black text-lg leading-none">BARBEARIA</div>
              <div className="text-[#f5f5f5] font-black text-lg leading-none">DO GUSTAVO</div>
            </div>
          </Link>
        </div>

        <div className="card border border-[#1f1f1f]">
          {done ? (
            // ── Success state ──────────────────────────────────────────────
            <div className="text-center py-4">
              <div className="flex justify-center mb-4">
                <CheckCircle2 size={52} className="text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-[#f5f5f5] mb-2">Senha redefinida!</h2>
              <p className="text-[#888888] text-sm mb-8">
                Sua senha foi atualizada com sucesso.<br />
                Faça login com a nova senha.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="btn-primary w-full py-3"
              >
                Ir para o login
              </button>
            </div>
          ) : (
            // ── Form ──────────────────────────────────────────────────────
            <>
              <h1 className="text-2xl font-bold text-[#f5f5f5] mb-1">Recuperar senha</h1>
              <p className="text-[#888888] text-sm mb-8">
                Confirme seus dados cadastrais para redefinir a senha
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Identity fields */}
                <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl p-4 space-y-4">
                  <p className="text-[#555555] text-xs uppercase tracking-wider font-medium">Verificação de identidade</p>

                  <div>
                    <label className="label">E-mail *</label>
                    <input
                      {...register('email')}
                      type="email"
                      className="input"
                      placeholder="seu@email.com"
                      autoComplete="email"
                    />
                    {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label className="label">CPF *</label>
                    <input
                      {...register('cpf')}
                      className="input"
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                    {errors.cpf && <p className="text-red-400 text-xs mt-1">{errors.cpf.message}</p>}
                  </div>

                  <div>
                    <label className="label">Data de nascimento *</label>
                    <input {...register('birthdate')} type="date" className="input" />
                    {errors.birthdate && <p className="text-red-400 text-xs mt-1">{errors.birthdate.message}</p>}
                  </div>
                </div>

                {/* New password fields */}
                <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl p-4 space-y-4">
                  <p className="text-[#555555] text-xs uppercase tracking-wider font-medium">Nova senha</p>

                  <div>
                    <label className="label">Nova senha *</label>
                    <div className="relative">
                      <input
                        {...register('newPassword')}
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
                    {errors.newPassword && <p className="text-red-400 text-xs mt-1">{errors.newPassword.message}</p>}
                  </div>

                  <div>
                    <label className="label">Confirmar nova senha *</label>
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
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                >
                  {isSubmitting ? 'Verificando...' : <><KeyRound size={18} /> Redefinir senha</>}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-[#1f1f1f] flex items-center justify-between text-sm">
                <Link to="/login" className="text-[#888888] hover:text-[#d4a853] transition-colors">
                  ← Voltar ao login
                </Link>
                <Link to="/register" className="text-[#555555] hover:text-[#888888] transition-colors">
                  Criar conta
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
