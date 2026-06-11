'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Sparkles,
  KeyRound,
  Star,
  ChevronLeft,
  ChevronRight,
  Quote,
  X,
  Search,
  Calendar,
  CheckCircle2,
  MessageCircle,
  ChevronDown,
  Send,
  Heart,
  Camera,
  CalendarDays,
  ConciergeBell,
  BadgeCheck,
  BarChart3,
  ClipboardCheck,
} from 'lucide-react';
import PublicHeader from '@/components/public/PublicHeader';
import BackToTop from '@/components/ui/BackToTop';
import UrgentAnnouncementBanner from '@/components/UrgentAnnouncementBanner';

interface LandingV3Props {
  locale: string;
}

type Loft = {
  id: string;
  name: string;
  address?: string;
  description?: string;
  price_per_night?: number;
  zone?: string;
  photo?: string;
};

const WHATSAPP_URL = 'https://wa.me/213560362543';
const PHONE_DISPLAY = '+213 56 03 62 543';
const PHONE_LINK = 'tel:+213560362543';
const EMAIL = 'contact@loftalgerie.com';

const fallbackLofts: Loft[] = [
  {
    id: 'fallback-1',
    name: 'Candy Loft',
    zone: 'Alger Centre',
    price_per_night: 9000,
    photo:
      'https://mhngbluefyucoesgcjoy.supabase.co/storage/v1/object/public/loft-photos/lofts/c4931c00-1792-492d-9101-4bc583484749/e43a66e0-1929-4bd1-8df8-ddf676cf70f8.jpeg',
  },
  {
    id: 'fallback-2',
    name: 'Swan Loft',
    zone: 'El Mouradia, Alger',
    price_per_night: 9000,
    photo:
      'https://mhngbluefyucoesgcjoy.supabase.co/storage/v1/object/public/loft-photos/lofts/b305b744-5ae6-40ed-bf91-00a848a4b1bc/e4defb1a-3b52-4128-b6d5-f3155766b913.jpeg',
  },
  {
    id: 'fallback-3',
    name: 'Dary Loft',
    zone: 'Hussein Dey, Alger',
    price_per_night: 9000,
    photo:
      'https://mhngbluefyucoesgcjoy.supabase.co/storage/v1/object/public/loft-photos/lofts/bcbf0c9f-a179-49e3-be64-f61339de4c8c/f0ec4489-a4fb-4a0a-9113-8ff8bdf6f643.jpg',
  },
  {
    id: 'fallback-4',
    name: 'Choco Loft',
    zone: 'Alger Centre',
    price_per_night: 10000,
    photo:
      'https://mhngbluefyucoesgcjoy.supabase.co/storage/v1/object/public/loft-photos/lofts/0d79d0fd-41e5-4206-97d1-cb217279c7e8/ea5bfb99-18a6-47f5-8534-4b74a14cb896.jpg',
  },
  {
    id: 'fallback-5',
    name: 'Dounia Loft',
    zone: 'Hussein Dey, Alger',
    price_per_night: 9000,
    photo:
      'https://mhngbluefyucoesgcjoy.supabase.co/storage/v1/object/public/loft-photos/lofts/9be87001-9977-4f1b-8bf5-e183f9ee8d27/c5ebd720-8dc8-42d6-b6b1-88de54a6f4e4.jpg',
  },
  {
    id: 'fallback-6',
    name: 'Talia Loft',
    zone: 'Alger Centre',
    price_per_night: 9000,
    photo:
      'https://mhngbluefyucoesgcjoy.supabase.co/storage/v1/object/public/loft-photos/lofts/c8f109bc-86c2-4aa5-a472-d155b3085c15/6ba33f2e-2fb0-4503-991a-857916aca347.jpg',
  },
];

