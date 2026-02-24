interface Props {
  icon: React.ElementType
  title: string
  description?: string
  action?: React.ReactNode
}

export default function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className='flex flex-col items-center justify-center py-16 text-center'>
      <div className='p-4 bg-[#1a1a1a] rounded-full mb-4'>
        <Icon size={32} className='text-[#d4a853]' />
      </div>
      <h3 className='text-lg font-semibold text-[#f5f5f5] mb-2'>{title}</h3>
      {description && <p className='text-[#888888] text-sm max-w-sm'>{description}</p>}
      {action && <div className='mt-6'>{action}</div>}
    </div>
  )
}
