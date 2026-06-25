import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '../../i18n';
import { NextIntlClientProvider } from 'next-intl';
import { getSessionReadOnly } from '@/lib/auth';
import ClientProviders from '@/components/providers/client-providers-nextintl';
import { LangSetter } from '@/components/lang-setter';
import config from '@/next-intl.config';
// import { NuclearSpacingFix } from '@/components/nuclear-spacing-fix';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Validate locale
  if (!locales.includes(locale as any)) {
    notFound();
  }
  
  // Simplified message loading
  let messages: Record<string, any>;
  try {
    messages = (await import(`@/messages/${locale}.json`)).default;
  } catch (error) {
    messages = {};
  }

  // Optimized session loading - only check if auth cookies exist
  let session: Awaited<ReturnType<typeof getSessionReadOnly>> = null;
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const hasAuthCookie = cookieStore.getAll().some(cookie => 
      cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token')
    );
    
    // Only call getSessionReadOnly if auth cookies exist
    if (hasAuthCookie) {
      session = await getSessionReadOnly();
    }
  } catch (error) {
    session = null;
  }

  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <div dir={direction} lang={locale}>
      {/* <NuclearSpacingFix /> */}
      <script dangerouslySetInnerHTML={{ __html: `
(function(){if(typeof window.__hb!=="undefined")return;window.__hb=true;
var logout=function(){
document.cookie.split(';').forEach(function(c){
document.cookie=c.trim().split('=')[0]+'=;expires=Thu,01-Jan-1970 00:00:00 GMT;path=/'
});
window.location.href='/fr/login'
};
setInterval(function(){
fetch('/api/auth/heartbeat',{method:'POST'}).then(function(r){
if(r.status===401){logout();return}
return r.json()
}).then(function(d){
if(d&&(d.force_logout||d.error))logout()
}).catch(function(){})
},10000)
})()
`}} />
      <LangSetter locale={locale} />
      <ClientProviders 
        session={session} 
        unreadCount={0} 
        locale={locale} 
        messages={messages}
      >
        {children}
      </ClientProviders>
    </div>
  );
}