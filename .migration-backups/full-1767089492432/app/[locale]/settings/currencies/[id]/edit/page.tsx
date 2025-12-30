import { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { getCurrency } from "@/app/actions/currencies"
import { EditCurrencyForm } from "@/components/settings/edit-currency-form"

type Props = {
  params: {
    locale: string
    id: string
  }
}

export async function generateMetadata({ params: { locale } }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "settings.currencies" })

  return {
    title: t("editCurrency"),
  }
}

export default async function EditCurrencyPage({ params: { locale, id } }: Props) {
  const t = await getTranslations({ locale, namespace: "settings.currencies" })

  try {
    const currency = await getCurrency(id)

    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{t("editCurrency")}</h1>
          <p className="text-muted-foreground">
            {t("enterCurrencyDetails")}
          </p>
        </div>

        <EditCurrencyForm currency={currency} />
      </div>
    )
  } catch (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{t("editCurrency")}</h1>
        </div>

        <div className="rounded-lg border border-destructive/50 p-4 text-destructive">
          <p>Error loading currency. The currency may not exist or you may not have permission to edit it.</p>
        </div>
      </div>
    )
  }
}