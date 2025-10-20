import { useTranslations } from "next-intl"
import { ContactForm } from "@/components/forms/contact-form"
import { ContactInfo } from "@/components/contact/contact-info"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  Users,
  Building,
  Wrench
} from "lucide-react"

export default function ContactPage() {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Hero Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              {t("page.title")}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t("page.subtitle")}
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>{t("page.responseTime")}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>{t("page.freeConsultation")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {t("form.sectionTitle")}
                </h2>
                <p className="text-gray-600">
                  {t("form.sectionDescription")}
                </p>
              </div>
              
              <ContactForm />

              {/* Contact Reasons */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("reasons.title")}</CardTitle>
                  <CardDescription>{t("reasons.description")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {contactReasons.map((reason, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                        <div className="text-primary mt-1">{reason.icon}</div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-sm">{reason.title}</h4>
                            <Badge variant="secondary" className="text-xs">{reason.badge}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{reason.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {t("info.sectionTitle")}
                </h2>
                <p className="text-gray-600">
                  {t("info.sectionDescription")}
                </p>
              </div>

              <ContactInfo />
            </div>
          </div>
        </div>
      </section>

      {/* Response Process */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              {t("process.title")}
            </h2>
            <p className="text-gray-600">
              {t("process.description")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {responseProcess.map((step, index) => (
              <div key={step.step} className="relative">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg">
                    {step.step}
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{step.title}</h3>
                    <p className="text-gray-600 text-sm">{step.description}</p>
                    <div className="flex items-center justify-center space-x-2 text-sm text-primary">
                      <Clock className="h-4 w-4" />
                      <span>{step.time}</span>
                    </div>
                  </div>
                </div>
                
                {/* Connector line */}
                {index < responseProcess.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-full w-full h-0.5 bg-gray-200 transform -translate-y-1/2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              {t("faq.title")}
            </h2>
            <p className="text-gray-600">
              {t("faq.description")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("faq.q1.question")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{t("faq.q1.answer")}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("faq.q2.question")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{t("faq.q2.answer")}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("faq.q3.question")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{t("faq.q3.answer")}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("faq.q4.question")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{t("faq.q4.answer")}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}