'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { 
  Contrast, 
  Type, 
  Eye, 
  Settings,
  X,
  Minus,
  Plus
} from 'lucide-react';
import { Button } from './button';

interface AccessibilitySettings {
  highContrast: boolean;
  fontSize: 'small' | 'normal' | 'large' | 'extra-large';
  reducedMotion: boolean;
}

export function AccessibilityToolbar() {
  const t = useTranslations('accessibility');
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    fontSize: 'normal',
    reducedMotion: false,
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        applySettings(parsed);
      } catch (error) {
        console.error('Error loading accessibility settings:', error);
      }
    }
  }, []);

  // Apply settings to document
  const applySettings = (newSettings: AccessibilitySettings) => {
    const root = document.documentElement;
    
    // High contrast
    if (newSettings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Font size
    root.classList.remove('font-small', 'font-normal', 'font-large', 'font-extra-large');
    root.classList.add(`font-${newSettings.fontSize}`);

    // Reduced motion
    if (newSettings.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  };

  // Update settings
  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    applySettings(updated);
    localStorage.setItem('accessibility-settings', JSON.stringify(updated));
  };

  const fontSizes = [
    { key: 'small', label: t('fontSize.small'), size: '14px' },
    { key: 'normal', label: t('fontSize.normal'), size: '16px' },
    { key: 'large', label: t('fontSize.large'), size: '18px' },
    { key: 'extra-large', label: t('fontSize.extraLarge'), size: '20px' },
  ] as const;

  const currentFontIndex = fontSizes.findIndex(f => f.key === settings.fontSize);

  const increaseFontSize = () => {
    if (currentFontIndex < fontSizes.length - 1) {
      updateSettings({ fontSize: fontSizes[currentFontIndex + 1].key });
    }
  };

  const decreaseFontSize = () => {
    if (currentFontIndex > 0) {
      updateSettings({ fontSize: fontSizes[currentFontIndex - 1].key });
    }
  };

  return (
    <>
      {/* Accessibility Toolbar Toggle */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full w-12 h-12 shadow-lg"
          aria-label={isOpen ? t('closeToolbar') : t('openToolbar')}
          aria-expanded={isOpen}
          aria-controls="accessibility-toolbar"
        >
          {isOpen ? (
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Eye className="h-5 w-5" aria-hidden="true" />
          )}
        </Button>
      </div>

      {/* Accessibility Toolbar Panel */}
      {isOpen && (
        <div
          id="accessibility-toolbar"
          className="fixed bottom-20 right-4 bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-80 max-w-[calc(100vw-2rem)] z-50"
          role="dialog"
          aria-label={t('toolbarTitle')}
          aria-modal="false"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Settings className="h-5 w-5 mr-2" aria-hidden="true" />
              {t('toolbarTitle')}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              aria-label={t('closeToolbar')}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          <div className="space-y-4">
            {/* High Contrast Toggle */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <Contrast className="h-4 w-4 text-gray-600" aria-hidden="true" />
                <span className="text-sm font-medium text-gray-700">
                  {t('highContrast')}
                </span>
              </label>
              <button
                role="switch"
                aria-checked={settings.highContrast}
                onClick={() => updateSettings({ highContrast: !settings.highContrast })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  settings.highContrast ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span className="sr-only">{t('toggleHighContrast')}</span>
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.highContrast ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Font Size Controls */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Type className="h-4 w-4 text-gray-600" aria-hidden="true" />
                <span className="text-sm font-medium text-gray-700">
                  {t('fontSize.title')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={decreaseFontSize}
                  disabled={currentFontIndex === 0}
                  aria-label={t('decreaseFontSize')}
                >
                  <Minus className="h-3 w-3" aria-hidden="true" />
                </Button>
                <span className="text-sm text-gray-600 px-3">
                  {fontSizes[currentFontIndex].label}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={increaseFontSize}
                  disabled={currentFontIndex === fontSizes.length - 1}
                  aria-label={t('increaseFontSize')}
                >
                  <Plus className="h-3 w-3" aria-hidden="true" />
                </Button>
              </div>
            </div>

            {/* Reduced Motion Toggle */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <span className="text-sm font-medium text-gray-700">
                  {t('reducedMotion')}
                </span>
              </label>
              <button
                role="switch"
                aria-checked={settings.reducedMotion}
                onClick={() => updateSettings({ reducedMotion: !settings.reducedMotion })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  settings.reducedMotion ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span className="sr-only">{t('toggleReducedMotion')}</span>
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.reducedMotion ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Reset Button */}
            <div className="pt-2 border-t border-gray-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const defaultSettings: AccessibilitySettings = {
                    highContrast: false,
                    fontSize: 'normal',
                    reducedMotion: false,
                  };
                  updateSettings(defaultSettings);
                }}
                className="w-full"
              >
                {t('resetSettings')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}