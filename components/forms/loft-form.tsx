"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState, useCallback } from "react"
import type { Loft, LoftOwner, InternetConnectionType } from "@/lib/types"
import type { ZoneArea } from "@/app/actions/zone-areas"
import { Textarea } from "@/components/ui/textarea"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { useRouter } from 'next/navigation'
import { PhotoUpload } from "@/components/lofts/photo-upload"

interface LoftFormProps {
  owners: LoftOwner[]
  zoneAreas: ZoneArea[]
  internetConnectionTypes: InternetConnectionType[]
  onSubmit: (data: any) => Promise<void>
  loft?: Loft | null
}

export function LoftForm({ owners, zoneAreas, internetConnectionTypes, onSubmit, loft }: LoftFormProps) {
  const t = useTranslations("lofts");
  const router = useRouter()
  
  // Initialize form data with loft data if available, otherwise use empty strings
  const getInitialFormData = useCallback(() => ({
    name: loft?.name || "",
    address: loft?.address || "",
    price_per_night: loft?.price_per_night?.toString() || "",
    owner_id: loft?.owner_id || "",
    zone_area_id: loft?.zone_area_id || "",
    internet_connection_type_id: loft?.internet_connection_type_id || "",
    description: loft?.description || "",
    water_customer_code: loft?.water_customer_code || "",
    water_contract_code: loft?.water_contract_code || "",
    water_meter_number: loft?.water_meter_number || "",
    electricity_pdl_ref: loft?.electricity_pdl_ref || "",
    electricity_customer_number: loft?.electricity_customer_number || "",
    electricity_meter_number: loft?.electricity_meter_number || "",
    gas_pdl_ref: loft?.gas_pdl_ref || "",
    gas_customer_number: loft?.gas_customer_number || "",
    gas_meter_number: loft?.gas_meter_number || "",
    phone_number: loft?.phone_number || "",
    company_percentage: loft?.company_percentage?.toString() || "",
    owner_percentage: loft?.owner_percentage?.toString() || "",
    frequence_paiement_eau: loft?.frequence_paiement_eau || "",
    prochaine_echeance_eau: loft?.prochaine_echeance_eau || "",
    frequence_paiement_energie: loft?.frequence_paiement_energie || "",
    prochaine_echeance_energie: loft?.prochaine_echeance_energie || "",
    frequence_paiement_telephone: loft?.frequence_paiement_telephone || "",
    prochaine_echeance_telephone: loft?.prochaine_echeance_telephone || "",
    frequence_paiement_internet: loft?.frequence_paiement_internet || "",
    prochaine_echeance_internet: loft?.prochaine_echeance_internet || "",
    frequence_paiement_tv: loft?.frequence_paiement_tv || "",
    prochaine_echeance_tv: loft?.prochaine_echeance_tv || "",
  }), [loft])

  const [formData, setFormData] = useState(() => getInitialFormData())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [existingPhotos, setExistingPhotos] = useState<any[]>([])
  const [currentPhotos, setCurrentPhotos] = useState<any[]>([])

  // Function to fetch existing photos
  const fetchExistingPhotos = useCallback(async () => {
    if (loft?.id) {
      try {
        const response = await fetch(`/api/lofts/${loft.id}/photos`)
        
        if (response.ok) {
          const photos = await response.json()
          
          // Transform the API response to match the PhotoUpload component's expected format
          const transformedPhotos = photos.map((photo: any) => ({
            id: photo.id,
            url: photo.url,
            name: photo.file_name,
            size: photo.file_size,
          }))
          setExistingPhotos(transformedPhotos)
          setCurrentPhotos(transformedPhotos)
        }
      } catch (error) {
        // Silently handle error
      }
    }
  }, [loft?.id])

  // Update form data when loft prop changes
  useEffect(() => {
    if (loft?.id) {
      setFormData(getInitialFormData())
      fetchExistingPhotos()
    }
  }, [loft?.id, getInitialFormData, fetchExistingPhotos])

  const safeInternetConnectionTypes = Array.isArray(internetConnectionTypes) ? internetConnectionTypes : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Convert empty strings to null to prevent database errors
      const processedData = {
        ...formData,
        price_per_night: Number(formData.price_per_night),
        company_percentage: Number(formData.company_percentage),
        owner_percentage: Number(formData.owner_percentage),
        // Convert empty UUID strings to null
        owner_id: formData.owner_id || null,
        zone_area_id: formData.zone_area_id || null,
        internet_connection_type_id: formData.internet_connection_type_id || null,
        // Convert empty date strings to null
        prochaine_echeance_eau: formData.prochaine_echeance_eau || null,
        prochaine_echeance_energie: formData.prochaine_echeance_energie || null,
        prochaine_echeance_telephone: formData.prochaine_echeance_telephone || null,
        prochaine_echeance_internet: formData.prochaine_echeance_internet || null,
        prochaine_echeance_tv: formData.prochaine_echeance_tv || null,
      }
      
      await onSubmit(processedData)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-gray-50 p-4 sm:p-6 md:p-8">
      <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
        <div className="space-y-12">
          {/* Loft Information Section */}
          <div className="space-y-6 p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-4 mb-6 flex items-center">
              <span className="mr-3 text-3xl">🏠</span>
              {t('loftInfoTitle')}
            </h2>
            <p className="text-gray-600 mb-6 -mt-4">
              {t('loftInfoDescription')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label htmlFor="name">{t('loftName')} *</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  placeholder={t('namePlaceholder')}
                  style={{ '--placeholder-color': '#d1d5db' } as any}
                  className="placeholder:text-gray-300 placeholder:opacity-100"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">{t('loftAddress')} *</Label>
                <Input 
                  id="address" 
                  value={formData.address} 
                  onChange={(e) => setFormData({...formData, address: e.target.value})} 
                  placeholder={t('addressPlaceholder')}
                  className="placeholder:text-gray-300 placeholder:opacity-100"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">{t('pricePerNight')} *</Label>
                <Input id="price" type="number" value={formData.price_per_night} onChange={(e) => setFormData({...formData, price_per_night: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner">{t('owner')}</Label>
                <Select value={formData.owner_id || ""} onValueChange={(value) => setFormData({...formData, owner_id: value})}>
                  <SelectTrigger><SelectValue placeholder={t('selectOption')} /></SelectTrigger>
                  <SelectContent>
                    {Array.isArray(owners) && owners.map((owner) => (
                      <SelectItem key={owner.id} value={owner.id}>{owner.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="zone">{t('zoneArea')}</Label>
                <Select value={formData.zone_area_id || ""} onValueChange={(value) => setFormData({...formData, zone_area_id: value})}>
                  <SelectTrigger><SelectValue placeholder={t('selectOption')} /></SelectTrigger>
                  <SelectContent>
                    {Array.isArray(zoneAreas) && zoneAreas.map((zone) => (
                      <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="internet">{t('internetConnection')}</Label>
                <Select value={formData.internet_connection_type_id || ""} onValueChange={(value) => setFormData({...formData, internet_connection_type_id: value})}>
                  <SelectTrigger><SelectValue placeholder={t('selectOption')} /></SelectTrigger>
                  <SelectContent>
                    {safeInternetConnectionTypes.map((connection) => (
                      <SelectItem key={connection.id} value={connection.id}>
                        {connection.type} {connection.speed && `- ${connection.speed}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_percentage">{t('companyPercentage')} (%) *</Label>
                <Input 
                  id="company_percentage" 
                  type="number" 
                  min="0" 
                  max="100" 
                  step="0.01"
                  value={formData.company_percentage} 
                  onChange={(e) => {
                    const companyPercentage = e.target.value
                    const ownerPercentage = companyPercentage && !isNaN(Number(companyPercentage)) 
                      ? (100 - Number(companyPercentage)).toString() 
                      : ""
                    setFormData({
                      ...formData, 
                      company_percentage: companyPercentage,
                      owner_percentage: ownerPercentage
                    })
                  }} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner_percentage">{t('ownerPercentage')} (%) *</Label>
                <Input 
                  id="owner_percentage" 
                  type="number" 
                  min="0" 
                  max="100" 
                  step="0.01"
                  value={formData.owner_percentage} 
                  onChange={(e) => {
                    const ownerPercentage = e.target.value
                    const companyPercentage = ownerPercentage && !isNaN(Number(ownerPercentage))
                      ? (100 - Number(ownerPercentage)).toString() 
                      : ""
                    setFormData({
                      ...formData, 
                      owner_percentage: ownerPercentage,
                      company_percentage: companyPercentage
                    })
                  }} 
                  required 
                />
                <p className="text-xs text-muted-foreground">
                  {t('total')}: {(Number(formData.company_percentage || 0) + Number(formData.owner_percentage || 0)).toFixed(1)}% 
                  {(Number(formData.company_percentage || 0) + Number(formData.owner_percentage || 0)) === 100 ? 
                    " ✅" : ` (${t('shouldEqual100')})`}
                </p>
              </div>
            </div>
            <div className="space-y-2 pt-4">
              <Label htmlFor="description">{t('loftDescription')}</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            </div>
          </div>

          {/* Photos Section */}
          <div className="space-y-6 p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-4 mb-6 flex items-center">
              <span className="mr-3 text-3xl">📸</span>
              {t('photos.title')}
            </h2>
            <p className="text-gray-600 mb-6 -mt-4">
              {t('photos.description')}
            </p>
            <PhotoUpload 
              loftId={loft?.id}
              existingPhotos={existingPhotos}
              onPhotosChange={(photos) => {
                setCurrentPhotos(photos)
              }}
              maxPhotos={15}
            />

          </div>

          {/* Utility Information Section */}
          <div className="space-y-6 p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-4 mb-6 flex items-center">
              <span className="mr-3 text-3xl">🛠️</span>
              {t('utilityInformation')}
            </h2>
            <div className="space-y-4">
              {/* Water Section */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                  <span>💧</span> {t('billingSections.water')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="water_customer_code">{t('waterCustomerCode')}</Label>
                    <Input id="water_customer_code" value={formData.water_customer_code} onChange={(e) => setFormData({...formData, water_customer_code: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="water_contract_code">{t('waterContractCode')}</Label>
                    <Input id="water_contract_code" value={formData.water_contract_code} onChange={(e) => setFormData({...formData, water_contract_code: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="water_meter_number">{t('waterMeterNumber')}</Label>
                    <Input id="water_meter_number" value={formData.water_meter_number} onChange={(e) => setFormData({...formData, water_meter_number: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* Electricity Section */}
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-yellow-900 mb-3 flex items-center gap-2">
                  <span>⚡</span> {t('billingSections.energy')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="electricity_pdl_ref">{t('electricityPdlRef')}</Label>
                    <Input id="electricity_pdl_ref" value={formData.electricity_pdl_ref} onChange={(e) => setFormData({...formData, electricity_pdl_ref: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="electricity_customer_number">{t('electricityCustomerNumber')}</Label>
                    <Input id="electricity_customer_number" value={formData.electricity_customer_number} onChange={(e) => setFormData({...formData, electricity_customer_number: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="electricity_meter_number">{t('electricityMeterNumber')}</Label>
                    <Input id="electricity_meter_number" value={formData.electricity_meter_number} onChange={(e) => setFormData({...formData, electricity_meter_number: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* Gas Section */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                  <span role="img" aria-label="gas">🔥</span> {t('billingSections.gas')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gas_pdl_ref">{t('gasPdlRef')}</Label>
                    <Input id="gas_pdl_ref" value={formData.gas_pdl_ref} onChange={(e) => setFormData({...formData, gas_pdl_ref: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gas_customer_number">{t('gasCustomerNumber')}</Label>
                    <Input id="gas_customer_number" value={formData.gas_customer_number} onChange={(e) => setFormData({...formData, gas_customer_number: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gas_meter_number">{t('gasMeterNumber')}</Label>
                    <Input id="gas_meter_number" value={formData.gas_meter_number} onChange={(e) => setFormData({...formData, gas_meter_number: e.target.value})} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Billing Alerts Section */}
          <div className="space-y-6 p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-4 mb-6 flex items-center">
              <span className="mr-3 text-3xl">🔔</span>
              {t('billingAlerts')}
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              {t('billingAlertsDescription')}
            </p>
            
            <div className="space-y-8">
              {/* Water */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                  <span>💧</span> {t('billingSections.water')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="frequence_paiement_eau" className="text-sm font-medium">
                      {t('waterBillFrequency')}
                    </Label>
                    <Select onValueChange={(value) => setFormData({...formData, frequence_paiement_eau: value})} value={formData.frequence_paiement_eau}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder={t('selectFrequency')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hebdomadaire">{t('frequency.weekly')}</SelectItem>
                        <SelectItem value="mensuel">{t('frequency.monthly')}</SelectItem>
                        <SelectItem value="bimestriel">{t('frequency.bimonthly')}</SelectItem>
                        <SelectItem value="trimestriel">{t('frequency.quarterly')}</SelectItem>
                        <SelectItem value="quadrimestriel">{t('frequency.fourMonthly')}</SelectItem>
                        <SelectItem value="semestriel">{t('frequency.sixMonthly')}</SelectItem>
                        <SelectItem value="annuel">{t('frequency.yearly')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prochaine_echeance_eau" className="text-sm font-medium">
                      {t('nextWaterBill')}
                    </Label>
                    <Input 
                      id="prochaine_echeance_eau" 
                      type="date" 
                      value={formData.prochaine_echeance_eau} 
                      onChange={(e) => setFormData({...formData, prochaine_echeance_eau: e.target.value})}
                      placeholder="jj/mm/aaaa"
                      className="bg-white placeholder:text-gray-400 placeholder:opacity-100"
                    />
                  </div>
                </div>
              </div>

              {/* Energy */}
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-yellow-900 mb-3 flex items-center gap-2">
                  <span>⚡</span> {t('billingSections.energy')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="frequence_paiement_energie" className="text-sm font-medium">
                      {t('energyBillFrequency')}
                    </Label>
                    <Select onValueChange={(value) => setFormData({...formData, frequence_paiement_energie: value})} value={formData.frequence_paiement_energie}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder={t('selectFrequency')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hebdomadaire">{t('frequency.weekly')}</SelectItem>
                        <SelectItem value="mensuel">{t('frequency.monthly')}</SelectItem>
                        <SelectItem value="bimestriel">{t('frequency.bimonthly')}</SelectItem>
                        <SelectItem value="trimestriel">{t('frequency.quarterly')}</SelectItem>
                        <SelectItem value="quadrimestriel">{t('frequency.fourMonthly')}</SelectItem>
                        <SelectItem value="semestriel">{t('frequency.sixMonthly')}</SelectItem>
                        <SelectItem value="annuel">{t('frequency.yearly')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prochaine_echeance_energie" className="text-sm font-medium">
                      {t('nextEnergyBill')}
                    </Label>
                    <Input 
                      id="prochaine_echeance_energie" 
                      type="date" 
                      value={formData.prochaine_echeance_energie} 
                      onChange={(e) => setFormData({...formData, prochaine_echeance_energie: e.target.value})}
                      placeholder="jj/mm/aaaa"
                      className="bg-white placeholder:text-gray-400 placeholder:opacity-100"
                    />
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                  <span>📞</span> {t('billingSections.phone')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone_number">{t('phoneNumber')}</Label>
                    <Input id="phone_number" value={formData.phone_number} onChange={(e) => setFormData({...formData, phone_number: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="frequence_paiement_telephone" className="text-sm font-medium">
                      {t('phoneBillFrequency')}
                    </Label>
                    <Select onValueChange={(value) => setFormData({...formData, frequence_paiement_telephone: value})} value={formData.frequence_paiement_telephone}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder={t('selectFrequency')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hebdomadaire">{t('frequency.weekly')}</SelectItem>
                        <SelectItem value="mensuel">{t('frequency.monthly')}</SelectItem>
                        <SelectItem value="bimestriel">{t('frequency.bimonthly')}</SelectItem>
                        <SelectItem value="trimestriel">{t('frequency.quarterly')}</SelectItem>
                        <SelectItem value="quadrimestriel">{t('frequency.fourMonthly')}</SelectItem>
                        <SelectItem value="semestriel">{t('frequency.sixMonthly')}</SelectItem>
                        <SelectItem value="annuel">{t('frequency.yearly')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prochaine_echeance_telephone" className="text-sm font-medium">
                      {t('nextPhoneBill')}
                    </Label>
                    <Input 
                      id="prochaine_echeance_telephone" 
                      type="date" 
                      value={formData.prochaine_echeance_telephone} 
                      onChange={(e) => setFormData({...formData, prochaine_echeance_telephone: e.target.value})}
                      placeholder="jj/mm/aaaa"
                      className="bg-white placeholder:text-gray-400 placeholder:opacity-100"
                    />
                  </div>
                </div>
              </div>

              {/* Internet */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
                  <span>🌐</span> {t('billingSections.internet')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="frequence_paiement_internet" className="text-sm font-medium">
                      {t('internetBillFrequency')}
                    </Label>
                    <Select onValueChange={(value) => setFormData({...formData, frequence_paiement_internet: value})} value={formData.frequence_paiement_internet}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder={t('selectFrequency')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hebdomadaire">{t('frequency.weekly')}</SelectItem>
                        <SelectItem value="mensuel">{t('frequency.monthly')}</SelectItem>
                        <SelectItem value="bimestriel">{t('frequency.bimonthly')}</SelectItem>
                        <SelectItem value="trimestriel">{t('frequency.quarterly')}</SelectItem>
                        <SelectItem value="quadrimestriel">{t('frequency.fourMonthly')}</SelectItem>
                        <SelectItem value="semestriel">{t('frequency.sixMonthly')}</SelectItem>
                        <SelectItem value="annuel">{t('frequency.yearly')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prochaine_echeance_internet" className="text-sm font-medium">
                      {t('nextInternetBill')}
                    </Label>
                    <Input 
                      id="prochaine_echeance_internet" 
                      type="date" 
                      value={formData.prochaine_echeance_internet} 
                      onChange={(e) => setFormData({...formData, prochaine_echeance_internet: e.target.value})}
                      placeholder="jj/mm/aaaa"
                      className="bg-white placeholder:text-gray-400 placeholder:opacity-100"
                    />
                  </div>
                </div>
              </div>

              {/* TV */}
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h4 className="font-medium text-red-900 mb-3 flex items-center gap-2">
                  <span>📺</span> {t('billingSections.tv')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="frequence_paiement_tv" className="text-sm font-medium">
                      {t('tvBillFrequency')}
                    </Label>
                    <Select onValueChange={(value) => setFormData({...formData, frequence_paiement_tv: value})} value={formData.frequence_paiement_tv}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder={t('selectFrequency')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hebdomadaire">{t('frequency.weekly')}</SelectItem>
                        <SelectItem value="mensuel">{t('frequency.monthly')}</SelectItem>
                        <SelectItem value="bimestriel">{t('frequency.bimonthly')}</SelectItem>
                        <SelectItem value="trimestriel">{t('frequency.quarterly')}</SelectItem>
                        <SelectItem value="quadrimestriel">{t('frequency.fourMonthly')}</SelectItem>
                        <SelectItem value="semestriel">{t('frequency.sixMonthly')}</SelectItem>
                        <SelectItem value="annuel">{t('frequency.yearly')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prochaine_echeance_tv" className="text-sm font-medium">
                      {t('nextTvBill')}
                    </Label>
                    <Input 
                      id="prochaine_echeance_tv" 
                      type="date" 
                      value={formData.prochaine_echeance_tv} 
                      onChange={(e) => setFormData({...formData, prochaine_echeance_tv: e.target.value})}
                      placeholder="jj/mm/aaaa"
                      className="bg-white placeholder:text-gray-400 placeholder:opacity-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-6 border-t">
          {/* Delete button (only in edit mode) */}
          {loft && (
            <Button 
              type="button" 
              variant="destructive" 
              disabled={isSubmitting}
              onClick={async () => {
                if (confirm(`⚠️ ${t('deleteConfirmTitle', { name: loft.name })}\n\n${t('deleteConfirmMessage')}`)) {
                  const confirmation = prompt(t('deleteConfirmPrompt'))
                  
                  if (confirmation === 'SUPPRIMER' || confirmation === 'DELETE' || confirmation === 'حذف') {
                    try {
                      toast.loading(`🗑️ ${t('deletingInProgress')}`, {
                        description: t('deletingLoftData'),
                        duration: 2000,
                      })
                      
                      // Importer et utiliser l'action de suppression
                      const { deleteLoft } = await import('@/app/actions/lofts')
                      await deleteLoft(loft.id)
                      
                      toast.success(`🗑️ ${t('loftDeletedSuccess', { name: loft.name })}`, {
                        description: t('loftDataDeleted'),
                        duration: 4000,
                      })
                      
                      // Redirection will be handled by the deleteLoft action
                    } catch (error) {
                      console.error("Delete failed:", error)
                      toast.error(`❌ ${t('deleteError')}`, {
                        description: t('deleteErrorMessage'),
                        duration: 6000,
                      })
                    }
                  } else if (confirmation !== null) {
                    toast.warning(`⚠️ ${t('deleteCancelled')}`, {
                      description: t('deleteConfirmationIncorrect'),
                      duration: 3000,
                    })
                  }
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              🗑️ {t('deleteLoft')}
            </Button>
          )}
          
          {/* Main action buttons */}
          <div className="flex-grow flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  {loft ? t('updating') : t('creating')}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {loft ? '💾 ' + t('updateLoft') : '➕ ' + t('createLoft')}
                </span>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
