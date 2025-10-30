'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { PricingBreakdown } from '@/lib/schemas/booking';
import { Euro, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PricingSummaryProps {
  pricing: PricingBreakdown;
  nights: number;
  className?: string;
  showDetails?: boolean;
}

export function PricingSummary({ 
  pricing, 
  nights, 
  className, 
  showDetails = true 
}: PricingSummaryProps) {
  const t = useTranslations('pricing');

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Euro className="h-5 w-5" />
          {t('summary.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {showDetails && (
          <>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span>€{pricing.nightlyRate.toFixed(2)} × {nights} {nights === 1 ? 'night' : 'nights'}</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('tooltips.nightlyRate')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span>€{pricing.subtotal.toFixed(2)}</span>
            </div>

            {pricing.cleaningFee > 0 && (
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span>{t('fees.cleaning')}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('tooltips.cleaningFee')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <span>€{pricing.cleaningFee.toFixed(2)}</span>
              </div>
            )}

            {pricing.serviceFee > 0 && (
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span>{t('fees.service')}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('tooltips.serviceFee')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <span>€{pricing.serviceFee.toFixed(2)}</span>
              </div>
            )}

            {pricing.taxes > 0 && (
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span>{t('fees.taxes')}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('tooltips.taxes')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <span>€{pricing.taxes.toFixed(2)}</span>
              </div>
            )}

            <Separator />
          </>
        )}

        <div className="flex justify-between items-center font-semibold text-lg">
          <span>{t('total')}</span>
          <div className="flex items-center gap-2">
            <span>€{pricing.total.toFixed(2)}</span>
            <Badge variant="secondary" className="text-xs">
              {pricing.currency}
            </Badge>
          </div>
        </div>

        {showDetails && (
          <div className="text-xs text-muted-foreground mt-2">
            <p>{t('disclaimer.taxes')}</p>
            <p>{t('disclaimer.currency')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact version for mobile or sidebar display
export function PricingSummaryCompact({ 
  pricing, 
  nights, 
  className 
}: PricingSummaryProps) {
  const t = useTranslations('pricing');

  return (
    <div className={`bg-muted/50 rounded-lg p-4 ${className}`}>
      <div className="flex justify-between items-center">
        <div>
          <p className="font-medium">€{pricing.total.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">
            {nights} {nights === 1 ? 'night' : 'nights'}
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          {pricing.currency}
        </Badge>
      </div>
    </div>
  );
}