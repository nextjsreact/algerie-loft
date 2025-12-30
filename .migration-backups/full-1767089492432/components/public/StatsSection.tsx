interface StatsSectionProps {
  locale: string;
}

export default function StatsSection({ locale }: StatsSectionProps) {
  const content = {
    fr: {
      title: "Nos Résultats en Chiffres",
      stats: [
        { number: "500+", label: "Propriétés Gérées" },
        { number: "98%", label: "Taux de Satisfaction" },
        { number: "5+", label: "Années d'Expérience" },
        { number: "24/7", label: "Support Client" }
      ]
    },
    en: {
      title: "Our Results in Numbers",
      stats: [
        { number: "500+", label: "Properties Managed" },
        { number: "98%", label: "Satisfaction Rate" },
        { number: "5+", label: "Years of Experience" },
        { number: "24/7", label: "Customer Support" }
      ]
    },
    ar: {
      title: "نتائجنا بالأرقام",
      stats: [
        { number: "500+", label: "عقار مُدار" },
        { number: "98%", label: "معدل الرضا" },
        { number: "5+", label: "سنوات الخبرة" },
        { number: "24/7", label: "دعم العملاء" }
      ]
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;

  return (
    <section className="bg-blue-600 dark:bg-blue-800 py-12 sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-8 sm:mb-12">
          {text.title}
        </h2>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {text.stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">
                {stat.number}
              </div>
              <div className="text-blue-100 text-sm sm:text-base font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}