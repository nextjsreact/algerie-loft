"use client"

import { useTranslations } from "next-intl"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  MessageCircle, 
  Calendar,
  ExternalLink,
  Globe
} from "lucide-react"

interface ContactMethod {
  type: 'phone' | 'email' | 'whatsapp' | 'address' | 'hours'
  label: string
  value: string
  description?: string
  primary?: boolean
  available?: boolean
  icon: React.ReactNode
}

interface ContactInfoProps {
  className?: string
  showMap?: boolean
  compactMode?: boolean
}

export function ContactInfo({ className, showMap = true, compactMode = false }: ContactInfoProps) {
  const t = useTranslations("contact")

  const contactMethods: ContactMethod[] = [
    {
      type: 'phone',
      label: t("info.phone.label"),
      value: t("info.phone.number"),
      description: t("info.phone.description"),
      primary: true,
      available: true,
      icon: <Phone className="h-5 w-5" />
    },
    {
      type: 'email',
      label: t("info.email.label"),
      value: t("info.email.address"),
      description: t("info.email.description"),
      primary: true,
      available: true,
      icon: <Mail className="h-5 w-5" />
    },
    {
      type: 'whatsapp',
      label: t("info.whatsapp.label"),
      value: t("info.whatsapp.number"),
      description: t("info.whatsapp.description"),
      available: true,
      icon: <MessageCircle className="h-5 w-5" />
    },
    {
      type: 'address',
      label: t("info.address.label"),
      value: t("info.address.full"),
      description: t("info.address.description"),
      icon: <MapPin className="h-5 w-5" />
    }
  ]

  const businessHours = [
    { day: t("info.hours.monday"), hours: t("info.hours.weekdayHours"), isToday: false },
    { day: t("info.hours.tuesday"), hours: t("info.hours.weekdayHours"), isToday: false },
    { day: t("info.hours.wednesday"), hours: t("info.hours.weekdayHours"), isToday: false },
    { day: t("info.hours.thursday"), hours: t("info.hours.weekdayHours"), isToday: false },
    { day: t("info.hours.friday"), hours: t("info.hours.weekdayHours"), isToday: false },
    { day: t("info.hours.saturday"), hours: t("info.hours.saturdayHours"), isToday: false },
    { day: t("info.hours.sunday"), hours: t("info.hours.sundayHours"), isToday: false }
  ]

  const handleContactClick = (method: ContactMethod) => {
    switch (method.type) {
      case 'phone':
        window.open(`tel:${method.value}`, '_self')
        break
      case 'email':
        window.open(`mailto:${method.value}`, '_self')
        break
      case 'whatsapp':
        const whatsappNumber = method.value.replace(/\s+/g, '').replace(/^\+/, '')
        window.open(`https://wa.me/${whatsappNumber}`, '_blank')
        break
      case 'address':
        const encodedAddress = encodeURIComponent(method.value)
        window.open(`https://maps.google.com/?q=${encodedAddress}`, '_blank')
        break
    }
  }

  if (compactMode) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {contactMethods.filter(method => method.primary).map((method) => (
            <Button
              key={method.type}
              variant="outline"
              className="h-auto p-4 justify-start"
              onClick={() => handleContactClick(method)}
            >
              <div className="flex items-center space-x-3">
                <div className="text-primary">{method.icon}</div>
                <div className="text-left">
                  <div className="font-medium">{method.label}</div>
                  <div className="text-sm text-muted-foreground">{method.value}</div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Contact Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {contactMethods.map((method) => (
          <Card 
            key={method.type} 
            className={`cursor-pointer transition-all hover:shadow-md ${method.primary ? 'ring-2 ring-primary/20' : ''}`}
            onClick={() => handleContactClick(method)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-primary">{method.icon}</div>
                  <CardTitle className="text-lg">{method.label}</CardTitle>
                </div>
                {method.primary && <Badge variant="secondary">{t("info.primary")}</Badge>}
                {method.available && <Badge variant="outline" className="text-green-600 border-green-600">{t("info.available")}</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium text-lg">{method.value}</p>
                {method.description && (
                  <p className="text-sm text-muted-foreground">{method.description}</p>
                )}
                <div className="flex items-center text-sm text-muted-foreground">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  {t("info.clickToContact")}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Business Hours */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5 text-primary" />
            <CardTitle>{t("info.businessHours")}</CardTitle>
          </div>
          <CardDescription>{t("info.businessHoursDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {businessHours.map((schedule, index) => (
              <div 
                key={index} 
                className={`flex justify-between items-center py-2 px-3 rounded-lg ${
                  schedule.isToday ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
                }`}
              >
                <span className={`font-medium ${schedule.isToday ? 'text-primary' : ''}`}>
                  {schedule.day}
                </span>
                <span className={`${schedule.isToday ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                  {schedule.hours}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-2">
              <Calendar className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">{t("info.appointmentNote")}</p>
                <p className="text-blue-700">{t("info.appointmentDescription")}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-900">{t("info.emergency.title")}</CardTitle>
          <CardDescription className="text-orange-700">{t("info.emergency.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-900">{t("info.emergency.phone")}</p>
                <p className="text-sm text-orange-700">{t("info.emergency.availability")}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
              onClick={() => window.open(`tel:${t("info.emergency.phone")}`, '_self')}
            >
              {t("info.callNow")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Map */}
      {showMap && (
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-primary" />
              <CardTitle>{t("info.location.title")}</CardTitle>
            </div>
            <CardDescription>{t("info.location.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="font-medium">{t("info.address.full")}</p>
                <p className="text-sm text-muted-foreground mt-1">{t("info.address.details")}</p>
              </div>
              
              {/* Map placeholder - replace with actual map integration */}
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/25">
                <div className="text-center space-y-2">
                  <Globe className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground">{t("info.map.placeholder")}</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const encodedAddress = encodeURIComponent(t("info.address.full"))
                      window.open(`https://maps.google.com/?q=${encodedAddress}`, '_blank')
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t("info.map.openInMaps")}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <h4 className="font-medium">{t("info.directions.publicTransport")}</h4>
                  <p className="text-muted-foreground">{t("info.directions.publicTransportDetails")}</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">{t("info.directions.parking")}</h4>
                  <p className="text-muted-foreground">{t("info.directions.parkingDetails")}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}