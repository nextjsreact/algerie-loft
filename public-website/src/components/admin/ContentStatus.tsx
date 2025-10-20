import { CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react'

interface ContentStatusProps {
  status: 'published' | 'draft' | 'scheduled' | 'archived'
  publishedAt?: string
  className?: string
}

const statusConfig = {
  published: {
    icon: CheckCircle,
    label: 'Published',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200'
  },
  draft: {
    icon: Clock,
    label: 'Draft',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200'
  },
  scheduled: {
    icon: AlertCircle,
    label: 'Scheduled',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200'
  },
  archived: {
    icon: XCircle,
    label: 'Archived',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200'
  }
}

export default function ContentStatus({ 
  status, 
  publishedAt, 
  className = '' 
}: ContentStatusProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      <div className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium border ${config.bgColor} ${config.color} ${config.borderColor}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </div>
      {publishedAt && status === 'published' && (
        <span className="text-xs text-gray-500">
          {formatDate(publishedAt)}
        </span>
      )}
    </div>
  )
}