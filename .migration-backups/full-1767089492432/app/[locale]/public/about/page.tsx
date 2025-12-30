import PublicHeader from '@/components/public/PublicHeader';
import PublicFooter from '@/components/public/PublicFooter';
import BackToTop from '@/components/ui/BackToTop';
import Breadcrumb from '@/components/public/Breadcrumb';

interface AboutPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  
  const content = {
    fr: {
      title: "À Propos de Loft Algérie",
      subtitle: "Votre partenaire de confiance pour la gestion immobilière en Algérie",
      login: "Connexion",
      clientArea: "Espace Client",
      contact: "Contact",
      allRightsReserved: "Tous droits réservés",
      
      hero: {
        description: "Depuis 2019, Loft Algérie s'est imposée comme un leader dans la gestion de propriétés courte durée en Algérie. Nous combinons expertise locale et technologies modernes pour maximiser vos revenus locatifs tout en offrant une expérience exceptionnelle à vos locataires."
      },
      
      mission: {
        title: "Notre Mission",
        description: "Révolutionner la gestion immobilière en Algérie en offrant des services professionnels, transparents et technologiquement avancés qui maximisent les revenus de nos partenaires propriétaires."
      },
      
      vision: {
        title: "Notre Vision",
        description: "Devenir la référence incontournable de la gestion immobilière moderne en Afrique du Nord, en créant un écosystème où propriétaires et locataires bénéficient d'une expérience optimale."
      },
      
      values: {
        title: "Nos Valeurs",
        items: [
          {
            title: "Excellence",
            description: "Nous visons l'excellence dans chaque aspect de notre service, de la première visite à la gestion quotidienne.",
            icon: "⭐"
          },
          {
            title: "Transparence",
            description: "Communication claire et reporting détaillé pour une confiance totale avec nos partenaires propriétaires.",
            icon: "🔍"
          },
          {
            title: "Innovation",
            description: "Adoption des dernières technologies pour optimiser la gestion et améliorer l'expérience utilisateur.",
            icon: "🚀"
          },
          {
            title: "Intégrité",
            description: "Honnêteté et éthique dans toutes nos relations commerciales et notre gestion des propriétés.",
            icon: "🤝"
          }
        ]
      },
      
      story: {
        title: "Notre Histoire",
        description: "Fondée par une équipe d'experts passionnés par l'immobilier et les nouvelles technologies, Loft Algérie est née de la volonté de moderniser le secteur de la location courte durée en Algérie.",
        timeline: [
          {
            year: "2019",
            title: "Création de Loft Algérie",
            description: "Lancement avec 5 propriétés pilotes à Alger"
          },
          {
            year: "2020",
            title: "Expansion régionale",
            description: "Extension à Oran et Constantine, 50+ propriétés"
          },
          {
            year: "2022",
            title: "Innovation technologique",
            description: "Lancement de notre plateforme de gestion digitale"
          },
          {
            year: "2024",
            title: "Leadership confirmé",
            description: "500+ propriétés gérées, 98% de satisfaction client"
          }
        ]
      },
      
      team: {
        title: "Notre Équipe",
        description: "Une équipe multidisciplinaire d'experts dédiés à votre succès",
        members: [
          {
            name: "Ahmed Benali",
            role: "Directeur Général",
            description: "15 ans d'expérience dans l'immobilier et la gestion d'entreprise"
          },
          {
            name: "Fatima Khelifi",
            role: "Directrice Opérationnelle",
            description: "Experte en optimisation des processus et satisfaction client"
          },
          {
            name: "Yacine Meziani",
            role: "Responsable Technique",
            description: "Spécialiste en technologies immobilières et automatisation"
          }
        ]
      },
      
      commitment: {
        title: "Notre Engagement",
        description: "Nous nous engageons à fournir un service exceptionnel basé sur la confiance, la performance et l'innovation continue."
      }
    },
    
    en: {
      title: "About Loft Algeria",
      subtitle: "Your trusted partner for property management in Algeria",
      login: "Login",
      clientArea: "Client Area",
      contact: "Contact",
      allRightsReserved: "All rights reserved",
      
      hero: {
        description: "Since 2019, Loft Algeria has established itself as a leader in short-term property management in Algeria. We combine local expertise with modern technologies to maximize your rental income while providing an exceptional experience for your tenants."
      },
      
      mission: {
        title: "Our Mission",
        description: "To revolutionize property management in Algeria by offering professional, transparent, and technologically advanced services that maximize our partner owners' revenue."
      },
      
      vision: {
        title: "Our Vision",
        description: "To become the undisputed reference for modern property management in North Africa, creating an ecosystem where both owners and tenants benefit from an optimal experience."
      },
      
      values: {
        title: "Our Values",
        items: [
          {
            title: "Excellence",
            description: "We strive for excellence in every aspect of our service, from the first visit to daily management.",
            icon: "⭐"
          },
          {
            title: "Transparency",
            description: "Clear communication and detailed reporting for complete trust with our partner owners.",
            icon: "🔍"
          },
          {
            title: "Innovation",
            description: "Adopting the latest technologies to optimize management and improve user experience.",
            icon: "🚀"
          },
          {
            title: "Integrity",
            description: "Honesty and ethics in all our business relationships and property management.",
            icon: "🤝"
          }
        ]
      },
      
      story: {
        title: "Our Story",
        description: "Founded by a team of experts passionate about real estate and new technologies, Loft Algeria was born from the desire to modernize the short-term rental sector in Algeria.",
        timeline: [
          {
            year: "2019",
            title: "Loft Algeria Creation",
            description: "Launch with 5 pilot properties in Algiers"
          },
          {
            year: "2020",
            title: "Regional Expansion",
            description: "Extension to Oran and Constantine, 50+ properties"
          },
          {
            year: "2022",
            title: "Technological Innovation",
            description: "Launch of our digital management platform"
          },
          {
            year: "2024",
            title: "Confirmed Leadership",
            description: "500+ managed properties, 98% customer satisfaction"
          }
        ]
      },
      
      team: {
        title: "Our Team",
        description: "A multidisciplinary team of experts dedicated to your success",
        members: [
          {
            name: "Ahmed Benali",
            role: "General Manager",
            description: "15 years of experience in real estate and business management"
          },
          {
            name: "Fatima Khelifi",
            role: "Operations Director",
            description: "Expert in process optimization and customer satisfaction"
          },
          {
            name: "Yacine Meziani",
            role: "Technical Manager",
            description: "Specialist in real estate technologies and automation"
          }
        ]
      },
      
      commitment: {
        title: "Our Commitment",
        description: "We are committed to providing exceptional service based on trust, performance, and continuous innovation."
      }
    },
    
    ar: {
      title: "حول لوفت الجزائر",
      subtitle: "شريكك الموثوق لإدارة العقارات في الجزائر",
      login: "تسجيل الدخول",
      clientArea: "منطقة العميل",
      contact: "اتصال",
      allRightsReserved: "جميع الحقوق محفوظة",
      
      hero: {
        description: "منذ عام 2019، رسخت لوفت الجزائر مكانتها كرائدة في إدارة العقارات قصيرة المدى في الجزائر. نحن نجمع بين الخبرة المحلية والتقنيات الحديثة لزيادة دخلك الإيجاري إلى أقصى حد مع توفير تجربة استثنائية للمستأجرين."
      },
      
      mission: {
        title: "مهمتنا",
        description: "ثورة في إدارة العقارات في الجزائر من خلال تقديم خدمات مهنية وشفافة ومتقدمة تقنياً تعظم إيرادات شركائنا المالكين."
      },
      
      vision: {
        title: "رؤيتنا",
        description: "أن نصبح المرجع الذي لا جدال فيه للإدارة العقارية الحديثة في شمال أفريقيا، وإنشاء نظام بيئي يستفيد فيه كل من المالكين والمستأجرين من تجربة مثلى."
      },
      
      values: {
        title: "قيمنا",
        items: [
          {
            title: "التميز",
            description: "نسعى للتميز في كل جانب من جوانب خدمتنا، من الزيارة الأولى إلى الإدارة اليومية.",
            icon: "⭐"
          },
          {
            title: "الشفافية",
            description: "تواصل واضح وتقارير مفصلة لثقة كاملة مع شركائنا المالكين.",
            icon: "🔍"
          },
          {
            title: "الابتكار",
            description: "اعتماد أحدث التقنيات لتحسين الإدارة وتحسين تجربة المستخدم.",
            icon: "🚀"
          },
          {
            title: "النزاهة",
            description: "الصدق والأخلاق في جميع علاقاتنا التجارية وإدارة العقارات.",
            icon: "🤝"
          }
        ]
      },
      
      story: {
        title: "قصتنا",
        description: "تأسست من قبل فريق من الخبراء المتحمسين للعقارات والتقنيات الجديدة، ولدت لوفت الجزائر من الرغبة في تحديث قطاع الإيجار قصير المدى في الجزائر.",
        timeline: [
          {
            year: "2019",
            title: "إنشاء لوفت الجزائر",
            description: "الإطلاق مع 5 عقارات تجريبية في الجزائر العاصمة"
          },
          {
            year: "2020",
            title: "التوسع الإقليمي",
            description: "التوسع إلى وهران وقسنطينة، أكثر من 50 عقار"
          },
          {
            year: "2022",
            title: "الابتكار التكنولوجي",
            description: "إطلاق منصة الإدارة الرقمية الخاصة بنا"
          },
          {
            year: "2024",
            title: "القيادة المؤكدة",
            description: "أكثر من 500 عقار مُدار، 98% رضا العملاء"
          }
        ]
      },
      
      team: {
        title: "فريقنا",
        description: "فريق متعدد التخصصات من الخبراء المكرسين لنجاحك",
        members: [
          {
            name: "أحمد بن علي",
            role: "المدير العام",
            description: "15 عاماً من الخبرة في العقارات وإدارة الأعمال"
          },
          {
            name: "فاطمة خليفي",
            role: "مديرة العمليات",
            description: "خبيرة في تحسين العمليات ورضا العملاء"
          },
          {
            name: "ياسين مزياني",
            role: "المسؤول التقني",
            description: "متخصص في تقنيات العقارات والأتمتة"
          }
        ]
      },
      
      commitment: {
        title: "التزامنا",
        description: "نحن ملتزمون بتقديم خدمة استثنائية قائمة على الثقة والأداء والابتكار المستمر."
      }
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;  return (

    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PublicHeader locale={locale} text={{ login: text.login }} />

      <main className="py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Breadcrumb */}
          <Breadcrumb locale={locale} items={[{ label: text.title }]} />
          
          {/* Hero Section */}
          <section className="text-center mb-16 sm:mb-20">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              {text.title}
            </h1>
            <p className="text-xl sm:text-2xl text-blue-600 dark:text-blue-400 font-medium mb-8">
              {text.subtitle}
            </p>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
              {text.hero.description}
            </p>
          </section>

          {/* Mission & Vision */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16 sm:mb-20">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
              <div className="text-4xl mb-4 text-center">🎯</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">
                {text.mission.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-center">
                {text.mission.description}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
              <div className="text-4xl mb-4 text-center">🔮</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">
                {text.vision.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-center">
                {text.vision.description}
              </p>
            </div>
          </section>

          {/* Values */}
          <section className="mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white text-center mb-12">
              {text.values.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {text.values.items.map((value, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition-shadow duration-300">
                  <div className="text-4xl mb-4">{value.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Story & Timeline */}
          <section className="mb-16 sm:mb-20">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-700 dark:to-blue-900 rounded-xl p-8 sm:p-12 text-white mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-center">
                {text.story.title}
              </h2>
              <p className="text-lg sm:text-xl leading-relaxed text-center max-w-4xl mx-auto opacity-90">
                {text.story.description}
              </p>
            </div>
            
            {/* Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {text.story.timeline.map((item, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    {item.year}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Team */}
          <section className="mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white text-center mb-6">
              {text.team.title}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 text-center mb-12 max-w-3xl mx-auto">
              {text.team.description}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {text.team.members.map((member, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {member.name}
                  </h3>
                  <p className="text-blue-600 dark:text-blue-400 font-medium mb-3">
                    {member.role}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    {member.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Commitment */}
          <section className="bg-emerald-50 dark:bg-emerald-900/20 p-8 sm:p-12 rounded-xl text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              {text.commitment.title}
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-4xl mx-auto">
              {text.commitment.description}
            </p>
            <div className="mt-8">
              <a 
                href={`/${locale}/contact`}
                className="inline-flex items-center px-8 py-4 bg-emerald-600 dark:bg-emerald-700 text-white font-semibold rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors"
              >
                {locale === 'fr' ? 'Contactez-nous' : locale === 'en' ? 'Contact Us' : 'اتصل بنا'}
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
          </section>

        </div>
      </main>

      <PublicFooter 
        locale={locale} 
        text={{ 
          clientArea: text.clientArea,
          contact: text.contact,
          allRightsReserved: text.allRightsReserved
        }} 
      />
      
      <BackToTop />
    </div>
  );
}