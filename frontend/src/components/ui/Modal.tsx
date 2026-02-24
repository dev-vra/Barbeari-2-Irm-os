import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export default function Modal({ open, onClose, title, children, size = 'md' }: Props) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      <div className='absolute inset-0 bg-black/70 backdrop-blur-sm' onClick={onClose} />
      <div className={cn('relative w-full bg-[#111111] rounded-2xl border border-[#1f1f1f] shadow-2xl', sizes[size])}>
        {title && (
          <div className='flex items-center justify-between p-6 border-b border-[#1f1f1f]'>
            <h2 className='text-lg font-semibold text-[#f5f5f5]'>{title}</h2>
            <button onClick={onClose} className='p-1.5 hover:bg-[#1f1f1f] rounded-lg transition-colors'>
              <X size={18} className='text-[#888888]' />
            </button>
          </div>
        )}
        <div className='p-6'>{children}</div>
      </div>
    </div>
  )
}
