'use client'

import Script from 'next/script'
import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

interface FacebookPixelProps {
  pixelId: string
}

export function FacebookPixel({ pixelId }: FacebookPixelProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'PageView')
    }
  }, [pathname, searchParams])

  if (!pixelId) return null

  return (
    <>
      <Script id="facebook-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixelId}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}

// Hook pour tracker les événements Facebook
export function useFacebookPixel() {
  const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', eventName, eventParams)
    }
  }

  const trackCustomEvent = (eventName: string, eventParams?: Record<string, any>) => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('trackCustom', eventName, eventParams)
    }
  }

  // Événements e-commerce
  const trackViewContent = (contentName: string, contentId: string, value?: number) => {
    trackEvent('ViewContent', {
      content_name: contentName,
      content_ids: [contentId],
      content_type: 'product',
      value: value,
      currency: 'DZD',
    })
  }

  const trackAddToCart = (contentName: string, contentId: string, value: number) => {
    trackEvent('AddToCart', {
      content_name: contentName,
      content_ids: [contentId],
      content_type: 'product',
      value: value,
      currency: 'DZD',
    })
  }

  const trackInitiateCheckout = (value: number, numItems: number) => {
    trackEvent('InitiateCheckout', {
      value: value,
      currency: 'DZD',
      num_items: numItems,
    })
  }

  const trackPurchase = (value: number, contentIds: string[]) => {
    trackEvent('Purchase', {
      value: value,
      currency: 'DZD',
      content_ids: contentIds,
      content_type: 'product',
    })
  }

  const trackLead = () => {
    trackEvent('Lead')
  }

  const trackSearch = (searchString: string) => {
    trackEvent('Search', {
      search_string: searchString,
    })
  }

  return {
    trackEvent,
    trackCustomEvent,
    trackViewContent,
    trackAddToCart,
    trackInitiateCheckout,
    trackPurchase,
    trackLead,
    trackSearch,
  }
}