const copy = {
  fr: {
    heroEyebrow: 'Lofts d\'exception — Grand Alger · Oran · Béjaïa · Jijel',
    heroTitle: 'L\'art de séjourner en Algérie',
    heroSubtitle:
      'Une collection de lofts choisis pour leur caractère, leur lumière et leur emplacement. Réservation directe, accueil soigné, expérience irréprochable.',
    heroCtaPrimary: 'Découvrir la collection',
    heroCtaSecondary: 'Parler à un conseiller',
    scroll: 'Découvrir',
    statsGuests: 'Voyageurs accueillis',
    statsLofts: 'Lofts d\'exception',
    statsCities: 'Villes',
    statsRating: 'Note moyenne',
    collectionEyebrow: 'La collection',
    collectionTitle: 'Des adresses qui ont une âme',
    collectionSubtitle:
      'Chaque loft est inspecté, photographié et entretenu avec le même niveau d\'exigence.',
    perNight: '/ nuit',
    view: 'Voir le loft',
    viewAll: 'Voir tous les lofts',
    promiseEyebrow: 'Notre promesse',
    promiseTitle: 'Le confort d\'un hôtel, l\'âme d\'un chez-soi',
    feat1Title: 'Sélection exigeante',
    feat1Desc:
      'Moins de lofts, mieux choisis. Nous ne référençons que des biens qui nous séduisent vraiment.',
    feat2Title: 'Arrivée sans friction',
    feat2Desc:
      'Check-in flexible, instructions claires, équipe joignable à toute heure pour un séjour serein.',
    feat3Title: 'Confiance & sécurité',
    feat3Desc:
      'Paiement sécurisé, lofts vérifiés, photos réelles. Ce que vous voyez est ce que vous vivez.',
    testimonialsEyebrow: 'Témoignages',
    testimonialsTitle: 'Ils ont vécu l\'expérience',
    testimonial1:
      'Un séjour parfait du début à la fin. Le loft était encore plus beau que sur les photos, et l\'accueil était chaleureux.',
    testimonial1Author: 'Sarah M.',
    testimonial1Role: 'Paris, France',
    testimonial2:
      'Je voyage souvent pour le travail à Alger. Loft Algérie est devenu mon adresse de confiance. Qualité constante, service impeccable.',
    testimonial2Author: 'Karim B.',
    testimonial2Role: 'Bruxelles, Belgique',
    testimonial3:
      'Nous avons loué le Candy Loft pour notre lune de miel. Magique. Le rooftop, la lumière, la décoration... tout était parfait.',
    testimonial3Author: 'Amine & Lina',
    testimonial3Role: 'Lyon, France',
    processEyebrow: 'Comment ça marche',
    processTitle: 'Votre séjour en 3 étapes',
    processStep1Title: 'Choisissez',
    processStep1Desc: 'Parcourez notre collection et trouvez le loft qui vous correspond.',
    processStep2Title: 'Réservez',
    processStep2Desc: 'Réservez en direct, sans intermédiaire. Paiement sécurisé.',
    processStep3Title: 'Profitez',
    processStep3Desc: 'Arrivée fluide, accueil personnalisé. Votre séjour commence.',
    galleryEyebrow: 'Galerie',
    galleryTitle: 'L\'élégance dans chaque détail',
    sponsorsEyebrow: 'Ils nous font confiance',
    sponsorsTitle: 'Nos partenaires & sponsors',
    faqEyebrow: 'Questions fréquentes',
    faqTitle: 'Tout ce que vous devez savoir',
    faq1Q: 'Comment réserver un loft ?',
    faq1A: 'Parcourez notre collection, choisissez votre loft et réservez directement en ligne. Vous pouvez aussi nous contacter par WhatsApp pour une réservation personnalisée.',
    faq2Q: 'Quels sont les modes de paiement acceptés ?',
    faq2A: 'Nous acceptons les paiements par carte bancaire, virement, et espèces à l\'arrivée selon les conditions du loft.',
    faq3Q: 'Puis-je annuler ma réservation ?',
    faq3A: 'Oui, selon la politique d\'annulation de chaque loft. La plupart offrent une annulation gratuite jusqu\'à 48h avant l\'arrivée.',
    faq4Q: 'Les lofts sont-ils vérifiés ?',
    faq4A: 'Absolument. Chaque loft est inspecté par nos équipes, photographié professionnellement et évalué régulièrement.',
    faq5Q: 'Proposez-vous des réductions pour les séjours longs ?',
    faq5A: 'Oui, nous offrons des tarifs préférentiels pour les séjours de 7 nuits et plus. Contactez-nous pour un devis personnalisé.',
    ownerEyebrow: 'Propriétaires',
    ownerTitle: 'Valorisez votre bien, sans les contraintes',
    ownerSubtitle:
      'Confiez-nous la gestion de votre loft et augmentez vos revenus locatifs jusqu\'à 40%, en toute sérénité.',
    ownerB1: 'Gestion complète et transparente',
    ownerB2: 'Photographie et mise en valeur professionnelle',
    ownerB3: 'Service voyageurs disponible en continu',
    ownerB4: 'Revenus sécurisés, sans frais cachés',
    ownerCta: 'Estimer mes revenus',
    ownerCtaSecondary: 'Nous appeler',
    avgRevenue: 'Revenu mensuel moyen',
    revenueUp: 'Revenus garantis, versés chaque mois',
    ctaTitle: 'Votre prochain séjour commence ici',
    ctaSubtitle:
      'Dites-nous où et quand. Nous nous occupons du reste.',
    ctaPrimary: 'Explorer les lofts',
    ctaSecondary: 'WhatsApp',
    newsletterTitle: 'Restez informé',
    newsletterSubtitle: 'Recevez nos meilleures adresses et offres exclusives.',
    newsletterPlaceholder: 'Votre adresse email',
    newsletterButton: 'S\'inscrire',
    newsletterPrivacy: 'Pas de spam. Désinscription à tout moment.',
    footerTagline: 'Locations de lofts haut de gamme en Algérie',
    footerExplore: 'Explorer',
    footerLofts: 'Nos lofts',
    footerOwners: 'Devenir partenaire',
    footerAbout: 'À propos',
    footerContact: 'Contact',
    footerClient: 'Espace client',
    rights: 'Tous droits réservés',
  },
  en: {
    heroEyebrow: 'Exceptional lofts — Greater Algiers · Oran · Béjaïa · Jijel',
    heroTitle: 'The art of staying in Algeria',
    heroSubtitle:
      'A collection of lofts chosen for their character, light and location. Direct booking, attentive welcome, a flawless experience.',
    heroCtaPrimary: 'Explore the collection',
    heroCtaSecondary: 'Talk to an advisor',
    scroll: 'Discover',
    statsGuests: 'Guests welcomed',
    statsLofts: 'Exceptional lofts',
    statsCities: 'Cities',
    statsRating: 'Average rating',
    collectionEyebrow: 'The collection',
    collectionTitle: 'Addresses with a soul',
    collectionSubtitle:
      'Every loft is inspected, photographed and maintained to the same demanding standard.',
    perNight: '/ night',
    view: 'View loft',
    viewAll: 'View all lofts',
    promiseEyebrow: 'Our promise',
    promiseTitle: 'The comfort of a hotel, the soul of a home',
    feat1Title: 'Curated selection',
    feat1Desc:
      'Fewer lofts, better chosen. We only list places that genuinely win us over.',
    feat2Title: 'Frictionless arrival',
    feat2Desc:
      'Flexible check-in, clear instructions, a team reachable any time for a serene stay.',
    feat3Title: 'Trust & safety',
    feat3Desc:
      'Secure payment, verified lofts, real photos. What you see is what you live.',
    testimonialsEyebrow: 'Testimonials',
    testimonialsTitle: 'They lived the experience',
    testimonial1:
      'A perfect stay from start to finish. The loft was even more beautiful than in the photos, and the welcome was warm.',
    testimonial1Author: 'Sarah M.',
    testimonial1Role: 'Paris, France',
    testimonial2:
      'I often travel for work to Algiers. Loft Algeria has become my trusted address. Consistent quality, impeccable service.',
    testimonial2Author: 'Karim B.',
    testimonial2Role: 'Brussels, Belgium',
    testimonial3:
      'We rented the Candy Loft for our honeymoon. Magical. The rooftop, the light, the decor... everything was perfect.',
    testimonial3Author: 'Amine & Lina',
    testimonial3Role: 'Lyon, France',
    processEyebrow: 'How it works',
    processTitle: 'Your stay in 3 steps',
    processStep1Title: 'Choose',
    processStep1Desc: 'Browse our collection and find the loft that suits you.',
    processStep2Title: 'Book',
    processStep2Desc: 'Book directly, no middleman. Secure payment.',
    processStep3Title: 'Enjoy',
    processStep3Desc: 'Smooth arrival, personalized welcome. Your stay begins.',
    galleryEyebrow: 'Gallery',
    galleryTitle: 'Elegance in every detail',
    sponsorsEyebrow: 'They trust us',
    sponsorsTitle: 'Our partners & sponsors',
    faqEyebrow: 'FAQ',
    faqTitle: 'Everything you need to know',
    faq1Q: 'How do I book a loft?',
    faq1A: 'Browse our collection, choose your loft and book directly online. You can also contact us via WhatsApp for a personalized booking.',
    faq2Q: 'What payment methods are accepted?',
    faq2A: 'We accept credit card payments, bank transfers, and cash on arrival depending on the loft conditions.',
    faq3Q: 'Can I cancel my reservation?',
    faq3A: 'Yes, according to each loft cancellation policy. Most offer free cancellation up to 48 hours before arrival.',
    faq4Q: 'Are the lofts verified?',
    faq4A: 'Absolutely. Every loft is inspected by our team, professionally photographed and regularly evaluated.',
    faq5Q: 'Do you offer discounts for long stays?',
    faq5A: 'Yes, we offer preferential rates for stays of 7 nights or more. Contact us for a personalized quote.',
    ownerEyebrow: 'Owners',
    ownerTitle: 'Grow your property\'s value, without the hassle',
    ownerSubtitle:
      'Entrust us with your loft and increase your rental income by up to 40%, with complete peace of mind.',
    ownerB1: 'Complete, transparent management',
    ownerB2: 'Professional photography and styling',
    ownerB3: 'Round-the-clock guest service',
    ownerB4: 'Secured income, no hidden fees',
    ownerCta: 'Estimate my income',
    ownerCtaSecondary: 'Call us',
    avgRevenue: 'Average monthly revenue',
    revenueUp: 'Guaranteed income, paid every month',
    ctaTitle: 'Your next stay begins here',
    ctaSubtitle: 'Tell us where and when. We take care of the rest.',
    ctaPrimary: 'Browse lofts',
    ctaSecondary: 'WhatsApp',
    newsletterTitle: 'Stay informed',
    newsletterSubtitle: 'Receive our best addresses and exclusive offers.',
    newsletterPlaceholder: 'Your email address',
    newsletterButton: 'Subscribe',
    newsletterPrivacy: 'No spam. Unsubscribe anytime.',
    footerTagline: 'Premium loft rentals in Algeria',
    footerExplore: 'Explore',
    footerLofts: 'Our lofts',
    footerOwners: 'Become a partner',
    footerAbout: 'About',
    footerContact: 'Contact',
    footerClient: 'Client area',
    rights: 'All rights reserved',
  },
  ar: {
    heroEyebrow: 'شقق استثنائية — الجزائر الكبرى · وهران · بجاية · جيجل',
    heroTitle: 'فن الإقامة في الجزائر',
    heroSubtitle:
      'مجموعة من الشقق المختارة بعناية لطابعها وإضاءتها وموقعها. حجز مباشر، استقبال راقٍ، تجربة لا تشوبها شائبة.',
    heroCtaPrimary: 'اكتشف المجموعة',
    heroCtaSecondary: 'تحدث إلى مستشار',
    scroll: 'اكتشف',
    statsGuests: 'ضيوف استقبلناهم',
    statsLofts: 'شقق استثنائية',
    statsCities: 'مدن',
    statsRating: 'متوسط التقييم',
    collectionEyebrow: 'المجموعة',
    collectionTitle: 'عناوين لها روح',
    collectionSubtitle:
      'يتم فحص كل شقة وتصويرها وصيانتها بنفس مستوى الدقة.',
    perNight: '/ ليلة',
    view: 'عرض الشقة',
    viewAll: 'عرض كل الشقق',
    promiseEyebrow: 'وعدنا',
    promiseTitle: 'راحة الفندق، روح المنزل',
    feat1Title: 'اختيار دقيق',
    feat1Desc: 'شقق أقل لكن أفضل. لا ندرج إلا ما يعجبنا حقاً.',
    feat2Title: 'وصول سلس',
    feat2Desc: 'تسجيل دخول مرن، تعليمات واضحة، فريق متاح في أي وقت.',
    feat3Title: 'ثقة وأمان',
    feat3Desc: 'دفع آمن، شقق موثقة، صور حقيقية. ما تراه هو ما تعيشه.',
    testimonialsEyebrow: 'آراء العملاء',
    testimonialsTitle: 'عاشوا التجربة',
    testimonial1:
      'إقامة مثالية من البداية إلى النهاية. الشقة كانت أجمل من الصور، والاستقبال كان دافئاً.',
    testimonial1Author: 'سارة م.',
    testimonial1Role: 'باريس، فرنسا',
    testimonial2:
      'أسافر كثيراً للعمل إلى الجزائر. Loft Algérie أصبح عنواني الموثوق به. جودة ثابتة، خدمة impeccable.',
    testimonial2Author: 'كريم ب.',
    testimonial2Role: 'بروكسل، بلجيكا',
    testimonial3:
      'أجرنا Candy Loft لشهر العسل. ساحر. السطح، الإضاءة، الديكور... كل شيء كان مثالياً.',
    testimonial3Author: 'أمين ولينا',
    testimonial3Role: 'ليون، فرنسا',
    processEyebrow: 'كيف يعمل',
    processTitle: 'إقامتك في 3 خطوات',
    processStep1Title: 'اختر',
    processStep1Desc: 'تصفح مجموعتنا واعثر على الشقة التي تناسبك.',
    processStep2Title: 'احجز',
    processStep2Desc: 'احجز مباشرة، بدون وسيط. دفع آمن.',
    processStep3Title: 'استمتع',
    processStep3Desc: 'وصول سلس، استقبال مخصص. تبدأ إقامتك.',
    galleryEyebrow: 'معرض الصور',
    galleryTitle: 'الأناقة في كل تفصيل',
    sponsorsEyebrow: 'يثقون بنا',
    sponsorsTitle: 'شركاؤنا ورعاتنا',
    faqEyebrow: 'أسئلة شائعة',
    faqTitle: 'كل ما تحتاج معرفته',
    faq1Q: 'كيف أحجز شقة؟',
    faq1A: 'تصفح مجموعتنا، اختر شقتك واحجز مباشرة عبر الإنترنت. يمكنك أيضاً التواصل معنا عبر واتساب لحجز مخصص.',
    faq2Q: 'ما طرق الدفع المقبولة؟',
    faq2A: 'نقبل الدفع بالبطاقة البنكية، التحويل البنكي، والنقد عند الوصول حسب شروط كل شقة.',
    faq3Q: 'هل يمكنني إلغاء حجزي؟',
    faq3A: 'نعم، حسب سياسة الإلغاء لكل شقة. معظمها يقدم إلغاء مجاني حتى 48 ساعة قبل الوصول.',
    faq4Q: 'هل الشقق موثقة؟',
    faq4A: 'بالتأكيد. كل شقة يتم تفتيشها من فريقنا، تصويرها بشكل احترافي، وتقييمها بانتظام.',
    faq5Q: 'هل تقدمون خصومات للإقامات الطويلة؟',
    faq5A: 'نعم، نقدم أسعاراً مفضلة للإقامات 7 ليالٍ أو أكثر. تواصل معنا للحصول على عرض مخصص.',
    ownerEyebrow: 'المالكون',
    ownerTitle: 'ارفع قيمة عقارك، دون عناء',
    ownerSubtitle:
      'اعهد إلينا بإدارة شقتك وارفع دخلك الإيجاري حتى 40%، بكل اطمئنان.',
    ownerB1: 'إدارة كاملة وشفافة',
    ownerB2: 'تصوير احترافي وتنسيق',
    ownerB3: 'خدمة ضيوف على مدار الساعة',
    ownerB4: 'دخل مضمون، بدون رسوم خفية',
    ownerCta: 'قدّر دخلي',
    ownerCtaSecondary: 'اتصل بنا',
    avgRevenue: 'متوسط الدخل الشهري',
    revenueUp: 'دخل مضمون، يُصرف كل شهر بانتظام',
    ctaTitle: 'إقامتك القادمة تبدأ هنا',
    ctaSubtitle: 'أخبرنا أين ومتى. نحن نتولى الباقي.',
    ctaPrimary: 'تصفح الشقق',
    ctaSecondary: 'واتساب',
    newsletterTitle: 'ابقَ على اطلاع',
    newsletterSubtitle: 'احصل على أفضل عناويننا وعروضنا الحصرية.',
    newsletterPlaceholder: 'بريدك الإلكتروني',
    newsletterButton: 'اشترك',
    newsletterPrivacy: 'لا رسائل مزعجة. إلغاء الاشتراك في أي وقت.',
    footerTagline: 'تأجير شقق فاخرة في الجزائر',
    footerExplore: 'استكشف',
    footerLofts: 'شققنا',
    footerOwners: 'كن شريكاً',
    footerAbout: 'من نحن',
    footerContact: 'اتصل',
    footerClient: 'منطقة العميل',
    rights: 'جميع الحقوق محفوظة',
  },
} as const;

