import { cn } from '../../lib/utils'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function Spinner({ size = 'md', className }: Props) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }
  return (
    <div className={cn('animate-spin rounded-full border-2 border-[#1f1f1f] border-t-[#d4a853]', sizes[size], className)} />
  )
}
