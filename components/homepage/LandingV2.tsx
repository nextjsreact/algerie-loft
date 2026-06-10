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
  Play,
  X,
} from 'lucide-react';
import PublicHeader from '@/components/public/PublicHeader';
import BackToTop from '@/components/ui/BackToTop';

interface LandingV2Props {
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
    heroOverline: 'Loft Algérie',
    heroTitleLine1: 'L\'art de',
    heroTitleLine2: 'séjourner',
    heroTitleLine3: 'en Algérie',
    heroSubtitle:
      'Une collection de lofts d\'exception, choisis pour leur caractère, leur lumière et leur emplacement. Réservez en direct, sans intermédiaire.',
    heroCtaPrimary: 'Explorer la collection',
    heroCtaSecondary: 'Prendre rendez-vous',
    scrollIndicator: 'Découvrir',
    statsGuests: 'Voyageurs accueillis',
    statsLofts: 'Lofts d\'exception',
    statsCities: 'Villes',
    statsRating: 'Note moyenne',
    collectionOverline: 'Nos adresses',
    collectionTitle: 'Chaque loft a une âme',
    collectionSubtitle:
      'Nous ne référençons que des biens que nous avons visités, photographiés et approuvés. Ce que vous voyez est ce que vous vivrez.',
    perNight: '/ nuit',
    view: 'Voir le loft',
    viewAll: 'Voir tous les lofts',
    promiseOverline: 'Notre promesse',
    promiseTitle: 'Le confort d\'un hôtel,\nl\'authenticité d\'un chez-soi',
    feat1Title: 'Sélection exigeante',
    feat1Desc:
      'Moins de lofts, mieux choisis. Chaque bien est inspecté et validé par nos équipes.',
    feat2Title: 'Arrivée sans friction',
    feat2Desc:
      'Check-in flexible, instructions claires, équipe joignable à toute heure.',
    feat3Title: 'Confiance totale',
    feat3Desc:
      'Paiement sécurisé, photos réelles, avis vérifiés. Ce que vous voyez est ce que vous vivrez.',
    testimonialsOverline: 'Témoignages',
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
    ownerOverline: 'Propriétaires',
    ownerTitle: 'Valorisez votre bien.\nNous gérons le reste.',
    ownerSubtitle:
      'Confiez-nous votre loft et augmentez vos revenus locatifs jusqu\'à 40%, en toute sérénité.',
    ownerB1: 'Gestion complète et transparente',
    ownerB2: 'Photographie et mise en valeur professionnelle',
    ownerB3: 'Service voyageurs 24h/24',
    ownerB4: 'Revenus sécurisés, sans frais cachés',
    ownerCta: 'Estimer mes revenus',
    ownerCtaSecondary: 'Nous appeler',
    avgRevenue: 'Revenu mensuel moyen',
    revenueUp: 'Hausse moyenne des revenus',
    ctaOverline: 'Votre séjour commence ici',
    ctaTitle: 'Prêt à vivre une expérience différente ?',
    ctaSubtitle:
      'Dites-nous où et quand. Nous nous occupons de tout.',
    ctaPrimary: 'Explorer les lofts',
    ctaSecondary: 'WhatsApp',
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
    heroOverline: 'Loft Algeria',
    heroTitleLine1: 'The art of',
    heroTitleLine2: 'staying',
    heroTitleLine3: 'in Algeria',
    heroSubtitle:
      'A collection of exceptional lofts, chosen for their character, light and location. Book directly, no middleman.',
    heroCtaPrimary: 'Explore the collection',
    heroCtaSecondary: 'Book a call',
    scrollIndicator: 'Discover',
    statsGuests: 'Guests welcomed',
    statsLofts: 'Exceptional lofts',
    statsCities: 'Cities',
    statsRating: 'Average rating',
    collectionOverline: 'Our addresses',
    collectionTitle: 'Every loft has a soul',
    collectionSubtitle:
      'We only list properties we have visited, photographed and approved. What you see is what you will experience.',
    perNight: '/ night',
    view: 'View loft',
    viewAll: 'View all lofts',
    promiseOverline: 'Our promise',
    promiseTitle: 'Hotel comfort,\nhome authenticity',
    feat1Title: 'Curated selection',
    feat1Desc:
      'Fewer lofts, better chosen. Every property is inspected and approved by our team.',
    feat2Title: 'Seamless arrival',
    feat2Desc:
      'Flexible check-in, clear instructions, team reachable at any time.',
    feat3Title: 'Total trust',
    feat3Desc:
      'Secure payment, real photos, verified reviews. What you see is what you experience.',
    testimonialsOverline: 'Testimonials',
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
    ownerOverline: 'Owners',
    ownerTitle: 'Grow your property\'s value.\nWe handle the rest.',
    ownerSubtitle:
      'Entrust us with your loft and increase your rental income by up to 40%, with complete peace of mind.',
    ownerB1: 'Complete, transparent management',
    ownerB2: 'Professional photography and styling',
    ownerB3: '24/7 guest service',
    ownerB4: 'Secured income, no hidden fees',
    ownerCta: 'Estimate my income',
    ownerCtaSecondary: 'Call us',
    avgRevenue: 'Average monthly revenue',
    revenueUp: 'Average revenue increase',
    ctaOverline: 'Your stay begins here',
    ctaTitle: 'Ready to live a different experience?',
    ctaSubtitle: 'Tell us where and when. We take care of everything.',
    ctaPrimary: 'Browse lofts',
    ctaSecondary: 'WhatsApp',
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
    heroOverline: 'Loft Algérie',
    heroTitleLine1: 'فن',
    heroTitleLine2: 'الإقامة',
    heroTitleLine3: 'في الجزائر',
    heroSubtitle:
      'مجموعة من الشقق الاستثنائية، مختارة بعناية لطابعها وإضاءتها وموقعها. احجز مباشرة، بدون وسيط.',
    heroCtaPrimary: 'استكشف المجموعة',
    heroCtaSecondary: 'حجز موعد',
    scrollIndicator: 'اكتشف',
    statsGuests: 'ضيوف استقبلناهم',
    statsLofts: 'شقق استثنائية',
    statsCities: 'مدن',
    statsRating: 'متوسط التقييم',
    collectionOverline: 'عناويننا',
    collectionTitle: 'كل شقة لها روح',
    collectionSubtitle:
      'ندرج فقط العقارات التي زرناها وصورناها ووافقنا عليها. ما تراه هو ما ستعيشه.',
    perNight: '/ ليلة',
    view: 'عرض الشقة',
    viewAll: 'عرض كل الشقق',
    promiseOverline: 'وعدنا',
    promiseTitle: 'راحة الفندق،\nأصالة المنزل',
    feat1Title: 'اختيار دقيق',
    feat1Desc: 'شقق أقل لكن أفضل. كل عقار يتم تفتيشه والموافقة عليه من فريقنا.',
    feat2Title: 'وصول سلس',
    feat2Desc: 'تسجيل دخول مرن، تعليمات واضحة، فريق متاح في أي وقت.',
    feat3Title: 'ثقة تامة',
    feat3Desc: 'دفع آمن، صور حقيقية، تقييمات موثقة. ما تراه هو ما تعيشه.',
    testimonialsOverline: 'آراء العملاء',
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
    ownerOverline: 'المالكون',
    ownerTitle: 'ارفع قيمة عقارك.\nنحن نتولى الباقي.',
    ownerSubtitle:
      'اعهد إلينا بإدارة شقتك وارفع دخلك الإيجاري حتى 40%، بكل اطمئنان.',
    ownerB1: 'إدارة كاملة وشفافة',
    ownerB2: 'تصوير احترافي وتنسيق',
    ownerB3: 'خدمة ضيوف 24/7',
    ownerB4: 'دخل مضمون، بدون رسوم خفية',
    ownerCta: 'قدّر دخلي',
    ownerCtaSecondary: 'اتصل بنا',
    avgRevenue: 'متوسط الدخل الشهري',
    revenueUp: 'متوسط زيادة الدخل',
    ctaOverline: 'إقامتك تبدأ هنا',
    ctaTitle: 'مستعد لتجربة مختلفة؟',
    ctaSubtitle: 'أخبرنا أين ومتى. نحن نتولى كل شيء.',
    ctaPrimary: 'تصفح الشقق',
    ctaSecondary: 'واتساب',
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
      className="pointer-events-none absolute inset-0 z-[5] opacity-[0.035]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }}
    />
  );
}

