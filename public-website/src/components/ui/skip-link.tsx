'use client';

import { useTranslations } from 'next-intl';
import { skipLink } from '@/lib/accessibility';

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
}

export function SkipLink({ href, children }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={skipLink}
      onFocus={(e) => {
        // Ensure the skip link is visible when focused
        e.currentTarget.classList.remove('sr-only');
      }}
      onBlur={(e) => {
        // Hide the skip link when focus is lost
        e.currentTarget.classList.add('sr-only');
      }}
    >
      {children}
    </a>
  );
}

export function SkipLinks() {
  const t = useTranslations('accessibility');

  return (
    <>
      <SkipLink href="#main-content">
        {t('skipToMain')}
      </SkipLink>
      <SkipLink href="#navigation">
        {t('skipToNavigation')}
      </SkipLink>
      <SkipLink href="#footer">
        {t('skipToFooter')}
      </SkipLink>
    </>
  );
}