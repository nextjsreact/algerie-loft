import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export default async function TasksRedirectPage() {
  // Get the Accept-Language header to determine preferred locale
  const headersList = await headers()
  const acceptLanguage = headersList.get('accept-language') || ''
  
  // Simple locale detection based on Accept-Language header
  let locale = 'fr' // default
  
  if (acceptLanguage.includes('en')) {
    locale = 'en'
  } else if (acceptLanguage.includes('ar')) {
    locale = 'ar'
  }
  
  // Redirect to the localized tasks page
  redirect(`/${locale}/tasks`)
}