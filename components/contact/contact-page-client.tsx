"use client"

import { useTranslations } from "next-intl"
import { ContactForm } from "@/components/forms/contact-form"
import { ContactInfo } from "@/components/contact/contact-info"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  Users,
  Building,
  Wrench,
  ArrowLeft,
  Sparkles,
  Phone
} from "lucide-react"
import Link from "next/link"

interface ContactPageClientProps {
  locale: string
}

export function ContactPageClient({ locale }: ContactPageClientProps) {
  const t = useTranslations("contact")

  const contactReasons = [
    {
      icon: <Building className="h-5 w-5" />,
      title: t("reasons.propertyManagement.title"),
      description: t("reasons.propertyManagement.description"),
      badge: t("reasons.propertyManagement.badge")
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: t("reasons.rentalServices.title"),
      description: t("reasons.rentalServices.description"),
      badge: t("reasons.rentalServices.badge")
    },
    {
      icon: <Wrench className="h-5 w-5" />,
      title: t("reasons.maintenance.title"),
      description: t("reasons.maintenance.description"),
      badge: t("reasons.maintenance.badge")
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      title: t("reasons.consultation.title"),
      description: t("reasons.consultation.description"),
      badge: t("reasons.consultation.badge")
    }
  ]

  const responseProcess = [
    {
      step: 1,
      title: t("process.step1.title"),
      description: t("process.step1.description"),
      time: t("process.step1.time")
    },
    {
      step: 2,
      title: t("process.step2.title"),
      description: t("process.step2.description"),
      time: t("process.step2.time")
    },
    {
      step: 3,
      title: t("process.step3.title"),
      description: t("process.step3.description"),
      time: t("process.step3.time")
    }
  ]

  return (
    <>
      {/* Hero Section with Back Button */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <Link 
            href={`/${locale}`}
            className="inline-flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors mb-8 group"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">
              {locale === 'fr' ? 'Retour à l\'accueil' : locale === 'en' ? 'Back to home' : 'العودة إلى الصفحة الرئيسية'}
            </span>
          </Link>

          <div className="text-center space-y-6">
            <div className="inline-flex items-center space-x-3 bg-primary/10 dark:bg-primary/20 px-6 py-3 rounded-full">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              <span className="text-primary font-semibold">
                {locale === 'fr' ? 'Nous sommes là pour vous' : locale === 'en' ? 'We are here for you' : 'نحن هنا من أجلك'}
              </span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white">
              {t("page.title")}
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              {t("page.subtitle")}
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-6 py-3 rounded-full shadow-lg">
                <Clock className="h-5 w-5 text-blue-500" />
                <span className="font-semibold text-gray-700 dark:text-gray-200">{t("page.responseTime")}</span>
              </div>
              <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-6 py-3 rounded-full shadow-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-semibold text-gray-700 dark:text-gray-200">{t("page.freeConsultation")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-8 rounded-2xl text-white shadow-2xl">
                <h2 className="text-3xl font-bold mb-4 flex items-center space-x-3">
                  <MessageSquare className="h-8 w-8" />
                  <span>{t("form.sectionTitle")}</span>
                </h2>
                <p className="text-blue-100 text-lg">{t("form.sectionDescription")}</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl">
                <ContactForm />
              </div>

              <Card className="shadow-xl border-2 border-primary/20">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                  <CardTitle className="text-2xl flex items-center space-x-2">
                    <Sparkles className="h-6 w-6 text-primary" />
                    <span>{t("reasons.title")}</span>
                  </CardTitle>
                  <CardDescription className="text-base">{t("reasons.description")}</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {contactReasons.map((reason, index) => (
                      <div key={index} className="flex items-start space-x-3 p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 hover:shadow-lg transition-all duration-300 border border-primary/10 hover:border-primary/30">
                        <div className="text-primary mt-1 bg-primary/10 p-2 rounded-lg">{reason.icon}</div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <h4 className="font-bold text-sm">{reason.title}</h4>
                            <Badge variant="secondary" className="text-xs font-semibold">{reason.badge}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{reason.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-8 rounded-2xl text-white shadow-2xl">
                <h2 className="text-3xl font-bold mb-4 flex items-center space-x-3">
                  <Phone className="h-8 w-8" />
                  <span>{t("info.sectionTitle")}</span>
                </h2>
                <p className="text-green-100 text-lg">{t("info.sectionDescription")}</p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl">
                <ContactInfo />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Response Process */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-6 mb-16">
            <div className="inline-flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-full">
              <CheckCircle className="h-5 w-5 text-primary" />
              <span className="text-primary font-semibold text-sm">
                {locale === 'fr' ? 'Processus simple et rapide' : locale === 'en' ? 'Simple and fast process' : 'عملية بسيطة وسريعة'}
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">{t("process.title")}</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">{t("process.description")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {responseProcess.map((step, index) => (
              <div key={step.step} className="relative">
                <Card className="text-center space-y-6 p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 border-2 border-primary/20 hover:border-primary/50 bg-white dark:bg-gray-800">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/70 text-white rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg transform hover:scale-110 transition-transform">
                    {step.step}
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-bold text-xl text-gray-900 dark:text-white">{step.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{step.description}</p>
                    <div className="inline-flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-full">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-primary font-semibold text-sm">{step.time}</span>
                    </div>
                  </div>
                </Card>
                
                {index < responseProcess.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-primary to-primary/30 transform -translate-y-1/2">
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-8 border-l-primary"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-6 mb-16">
            <div className="inline-flex items-center space-x-2 bg-green-500/10 px-4 py-2 rounded-full">
              <MessageSquare className="h-5 w-5 text-green-600" />
              <span className="text-green-600 font-semibold text-sm">
                {locale === 'fr' ? 'Questions fréquentes' : locale === 'en' ? 'Frequently asked' : 'أسئلة متكررة'}
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">{t("faq.title")}</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">{t("faq.description")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { emoji: "❓", q: "q1" },
              { emoji: "💰", q: "q2" },
              { emoji: "🏠", q: "q3" },
              { emoji: "⏰", q: "q4" }
            ].map((item, index) => (
              <Card key={index} className="shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-primary/30 bg-white dark:bg-gray-800">
                <CardHeader className={`bg-gradient-to-br ${
                  index === 0 ? 'from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10' :
                  index === 1 ? 'from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10' :
                  index === 2 ? 'from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10' :
                  'from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/10'
                }`}>
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-start space-x-3">
                    <span className="text-2xl">{item.emoji}</span>
                    <span>{t(`faq.${item.q}.question`)}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{t(`faq.${item.q}.answer`)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
