import { useTranslations } from 'next-intl';
import { Building, Users, TrendingUp, Award } from 'lucide-react';

const iconMap = {
  properties: Building,
  clients: Users,
  revenue: TrendingUp,
  experience: Award,
};

export function StatsSection() {
  const t = useTranslations('stats');
  
  const stats = [
    {
      key: 'properties',
      icon: Building,
      number: t('properties.number'),
      label: t('properties.label'),
    },
    {
      key: 'clients',
      icon: Users,
      number: t('clients.number'),
      label: t('clients.label'),
    },
    {
      key: 'revenue',
      icon: TrendingUp,
      number: t('revenue.number'),
      label: t('revenue.label'),
    },
    {
      key: 'experience',
      icon: Award,
      number: t('experience.number'),
      label: t('experience.label'),
    },
  ];

  return (
    <section className="py-16 bg-blue-600">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <div key={stat.key} className="text-center text-white">
                <div className="flex justify-center mb-4">
                  <IconComponent className="h-8 w-8 text-blue-200" />
                </div>
                <div className="text-3xl md:text-4xl font-bold mb-2">
                  {stat.number}
                </div>
                <div className="text-blue-100 text-sm md:text-base">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}