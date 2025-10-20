import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './card';
import { Button } from './button';
import { Check, ArrowRight } from 'lucide-react';

interface ServiceCardProps {
  serviceKey: string;
  icon: React.ReactNode;
  href?: string;
}

export function ServiceCard({ serviceKey, icon, href = '/services' }: ServiceCardProps) {
  const t = useTranslations('services');
  
  const title = t(`${serviceKey}.title`);
  const description = t(`${serviceKey}.description`);
  const features = t.raw(`${serviceKey}.features`) || [];

  return (
    <Card className="h-full hover:shadow-lg transition-all duration-300 group">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-300">
            {icon}
          </div>
        </div>
        <CardTitle className="text-xl mb-2">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        {features.length > 0 && (
          <ul className="space-y-2 mb-6 flex-1">
            {features.map((feature: string, index: number) => (
              <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        )}
        
        <Link href={href} className="mt-auto">
          <Button variant="outline" className="w-full group-hover:bg-blue-50 group-hover:border-blue-300">
            <span>En savoir plus</span>
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}