'use client';

import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

// Hook optimisé qui met en cache les traductions fréquemment utilisées
export function useOptimizedTranslations(namespace?: string) {
  const t = useTranslations(namespace);
  
  // Cache des traductions communes pour éviter les re-calculs
  const commonTranslations = useMemo(() => {
    if (!namespace || namespace === 'common') {
      return {
        save: t('save'),
        cancel: t('cancel'),
        delete: t('delete'),
        edit: t('edit'),
        add: t('add'),
        loading: t('loading'),
        error: t('error'),
        success: t('success'),
        confirm: t('confirm'),
        yes: t('yes'),
        no: t('no')
      };
    }
    return {};
  }, [t, namespace]);

  return {
    t,
    common: commonTranslations
  };
}

// Hook spécialisé pour les formulaires
export function useFormTranslations() {
  const t = useTranslations('forms');
  
  const formTranslations = useMemo(() => ({
    validation: {
      required: t('validation.required'),
      email: t('validation.email'),
      minLength: t('validation.minLength'),
      maxLength: t('validation.maxLength')
    },
    actions: {
      submit: t('actions.submit'),
      reset: t('actions.reset'),
      save: t('actions.save')
    }
  }), [t]);

  return formTranslations;
}

// Hook spécialisé pour la navigation
export function useNavigationTranslations() {
  const t = useTranslations('navigation');
  
  const navTranslations = useMemo(() => ({
    dashboard: t('dashboard'),
    lofts: t('lofts'),
    transactions: t('transactions'),
    teams: t('teams'),
    tasks: t('tasks'),
    reservations: t('reservations'),
    reports: t('reports'),
    settings: t('settings'),
    logout: t('logout')
  }), [t]);

  return navTranslations;
}