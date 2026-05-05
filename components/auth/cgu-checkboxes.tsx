'use client'

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

interface CGUCheckboxesProps {
  locale?: string
  onValidityChange: (valid: boolean) => void
  onConsentChange: (consent: {
    accepted_cgu: boolean
    accepted_data_transfer: boolean
    marketing_consent: boolean
  }) => void
}

const TEXTS = {
  fr: {
    title: 'Consentements requis',
    cgu: (locale: string) => <>J'ai lu et j'accepte les{' '}<Link href={`/${locale}/cgu`} target="_blank" className="text-blue-600 hover:underline font-medium">Conditions Générales d'Utilisation</Link>{' '}de LoftAlgerie, notamment les règles applicables aux hôtes et aux voyageurs, les conditions d'annulation et la politique de responsabilité.</>,
    cguError: 'Vous devez accepter les CGU pour continuer.',
    data: <>J'accepte que mes données personnelles (nom, email, téléphone, adresse) soient collectées et traitées par LoftAlgerie conformément à la <span className="font-medium">Loi n° 18-07 du 10 juin 2018</span>. Je consens expressément au transfert de ces données vers des serveurs situés hors du territoire algérien (États-Unis / Union Européenne) via les prestataires Vercel et Supabase.</>,
    dataError: 'Ce consentement est obligatoire pour utiliser la plateforme.',
    marketing: "J'accepte de recevoir des communications de LoftAlgerie concernant les nouveaux lofts disponibles, les offres spéciales et les actualités. Je peux me désinscrire à tout moment.",
    optional: '(optionnel)',
    required: 'Champs obligatoires',
  },
  en: {
    title: 'Required consents',
    cgu: (locale: string) => <>I have read and accept the{' '}<Link href={`/${locale}/cgu`} target="_blank" className="text-blue-600 hover:underline font-medium">Terms of Use</Link>{' '}of LoftAlgerie, including the rules applicable to hosts and travelers, cancellation conditions and the liability policy.</>,
    cguError: 'You must accept the Terms of Use to continue.',
    data: <>I agree that my personal data (name, email, phone, address) may be collected and processed by LoftAlgerie in accordance with <span className="font-medium">Law No. 18-07 of June 10, 2018</span>. I expressly consent to the transfer of this data to servers located outside Algeria (USA / EU) via Vercel and Supabase.</>,
    dataError: 'This consent is required to use the platform.',
    marketing: 'I agree to receive communications from LoftAlgerie about new available lofts, special offers and news. I can unsubscribe at any time.',
    optional: '(optional)',
    required: 'Required fields',
  },
  ar: {
    title: 'الموافقات المطلوبة',
    cgu: (locale: string) => <>لقد قرأت وأوافق على{' '}<Link href={`/${locale}/cgu`} target="_blank" className="text-blue-600 hover:underline font-medium">شروط الاستخدام</Link>{' '}لـ LoftAlgerie، بما في ذلك القواعد المطبقة على المضيفين والمسافرين وشروط الإلغاء وسياسة المسؤولية.</>,
    cguError: 'يجب قبول شروط الاستخدام للمتابعة.',
    data: <>أوافق على جمع ومعالجة بياناتي الشخصية (الاسم، البريد الإلكتروني، الهاتف، العنوان) من قبل LoftAlgerie وفقاً <span className="font-medium">للقانون رقم 18-07 المؤرخ في 10 يونيو 2018</span>. أوافق صراحةً على نقل هذه البيانات إلى خوادم خارج الجزائر (الولايات المتحدة / الاتحاد الأوروبي) عبر Vercel وSupabase.</>,
    dataError: 'هذه الموافقة مطلوبة لاستخدام المنصة.',
    marketing: 'أوافق على تلقي اتصالات من LoftAlgerie حول الشقق الجديدة والعروض الخاصة والأخبار. يمكنني إلغاء الاشتراك في أي وقت.',
    optional: '(اختياري)',
    required: 'الحقول المطلوبة',
  },
}

export function CGUCheckboxes({ locale = 'fr', onValidityChange, onConsentChange }: CGUCheckboxesProps) {
  const [cgu, setCgu] = useState(false)
  const [dataTransfer, setDataTransfer] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [touched, setTouched] = useState({ cgu: false, dataTransfer: false })

  const lang = (locale === 'ar' ? 'ar' : locale === 'en' ? 'en' : 'fr') as keyof typeof TEXTS
  const tx = TEXTS[lang]

  const handleCgu = (checked: boolean) => {
    setCgu(checked)
    setTouched(t => ({ ...t, cgu: true }))
    onValidityChange(checked && dataTransfer)
    onConsentChange({ accepted_cgu: checked, accepted_data_transfer: dataTransfer, marketing_consent: marketing })
  }

  const handleDataTransfer = (checked: boolean) => {
    setDataTransfer(checked)
    setTouched(t => ({ ...t, dataTransfer: true }))
    onValidityChange(cgu && checked)
    onConsentChange({ accepted_cgu: cgu, accepted_data_transfer: checked, marketing_consent: marketing })
  }

  const handleMarketing = (checked: boolean) => {
    setMarketing(checked)
    onConsentChange({ accepted_cgu: cgu, accepted_data_transfer: dataTransfer, marketing_consent: checked })
  }

  return (
    <div className="space-y-4 border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-800/50">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {tx.title}
      </p>

      {/* Case 1 — CGU obligatoire */}
      <div className="space-y-1">
        <div className="flex items-start gap-3">
          <Checkbox id="cgu" checked={cgu} onCheckedChange={(v) => handleCgu(v === true)} className="mt-0.5 flex-shrink-0" />
          <Label htmlFor="cgu" className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed cursor-pointer">
            {tx.cgu(locale)}{' '}<span className="text-red-500 font-medium">*</span>
          </Label>
        </div>
        {touched.cgu && !cgu && <p className="text-xs text-red-500 pl-7">{tx.cguError}</p>}
      </div>

      {/* Case 2 — Données personnelles obligatoire */}
      <div className="space-y-1">
        <div className="flex items-start gap-3">
          <Checkbox id="dataTransfer" checked={dataTransfer} onCheckedChange={(v) => handleDataTransfer(v === true)} className="mt-0.5 flex-shrink-0" />
          <Label htmlFor="dataTransfer" className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed cursor-pointer">
            {tx.data}{' '}<span className="text-red-500 font-medium">*</span>
          </Label>
        </div>
        {touched.dataTransfer && !dataTransfer && <p className="text-xs text-red-500 pl-7">{tx.dataError}</p>}
      </div>

      {/* Case 3 — Marketing optionnel */}
      <div className="flex items-start gap-3">
        <Checkbox id="marketing" checked={marketing} onCheckedChange={(v) => handleMarketing(v === true)} className="mt-0.5 flex-shrink-0" />
        <Label htmlFor="marketing" className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed cursor-pointer">
          {tx.marketing}{' '}<span className="text-gray-400 text-xs">{tx.optional}</span>
        </Label>
      </div>

      <p className="text-xs text-gray-400"><span className="text-red-500">*</span> {tx.required}</p>
    </div>
  )
}
