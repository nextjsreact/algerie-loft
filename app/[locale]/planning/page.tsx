'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, addDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import { RefreshCw, Send, Calendar, Loader2, CheckCircle, AlertCircle, Brush, HandshakeIcon, Moon, Bell, Clock, UserX, ArrowRightLeft, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

export default function PlanningPage() {
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')
  const [targetDate, setTargetDate] = useState(tomorrow)
  const [planning, setPlanning] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  // Editable planning state (separate from generated)
  const [editedMembers, setEditedMembers] = useState<any[]>([])
  const [isEdited, setIsEdited] = useState(false)

  const generatePlanning = useCallback(async () => {
    setLoading(true)
    setSent(false)
    setIsEdited(false)
    try {
      const res = await fetch(`/api/planning/generate?date=${targetDate}`)
      const data = await res.json()
      if (data.error) { toast.error(data.error); return }
      setPlanning(data)
      setEditedMembers(JSON.parse(JSON.stringify(data.members))) // deep copy
    } catch { toast.error('Erreur réseau') }
    setLoading(false)
  }, [targetDate])

  useEffect(() => { generatePlanning() }, [generatePlanning])

  const sendPlanning = async () => {
    if (!planning) return
    setSending(true)
    try {
      const payload = { ...planning, members: editedMembers }
      const res = await fetch('/api/planning/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Planning envoyé à ${data.sent}/${data.total} agents`)
        data.results?.forEach((r: any) => {
          if (r.sent) toast.success(`✅ ${r.agent} : reçu`)
          else toast.warning(`⚠️ ${r.agent} : ${r.error}`)
        })
        setSent(true)
      } else {
        toast.error(data.error || 'Erreur envoi')
      }
    } catch { toast.error('Erreur réseau') }
    setSending(false)
  }

  // Mark agent as absent → redistribute their tasks
  const markAbsent = (agentId: string) => {
    setEditedMembers(prev => {
      const updated = JSON.parse(JSON.stringify(prev))
      const absentIdx = updated.findIndex((m: any) => m.agent.id === agentId)
      if (absentIdx === -1) return prev

      const absent = updated[absentIdx]
      absent.is_off = true
      absent.is_absent_override = true

      // Get available agents (not off, not the absent one)
      const available = updated.filter((m: any) => !m.is_off && m.agent.id !== agentId)
      if (available.length === 0) {
        toast.warning('Aucun agent disponible pour redistribuer les tâches')
        return prev
      }

      // Redistribute cleaning tasks
      absent.cleaning_tasks.forEach((task: any, i: number) => {
        available[i % available.length].cleaning_tasks.push(task)
      })
      absent.cleaning_tasks = []

      // Redistribute welcome tasks
      absent.welcome_tasks.forEach((task: any, i: number) => {
        available[i % available.length].welcome_tasks.push(task)
      })
      absent.welcome_tasks = []

      setIsEdited(true)
      toast.success(`${absent.agent.full_name} marqué absent — tâches redistribuées`)
      return updated
    })
  }

  // Reassign a task from one agent to another
  const reassignTask = (fromAgentId: string, taskId: string, taskType: 'cleaning' | 'welcome', toAgentId: string) => {
    setEditedMembers(prev => {
      const updated = JSON.parse(JSON.stringify(prev))
      const fromAgent = updated.find((m: any) => m.agent.id === fromAgentId)
      const toAgent = updated.find((m: any) => m.agent.id === toAgentId)
      if (!fromAgent || !toAgent) return prev

      const taskKey = taskType === 'cleaning' ? 'cleaning_tasks' : 'welcome_tasks'
      const taskIdx = fromAgent[taskKey].findIndex((t: any) => t.id === taskId)
      if (taskIdx === -1) return prev

      const [task] = fromAgent[taskKey].splice(taskIdx, 1)
      toAgent[taskKey].push(task)

      setIsEdited(true)
      toast.success('Tâche réassignée')
      return updated
    })
  }

  const resetEdits = () => {
    if (!planning) return
    setEditedMembers(JSON.parse(JSON.stringify(planning.members)))
    setIsEdited(false)
    toast.info('Modifications annulées')
  }

  const dateLabel = targetDate
    ? format(new Date(targetDate + 'T00:00:00'), 'EEEE dd MMMM yyyy', { locale: fr })
    : ''

  const availableAgents = editedMembers.filter((m: any) => !m.is_off)

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
                {isEdited && <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-xs ml-2">Modifié</Badge>}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Générez, ajustez et envoyez le planning via Telegram
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Date</Label>
                <Input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="h-9 w-[150px]" />
              </div>
              <Button onClick={generatePlanning} disabled={loading} variant="outline" className="h-9 mt-5">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Générer
              </Button>
              {isEdited && (
                <Button onClick={resetEdits} variant="outline" className="h-9 mt-5 text-amber-600 border-amber-300">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Annuler modifs
                </Button>
              )}
              <Button
                onClick={sendPlanning}
                disabled={!planning || sending}
                className={`h-9 mt-5 gap-2 ${sent && !isEdited ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : sent && !isEdited ? <CheckCircle className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                {sending ? 'Envoi...' : sent && !isEdited ? 'Envoyé ✓' : isEdited ? 'Envoyer planning modifié' : 'Envoyer via Telegram'}
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
            {/* Summary */}
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 capitalize">{dateLabel}</h2>
              <div className="flex items-center justify-center gap-6 mt-3 text-sm text-gray-500 flex-wrap">
                <span>🧹 {planning.summary.total_checkouts} départ{planning.summary.total_checkouts !== 1 ? 's' : ''}</span>
                <span>🤝 {planning.summary.total_checkins} arrivée{planning.summary.total_checkins !== 1 ? 's' : ''}</span>
                <span>👥 {availableAgents.length}/{editedMembers.length} disponibles</span>
                {isEdited && <span className="text-amber-600 font-medium">⚠️ Planning modifié manuellement</span>}
              </div>
            </div>

            {/* Agent cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {editedMembers.map((item: any) => (
                <AgentCard
                  key={item.agent.id}
                  item={item}
                  allAgents={editedMembers}
                  onMarkAbsent={markAbsent}
                  onReassign={reassignTask}
                />
              ))}
            </div>

            {planning.summary.total_checkouts === 0 && planning.summary.total_checkins === 0 && (
              <Card className="border-0 shadow-lg bg-green-50 dark:bg-green-900/20">
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
                  <p className="text-green-700 dark:text-green-300 font-medium">Aucune arrivée ni départ ce jour</p>
                </CardContent>
              </Card>
            )}

            {editedMembers.some((m: any) => !m.agent.telegram_chat_id) && (
              <Card className="border-0 shadow-lg bg-amber-50 dark:bg-amber-900/20">
                <CardContent className="p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-800 dark:text-amber-300 font-medium text-sm">Telegram non configuré</p>
                    <p className="text-amber-700 dark:text-amber-400 text-xs mt-1">
                      {editedMembers.filter((m: any) => !m.agent.telegram_chat_id).map((m: any) => m.agent.full_name).join(', ')}
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

function AgentCard({ item, allAgents, onMarkAbsent, onReassign }: {
  item: any
  allAgents: any[]
  onMarkAbsent: (id: string) => void
  onReassign: (fromId: string, taskId: string, type: 'cleaning' | 'welcome', toId: string) => void
}) {
  const { agent, is_off, is_astreinte, cleaning_tasks, welcome_tasks, pending_tasks = [], is_absent_override } = item
  const totalTasks = cleaning_tasks.length + welcome_tasks.length
  const otherAgents = allAgents.filter(m => !m.is_off && m.agent.id !== agent.id)

  const zoneName = (agent.zone_areas as any)?.name || null

  return (
    <Card className={`border-0 shadow-lg overflow-hidden ${
      is_off ? 'bg-gray-50 dark:bg-gray-800/50 opacity-60' :
      is_absent_override ? 'bg-red-50 dark:bg-red-900/20 ring-2 ring-red-300' :
      is_astreinte ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-400' :
      'bg-white dark:bg-gray-800'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${
              is_off ? 'bg-gray-400' : is_absent_override ? 'bg-red-500' : is_astreinte ? 'bg-blue-600' : 'bg-indigo-600'
            }`}>
              {(agent.full_name || '?')[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900 dark:text-white">{agent.full_name || agent.email}</p>
              <p className="text-xs text-gray-400">
                {agent.team && `🏷️ ${agent.team}`}
                {zoneName && ` · 📍 ${zoneName}`}
                {agent.telegram_chat_id ? ' · ✅' : ' · ⚠️'}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {is_off && !is_absent_override && <Badge variant="secondary" className="bg-gray-200 text-gray-600 text-xs gap-1"><Moon className="h-3 w-3" />Repos</Badge>}
            {is_absent_override && <Badge className="bg-red-100 text-red-700 border-red-300 text-xs gap-1"><UserX className="h-3 w-3" />Absent</Badge>}
            {is_astreinte && !is_off && <Badge className="bg-blue-600 text-white text-xs gap-1"><Bell className="h-3 w-3" />Astreinte</Badge>}
            {!is_off && !is_astreinte && totalTasks === 0 && <Badge variant="outline" className="text-xs">Disponible</Badge>}
          </div>
        </div>

        {/* Mark absent button */}
        {!is_off && (
          <Button
            size="sm"
            variant="outline"
            className="w-full mt-2 h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => onMarkAbsent(agent.id)}
          >
            <UserX className="h-3 w-3 mr-1" />
            Marquer absent (redistribuer)
          </Button>
        )}
      </CardHeader>

      {!is_off && (
        <CardContent className="pt-0 space-y-3">
          {/* Cleaning tasks */}
          {cleaning_tasks.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
                <Brush className="h-3 w-3" /> Nettoyage ({cleaning_tasks.length})
              </p>
              <div className="space-y-1">
                {cleaning_tasks.map((r: any) => (
                  <TaskItem
                    key={r.id}
                    reservation={r}
                    type="cleaning"
                    agentId={agent.id}
                    otherAgents={otherAgents}
                    onReassign={onReassign}
                    color="orange"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Welcome tasks */}
          {welcome_tasks.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
                <HandshakeIcon className="h-3 w-3" /> Accueil + Contrat ({welcome_tasks.length})
              </p>
              <div className="space-y-1">
                {welcome_tasks.map((r: any) => (
                  <TaskItem
                    key={r.id}
                    reservation={r}
                    type="welcome"
                    agentId={agent.id}
                    otherAgents={otherAgents}
                    onReassign={onReassign}
                    color="green"
                  />
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

          {/* Pending tasks */}
          {pending_tasks.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Tâches en cours ({pending_tasks.length})
              </p>
              <div className="space-y-1">
                {pending_tasks.map((task: any) => (
                  <div key={task.id} className={`rounded-lg px-3 py-2 text-xs border ${task.status === 'in_progress' ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${task.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                      <p className="font-medium truncate">{task.title}</p>
                    </div>
                    {task.lofts?.name && <p className="text-gray-400 mt-0.5 pl-3">🏠 {task.lofts.name}</p>}
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

function TaskItem({ reservation, type, agentId, otherAgents, onReassign, color }: {
  reservation: any
  type: 'cleaning' | 'welcome'
  agentId: string
  otherAgents: any[]
  onReassign: (fromId: string, taskId: string, type: 'cleaning' | 'welcome', toId: string) => void
  color: 'orange' | 'green'
}) {
  const [showReassign, setShowReassign] = useState(false)
  const bg = color === 'orange' ? 'bg-orange-50 border-orange-100' : 'bg-green-50 border-green-100'
  const textColor = color === 'orange' ? 'text-orange-800' : 'text-green-800'
  const subColor = color === 'orange' ? 'text-orange-500' : 'text-green-500'
  const zoneName = (reservation.lofts as any)?.zone_areas?.name

  return (
    <div className={`rounded-lg px-3 py-2 text-xs border ${bg}`}>
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1 min-w-0">
          <p className={`font-medium ${textColor}`}>{reservation.lofts?.name || '—'}</p>
          {reservation.lofts?.address && <p className={`${subColor} mt-0.5`}>📍 {reservation.lofts.address}</p>}
          {zoneName && <p className="text-gray-400 mt-0.5">🗺️ {zoneName}</p>}
          {type === 'cleaning' && reservation.guest_name && <p className={`${subColor} mt-0.5`}>👤 Départ : {reservation.guest_name}</p>}
          {type === 'welcome' && reservation.guest_name && <p className={`${subColor} mt-0.5`}>👤 {reservation.guest_name}</p>}
          {type === 'welcome' && reservation.guest_phone && <p className={`${subColor}`}>📞 {reservation.guest_phone}</p>}
        </div>
        {otherAgents.length > 0 && (
          <button
            onClick={() => setShowReassign(!showReassign)}
            className="text-gray-400 hover:text-blue-600 flex-shrink-0 mt-0.5"
            title="Réassigner"
          >
            <ArrowRightLeft className="h-3 w-3" />
          </button>
        )}
      </div>
      {showReassign && otherAgents.length > 0 && (
        <div className="mt-2 flex items-center gap-1">
          <Select onValueChange={val => { onReassign(agentId, reservation.id, type, val); setShowReassign(false) }}>
            <SelectTrigger className="h-6 text-xs flex-1">
              <SelectValue placeholder="Réassigner à..." />
            </SelectTrigger>
            <SelectContent>
              {otherAgents.map((a: any) => (
                <SelectItem key={a.agent.id} value={a.agent.id} className="text-xs">
                  {a.agent.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button onClick={() => setShowReassign(false)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
        </div>
      )}
    </div>
  )
}
