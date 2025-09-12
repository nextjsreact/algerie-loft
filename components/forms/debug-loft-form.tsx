"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslations } from "next-intl"

interface DebugLoftFormProps {
  loft?: any
  owners?: any[]
  zoneAreas?: any[]
  internetConnectionTypes?: any[]
  onSubmit?: (data: any) => Promise<void>
}

export function DebugLoftForm({ 
  loft, 
  owners = [], 
  zoneAreas = [], 
  internetConnectionTypes = [],
  onSubmit 
}: DebugLoftFormProps) {
  const t = useTranslations("lofts")
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    price_per_night: ""
  })

  useEffect(() => {
    const info = [
      `🏠 Loft: ${loft ? 'OK' : 'MANQUANT'}`,
      `👥 Propriétaires: ${owners?.length || 0}`,
      `🗺️ Zones: ${zoneAreas?.length || 0}`,
      `🌐 Internet: ${internetConnectionTypes?.length || 0}`,
      `📊 Loft ID: ${loft?.id || 'N/A'}`,
      `📝 Loft nom: ${loft?.name || 'N/A'}`
    ].join('\n')
    
    setDebugInfo(info)

    if (loft) {
      setFormData({
        name: loft.name || "",
        address: loft.address || "",
        price_per_night: loft.price_per_night?.toString() || ""
      })
    }
  }, [loft, owners, zoneAreas, internetConnectionTypes])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    alert('Formulaire soumis ! (mode debug)')
    if (onSubmit) {
      try {
        await onSubmit(formData)
      } catch (error) {
        console.error('Erreur soumission:', error)
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-bold text-blue-800 mb-2">🔍 Debug Info</h2>
        <pre className="text-sm text-blue-700 whitespace-pre-line">{debugInfo}</pre>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Formulaire de Debug</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nom du Loft</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder={t('namePlaceholder')}
            />
          </div>

          <div>
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              placeholder={t('addressPlaceholder')}
            />
          </div>

          <div>
            <Label htmlFor="price">Prix par nuit</Label>
            <Input
              id="price"
              type="number"
              value={formData.price_per_night}
              onChange={(e) => setFormData({...formData, price_per_night: e.target.value})}
              placeholder={t('pricePlaceholder')}
            />
          </div>

          <Button type="submit" className="w-full">
            Tester la soumission
          </Button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded">
          <h3 className="font-bold mb-2">Données actuelles :</h3>
          <pre className="text-sm">{JSON.stringify(formData, null, 2)}</pre>
        </div>
      </div>
    </div>
  )
}