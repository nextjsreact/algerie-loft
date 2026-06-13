"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  MapPin, 
  Calendar, 
  Users, 
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquareText
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { getZoneAreas } from "@/app/actions/zone-areas"
import { useTranslations, useLocale } from "next-intl"

interface ClientDashboardViewProps {
  bookings: any[]
  locale: string
  clientName: string
}

export function ClientDashboardView({ bookings, locale, clientName }: ClientDashboardViewProps) {
  const router = useRouter()
  const t = useTranslations("client.dashboard")
  const tStatus = useTranslations("client.bookingStatus")
  const currentLocale = useLocale()
  const [searchData, setSearchData] = useState({
    destination: "",
    checkIn: "",
    checkOut: "",
    guests: 1
  })
  const [zones, setZones] = useState<{ id: string; name: string }[]>([])
  const [lofts, setLofts] = useState<any[]>([])

  useEffect(() => {
    getZoneAreas().then((data) => setZones(data))
  }, [])

  // Fetcher les lofts depuis la MÊME API que la homepage
  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/public/featured-lofts?limit=25&randomize=true', { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        if (data.lofts?.length > 0) {
          setLofts(data.lofts)
        }
      })
      .catch(e => console.error('[dashboard] fetch lofts error:', e))
    return () => controller.abort()
  }, [])

  const filteredLofts = useMemo(() => {
    if (!searchData.destination) return lofts
    return lofts.filter((loft) => {
      const zoneName = loft.zone || loft.address
      return zoneName?.toLowerCase().includes(searchData.destination.toLowerCase())
    })
  }, [lofts, searchData.destination])

  const handleSearch = () => {
    const params = new URLSearchParams({
      destination: searchData.destination,
      checkIn: searchData.checkIn,
      checkOut: searchData.checkOut,
      guests: searchData.guests.toString()
    })
    router.push(`/${locale}/client/search?${params}`)
  }

  const getBookingStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string; icon: any }> = {
      pending: { label: tStatus("pending"), className: "bg-yellow-100 text-yellow-800", icon: Clock },
      confirmed: { label: tStatus("confirmed"), className: "bg-green-100 text-green-800", icon: CheckCircle },
      cancelled: { label: tStatus("cancelled"), className: "bg-red-100 text-red-800", icon: XCircle },
      completed: { label: tStatus("completed"), className: "bg-blue-100 text-blue-800", icon: CheckCircle }
    }
    const { label, className, icon: Icon } = config[status] || config.pending
    return (
      <Badge className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-4xl font-bold mb-2">{t("welcome", { name: clientName })}</h1>
          <p className="text-blue-100 text-lg mb-8">{t("subtitle")}</p>
          
          <Card className="max-w-5xl mx-auto shadow-2xl">
            <CardContent className="p-2">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <div className="relative">
                  <label className="text-xs font-semibold text-gray-700 ml-4 mb-1 block">{t("destination")}</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={searchData.destination}
                      onChange={(e) => setSearchData({ ...searchData, destination: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">{t("destinationPlaceholder")}</option>
                      {zones.map((zone) => (
                        <option key={zone.id} value={zone.name}>{zone.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="relative">
                  <label className="text-xs font-semibold text-gray-700 ml-4 mb-1 block">{t("checkIn")}</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="date"
                      value={searchData.checkIn}
                      onChange={(e) => setSearchData({ ...searchData, checkIn: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="pl-10 border-0 focus-visible:ring-0"
                    />
                  </div>
                </div>
                
                <div className="relative">
                  <label className="text-xs font-semibold text-gray-700 ml-4 mb-1 block">{t("checkOut")}</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="date"
                      value={searchData.checkOut}
                      onChange={(e) => setSearchData({ ...searchData, checkOut: e.target.value })}
                      min={searchData.checkIn || new Date().toISOString().split('T')[0]}
                      className="pl-10 border-0 focus-visible:ring-0"
                    />
                  </div>
                </div>
                
                <div className="relative">
                  <label className="text-xs font-semibold text-gray-700 ml-4 mb-1 block">{t("guests")}</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="number"
                      min={1}
                      value={searchData.guests}
                      onChange={(e) => setSearchData({ ...searchData, guests: parseInt(e.target.value) })}
                      className="pl-10 border-0 focus-visible:ring-0"
                    />
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleSearch}
                className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-6"
              >
                <Search className="h-5 w-5 mr-2" />
                {t("searchButton")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8 relative z-10">
        <Card className="p-4 shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-blue-50 text-blue-700">
                <MessageSquareText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{t("journalAvis")}</h2>
                <p className="text-sm text-gray-500 mt-1">{t("journalAvisSubtitle")}</p>
              </div>
            </div>
            <Link href={`/${locale}/client/journal-avis`}>
              <Button variant="outline">
                {t("openJournalAvis")}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      <div className="container mx-auto px-4 py-12 space-y-12">
        {/* Mes réservations */}
        {bookings.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">{t("myBookings")}</h2>
                <p className="text-gray-600">{t("myBookingsSubtitle")}</p>
              </div>
              <Link href={`/${locale}/client/bookings`}>
                <Button variant="outline">
                  {t("viewAll")}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookings.map((booking) => (
                <Card key={booking.id} className="overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="relative h-48">
                    {booking.lofts?.loft_photos?.[0]?.url ? (
                      <Image
                        src={booking.lofts.loft_photos[0].url}
                        alt={booking.lofts.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                        <MapPin className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      {getBookingStatusBadge(booking.status)}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg mb-2">{booking.lofts?.name}</h3>
                    <p className="text-sm text-gray-600 mb-3 flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {booking.lofts?.address}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(booking.check_in_date).toLocaleDateString(currentLocale === 'ar' ? 'ar-DZ' : currentLocale === 'en' ? 'en-US' : 'fr-FR')}
                      </span>
                      <span>→</span>
                      <span>{new Date(booking.check_out_date).toLocaleDateString(currentLocale === 'ar' ? 'ar-DZ' : currentLocale === 'en' ? 'en-US' : 'fr-FR')}</span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t">
                      <span className="font-bold text-lg text-blue-600">
                        {booking.total_price?.toLocaleString()} DA
                      </span>
                      <Link href={`/${locale}/client/bookings/${booking.id}`}>
                        <Button size="sm" variant="outline">{t("details")}</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Lofts — même API que la homepage */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {searchData.destination ? t("loftsAt", { zone: searchData.destination }) : t("availableLofts")}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("availableLoftsSubtitle")}</p>
            </div>
            <Link href={`/${locale}/client/lofts`}>
              <Button variant="outline" className="gap-2">
                {t("viewAll")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredLofts.length === 0 && (
              <div className="col-span-3 text-center py-16 text-gray-400">
                <MapPin className="h-14 w-14 mx-auto mb-4 opacity-40" />
                <p className="text-base">{t("noLoftsFound")}</p>
              </div>
            )}
            {filteredLofts.map((loft: any, i: number) => {
              const location = loft.zone || loft.address
              return (
                <motion.div
                  key={loft.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, delay: (i % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link href={`/${locale}/client/lofts/${loft.id}`} className="group block">
                    {/* Photo — même ratio que landing page */}
                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-neutral-200 dark:bg-neutral-800">
                      {loft.photo ? (
                        <Image
                          src={loft.photo}
                          alt={loft.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700">
                          <MapPin className="h-12 w-12 text-neutral-400" />
                        </div>
                      )}
                      {/* Overlay hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    </div>

                    {/* Infos */}
                    <div className="mt-4 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-lg font-medium text-neutral-900 dark:text-white truncate">{loft.name}</h3>
                        {location && (
                          <p className="mt-1 flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">{location}</span>
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-base font-semibold text-neutral-900 dark:text-white">
                          {loft.price_per_night?.toLocaleString()} DA
                        </span>
                        <span className="block text-xs text-neutral-500 dark:text-neutral-400">
                          {t("perNight")}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* Message si pas de réservations */}
        {bookings.length === 0 && (
          <Card className="p-12 text-center">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-2xl font-bold mb-2">{t("noBookings")}</h3>
            <p className="text-gray-600 mb-6">{t("noBookingsDescription")}</p>
            <Link href={`/${locale}/client/lofts`}>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                {t("discoverLofts")}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  )
}