function AnimatedCounter({ value, suffix = '' }: { value: string; suffix?: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="inline-block"
    >
      {value}
      {suffix}
    </motion.span>
  );
}

function SectionOverline({ children }: { children: React.ReactNode }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6 }}
      className="mb-4 text-[11px] font-medium uppercase tracking-[0.35em] text-[#b08d57]"
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
      <div className="relative overflow-hidden rounded-2xl border border-[#e8e0d5] bg-white p-8 transition-all duration-500 hover:border-[#d4c4a8] hover:shadow-xl hover:shadow-[#b08d57]/5 sm:p-10">
        <Quote className="mb-6 h-8 w-8 text-[#b08d57]/30" strokeWidth={1.5} />
        <p className="mb-8 text-base leading-relaxed text-neutral-700" style={{ fontFamily: "'Inter', sans-serif" }}>
          "{quote}"
        </p>
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f5f0e8] text-sm font-semibold text-[#8b7355]">
            {author.charAt(0)}
          </div>
          <div>
            <div className="text-sm font-semibold text-neutral-900">{author}</div>
            <div className="text-xs text-neutral-500" style={{ fontFamily: "'Inter', sans-serif" }}>
              {role}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Main component ─── */

export default function LandingV2({ locale }: LandingV2Props) {
  const t = copy[locale as keyof typeof copy] || copy.fr;
  const isRtl = locale === 'ar';
  const [lofts, setLofts] = useState<Loft[]>(fallbackLofts);
  const [activeLoftIndex, setActiveLoftIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroImageY = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

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

  const collection = useMemo(() => lofts.slice(0, 6), [lofts]);

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
    { city: 'Alger · Hydra', amount: '45 000 DA' },
    { city: 'Oran · Centre', amount: '38 000 DA' },
    { city: 'Constantine', amount: '28 000 DA' },
  ];

  const ownerBenefits = [t.ownerB1, t.ownerB2, t.ownerB3, t.ownerB4];

  const testimonials = [
    { quote: t.testimonial1, author: t.testimonial1Author, role: t.testimonial1Role },
    { quote: t.testimonial2, author: t.testimonial2Author, role: t.testimonial2Role },
    { quote: t.testimonial3, author: t.testimonial3Author, role: t.testimonial3Role },
  ];

  const scrollCarousel = useCallback((direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const scrollAmount = 340;
    carouselRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }, []);

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
      className="min-h-screen w-full overflow-x-hidden bg-[#faf8f5] text-neutral-900 antialiased selection:bg-[#b08d57] selection:text-white"
      style={{ fontFamily: "'Inter', 'Georgia', serif" }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap"
        rel="stylesheet"
      />
      <PublicHeader locale={locale} text={{ login: t.footerClient }} />

      {/* ─── HERO ─── */}
      <section ref={heroRef} className="relative h-[100dvh] min-h-[700px] w-full overflow-hidden">
        <motion.div style={{ y: heroImageY, scale: heroScale }} className="absolute inset-0">
          {collection[activeLoftIndex]?.photo && (
            <Image
              src={collection[activeLoftIndex].photo}
              alt={collection[activeLoftIndex].name || 'Loft Algérie'}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          )}
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/70" />
        <GrainOverlay />

        {/* Loft selector dots */}
        <div className="absolute bottom-32 left-1/2 z-20 flex -translate-x-1/2 gap-2 sm:bottom-36">
          {collection.slice(0, 4).map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveLoftIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === activeLoftIndex ? 'w-8 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Loft ${i + 1}`}
            />
          ))}
        </div>

        <motion.div style={{ opacity: heroOpacity }} className="relative z-10 flex h-full flex-col justify-end">
          <div className="mx-auto w-full max-w-7xl px-6 pb-28 sm:px-8 lg:pb-32">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="mb-6 text-[11px] font-medium uppercase tracking-[0.4em] text-white/70"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {t.heroOverline}
            </motion.p>

            <div className="max-w-4xl">
              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="text-5xl font-medium leading-[0.95] tracking-tight text-white sm:text-7xl lg:text-8xl"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                <span className="block">{t.heroTitleLine1}</span>
                <span className="mt-2 block italic text-[#d4c4a8]">{t.heroTitleLine2}</span>
                <span className="mt-2 block">{t.heroTitleLine3}</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="mt-8 max-w-lg text-base leading-relaxed text-white/75 sm:text-lg"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {t.heroSubtitle}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                <button
                  onClick={goToSearch}
                  className="group inline-flex items-center justify-center gap-3 rounded-full bg-white px-8 py-4 text-sm font-medium text-neutral-900 transition-all duration-300 hover:bg-[#f5f0e8] hover:shadow-lg hover:shadow-white/10"
                >
                  {t.heroCtaPrimary}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                </button>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/5 px-8 py-4 text-sm font-medium text-white backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:border-white/50"
                >
                  <Phone className="h-4 w-4" />
                  {t.heroCtaSecondary}
                </a>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/50" style={{ fontFamily: "'Inter', sans-serif" }}>
            {t.scrollIndicator}
          </span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="h-10 w-px bg-gradient-to-b from-white/50 to-transparent"
          />
        </motion.div>
      </section>

      {/* ─── STATS ─── */}
      <section className="relative border-b border-[#e8e0d5] bg-[#faf8f5]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-12 px-6 py-20 sm:px-8 md:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="text-center"
            >
              <div className="text-4xl font-medium tracking-tight text-neutral-900 sm:text-5xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                <AnimatedCounter value={s.value} />
              </div>
              <div
                className="mt-3 text-[11px] font-medium uppercase tracking-[0.25em] text-neutral-500"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── COLLECTION (Horizontal Carousel) ─── */}
      <section id="featured-lofts" className="mx-auto max-w-7xl px-6 py-28 sm:px-8">
        <div className="mb-16 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-xl">
            <SectionOverline>{t.collectionOverline}</SectionOverline>
            <h2 className="text-4xl font-medium leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl" style={{ fontFamily: "'Playfair Display', serif" }}>
              {t.collectionTitle}
            </h2>
            <p className="mt-5 max-w-md text-neutral-600" style={{ fontFamily: "'Inter', sans-serif" }}>
              {t.collectionSubtitle}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => scrollCarousel('left')}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-[#e8e0d5] text-neutral-600 transition-all duration-300 hover:border-[#b08d57] hover:text-[#b08d57]"
              aria-label="Previous"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scrollCarousel('right')}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-[#e8e0d5] text-neutral-600 transition-all duration-300 hover:border-[#b08d57] hover:text-[#b08d57]"
              aria-label="Next"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          ref={carouselRef}
          className="-mx-6 flex gap-6 overflow-x-auto px-6 pb-4 scrollbar-hide sm:-mx-8 sm:px-8"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {collection.map((loft, i) => (
            <motion.div
              key={loft.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="group w-[300px] flex-shrink-0 sm:w-[340px]"
            >
              <div
                className="relative aspect-[3/4] w-full cursor-pointer overflow-hidden rounded-2xl bg-neutral-200"
                onClick={() => openLightbox(i)}
              >
                {loft.photo && (
                  <Image
                    src={loft.photo}
                    alt={loft.name}
                    fill
                    sizes="340px"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="absolute bottom-0 left-0 right-0 p-6 opacity-0 transition-all duration-500 group-hover:opacity-100">
                  <button className="inline-flex items-center gap-2 rounded-full bg-white/90 px-5 py-2.5 text-sm font-medium text-neutral-900 backdrop-blur-sm transition-transform duration-300 hover:scale-105">
                    <Play className="h-3.5 w-3.5" />
                    {t.view}
                  </button>
                </div>
              </div>
              <div className="mt-5 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-medium" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {loft.name}
                  </h3>
                  {(loft.zone || loft.address) && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-neutral-500" style={{ fontFamily: "'Inter', sans-serif" }}>
                      <MapPin className="h-3.5 w-3.5" />
                      {loft.zone || loft.address}
                    </p>
                  )}
                </div>
                <div className="text-right rtl:text-left">
                  <div className="text-lg font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {formatPrice(loft.price_per_night)} DA
                  </div>
                  <div className="text-xs text-neutral-500" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {t.perNight}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <button
            onClick={goToSearch}
            className="group inline-flex items-center gap-2 text-sm font-medium text-neutral-900 transition-colors hover:text-[#b08d57]"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {t.viewAll}
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>
      </section>

      {/* ─── PROMISE ─── */}
      <section className="relative overflow-hidden bg-[#1a1a1a] py-28 text-white">
        <div className="absolute inset-0 opacity-5">
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: '40px 40px',
            }}
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 sm:px-8">
          <div className="mb-20 max-w-2xl">
            <SectionOverline>{t.promiseOverline}</SectionOverline>
            <h2
              className="text-4xl font-medium leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {t.promiseTitle.split('\n').map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.7, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-10 backdrop-blur-sm transition-all duration-500 hover:border-[#b08d57]/30 hover:bg-white/10"
                >
                  <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-full border border-[#b08d57]/30 bg-[#b08d57]/10">
                    <Icon className="h-6 w-6 text-[#d4c4a8]" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-medium" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {f.title}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-white/60" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {f.desc}
                  </p>
                  <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-[#b08d57]/5 blur-2xl transition-all duration-500 group-hover:bg-[#b08d57]/10" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="mx-auto max-w-7xl px-6 py-28 sm:px-8">
        <div className="mb-16 max-w-2xl">
          <SectionOverline>{t.testimonialsOverline}</SectionOverline>
          <h2 className="text-4xl font-medium leading-[1.1] tracking-tight sm:text-5xl" style={{ fontFamily: "'Playfair Display', serif" }}>
            {t.testimonialsTitle}
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((tmn, i) => (
            <TestimonialCard key={i} quote={tmn.quote} author={tmn.author} role={tmn.role} index={i} />
          ))}
        </div>
      </section>

      {/* ─── OWNERS ─── */}
      <section className="relative overflow-hidden bg-[#f5f0e8] py-28">
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-[#b08d57]/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-[#b08d57]/5 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 sm:px-8">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.8 }}
            >
              <SectionOverline>{t.ownerOverline}</SectionOverline>
              <h2
                className="text-4xl font-medium leading-[1.1] tracking-tight sm:text-5xl"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {t.ownerTitle.split('\n').map((line, i) => (
                  <span key={i} className="block">
                    {line}
                  </span>
                ))}
              </h2>
              <p className="mt-6 max-w-md text-neutral-600" style={{ fontFamily: "'Inter', sans-serif" }}>
                {t.ownerSubtitle}
              </p>

              <ul className="mt-10 space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
                {ownerBenefits.map((b, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#b08d57]/10">
                      <svg className="h-3 w-3 text-[#b08d57]" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M2.5 6.5L5 9L9.5 3.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span className="text-neutral-700">{b}</span>
                  </motion.li>
                ))}
              </ul>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row" style={{ fontFamily: "'Inter', sans-serif" }}>
                <button
                  onClick={goToPartner}
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#1a1a1a] px-8 py-4 text-sm font-medium text-white transition-all duration-300 hover:bg-neutral-800 hover:shadow-lg hover:shadow-neutral-900/20"
                >
                  {t.ownerCta}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                </button>
                <a
                  href={PHONE_LINK}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d4c4a8] bg-white px-8 py-4 text-sm font-medium text-neutral-900 transition-all duration-300 hover:bg-[#faf8f5]"
                >
                  <Phone className="h-4 w-4" />
                  {t.ownerCtaSecondary}
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="rounded-3xl border border-[#e8e0d5] bg-white p-10 shadow-xl shadow-[#b08d57]/5">
                <div className="flex items-center gap-3 text-neutral-500" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <Star className="h-5 w-5 text-[#b08d57]" strokeWidth={1.5} />
                  <span className="text-sm font-medium">{t.avgRevenue}</span>
                </div>
                <div className="mt-8 space-y-6" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {revenues.map((r, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                      className="flex items-center justify-between border-b border-[#f0ebe3] pb-5 last:border-0"
                    >
                      <span className="text-neutral-600">{r.city}</span>
                      <span className="text-xl font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {r.amount}
                      </span>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-8 rounded-2xl bg-[#1a1a1a] p-8 text-center text-white">
                  <div className="text-5xl font-medium" style={{ fontFamily: "'Playfair Display', serif" }}>
                    +40%
                  </div>
                  <div className="mt-2 text-sm text-white/60" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {t.revenueUp}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── CLOSING CTA ─── */}
      <section id="contact-section" className="relative overflow-hidden py-32">
        {collection[0]?.photo && (
          <Image src={collection[0].photo} alt="" fill sizes="100vw" className="object-cover opacity-20" />
        )}
        <div className="absolute inset-0 bg-[#faf8f5]/80 backdrop-blur-sm" />
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center sm:px-8">
          <SectionOverline>{t.ctaOverline}</SectionOverline>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-4xl font-medium leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {t.ctaTitle}
          </motion.h2>
          <p className="mx-auto mt-6 max-w-lg text-neutral-600" style={{ fontFamily: "'Inter', sans-serif" }}>
            {t.ctaSubtitle}
          </p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <button
              onClick={goToSearch}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#1a1a1a] px-8 py-4 text-sm font-medium text-white transition-all duration-300 hover:bg-neutral-800 hover:shadow-lg hover:shadow-neutral-900/20"
            >
              {t.ctaPrimary}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </button>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d4c4a8] bg-white px-8 py-4 text-sm font-medium text-neutral-900 transition-all duration-300 hover:bg-[#f5f0e8]"
            >
              <Phone className="h-4 w-4" />
              {t.ctaSecondary}
            </a>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-[#e8e0d5] bg-[#faf8f5]">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8" style={{ fontFamily: "'Inter', sans-serif" }}>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
            <div className="md:col-span-5">
              <div className="text-2xl font-medium" style={{ fontFamily: "'Playfair Display', serif" }}>
                Loft Algérie
              </div>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-neutral-500">{t.footerTagline}</p>
              <div className="mt-6 flex items-center gap-1.5 text-sm text-[#b08d57]">
                <Star className="h-4 w-4 fill-current" />
                <span className="font-medium">4,9</span>
                <span className="text-neutral-400">/ 5</span>
              </div>
            </div>
            <div className="md:col-span-3 md:col-start-7">
              <h4 className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400">{t.footerExplore}</h4>
              <ul className="mt-6 space-y-3 text-sm">
                <li>
                  <a
                    href={`/${locale}/client/search`}
                    className="text-neutral-600 transition-colors hover:text-[#b08d57]"
                  >
                    {t.footerLofts}
                  </a>
                </li>
                <li>
                  <a
                    href={`/${locale}/register?role=partner`}
                    className="text-neutral-600 transition-colors hover:text-[#b08d57]"
                  >
                    {t.footerOwners}
                  </a>
                </li>
                <li>
                  <a href={`/${locale}/public/about`} className="text-neutral-600 transition-colors hover:text-[#b08d57]">
                    {t.footerAbout}
                  </a>
                </li>
                <li>
                  <a href={`/${locale}/login`} className="text-neutral-600 transition-colors hover:text-[#b08d57]">
                    {t.footerClient}
                  </a>
                </li>
              </ul>
            </div>
            <div className="md:col-span-3">
              <h4 className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400">{t.footerContact}</h4>
              <ul className="mt-6 space-y-3 text-sm">
                <li>
                  <a
                    href={PHONE_LINK}
                    className="flex items-center gap-2 text-neutral-600 transition-colors hover:text-[#b08d57]"
                  >
                    <Phone className="h-4 w-4" />
                    <span dir="ltr">{PHONE_DISPLAY}</span>
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${EMAIL}`}
                    className="flex items-center gap-2 text-neutral-600 transition-colors hover:text-[#b08d57]"
                  >
                    <Mail className="h-4 w-4" />
                    {EMAIL}
                  </a>
                </li>
                <li>
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-neutral-600 transition-colors hover:text-[#b08d57]"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-[#e8e0d5] pt-8 text-sm text-neutral-500 sm:flex-row">
            <span>
              &copy; {new Date().getFullYear()} Loft Algérie — {t.rights}
            </span>
            <span className="flex items-center gap-1.5">
              Crafted with care in Algeria
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
                <h3 className="text-2xl font-medium text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {collection[lightboxIndex]?.name}
                </h3>
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
