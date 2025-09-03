'use client'

import { MessageSquare, Users, Shield, Zap, Lock, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

export function WhatsAppWelcome() {
  const t = useTranslations('conversations')

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-[#f0f2f5] dark:bg-[#202c33]">
      <div className="text-center max-w-md">
        {/* Logo/Icône principale */}
        <div className="relative mb-8">
          <div className="w-32 h-32 bg-[#d9fdd3] dark:bg-[#005c4b] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <MessageSquare className="w-16 h-16 text-[#00a884]" />
          </div>
          <div className="absolute -top-2 -right-2 w-12 h-12 bg-[#00a884] rounded-full flex items-center justify-center shadow-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Titre et description */}
        <h1 className="text-3xl font-light mb-4 text-[#41525d] dark:text-[#e9edef]">
          {t('whatsappWeb')}
        </h1>
        <p className="text-[#667781] dark:text-[#8696a0] mb-8 leading-relaxed">
          {t('whatsappWebDescription')}
        </p>

        {/* Fonctionnalités */}
        <div className="grid grid-cols-1 gap-4 mb-8">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-white dark:bg-[#2a3942] shadow-sm">
            <div className="w-10 h-10 bg-[#e7f3ff] dark:bg-[#1f2937] rounded-full flex items-center justify-center">
              <Lock className="w-5 h-5 text-[#0084ff]" />
            </div>
            <div className="text-left">
              <h4 className="font-medium text-sm text-[#111b21] dark:text-[#e9edef]">
                {t('endToEndEncryption')}
              </h4>
              <p className="text-xs text-[#667781] dark:text-[#8696a0]">
                {t('privacyNotice')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-4 rounded-lg bg-white dark:bg-[#2a3942] shadow-sm">
            <div className="w-10 h-10 bg-[#e8f5e8] dark:bg-[#1f2937] rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-[#00a884]" />
            </div>
            <div className="text-left">
              <h4 className="font-medium text-sm text-[#111b21] dark:text-[#e9edef]">
                {t('groupChatBenefits')}
              </h4>
              <p className="text-xs text-[#667781] dark:text-[#8696a0]">
                {t('groupChatBenefits')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-lg bg-white dark:bg-[#2a3942] shadow-sm">
            <div className="w-10 h-10 bg-[#fff3e0] dark:bg-[#1f2937] rounded-full flex items-center justify-center">
              <Globe className="w-5 h-5 text-[#ff9800]" />
            </div>
            <div className="text-left">
              <h4 className="font-medium text-sm text-[#111b21] dark:text-[#e9edef]">
                {t('multiDeviceSync')}
              </h4>
              <p className="text-xs text-[#667781] dark:text-[#8696a0]">
                {t('multiDeviceSync')}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <Button asChild className="w-full bg-[#00a884] hover:bg-[#00a884]/90 text-white">
            <Link href="/conversations/new">
              <MessageSquare className="w-4 h-4 mr-2" />
              {t('startNewConversation')}
            </Link>
          </Button>
          
          <p className="text-xs text-[#667781] dark:text-[#8696a0]">
            {t('startChatting')}
          </p>
        </div>

        {/* Footer info */}
        <div className="mt-8 pt-6 border-t border-[#e9edef] dark:border-[#313d45]">
          <div className="flex items-center justify-center gap-2 text-xs text-[#667781] dark:text-[#8696a0]">
            <Shield className="w-3 h-3" />
            <span>{t('privacyNotice')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}