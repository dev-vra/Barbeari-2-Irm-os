import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Scissors, Eye, EyeOff, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/auth.store'

const schema = z.object({
  identifier: z.string().min(1, 'Informe seu e-mail ou CPF'),
  password: z.string().min(1, 'Informe sua senha'),
})

type FormData = z.infer<typeof schema>

export default function Login() {
  const navigate = useNavigate()
  const { login, user } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.identifier, data.password)
      const u = useAuthStore.getState().user
      if (u?.role === 'ADMIN') navigate('/admin')
      else navigate('/client')
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'E-mail/CPF ou senha incorretos'
      toast.error(msg)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-[#d4a853]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
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
          <h1 className="text-2xl font-bold text-[#f5f5f5] mb-1">Bem-vindo de volta</h1>
          <p className="text-[#888888] text-sm mb-8">Entre com seu e-mail ou CPF</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">E-mail ou CPF</label>
              <input
                {...register('identifier')}
                className="input"
                placeholder="exemplo@email.com ou 000.000.000-00"
                autoComplete="username"
              />
              {errors.identifier && <p className="text-red-400 text-xs mt-1">{errors.identifier.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Senha</label>
                <Link to="/forgot-password" className="text-xs text-[#888888] hover:text-[#d4a853] transition-colors">
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-11"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555555] hover:text-[#888888]">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {isSubmitting ? 'Entrando...' : (<><LogIn size={18} /> Entrar</>)}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#1f1f1f] flex items-center justify-between text-sm">
            <Link to="/register" className="text-[#d4a853] hover:text-[#e8c06a] font-medium transition-colors">
              Criar conta →
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
