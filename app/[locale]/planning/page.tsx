'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, addDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import { RefreshCw, Send, Calendar, User, Loader2, CheckCircle, AlertCircle, Brush, HandshakeIcon, Moon, Bell, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function PlanningPage() {
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')
  const [targetDate, setTargetDate] = useState(tomorrow)
  const [planning, setPlanning] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const generatePlanning = useCallback(async () => {
    setLoading(true)
    setSent(false)
    try {
      const res = await fetch(`/api/planning/generate?date=${targetDate}`)
      const data = await res.json()
      if (data.error) { toast.error(data.error); return }
      setPlanning(data)
    } catch { toast.error('Erreur réseau') }
    setLoading(false)
  }, [targetDate])

  useEffect(() => { generatePlanning() }, [generatePlanning])

  const sendPlanning = async () => {
    if (!planning) return
    setSending(true)
    try {
      const res = await fetch('/api/planning/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planning),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Planning envoyé à ${data.sent}/${data.total} agents`)
        // Show individual results
        data.results?.forEach((r: any) => {
          if (!r.sent) toast.warning(`${r.agent} : ${r.error}`)
        })
        setSent(true)
      } else {
        toast.error(data.error || 'Erreur envoi')
      }
    } catch { toast.error('Erreur réseau') }
    setSending(false)
  }

  const dateLabel = targetDate
    ? format(new Date(targetDate + 'T00:00:00'), 'EEEE dd MMMM yyyy', { locale: fr })
    : ''

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="h-6 w-6 text-blue-600" />
                Planning équipe
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Générez et envoyez le planning quotidien à votre équipe via Telegram
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Date du planning</Label>
                <Input
                  type="date"
                  value={targetDate}
                  onChange={e => setTargetDate(e.target.value)}
                  className="h-9 w-[160px]"
                />
              </div>
              <Button onClick={generatePlanning} disabled={loading} variant="outline" className="h-9 mt-5">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Générer
              </Button>
              <Button
                onClick={sendPlanning}
                disabled={!planning || sending || sent}
                className="h-9 mt-5 bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : sent ? <CheckCircle className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                {sending ? 'Envoi...' : sent ? 'Envoyé ✓' : 'Envoyer via Telegram'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-6">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}

        {!loading && planning && (
          <>
            {/* Date + summary */}
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 capitalize">{dateLabel}</h2>
              <div className="flex items-center justify-center gap-6 mt-3 text-sm text-gray-500">
                <span>🧹 {planning.summary.total_checkouts} départ{planning.summary.total_checkouts !== 1 ? 's' : ''}</span>
                <span>🤝 {planning.summary.total_checkins} arrivée{planning.summary.total_checkins !== 1 ? 's' : ''}</span>
                <span>👥 {planning.summary.available_count}/{planning.summary.total_members} disponibles</span>
              </div>
            </div>

            {/* Agent cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {planning.members.map((item: any) => (
                <AgentCard key={item.agent.id} item={item} />
              ))}
            </div>

            {/* No tasks notice */}
            {planning.summary.total_checkouts === 0 && planning.summary.total_checkins === 0 && (
              <Card className="border-0 shadow-lg bg-green-50 dark:bg-green-900/20">
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
                  <p className="text-green-700 dark:text-green-300 font-medium">Aucune arrivée ni départ ce jour</p>
                  <p className="text-green-600 dark:text-green-400 text-sm mt-1">L'astreinte reste active pour les urgences</p>
                </CardContent>
              </Card>
            )}

            {/* Telegram warning if agents missing chat ID */}
            {planning.members.some((m: any) => !m.agent.telegram_chat_id) && (
              <Card className="border-0 shadow-lg bg-amber-50 dark:bg-amber-900/20 border-amber-200">
                <CardContent className="p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-800 dark:text-amber-300 font-medium text-sm">Telegram non configuré</p>
                    <p className="text-amber-700 dark:text-amber-400 text-xs mt-1">
                      Ces agents n'ont pas de Telegram ID dans leur profil et ne recevront pas le message :{' '}
                      <strong>{planning.members.filter((m: any) => !m.agent.telegram_chat_id).map((m: any) => m.agent.full_name).join(', ')}</strong>
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function AgentCard({ item }: { item: any }) {
  const { agent, is_off, is_astreinte, cleaning_tasks, welcome_tasks, pending_tasks = [] } = item
  const totalTasks = cleaning_tasks.length + welcome_tasks.length

  return (
    <Card className={`border-0 shadow-lg overflow-hidden ${
      is_off ? 'bg-gray-50 dark:bg-gray-800/50 opacity-70' :
      is_astreinte ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-400' :
      'bg-white dark:bg-gray-800'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${
              is_off ? 'bg-gray-400' : is_astreinte ? 'bg-blue-600' : 'bg-indigo-600'
            }`}>
              {(agent.full_name || agent.email || '?')[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900 dark:text-white">{agent.full_name || agent.email}</p>
              <p className="text-xs text-gray-400">
                {agent.team ? `🏷️ ${agent.team} · ` : ''}{agent.telegram_chat_id ? '✅ Telegram' : '⚠️ Pas de Telegram'}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {is_off && <Badge variant="secondary" className="bg-gray-200 text-gray-600 text-xs gap-1"><Moon className="h-3 w-3" />Repos</Badge>}
            {is_astreinte && <Badge className="bg-blue-600 text-white text-xs gap-1"><Bell className="h-3 w-3" />Astreinte</Badge>}
            {!is_off && !is_astreinte && totalTasks === 0 && <Badge variant="outline" className="text-xs">Disponible</Badge>}
          </div>
        </div>
      </CardHeader>

      {!is_off && (
        <CardContent className="pt-0 space-y-3">
          {cleaning_tasks.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1">
                <Brush className="h-3 w-3" /> Nettoyage ({cleaning_tasks.length})
              </p>
              <div className="space-y-1">
                {cleaning_tasks.map((r: any) => (
                  <div key={r.id} className="bg-orange-50 dark:bg-orange-900/20 rounded-lg px-3 py-2 text-xs border border-orange-100 dark:border-orange-800">
                    <p className="font-medium text-orange-800 dark:text-orange-300">{r.lofts?.name || '—'}</p>
                    {r.lofts?.address && <p className="text-orange-600 dark:text-orange-400 mt-0.5">📍 {r.lofts.address}</p>}
                    {r.guest_name && <p className="text-orange-500 mt-0.5">👤 Départ : {r.guest_name}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {welcome_tasks.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1">
                <HandshakeIcon className="h-3 w-3" /> Accueil + Contrat ({welcome_tasks.length})
              </p>
              <div className="space-y-1">
                {welcome_tasks.map((r: any) => (
                  <div key={r.id} className="bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2 text-xs border border-green-100 dark:border-green-800">
                    <p className="font-medium text-green-800 dark:text-green-300">{r.lofts?.name || '—'}</p>
                    {r.lofts?.address && <p className="text-green-600 dark:text-green-400 mt-0.5">📍 {r.lofts.address}</p>}
                    {r.guest_name && <p className="text-green-500 mt-0.5">👤 {r.guest_name}</p>}
                    {r.guest_phone && <p className="text-green-500">📞 {r.guest_phone}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {totalTasks === 0 && !is_astreinte && (
            <p className="text-xs text-gray-400 text-center py-2">Aucune tâche assignée</p>
          )}
          {is_astreinte && totalTasks === 0 && (
            <p className="text-xs text-blue-500 text-center py-1">Disponible pour les urgences</p>
          )}

          {/* Pending tasks from /tasks */}
          {pending_tasks?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Tâches en cours / à faire ({pending_tasks.length})
              </p>
              <div className="space-y-1">
                {pending_tasks.map((task: any) => (
                  <div key={task.id} className={`rounded-lg px-3 py-2 text-xs border ${task.status === 'in_progress' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-700/30 border-gray-100 dark:border-gray-700'}`}>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${task.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                      <p className={`font-medium truncate ${task.status === 'in_progress' ? 'text-blue-800 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>{task.title}</p>
                    </div>
                    {task.lofts?.name && <p className="text-gray-400 mt-0.5 pl-3">🏠 {task.lofts.name}</p>}
                    {task.due_date && <p className="text-gray-400 mt-0.5 pl-3">📅 {new Date(task.due_date).toLocaleDateString('fr-FR')}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
