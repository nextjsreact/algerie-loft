import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from './button';
import { Card, CardContent } from './card';
import { Check, ArrowRight, Eye } from 'lucide-react';

interface CTASectionProps {
  variant?: 'primary' | 'secondary';
}

export function CTASection({ variant = 'primary' }: CTASectionProps) {
  const t = useTranslations('cta');
  
  const ctaData = t.raw(variant);
  
  if (!ctaData) return null;

  if (variant === 'primary') {
    return (
      <section className="py-16 bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto bg-white/95 backdrop-blur-sm">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {ctaData.title}
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                {ctaData.subtitle}
              </p>
              
              {/* Features list */}
              {ctaData.features && (
                <div className="grid md:grid-cols-2 gap-4 mb-8 max-w-2xl mx-auto">
                  {ctaData.features.map((feature: string, index: number) => (
                    <div key={index} className="flex items-center space-x-3 text-left">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              )}
              
              <Link href="/contact">
                <Button size="lg" className="px-8 py-4 text-lg">
                  {ctaData.button}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  // Secondary CTA variant
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          {ctaData.title}
        </h2>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          {ctaData.subtitle}
        </p>
        
        <Link href="/portfolio">
          <Button variant="outline" size="lg" className="px-8 py-4">
            <Eye className="h-5 w-5 mr-2" />
            {ctaData.button}
          </Button>
        </Link>
      </div>
    </section>
  );
}