import { getStatusBadgeClass, getStatusLabel } from '../../lib/utils'

interface Props {
  status: string
  label?: string
}

export default function StatusBadge({ status, label }: Props) {
  return (
    <span className={getStatusBadgeClass(status)}>
      {label || getStatusLabel(status)}
    </span>
  )
}
