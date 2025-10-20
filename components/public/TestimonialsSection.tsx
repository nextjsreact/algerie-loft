interface TestimonialsSectionProps {
  locale: string;
}

export default function TestimonialsSection({ locale }: TestimonialsSectionProps) {
  const content = {
    fr: {
      title: "Ce que disent nos clients",
      testimonials: [
        {
          name: "Ahmed B.",
          role: "Propriétaire",
          text: "Service exceptionnel ! Mes revenus ont augmenté de 30% depuis que je fais confiance à Loft Algérie.",
          rating: 5
        },
        {
          name: "Fatima K.",
          role: "Investisseuse",
          text: "Équipe professionnelle et réactive. Je recommande vivement leurs services de gestion.",
          rating: 5
        },
        {
          name: "Yacine M.",
          role: "Propriétaire",
          text: "Transparence totale et communication excellente. Enfin une équipe de confiance !",
          rating: 5
        }
      ]
    },
    en: {
      title: "What our clients say",
      testimonials: [
        {
          name: "Ahmed B.",
          role: "Property Owner",
          text: "Exceptional service! My income has increased by 30% since trusting Loft Algeria.",
          rating: 5
        },
        {
          name: "Fatima K.",
          role: "Investor",
          text: "Professional and responsive team. I highly recommend their management services.",
          rating: 5
        },
        {
          name: "Yacine M.",
          role: "Property Owner",
          text: "Complete transparency and excellent communication. Finally a trustworthy team!",
          rating: 5
        }
      ]
    },
    ar: {
      title: "ما يقوله عملاؤنا",
      testimonials: [
        {
          name: "أحمد ب.",
          role: "مالك عقار",
          text: "خدمة استثنائية! زادت إيراداتي بنسبة 30% منذ أن وثقت في لوفت الجزائر.",
          rating: 5
        },
        {
          name: "فاطمة ك.",
          role: "مستثمرة",
          text: "فريق محترف ومتجاوب. أنصح بشدة بخدمات الإدارة الخاصة بهم.",
          rating: 5
        },
        {
          name: "ياسين م.",
          role: "مالك عقار",
          text: "شفافية كاملة وتواصل ممتاز. أخيراً فريق جدير بالثقة!",
          rating: 5
        }
      ]
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white text-center mb-8 sm:mb-12">
          {text.title}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {text.testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-xl shadow-lg">
              {/* Stars */}
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              
              {/* Testimonial Text */}
              <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed italic">
                "{testimonial.text}"
              </p>
              
              {/* Author */}
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {testimonial.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {testimonial.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}