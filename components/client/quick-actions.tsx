'use client'

import { Search, Heart, MessageSquare, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function QuickActions() {
  const router = useRouter()

  const actions = [
    { icon: Search, label: 'Rechercher un loft', color: 'from-blue-500 to-cyan-500', path: '/fr/public' },
    { icon: Heart, label: 'Mes favoris', color: 'from-rose-500 to-pink-500', path: '/fr/client/favorites' },
    { icon: MessageSquare, label: 'Messages', color: 'from-purple-500 to-indigo-500', path: '/fr/client/messages' }
  ]

  return (
    <div className="bg-white rounded-3xl p-6 shadow-lg">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Actions rapides</h3>
      <div className="space-y-3">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => router.push(action.path)}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all group"
          >
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <action.icon className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-gray-700">{action.label}</span>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
          </button>
        ))}
      </div>
    </div>
  )
}
