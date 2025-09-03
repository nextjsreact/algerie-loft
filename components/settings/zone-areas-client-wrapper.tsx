"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { createZoneArea, updateZoneArea, getZoneAreas, type ZoneArea } from "@/app/actions/zone-areas"
import { ZoneAreaList } from "@/components/zone-areas/zone-areas-list"

interface ZoneAreasClientWrapperProps {
  initialZoneAreas: ZoneArea[]
  translations: {
    pageTitle: string
    subtitle: string
    addNew: string
    updateZoneArea: string
    createZoneArea: string
    updateZoneAreaInfo: string
    createNewZoneArea: string
    existingZoneAreas: string
    totalZoneAreas: string
    noZoneAreasFound: string
    addFirstZoneArea: string
    success: string
    error: string
    updateSuccess: string
    createSuccess: string
    refreshError: string
    // Nouvelles traductions pour le formulaire
    name: string
    namePlaceholder: string
    saving: string
    update: string
    create: string
    cancel: string
  }
}

export default function ZoneAreasClientWrapper({ 
  initialZoneAreas, 
  translations 
}: ZoneAreasClientWrapperProps) {
  const [zoneAreas, setZoneAreas] = useState<ZoneArea[]>(initialZoneAreas)
  const [editingZoneArea, setEditingZoneArea] = useState<ZoneArea | null>(null)
  const [name, setName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const refreshZoneAreas = useCallback(async () => {
    try {
      const updatedZoneAreas = await getZoneAreas()
      setZoneAreas(updatedZoneAreas)
    } catch (error) {
      toast({
        title: translations.error,
        description: translations.refreshError,
        variant: "destructive",
      })
    }
  }, [translations])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      if (editingZoneArea) {
        await updateZoneArea(editingZoneArea.id, { name: name.trim() })
        toast({
          title: translations.success,
          description: translations.updateSuccess,
        })
      } else {
        await createZoneArea({ name: name.trim() })
        toast({
          title: translations.success,
          description: translations.createSuccess,
        })
      }
      
      setName("")
      setEditingZoneArea(null)
      await refreshZoneAreas()
    } catch (error) {
      toast({
        title: translations.error,
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (zoneArea: ZoneArea) => {
    setEditingZoneArea(zoneArea)
    setName(zoneArea.name)
  }

  const handleCancel = () => {
    setEditingZoneArea(null)
    setName("")
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{translations.pageTitle}</h1>
        <p className="text-muted-foreground mt-2">{translations.subtitle}</p>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>
            {editingZoneArea ? translations.updateZoneArea : translations.createZoneArea}
          </CardTitle>
          <CardDescription>
            {editingZoneArea ? translations.updateZoneAreaInfo : translations.createNewZoneArea}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{translations.name}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={translations.namePlaceholder}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting || !name.trim()}>
                {isSubmitting ? translations.saving : (editingZoneArea ? translations.update : translations.create)}
              </Button>
              {editingZoneArea && (
                <Button type="button" variant="outline" onClick={handleCancel}>
                  {translations.cancel}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Zone Areas List */}
      <Card>
        <CardHeader>
          <CardTitle>{translations.existingZoneAreas}</CardTitle>
          <CardDescription>
            {zoneAreas.length > 0 
              ? translations.totalZoneAreas.replace('{count}', zoneAreas.length.toString())
              : translations.noZoneAreasFound
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {zoneAreas.length > 0 ? (
            <ZoneAreaList 
              zoneAreas={zoneAreas} 
              onEdit={handleEdit}
              onRefresh={refreshZoneAreas}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>{translations.addFirstZoneArea}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}