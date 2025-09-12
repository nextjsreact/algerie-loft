import { createInstance } from 'i18next'
import Backend from 'i18next-fs-backend'
import { cookies } from 'next/headers'
import { getOptions } from './settings'

export async function getTranslations(lng: string, ns: string | string[]) {
  const i18n = createInstance()
  await i18n
    .use(Backend)
    .init(getOptions(lng, ns))
  return {
    t: i18n.t,
    resources: i18n.services.resourceStore.data
  }
}