function formatPrice(value?: number) {
  return (value || 0).toLocaleString('fr-FR');
}

/* ─── Sub-components ─── */

function GrainOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[5] opacity-[0.03]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }}
    />
  );
}

function SectionOverline({ children }: { children: React.ReactNode }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6 }}
      className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-neutral-500 dark:text-neutral-400"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {children}
    </motion.p>
  );
}

function TestimonialCard({
  quote,
  author,
  role,
  index,
}: {
  quote: string;
  author: string;
  role: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="group relative"
    >
      <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-8 transition-all duration-500 hover:border-neutral-300 hover:shadow-xl hover:shadow-neutral-900/5 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700 sm:p-10">
        <Quote className="mb-6 h-8 w-8 text-neutral-300 dark:text-neutral-700" strokeWidth={1.5} />
        <p className="mb-8 text-base leading-relaxed text-neutral-700 dark:text-neutral-300" style={{ fontFamily: "'Inter', sans-serif" }}>
          "{quote}"
        </p>
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
            {author.charAt(0)}
          </div>
          <div>
            <div className="text-sm font-semibold text-neutral-900 dark:text-white">{author}</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400" style={{ fontFamily: "'Inter', sans-serif" }}>
              {role}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function FaqItem({
  question,
  answer,
  index,
}: {
  question: string;
  answer: string;
  index: number;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="border-b border-neutral-200 dark:border-neutral-800"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-6 text-left"
      >
        <span className="text-base font-medium text-neutral-900 dark:text-white sm:text-lg">{question}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown className="h-5 w-5 text-neutral-500" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400" style={{ fontFamily: "'Inter', sans-serif" }}>
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Main component ─── */

export default function LandingV3({ locale }: LandingV3Props) {
  const t = copy[locale as keyof typeof copy] || copy.fr;
  const isRtl = locale === 'ar';
  const [lofts, setLofts] = useState<Loft[]>(fallbackLofts);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [email, setEmail] = useState('');
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroImageY = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);
  const heroOverlayOpacity = useTransform(scrollYProgress, [0, 1], [0.55, 0.85]);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/public/featured-lofts?limit=12&randomize=true', {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.lofts) && data.lofts.length > 0) {
          setLofts(data.lofts);
        }
      })
      .catch(() => {
        /* keep fallback */
      });
    return () => controller.abort();
  }, []);

  const heroLoft = lofts[0];
  const collection = useMemo(() => lofts.slice(0, 9), [lofts]);

  const goToSearch = () => {
    window.location.href = `/${locale}/client/search`;
  };
  const goToPartner = () => {
    window.location.href = `/${locale}/register?role=partner`;
  };

  const stats = [
    { value: '2 500+', label: t.statsGuests },
    { value: '150+', label: t.statsLofts },
    { value: '12', label: t.statsCities },
    { value: '4,9', label: t.statsRating },
  ];

  const features = [
    { icon: Sparkles, title: t.feat1Title, desc: t.feat1Desc },
    { icon: KeyRound, title: t.feat2Title, desc: t.feat2Desc },
    { icon: ShieldCheck, title: t.feat3Title, desc: t.feat3Desc },
  ];

  const revenues = [
    { city: 'Alger · Centre', amount: '+145 000 DA' },
    { city: 'Oran · Centre', amount: '+120 000 DA' },
    { city: 'Béjaïa · Jijel', amount: '+100 000 DA' },
  ];

  const ownerBenefits = [t.ownerB1, t.ownerB2, t.ownerB3, t.ownerB4];

  const testimonials = [
    { quote: t.testimonial1, author: t.testimonial1Author, role: t.testimonial1Role },
    { quote: t.testimonial2, author: t.testimonial2Author, role: t.testimonial2Role },
    { quote: t.testimonial3, author: t.testimonial3Author, role: t.testimonial3Role },
  ];

  const processSteps = [
    { icon: Search, title: t.processStep1Title, desc: t.processStep1Desc },
    { icon: Calendar, title: t.processStep2Title, desc: t.processStep2Desc },
    { icon: Heart, title: t.processStep3Title, desc: t.processStep3Desc },
  ];

  const faqItems = [
    { q: t.faq1Q, a: t.faq1A },
    { q: t.faq2Q, a: t.faq2A },
    { q: t.faq3Q, a: t.faq3A },
    { q: t.faq4Q, a: t.faq4A },
    { q: t.faq5Q, a: t.faq5A },
  ];

  const sponsors = [
    { name: 'Airbnb',            logo: '/partners/airbnb-logo.svg',                 website: 'https://www.airbnb.com' },
    { name: 'Booking.com',       logo: '/partners/booking-logo.svg',                website: 'https://www.booking.com' },
    { name: 'Expedia',           logo: '/partners/expedia-logo.svg',                website: 'https://www.expedia.com' },
    { name: 'TripAdvisor',       logo: '/partners/tripadvisor-logo.svg',            website: 'https://www.tripadvisor.com' },
    { name: 'Hotels.com',        logo: '/partners/hotels-logo.svg',                 website: 'https://www.hotels.com' },
    { name: 'Destination Algeria', logo: '/partners/destination-algerie-light-logo.svg', logoDark: '/partners/destination-algerie-dark-logo.svg', website: 'https://www.destination-algeria.com' },
  ];

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = '';
  };

  const nextLightbox = () => {
    setLightboxIndex((prev) => (prev + 1) % collection.length);
  };

  const prevLightbox = () => {
    setLightboxIndex((prev) => (prev - 1 + collection.length) % collection.length);
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen w-full overflow-x-hidden bg-[#faf9f7] text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100"
      style={{ fontFamily: "'Fraunces', ui-serif, Georgia, serif" }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap"
        rel="stylesheet"
      />
      {/* Bannière annonces urgentes */}
      <UrgentAnnouncementBanner locale={locale} />
      <PublicHeader locale={locale} text={{ login: t.footerClient }} />

      {/* ─── HERO ─── */}
      <section ref={heroRef} className="relative h-[92vh] min-h-[620px] w-full overflow-hidden">
        <motion.div style={{ y: heroImageY }} className="absolute inset-0 scale-110">
          {heroLoft?.photo && (
            <Image
              src={heroLoft.photo}
              alt={heroLoft.name || 'Loft Algérie'}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          )}
        </motion.div>
        <motion.div
          style={{ opacity: heroOverlayOpacity }}
          className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30"
        />
        <GrainOverlay />

        <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-end px-6 pb-20 sm:px-8">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mb-5 text-xs uppercase tracking-[0.35em] text-white/80"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {t.heroEyebrow}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl text-4xl font-medium leading-[1.05] text-white sm:text-6xl lg:text-7xl"
          >
            {t.heroTitle}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {t.heroSubtitle}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <button
              onClick={goToSearch}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-neutral-900/80 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:bg-neutral-900"
            >
              {t.heroCtaPrimary}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </button>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/50 bg-white/10 px-7 py-3.5 text-sm font-medium text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/20"
            >
              <Phone className="h-4 w-4" />
              {t.heroCtaSecondary}
            </a>
          </motion.div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="border-b border-neutral-200/70 bg-[#faf9f7] dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-10 px-6 py-14 sm:px-8 md:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="text-center"
            >
              <div className="text-4xl font-medium tracking-tight text-neutral-900 dark:text-white sm:text-5xl">{s.value}</div>
              <div
                className="mt-2 text-xs uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── COLLECTION ─── */}
      <section id="featured-lofts" className="mx-auto max-w-6xl px-6 py-24 sm:px-8">
        <div className="mb-14 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <SectionOverline>{t.collectionEyebrow}</SectionOverline>
            <h2 className="max-w-xl text-3xl font-medium leading-tight text-neutral-900 dark:text-white sm:text-5xl">
              {t.collectionTitle}
            </h2>
            <p
              className="mt-4 max-w-lg text-neutral-600 dark:text-neutral-400"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {t.collectionSubtitle}
            </p>
          </div>
          <button
            onClick={goToSearch}
            className="group inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-neutral-100"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {t.viewAll}
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {collection.map((loft, i) => (
            <motion.div
              key={loft.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, delay: (i % 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="group cursor-pointer"
              onClick={() => openLightbox(i)}
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-neutral-200 dark:bg-neutral-800">
                {loft.photo && (
                  <Image
                    src={loft.photo}
                    alt={loft.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              </div>
              <div className="mt-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-medium text-neutral-900 dark:text-white">{loft.name}</h3>
                  {(loft.zone || loft.address) && (
                    <p
                      className="mt-1 flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      {loft.zone || loft.address}
                    </p>
                  )}
                </div>
                <div className="text-right rtl:text-left" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <div className="text-base font-semibold text-neutral-900 dark:text-white">{formatPrice(loft.price_per_night)} DA</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">{t.perNight}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── PROMISE / SERVICES ─── */}
      <section id="services" className="bg-neutral-900 text-white dark:bg-black">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:px-8">

          {/* Services voyageurs */}
          <div className="mb-16 max-w-2xl">
            <SectionOverline>{t.promiseEyebrow}</SectionOverline>
            <h2 className="text-3xl font-medium leading-tight text-white sm:text-5xl">{t.promiseTitle}</h2>
          </div>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-white/10 md:grid-cols-3">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="bg-neutral-900 p-10 dark:bg-black"
                >
                  <Icon className="h-7 w-7 text-white" strokeWidth={1.5} />
                  <h3 className="mt-6 text-xl font-medium text-white">{f.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/60" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {f.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* ─ Séparateur ─ */}
          <div className="my-20 border-t border-white/10" />

          {/* Aperçu partenaires — lien vers la section dédiée */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <p className="text-sm text-white/50 mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>
              {locale === 'ar' ? 'هل أنت مالك لوفت؟' : locale === 'en' ? 'Do you own a loft?' : 'Vous êtes propriétaire d\'un loft ?'}
            </p>
            <button
              onClick={goToPartner}
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-8 py-3.5 text-sm font-medium text-white transition-all hover:bg-white/10"
            >
              {locale === 'ar' ? 'اكتشف خدماتنا للشركاء ←' : locale === 'en' ? 'Discover our partner services →' : 'Découvrir nos services pour partenaires →'}
            </button>
          </motion.div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="mx-auto max-w-6xl px-6 py-24 sm:px-8">
        <div className="mb-14 max-w-2xl">
          <SectionOverline>{t.testimonialsEyebrow}</SectionOverline>
          <h2 className="text-3xl font-medium leading-tight text-neutral-900 dark:text-white sm:text-5xl">{t.testimonialsTitle}</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((tmn, i) => (
            <TestimonialCard key={i} quote={tmn.quote} author={tmn.author} role={tmn.role} index={i} />
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="border-y border-neutral-200/70 bg-[#faf9f7] dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:px-8">
          <div className="mb-16 text-center">
            <SectionOverline>{t.processEyebrow}</SectionOverline>
            <h2 className="text-3xl font-medium leading-tight text-neutral-900 dark:text-white sm:text-5xl">{t.processTitle}</h2>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {processSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                  className="relative text-center"
                >
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                    <Icon className="h-6 w-6 text-neutral-700 dark:text-neutral-300" strokeWidth={1.5} />
                  </div>
                  <div className="mb-3 text-sm font-medium text-neutral-400" style={{ fontFamily: "'Inter', sans-serif" }}>
                    0{i + 1}
                  </div>
                  <h3 className="mb-3 text-xl font-medium text-neutral-900 dark:text-white">{step.title}</h3>
                  <p className="mx-auto max-w-xs text-sm leading-relaxed text-neutral-600 dark:text-neutral-400" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {step.desc}
                  </p>
                  {i < 2 && (
                    <div className="absolute right-0 top-20 hidden h-px w-full md:block" style={{ background: 'linear-gradient(90deg, transparent 50%, #e5e5e5 50%)' }} />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── GALLERY ─── */}
      <section className="mx-auto max-w-6xl px-6 py-24 sm:px-8">
        <div className="mb-14 max-w-2xl">
          <SectionOverline>{t.galleryEyebrow}</SectionOverline>
          <h2 className="text-3xl font-medium leading-tight text-neutral-900 dark:text-white sm:text-5xl">{t.galleryTitle}</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {collection.slice(0, 4).map((loft, i) => (
            <motion.div
              key={loft.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className={`group relative cursor-pointer overflow-hidden rounded-2xl bg-neutral-200 dark:bg-neutral-800 ${
                i === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-[4/3]'
              }`}
              onClick={() => openLightbox(i)}
            >
              {loft.photo && (
                <Image
                  src={loft.photo}
                  alt={loft.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
              )}
              <div className="absolute inset-0 bg-black/0 transition-all duration-500 group-hover:bg-black/30" />
              <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                <p className="text-sm font-medium text-white">{loft.name}</p>
                <p className="text-xs text-white/70" style={{ fontFamily: "'Inter', sans-serif" }}>{loft.zone}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── SPONSORS — banderole défilante ─── */}
      <section className="overflow-hidden border-y border-neutral-200/70 bg-white py-14 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-10 text-center px-6">
          <SectionOverline>{t.sponsorsEyebrow}</SectionOverline>
          <h2 className="text-2xl font-medium text-neutral-900 dark:text-white sm:text-3xl">{t.sponsorsTitle}</h2>
        </div>

        {/* Banderole défilante infinie */}
        <div className="relative overflow-hidden">
          {/* Fondu gauche */}
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-white to-transparent dark:from-neutral-900" />
          {/* Fondu droit */}
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-white to-transparent dark:from-neutral-900" />

          <style>{`
            @keyframes scroll-sponsors {
              0%   { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .sponsors-track {
              animation: scroll-sponsors 22s linear infinite;
              will-change: transform;
            }
            .sponsors-track:hover {
              animation-play-state: paused;
            }
          `}</style>

          <div className="sponsors-track flex w-max items-center gap-10">
            {[...sponsors, ...sponsors].map((sponsor, i) => (
              <a
                key={i}
                href={sponsor.website}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex shrink-0 flex-col items-center gap-2.5"
                title={sponsor.name}
              >
                <div className="relative flex h-16 w-36 shrink-0 items-center justify-center rounded-2xl border border-neutral-100 bg-neutral-50 px-5 py-3 shadow-sm transition-all duration-300 group-hover:border-neutral-300 group-hover:shadow-md dark:border-neutral-700/60 dark:bg-neutral-800">
                  <div className="relative h-8 w-full">
                    <Image
                      src={sponsor.logo}
                      alt={`${sponsor.name} logo`}
                      fill
                      sizes="144px"
                      className={`object-contain opacity-40 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0 ${sponsor.logoDark ? 'dark:hidden' : ''}`}
                      onError={(e) => {
                        const el = e.target as HTMLImageElement;
                        el.style.display = 'none';
                        const p = el.parentElement;
                        if (p) p.innerHTML = `<div class="flex items-center justify-center w-full h-full text-neutral-400 dark:text-neutral-500 font-medium text-xs">${sponsor.name}</div>`;
                      }}
                    />
                    {sponsor.logoDark && (
                      <Image
                        src={sponsor.logoDark}
                        alt={`${sponsor.name} logo`}
                        fill
                        sizes="144px"
                        className="hidden object-contain opacity-40 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0 dark:block"
                      />
                    )}
                  </div>
                </div>
                <span
                  className="text-[11px] font-medium text-neutral-400 transition-colors duration-300 group-hover:text-neutral-600 dark:text-neutral-500 dark:group-hover:text-neutral-300"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {sponsor.name}
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ─── OWNERS — section fusionnée ─── */}
      <section className="mx-auto max-w-6xl px-6 py-24 sm:px-8">

        {/* Titre centré */}
        <div className="mb-16 text-center">
          <SectionOverline>{t.ownerEyebrow}</SectionOverline>
          <h2 className="mx-auto max-w-3xl text-3xl font-medium leading-tight text-neutral-900 dark:text-white sm:text-5xl">
            {t.ownerTitle}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-neutral-600 dark:text-neutral-400" style={{ fontFamily: "'Inter', sans-serif" }}>
            {t.ownerSubtitle}
          </p>
        </div>

        {/* Grille principale */}
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2">

          {/* Colonne gauche — services complets */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7 }}
          >
            <ul className="space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
              {[
                { icon: Camera,       text: locale === 'ar' ? 'تصوير احترافي مجاني عند الانضمام' : locale === 'en' ? 'Free professional photography on joining' : 'Photographie professionnelle offerte à l\'inscription' },
                { icon: ClipboardCheck, text: locale === 'ar' ? 'تقييم وتهيئة الشقة وفق معاييرنا' : locale === 'en' ? 'Loft evaluation & setup to our standards' : 'Évaluation et aménagement du loft selon nos standards' },
                { icon: CalendarDays, text: locale === 'ar' ? 'إدارة الحجوزات والتوافر' : locale === 'en' ? 'Booking & availability management' : 'Gestion complète des réservations et de la disponibilité' },
                { icon: ConciergeBell, text: locale === 'ar' ? 'خدمة ضيوف 24/7 باسمك' : locale === 'en' ? '24/7 guest service in your name' : 'Service voyageurs 24h/24 en votre nom' },
                { icon: Sparkles,     text: locale === 'ar' ? 'تنظيف الشقة، تسجيل الدخول والخروج' : locale === 'en' ? 'Cleaning, check-in & check-out management' : 'Nettoyage, check-in et check-out pris en charge' },
                { icon: BadgeCheck,   text: locale === 'ar' ? 'دفع شهري مضمون وفي الموعد، بدون رسوم خفية' : locale === 'en' ? 'Guaranteed on-time monthly payment, no hidden fees' : 'Paiement mensuel garanti et ponctuel, sans frais cachés' },
                { icon: BarChart3,    text: locale === 'ar' ? 'تتبع الإيرادات والمصروفات بشفافية تامة عبر التطبيق' : locale === 'en' ? 'Full income & expense tracking via the app' : 'Suivi transparent des revenus et dépenses via l\'application' },
                { icon: ShieldCheck,  text: locale === 'ar' ? 'مراقبة الدخول والخروج في الوقت الفعلي (كاميرا + تطبيق)' : locale === 'en' ? 'Real-time entry/exit monitoring (camera + app)' : 'Surveillance entrées/sorties en temps réel (caméra + application)' },
              ].map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.06 }}
                  className="flex items-center gap-4"
                >
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                    <item.icon className="h-5 w-5 text-neutral-700 dark:text-neutral-300" strokeWidth={1.5} />
                  </span>
                  <span className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{item.text}</span>
                </motion.li>
              ))}
            </ul>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row" style={{ fontFamily: "'Inter', sans-serif" }}>
              <button
                onClick={goToPartner}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-neutral-900 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
              >
                {t.ownerCta}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
              <a
                href={PHONE_LINK}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-300 px-7 py-3.5 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-900"
              >
                <Phone className="h-4 w-4" />
                {t.ownerCtaSecondary}
              </a>
            </div>
          </motion.div>

          {/* Colonne droite — revenus + stats */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="space-y-4"
          >
            {/* Carte revenus */}
            <div className="rounded-3xl border border-neutral-200 bg-white p-9 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400" style={{ fontFamily: "'Inter', sans-serif" }}>
                <Star className="h-5 w-5" strokeWidth={1.5} />
                <span className="text-sm">{t.avgRevenue}</span>
              </div>
              <div className="mt-7 space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
                {revenues.map((r, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-neutral-100 pb-4 last:border-0 dark:border-neutral-800">
                    <span className="text-neutral-600 dark:text-neutral-300">{r.city}</span>
                    <span className="text-xl font-semibold text-neutral-900 dark:text-white">{r.amount}</span>
                  </div>
                ))}
              </div>
              <div className="mt-7 rounded-2xl bg-neutral-900 p-6 text-center text-white dark:bg-black">
                <div className="text-2xl font-semibold leading-tight">✓ {locale === 'ar' ? 'دخل مضمون' : locale === 'en' ? 'Secured income' : 'Revenus assurés'}</div>
                <div className="mt-1 text-sm text-white/60" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {t.revenueUp}
                </div>
              </div>
            </div>

            {/* Stats 4 cases */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '150+', label: locale === 'ar' ? 'شقة مُدارة' : locale === 'en' ? 'Managed lofts' : 'Lofts gérés' },
                { value: '98%', label: locale === 'ar' ? 'شركاء راضون' : locale === 'en' ? 'Satisfied partners' : 'Partenaires satisfaits' },
                { value: '72h', label: locale === 'ar' ? 'للبدء بعد التسجيل' : locale === 'en' ? 'To launch after signup' : 'Pour démarrer après inscription' },
                { value: '0 DA', label: locale === 'ar' ? 'تكاليف مخفية' : locale === 'en' ? 'Hidden fees' : 'Frais cachés' },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-center dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <div className="text-3xl font-medium text-neutral-900 dark:text-white">{s.value}</div>
                  <div className="mt-1.5 text-xs text-neutral-500 uppercase tracking-wider dark:text-neutral-400" style={{ fontFamily: "'Inter', sans-serif" }}>{s.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="border-y border-neutral-200/70 bg-[#faf9f7] dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mx-auto max-w-3xl px-6 py-24 sm:px-8">
          <div className="mb-14 text-center">
            <SectionOverline>{t.faqEyebrow}</SectionOverline>
            <h2 className="text-3xl font-medium leading-tight text-neutral-900 dark:text-white sm:text-5xl">{t.faqTitle}</h2>
          </div>
          <div>
            {faqItems.map((item, i) => (
              <FaqItem key={i} question={item.q} answer={item.a} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── CLOSING CTA ─── */}
      <section id="contact-section" className="relative overflow-hidden bg-neutral-900 dark:bg-black">
        {heroLoft?.photo && (
          <Image src={heroLoft.photo} alt="" fill sizes="100vw" className="object-cover opacity-25" />
        )}
        <div className="absolute inset-0 bg-neutral-900/70 dark:bg-black/70" />
        <div className="relative z-10 mx-auto max-w-3xl px-6 py-28 text-center sm:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-3xl font-medium leading-tight text-white sm:text-5xl"
          >
            {t.ctaTitle}
          </motion.h2>
          <p
            className="mx-auto mt-5 max-w-xl text-white/70"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {t.ctaSubtitle}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row" style={{ fontFamily: "'Inter', sans-serif" }}>
            <button
              onClick={goToSearch}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold text-neutral-900 transition-all hover:bg-neutral-100"
              style={{ color: '#171717' }}
            >
              {t.ctaPrimary}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </button>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 px-8 py-4 text-sm font-medium text-white transition-all hover:bg-white/10"
            >
              <Phone className="h-4 w-4" />
              {t.ctaSecondary}
            </a>
          </div>
        </div>
      </section>

      {/* ─── NEWSLETTER ─── */}
      <section className="bg-white dark:bg-neutral-900">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl border border-neutral-200 bg-[#faf9f7] p-8 dark:border-neutral-800 dark:bg-neutral-950 sm:p-12"
          >
            <div className="mx-auto max-w-xl text-center">
              <MessageCircle className="mx-auto mb-4 h-8 w-8 text-neutral-400 dark:text-neutral-500" strokeWidth={1.5} />
              <h3 className="text-2xl font-medium text-neutral-900 dark:text-white sm:text-3xl">{t.newsletterTitle}</h3>
              <p className="mt-3 text-neutral-600 dark:text-neutral-400" style={{ fontFamily: "'Inter', sans-serif" }}>
                {t.newsletterSubtitle}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row" style={{ fontFamily: "'Inter', sans-serif" }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.newsletterPlaceholder}
                  className="flex-1 rounded-full border border-neutral-300 bg-white px-6 py-3.5 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-500 dark:focus:border-neutral-500"
                />
                <button className="inline-flex items-center justify-center gap-2 rounded-full bg-neutral-900 px-8 py-3.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-white/90">
                  <Send className="h-4 w-4" />
                  {t.newsletterButton}
                </button>
              </div>
              <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-500" style={{ fontFamily: "'Inter', sans-serif" }}>
                {t.newsletterPrivacy}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[#faf9f7] text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:px-8" style={{ fontFamily: "'Inter', sans-serif" }}>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            <div>
              <div className="text-2xl font-medium text-neutral-900 dark:text-white" style={{ fontFamily: "'Fraunces', serif" }}>
                Loft Algérie
              </div>
              <p className="mt-3 max-w-xs text-sm text-neutral-500 dark:text-neutral-400">{t.footerTagline}</p>
              <div className="mt-4 flex items-center gap-1.5 text-sm text-neutral-700 dark:text-neutral-300">
                <Star className="h-4 w-4 fill-current text-yellow-500" />
                <span className="font-medium">4,9</span>
                <span className="text-neutral-400 dark:text-neutral-500">/ 5</span>
              </div>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500">{t.footerExplore}</h4>
              <ul className="mt-5 space-y-3 text-sm">
                <li><a href={`/${locale}/client/search`} className="text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">{t.footerLofts}</a></li>
                <li><a href={`/${locale}/register?role=partner`} className="text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">{t.footerOwners}</a></li>
                <li><a href={`/${locale}/public/about`} className="text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">{t.footerAbout}</a></li>
                <li><a href={`/${locale}/login`} className="text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">{t.footerClient}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500">{t.footerContact}</h4>
              <ul className="mt-5 space-y-3 text-sm">
                <li>
                  <a href={PHONE_LINK} className="flex items-center gap-2 text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">
                    <Phone className="h-4 w-4" />
                    <span dir="ltr">{PHONE_DISPLAY}</span>
                  </a>
                </li>
                <li>
                  <a href={`mailto:${EMAIL}`} className="flex items-center gap-2 text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">
                    <Mail className="h-4 w-4" />
                    {EMAIL}
                  </a>
                </li>
                <li>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-neutral-200 pt-8 text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400 sm:flex-row">
            <span>&copy; {new Date().getFullYear()} Loft Algérie — {t.rights}</span>
            <span className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
              <Heart className="h-3.5 w-3.5" /> Crafted with care in Algeria
            </span>
          </div>
        </div>
      </footer>

      <BackToTop />

      {/* ─── LIGHTBOX ─── */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute right-6 top-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); prevLightbox(); }}
              className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-8"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); nextLightbox(); }}
              className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-8"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="relative mx-4 aspect-[3/4] w-full max-w-3xl overflow-hidden rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {collection[lightboxIndex]?.photo && (
                <Image
                  src={collection[lightboxIndex].photo}
                  alt={collection[lightboxIndex].name}
                  fill
                  sizes="(max-width: 768px) 100vw, 768px"
                  className="object-cover"
                />
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8">
                <h3 className="text-2xl font-medium text-white">{collection[lightboxIndex]?.name}</h3>
                <p className="mt-1 text-white/70" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {collection[lightboxIndex]?.zone}
                </p>
              </div>
            </motion.div>
            <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-2">
              {collection.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === lightboxIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/30'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
