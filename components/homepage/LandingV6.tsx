'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  Star,
  ChevronDown,
  Send,
  Heart,
  Search,
  Calendar,
  ShieldCheck,
  Users,
  TrendingUp,
  MessageCircle,
  CheckCircle2,
  Quote,
} from 'lucide-react';
import PublicHeader from '@/components/public/PublicHeader';
import BackToTop from '@/components/ui/BackToTop';

interface LandingV6Props {
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
    heroEyebrow: 'Lofts d\'exception — Alger · Oran · Constantine',
    heroTitle: 'Bienvenue en Algérie,\nlà où chaque séjour\nest une histoire',
    heroSubtitle:
      'Des lofts imprégnés de caractère, de lumière et de chaleur. Réservez en direct et vivez l\'hospitalité algérienne comme jamais.',
    heroCtaPrimary: 'Explorer nos lofts',
    heroCtaSecondary: 'Discuter sur WhatsApp',
    scroll: 'Découvrir',
    statsGuests: 'Voyageurs accueillis',
    statsLofts: 'Lofts d\'exception',
    statsCities: 'Villes',
    statsRating: 'Note moyenne',
    collectionTitle: 'Des lofts qui\nracontent une histoire',
    collectionSubtitle: 'Chaque espace a été choisi pour son âme, sa lumière et son authenticité.',
    perNight: '/ nuit',
    view: 'Voir le loft',
    viewAll: 'Voir tous les lofts',
    promiseTitle: 'Notre promesse',
    promiseSubtitle: 'L\'excellence dans chaque détail, la chaleur dans chaque accueil.',
    feat1Title: 'Sélection sur mesure',
    feat1Desc: 'Nous visitons chaque loft personnellement pour garantir une qualité irréprochable.',
    feat2Title: 'Accueil chaleureux',
    feat2Desc: 'Check-in flexible et équipe disponible 7j/7 pour un séjour en toute sérénité.',
    feat3Title: 'Confiance totale',
    feat3Desc: 'Paiement sécurisé, photos réelles, et support continu. Votre satisfaction est notre priorité.',
    testimonial1:
      'Un séjour inoubliable ! Le loft était magnifique, et l\'équipe nous a accueillis comme des membres de la famille.',
    testimonial1Author: 'Sarah M.',
    testimonial1Role: 'Paris, France',
    testimonial2:
      'Je recommande vivement. La qualité des lofts et le service sont exceptionnels. Une vraie pépite.',
    testimonial2Author: 'Karim B.',
    testimonial2Role: 'Bruxelles, Belgique',
    testimonial3:
      'Nous avons adoré chaque instant. Le décor, l\'ambiance, la gentillesse de l\'équipe... Parfait !',
    testimonial3Author: 'Amine & Lina',
    testimonial3Role: 'Lyon, France',
    testimonialsTitle: 'Ce que nos voyageurs disent',
    processTitle: 'Votre séjour\nen 3 étapes',
    processStep1Title: 'Choisissez',
    processStep1Desc: 'Parcourez notre collection de lofts uniques et trouvez celui qui vous ressemble.',
    processStep2Title: 'Réservez',
    processStep2Desc: 'Réservez en direct, sans commission. Paiement 100% sécurisé.',
    processStep3Title: 'Savourez',
    processStep3Desc: 'Arrivez, installez-vous et laissez-vous porter par l\'expérience.',
    galleryTitle: 'Un aperçu de\nnos havres de paix',
    ownerEyebrow: 'Vous êtes propriétaire ?',
    ownerTitle: 'Transformez votre bien\nen source de revenus',
    ownerSubtitle:
      'Confiez-nous votre loft et profitez d\'une gestion clé en main. Jusqu\'à +40% de revenus locatifs.',
    ownerB1: 'Gestion complète sans tracas',
    ownerB2: 'Mise en valeur professionnelle',
    ownerB3: 'Service voyageurs 24h/24',
    ownerB4: 'Revenus transparents et sécurisés',
    ownerCta: 'Estimer mes revenus',
    ownerCtaSecondary: 'Nous appeler',
    avgRevenue: 'Revenu mensuel moyen par ville',
    revenueUp: 'Hausse moyenne des revenus',
    faq1Q: 'Comment réserver un loft ?',
    faq1A: 'Parcourez notre collection, choisissez votre loft et réservez directement en ligne. Vous pouvez aussi nous contacter par WhatsApp.',
    faq2Q: 'Quels modes de paiement acceptez-vous ?',
    faq2A: 'Nous acceptons les cartes bancaires, virements et espèces selon les conditions du loft.',
    faq3Q: 'Puis-je annuler ma réservation ?',
    faq3A: 'Oui, la plupart de nos lofts proposent une annulation gratuite jusqu\'à 48h avant l\'arrivée.',
    faq4Q: 'Les lofts sont-ils vérifiés ?',
    faq4A: 'Absolument. Chaque loft est inspecté par nos équipes et photographié professionnellement.',
    faq5Q: 'Proposez-vous des tarifs pour longs séjours ?',
    faq5A: 'Oui, contactez-nous pour un devis personnalisé pour les séjours de 7 nuits et plus.',
    faqTitle: 'Questions fréquentes',
    ctaTitle: 'Prêt à vivre\nl\'expérience algérienne ?',
    ctaSubtitle: 'Réservez votre loft dès maintenant et laissez-vous séduire par la magie de l\'Algérie.',
    ctaPrimary: 'Trouver mon loft',
    newsletterTitle: 'Restez inspiré',
    newsletterSubtitle: 'Recevez nos plus belles adresses et offres exclusives chaque mois.',
    newsletterPlaceholder: 'Votre email',
    newsletterButton: 'S\'abonner',
    newsletterPrivacy: 'Sans spam, désabonnement à tout moment.',
    footerTagline: 'Location de lofts haut de gamme en Algérie — élégance, confort, authenticité.',
    footerExplore: 'Explorer',
    footerLofts: 'Nos lofts',
    footerOwners: 'Devenir partenaire',
    footerAbout: 'À propos',
    footerContact: 'Contact',
    footerClient: 'Espace client',
    rights: 'Tous droits réservés',
  },
  en: {
    heroEyebrow: 'Exceptional lofts — Algiers · Oran · Constantine',
    heroTitle: 'Welcome to Algeria,\nwhere every stay\nis a story',
    heroSubtitle:
      'Lofts infused with character, light and warmth. Book direct and experience Algerian hospitality like never before.',
    heroCtaPrimary: 'Explore our lofts',
    heroCtaSecondary: 'Chat on WhatsApp',
    scroll: 'Discover',
    statsGuests: 'Guests welcomed',
    statsLofts: 'Exceptional lofts',
    statsCities: 'Cities',
    statsRating: 'Average rating',
    collectionTitle: 'Lofts that\ntell a story',
    collectionSubtitle: 'Every space was chosen for its soul, its light, and its authenticity.',
    perNight: '/ night',
    view: 'View loft',
    viewAll: 'View all lofts',
    promiseTitle: 'Our promise',
    promiseSubtitle: 'Excellence in every detail, warmth in every welcome.',
    feat1Title: 'Curated selection',
    feat1Desc: 'We personally visit every loft to guarantee impeccable quality.',
    feat2Title: 'Warm welcome',
    feat2Desc: 'Flexible check-in and a team available 7/7 for a serene stay.',
    feat3Title: 'Total trust',
    feat3Desc: 'Secure payment, real photos, continuous support. Your satisfaction is our priority.',
    testimonial1:
      'An unforgettable stay! The loft was beautiful, and the team welcomed us like family.',
    testimonial1Author: 'Sarah M.',
    testimonial1Role: 'Paris, France',
    testimonial2:
      'Highly recommend. The quality of the lofts and the service are exceptional. A true gem.',
    testimonial2Author: 'Karim B.',
    testimonial2Role: 'Brussels, Belgium',
    testimonial3:
      'We loved every moment. The decor, the atmosphere, the kindness of the team... Perfect!',
    testimonial3Author: 'Amine & Lina',
    testimonial3Role: 'Lyon, France',
    testimonialsTitle: 'What our travelers say',
    processTitle: 'Your stay\nin 3 steps',
    processStep1Title: 'Choose',
    processStep1Desc: 'Browse our collection of unique lofts and find the one that suits you.',
    processStep2Title: 'Book',
    processStep2Desc: 'Book directly, no commission. 100% secure payment.',
    processStep3Title: 'Enjoy',
    processStep3Desc: 'Arrive, settle in and let yourself be carried away by the experience.',
    galleryTitle: 'A glimpse of\nour havens of peace',
    ownerEyebrow: 'Are you an owner?',
    ownerTitle: 'Turn your property\ninto a source of income',
    ownerSubtitle:
      'Entrust us with your loft and enjoy turnkey management. Up to +40% rental income.',
    ownerB1: 'Complete hassle-free management',
    ownerB2: 'Professional showcasing',
    ownerB3: '24/7 guest service',
    ownerB4: 'Transparent and secure income',
    ownerCta: 'Estimate my income',
    ownerCtaSecondary: 'Call us',
    avgRevenue: 'Average monthly revenue by city',
    revenueUp: 'Average revenue increase',
    faq1Q: 'How do I book a loft?',
    faq1A: 'Browse our collection, choose your loft and book directly online. You can also contact us via WhatsApp.',
    faq2Q: 'What payment methods do you accept?',
    faq2A: 'We accept credit cards, bank transfers, and cash depending on loft conditions.',
    faq3Q: 'Can I cancel my reservation?',
    faq3A: 'Yes, most of our lofts offer free cancellation up to 48 hours before arrival.',
    faq4Q: 'Are the lofts verified?',
    faq4A: 'Absolutely. Every loft is inspected by our team and professionally photographed.',
    faq5Q: 'Do you offer long-stay rates?',
    faq5A: 'Yes, contact us for a personalized quote for stays of 7 nights or more.',
    faqTitle: 'Frequently asked questions',
    ctaTitle: 'Ready to experience\nAlgeria?',
    ctaSubtitle: 'Book your loft now and let yourself be seduced by the magic of Algeria.',
    ctaPrimary: 'Find my loft',
    newsletterTitle: 'Stay inspired',
    newsletterSubtitle: 'Receive our best addresses and exclusive offers every month.',
    newsletterPlaceholder: 'Your email',
    newsletterButton: 'Subscribe',
    newsletterPrivacy: 'No spam, unsubscribe anytime.',
    footerTagline: 'Premium loft rentals in Algeria — elegance, comfort, authenticity.',
    footerExplore: 'Explore',
    footerLofts: 'Our lofts',
    footerOwners: 'Become a partner',
    footerAbout: 'About',
    footerContact: 'Contact',
    footerClient: 'Client area',
    rights: 'All rights reserved',
  },
  ar: {
    heroEyebrow: 'شقق استثنائية — الجزائر · وهران · قسنطينة',
    heroTitle: 'مرحباً بكم في الجزائر،\nحيث كل إقامة\nهي قصة',
    heroSubtitle:
      'شقق مفعمة بالشخصية والضوء والدفء. احجز مباشرة وعش الضيافة الجزائرية كما لم يسبق لك.',
    heroCtaPrimary: 'استكشف شققنا',
    heroCtaSecondary: 'تحدث عبر واتساب',
    scroll: 'اكتشف',
    statsGuests: 'ضيوف استقبلناهم',
    statsLofts: 'شقق استثنائية',
    statsCities: 'مدن',
    statsRating: 'متوسط التقييم',
    collectionTitle: 'شقق\nتروي قصة',
    collectionSubtitle: 'كل فضاء تم اختياره لروحه وضوئه وأصالته.',
    perNight: '/ ليلة',
    view: 'عرض الشقة',
    viewAll: 'عرض كل الشقق',
    promiseTitle: 'وعدنا',
    promiseSubtitle: 'التميز في كل تفصيل، الدفء في كل استقبال.',
    feat1Title: 'اختيار دقيق',
    feat1Desc: 'نزور كل شقة شخصياً لنضمن جودة لا تشوبها شائبة.',
    feat2Title: 'استقبال دافئ',
    feat2Desc: 'تسجيل دخول مرن وفريق متاح 7/7 لإقامة هانئة.',
    feat3Title: 'ثقة كاملة',
    feat3Desc: 'دفع آمن، صور حقيقية، دعم مستمر. رضاك هو أولويتنا.',
    testimonial1:
      'إقامة لا تُنسى! كانت الشقة جميلة والفريق استقبلنا كأفراد العائلة.',
    testimonial1Author: 'سارة م.',
    testimonial1Role: 'باريس، فرنسا',
    testimonial2:
      'أنصح به بشدة. جودة الشقق والخدمة استثنائية. جوهرة حقيقية.',
    testimonial2Author: 'كريم ب.',
    testimonial2Role: 'بروكسل، بلجيكا',
    testimonial3:
      'أحببنا كل لحظة. الديكور والأجواء ولطف الفريق... مثالي!',
    testimonial3Author: 'أمين ولينا',
    testimonial3Role: 'ليون، فرنسا',
    testimonialsTitle: 'ماذا يقول مسافرونا',
    processTitle: 'إقامتك\nفي 3 خطوات',
    processStep1Title: 'اختر',
    processStep1Desc: 'تصفح مجموعتنا من الشقق الفريدة واعثر على ما يناسبك.',
    processStep2Title: 'احجز',
    processStep2Desc: 'احجز مباشرة، بدون عمولة. دفع آمن 100%.',
    processStep3Title: 'استمتع',
    processStep3Desc: 'احضر، استقر، ودع نفسك تنجرف مع التجربة.',
    galleryTitle: 'لمحة من\nملاذاتنا الهادئة',
    ownerEyebrow: 'هل أنت مالك؟',
    ownerTitle: 'حوّل عقارك\nإلى مصدر دخل',
    ownerSubtitle:
      'اعهد إلينا بشقتك واستمتع بإدارة جاهزة. حتى +40% دخل إيجاري.',
    ownerB1: 'إدارة كاملة بدون متاعب',
    ownerB2: 'تسويق احترافي',
    ownerB3: 'خدمة ضيوف 24/7',
    ownerB4: 'دخل شفاف وآمن',
    ownerCta: 'قدّر دخلي',
    ownerCtaSecondary: 'اتصل بنا',
    avgRevenue: 'متوسط الدخل الشهري حسب المدينة',
    revenueUp: 'متوسط زيادة الدخل',
    faq1Q: 'كيف أحجز شقة؟',
    faq1A: 'تصفح مجموعتنا، اختر شقتك واحجز مباشرة عبر الإنترنت. يمكنك أيضاً التواصل معنا عبر واتساب.',
    faq2Q: 'ما طرق الدفع المقبولة؟',
    faq2A: 'نقبل البطاقات البنكية والتحويلات والنقد حسب شروط الشقة.',
    faq3Q: 'هل يمكنني إلغاء حجزي؟',
    faq3A: 'نعم، معظم شققنا تقدم إلغاء مجاني حتى 48 ساعة قبل الوصول.',
    faq4Q: 'هل الشقق موثقة؟',
    faq4A: 'بالتأكيد. كل شقة يتم تفتيشها من فريقنا وتصويرها بشكل احترافي.',
    faq5Q: 'هل تقدمون أسعاراً للإقامات الطويلة؟',
    faq5A: 'نعم، تواصل معنا للحصول على عرض مخصص للإقامات 7 ليالٍ أو أكثر.',
    faqTitle: 'أسئلة شائعة',
    ctaTitle: 'مستعد لتجربة\nالجزائر؟',
    ctaSubtitle: 'احجز شقتك الآن ودع سحر الجزائر يأسرك.',
    ctaPrimary: 'اعثر على شقتي',
    newsletterTitle: 'ابقَ ملهمًا',
    newsletterSubtitle: 'استلم أفضل عناويننا وعروضنا الحصرية كل شهر.',
    newsletterPlaceholder: 'بريدك الإلكتروني',
    newsletterButton: 'اشترك',
    newsletterPrivacy: 'لا رسائل مزعجة، إلغاء الاشتراك في أي وقت.',
    footerTagline: 'تأجير شقق فاخرة في الجزائر — أناقة، راحة، أصالة.',
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

function SectionOverline({ children }: { children: string }) {
  return (
    <p
      className="mb-3 inline-block rounded-full border border-[#d4a853]/30 bg-[#d4a853]/10 px-4 py-1 text-xs uppercase tracking-[0.25em] text-[#d4a853]"
      style={{ fontFamily: "'Tajawal', sans-serif" }}
    >
      {children}
    </p>
  );
}

function DecorativeArch({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 40C0 17.9086 17.9086 0 40 0H80C102.091 0 120 17.9086 120 40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 4" opacity="0.4" />
    </svg>
  );
}

function GeometricPattern({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" opacity="0.08">
      <path d="M0 100L50 0L100 100L50 200Z" fill="currentColor" />
      <path d="M100 0L150 100L100 200L50 100Z" fill="currentColor" />
      <path d="M50 50L100 0L150 50L100 100Z" fill="currentColor" />
      <path d="M150 50L200 100L150 150L100 100Z" fill="currentColor" />
      <path d="M0 100L50 150L100 100L50 50Z" fill="currentColor" />
      <path d="M100 100L150 150L200 100L150 50Z" fill="currentColor" />
    </svg>
  );
}

function MosaicPattern({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" opacity="0.06">
      <path d="M0 50L25 25L50 50L25 75Z" fill="currentColor" />
      <path d="M50 50L75 25L100 50L75 75Z" fill="currentColor" />
      <path d="M25 25L50 0L75 25L50 50Z" fill="currentColor" />
      <path d="M25 75L50 50L75 75L50 100Z" fill="currentColor" />
    </svg>
  );
}

export default function LandingV6({ locale }: LandingV6Props) {
  const t = copy[locale as keyof typeof copy] || copy.fr;
  const isRtl = locale === 'ar';
  const [lofts, setLofts] = useState<Loft[]>(fallbackLofts);
  const [email, setEmail] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroImageY = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const heroOverlayOpacity = useTransform(scrollYProgress, [0, 1], [0.5, 0.8]);

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
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const heroLoft = lofts[0];
  const collection = useMemo(() => lofts.slice(0, 6), [lofts]);
  const galleryLofts = useMemo(() => lofts.slice(0, 5), [lofts]);

  const goToSearch = () => {
    window.location.href = `/${locale}/client/search`;
  };
  const goToPartner = () => {
    window.location.href = `/${locale}/register?role=partner`;
  };

  const stats = [
    { value: '2 500+', label: t.statsGuests, icon: Users },
    { value: '150+', label: t.statsLofts, icon: Star },
    { value: '12', label: t.statsCities, icon: MapPin },
    { value: '4,9', label: t.statsRating, icon: Heart },
  ];

  const features = [
    { icon: Search, title: t.feat1Title, desc: t.feat1Desc },
    { icon: Calendar, title: t.feat2Title, desc: t.feat2Desc },
    { icon: ShieldCheck, title: t.feat3Title, desc: t.feat3Desc },
  ];

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

  const revenues = [
    { city: 'Alger · Hydra', amount: '45 000 DA' },
    { city: 'Oran · Centre', amount: '38 000 DA' },
    { city: 'Constantine', amount: '28 000 DA' },
  ];

  const ownerBenefits = [t.ownerB1, t.ownerB2, t.ownerB3, t.ownerB4];

  const faqItems = [
    { q: t.faq1Q, a: t.faq1A },
    { q: t.faq2Q, a: t.faq2A },
    { q: t.faq3Q, a: t.faq3A },
    { q: t.faq4Q, a: t.faq4A },
    { q: t.faq5Q, a: t.faq5A },
  ];

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen w-full overflow-x-hidden bg-[#fdf8f2] text-[#2a1f14] antialiased"
      style={{ fontFamily: "'Tajawal', sans-serif" }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&display=swap"
        rel="stylesheet"
      />
      <PublicHeader locale={locale} text={{ login: t.footerClient }} />

      {/* ─── HERO ─── */}
      <section ref={heroRef} className="relative h-[95vh] min-h-[680px] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a3a5c]/90 via-[#c8513b]/60 to-[#c8513b]/90" />
        <MosaicPattern className="absolute right-0 top-0 h-full w-full text-[#e8d5b7]" />
        <motion.div style={{ y: heroImageY }} className="absolute inset-0 scale-110 mix-blend-overlay opacity-40">
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
          className="absolute inset-0 bg-gradient-to-t from-[#1a3a5c]/60 via-transparent to-transparent"
        />

        {/* Decorative top border */}
        <div className="absolute left-0 right-0 top-0 z-20 flex justify-center">
          <DecorativeArch className="h-10 w-48 text-[#d4a853] md:w-72" />
        </div>

        <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-end px-6 pb-24 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mb-5"
          >
            <span className="inline-block rounded-full border border-[#d4a853]/40 bg-[#d4a853]/15 px-5 py-1.5 text-xs uppercase tracking-[0.3em] text-[#d4a853] backdrop-blur-sm">
              {t.heroEyebrow}
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl whitespace-pre-line text-4xl font-bold leading-[1.1] text-white sm:text-6xl lg:text-7xl"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {t.heroTitle}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 max-w-xl text-base leading-relaxed text-[#e8d5b7] sm:text-lg"
          >
            {t.heroSubtitle}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <button
              onClick={goToSearch}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#d4a853] px-8 py-4 text-sm font-bold text-[#1a3a5c] transition-all duration-300 hover:bg-[#d4a853]/90 hover:shadow-lg hover:shadow-[#d4a853]/30"
            >
              {t.heroCtaPrimary}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </button>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#e8d5b7]/50 px-8 py-4 text-sm font-medium text-[#e8d5b7] backdrop-blur-sm transition-all duration-300 hover:bg-[#e8d5b7]/10"
            >
              <MessageCircle className="h-4 w-4" />
              {t.heroCtaSecondary}
            </a>
          </motion.div>
        </div>

        {/* Bottom decorative arch */}
        <div className="absolute -bottom-1 left-0 right-0 z-10">
          <svg viewBox="0 0 1440 60" fill="none" className="h-16 w-full">
            <path d="M0 60V30C240 0 480 15 720 30C960 45 1200 30 1440 30V60H0Z" fill="#fdf8f2" />
          </svg>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-24 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-white/50 md:flex"
        >
          <span className="text-xs uppercase tracking-[0.3em]">{t.scroll}</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        </motion.div>
      </section>

      {/* ─── STATS ─── */}
      <section className="relative overflow-hidden bg-[#fdf8f2]">
        <GeometricPattern className="absolute left-0 top-0 h-full w-full text-[#c8513b]" />
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-16 sm:px-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="group relative overflow-hidden rounded-2xl border border-[#e8d5b7] bg-white/80 p-6 text-center shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-[#c8513b]/10"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#c8513b]/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <Icon className="mx-auto mb-3 h-6 w-6 text-[#c8513b]" strokeWidth={1.5} />
                  <div
                    className="text-3xl font-bold tracking-tight text-[#1a3a5c] sm:text-4xl"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {s.value}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-[0.2em] text-[#c8513b]">
                    {s.label}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── FEATURED LOFTS ─── */}
      <section id="featured-lofts" className="relative mx-auto max-w-6xl px-6 py-24 sm:px-8">
        <DecorativeArch className="mx-auto mb-6 h-12 w-48 text-[#c8513b]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-14 text-center"
        >
          <h2
            className="whitespace-pre-line text-3xl font-bold leading-tight text-[#1a3a5c] sm:text-5xl"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {t.collectionTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[#c8513b]">
            {t.collectionSubtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {collection.slice(0, 6).map((loft, i) => (
            <motion.a
              key={loft.id}
              href={loft.id.startsWith('fallback') ? `/${locale}/client/search` : `/${locale}/client/lofts/${loft.id}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, delay: (i % 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="group block"
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl bg-[#e8d5b7] shadow-md transition-all duration-500 group-hover:shadow-xl group-hover:shadow-[#c8513b]/20">
                <div className="absolute inset-0 z-10 rounded-3xl ring-1 ring-[#d4a853]/20 ring-inset" />
                {loft.photo && (
                  <Image
                    src={loft.photo}
                    alt={loft.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a3a5c]/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              </div>
              <div className="mt-5 flex items-start justify-between gap-4">
                <div>
                  <h3
                    className="text-xl font-bold text-[#1a3a5c]"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {loft.name}
                  </h3>
                  {(loft.zone || loft.address) && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-[#c8513b]">
                      <MapPin className="h-3.5 w-3.5" />
                      {loft.zone || loft.address}
                    </p>
                  )}
                </div>
                <div className="text-right rtl:text-left">
                  <div className="text-lg font-bold text-[#d4a853]">{formatPrice(loft.price_per_night)} DA</div>
                  <div className="text-xs text-[#c8513b]/70">{t.perNight}</div>
                </div>
              </div>
            </motion.a>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-14 text-center"
        >
          <button
            onClick={goToSearch}
            className="group inline-flex items-center gap-2 rounded-full bg-[#1a3a5c] px-8 py-4 text-sm font-bold text-white transition-all duration-300 hover:bg-[#1a3a5c]/90 hover:shadow-lg hover:shadow-[#1a3a5c]/30"
          >
            {t.viewAll}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
          </button>
        </motion.div>
      </section>

      {/* ─── OUR PROMISE ─── */}
      <section className="relative overflow-hidden bg-[#1a3a5c]">
        <GeometricPattern className="absolute right-0 top-0 h-full w-full text-[#d4a853]" />
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-24 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-14 text-center"
          >
            <SectionOverline>{t.promiseTitle}</SectionOverline>
            <h2
              className="mt-4 whitespace-pre-line text-3xl font-bold leading-tight text-[#e8d5b7] sm:text-5xl"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {t.promiseSubtitle}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, delay: i * 0.12 }}
                  className="group relative overflow-hidden rounded-3xl border border-[#d4a853]/20 bg-[#1a3a5c]/80 p-8 backdrop-blur-sm transition-all duration-300 hover:border-[#d4a853]/40 hover:shadow-xl hover:shadow-[#d4a853]/10"
                >
                  <MosaicPattern className="absolute bottom-0 right-0 h-32 w-32 text-[#d4a853]" />
                  <div className="relative z-10">
                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d4a853]/15 text-[#d4a853] ring-1 ring-[#d4a853]/30">
                      <Icon className="h-6 w-6" strokeWidth={1.5} />
                    </div>
                    <h3
                      className="text-xl font-bold text-[#e8d5b7]"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      {f.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#e8d5b7]/70">
                      {f.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bottom wave */}
        <div className="relative z-10">
          <svg viewBox="0 0 1440 60" fill="none" className="h-16 w-full">
            <path d="M0 0V30C240 60 480 45 720 30C960 15 1200 30 1440 30V0H0Z" fill="#fdf8f2" />
          </svg>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="relative mx-auto max-w-6xl px-6 py-24 sm:px-8">
        <DecorativeArch className="mx-auto mb-6 h-12 w-48 text-[#c8513b]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-14 text-center"
        >
          <h2
            className="whitespace-pre-line text-3xl font-bold leading-tight text-[#1a3a5c] sm:text-5xl"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {t.testimonialsTitle}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((tm, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="group relative overflow-hidden rounded-3xl border border-[#e8d5b7] bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-[#c8513b]/10"
            >
              <Quote className="absolute right-6 top-6 h-10 w-10 text-[#e8d5b7]" strokeWidth={1} />
              <p className="relative z-10 text-sm leading-relaxed italic text-[#2a1f14]/80">
                &ldquo;{tm.quote}&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3 border-t border-[#e8d5b7]/50 pt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c8513b] text-sm font-bold text-white">
                  {tm.author.charAt(0)}
                </div>
                <div>
                  <div
                    className="text-sm font-bold text-[#1a3a5c]"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {tm.author}
                  </div>
                  <div className="text-xs text-[#c8513b]/70">{tm.role}</div>
                </div>
              </div>
              <div className="mt-3 flex gap-1">
                {[...Array(5)].map((_, s) => (
                  <Star key={s} className="h-3.5 w-3.5 fill-[#d4a853] text-[#d4a853]" strokeWidth={0} />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="relative overflow-hidden bg-[#fdf8f2]">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:px-8">
          <DecorativeArch className="mx-auto mb-6 h-12 w-48 text-[#c8513b]" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-14 text-center"
          >
            <h2
              className="whitespace-pre-line text-3xl font-bold leading-tight text-[#1a3a5c] sm:text-5xl"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {t.processTitle}
            </h2>
          </motion.div>

          <div className="relative grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Connecting line */}
            <div className="absolute left-1/2 top-16 hidden h-px w-2/3 -translate-x-1/2 md:block" style={{ background: 'linear-gradient(90deg, #c8513b20, #d4a853, #c8513b20)' }} />

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
                  <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
                    <div className="absolute inset-0 rotate-45 rounded-2xl border-2 border-[#d4a853]/30 bg-[#d4a853]/10" />
                    <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#c8513b] text-xs font-bold text-white shadow-md">
                      {i + 1}
                    </div>
                    <Icon className="relative h-7 w-7 text-[#c8513b]" strokeWidth={1.5} />
                  </div>
                  <h3
                    className="mb-3 text-xl font-bold text-[#1a3a5c]"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {step.title}
                  </h3>
                  <p className="mx-auto max-w-xs text-sm leading-relaxed text-[#c8513b]/80">
                    {step.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── GALLERY ─── */}
      <section className="relative mx-auto max-w-6xl px-6 py-24 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-14 text-center"
        >
          <SectionOverline>{t.galleryTitle.split('\n')[0]}</SectionOverline>
          <h2
            className="mt-4 whitespace-pre-line text-3xl font-bold leading-tight text-[#1a3a5c] sm:text-5xl"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {t.galleryTitle}
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {galleryLofts.slice(0, 5).map((loft, i) => (
            <motion.div
              key={loft.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className={`group relative cursor-pointer overflow-hidden rounded-3xl bg-[#e8d5b7] shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-[#c8513b]/20 ${
                i === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-[4/3]'
              }`}
            >
              <div className="absolute inset-0 z-10 rounded-3xl ring-1 ring-[#d4a853]/20 ring-inset" />
              {loft.photo && (
                <Image
                  src={loft.photo}
                  alt={loft.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a3a5c]/70 via-transparent to-transparent opacity-0 transition-all duration-500 group-hover:opacity-100" />
              <div className="absolute bottom-0 left-0 right-0 p-5 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                <p
                  className="text-lg font-bold text-white"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {loft.name}
                </p>
                <p className="text-sm text-[#e8d5b7]/90">{loft.zone}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── OWNER SECTION ─── */}
      <section className="relative overflow-hidden bg-[#1a3a5c]">
        <MosaicPattern className="absolute left-0 top-0 h-full w-full text-[#d4a853]" />
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-24 sm:px-8">
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7 }}
            >
              <SectionOverline>{t.ownerEyebrow}</SectionOverline>
              <h2
                className="mt-4 whitespace-pre-line text-3xl font-bold leading-tight text-[#e8d5b7] sm:text-5xl"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {t.ownerTitle}
              </h2>
              <p className="mt-5 max-w-md text-[#e8d5b7]/70">
                {t.ownerSubtitle}
              </p>
              <ul className="mt-8 space-y-4">
                {ownerBenefits.map((b, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#d4a853]" strokeWidth={1.5} />
                    <span className="text-[#e8d5b7]/90">{b}</span>
                  </motion.li>
                ))}
              </ul>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={goToPartner}
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#d4a853] px-8 py-4 text-sm font-bold text-[#1a3a5c] transition-all duration-300 hover:bg-[#d4a853]/90 hover:shadow-lg hover:shadow-[#d4a853]/30"
                >
                  {t.ownerCta}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                </button>
                <a
                  href={PHONE_LINK}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d4a853]/40 px-8 py-4 text-sm font-medium text-[#e8d5b7] transition-all duration-300 hover:bg-[#d4a853]/10"
                >
                  <Phone className="h-4 w-4" />
                  {t.ownerCtaSecondary}
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="relative overflow-hidden rounded-3xl border border-[#d4a853]/20 bg-[#1a3a5c]/80 p-9 backdrop-blur-sm"
            >
              <div className="flex items-center gap-2 text-[#d4a853]">
                <TrendingUp className="h-5 w-5" strokeWidth={1.5} />
                <span className="text-sm">{t.avgRevenue}</span>
              </div>
              <div className="mt-7 space-y-5">
                {revenues.map((r, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-[#d4a853]/20 pb-4 last:border-0">
                    <span className="text-[#e8d5b7]/80">{r.city}</span>
                    <span
                      className="text-xl font-bold text-[#d4a853]"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      {r.amount}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-7 rounded-2xl bg-gradient-to-br from-[#d4a853] to-[#c8513b] p-6 text-center shadow-lg">
                <div
                  className="text-4xl font-bold text-white"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  +40%
                </div>
                <div className="mt-1 text-sm text-white/80">{t.revenueUp}</div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="relative z-10">
          <svg viewBox="0 0 1440 60" fill="none" className="h-16 w-full">
            <path d="M0 0V30C240 60 480 45 720 30C960 15 1200 30 1440 30V0H0Z" fill="#fdf8f2" />
          </svg>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="relative mx-auto max-w-3xl px-6 py-24 sm:px-8">
        <DecorativeArch className="mx-auto mb-6 h-12 w-48 text-[#c8513b]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-14 text-center"
        >
          <h2
            className="text-3xl font-bold leading-tight text-[#1a3a5c] sm:text-5xl"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {t.faqTitle}
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="overflow-hidden rounded-2xl border border-[#e8d5b7] bg-white shadow-sm transition-all duration-300"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between px-6 py-5 text-left transition-colors hover:bg-[#fdf8f2]"
              >
                <span className="text-sm font-bold text-[#1a3a5c] sm:text-base">{item.q}</span>
                <ChevronDown
                  className={`h-4 w-4 flex-shrink-0 text-[#c8513b] transition-transform duration-300 ${
                    openFaq === i ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-[#e8d5b7]/50 px-6 pb-5 pt-4">
                      <p className="text-sm leading-relaxed text-[#c8513b]/80">{item.a}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── CTA + NEWSLETTER ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#c8513b] via-[#c8513b] to-[#1a3a5c]">
        <GeometricPattern className="absolute left-0 top-0 h-full w-full text-[#e8d5b7]" />
        <div className="relative z-10 mx-auto max-w-3xl px-6 py-28 text-center sm:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="whitespace-pre-line text-3xl font-bold leading-tight text-white sm:text-5xl"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {t.ctaTitle}
          </motion.h2>
          <p className="mx-auto mt-5 max-w-xl text-[#e8d5b7]">
            {t.ctaSubtitle}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={goToSearch}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#d4a853] px-8 py-4 text-sm font-bold text-[#1a3a5c] transition-all duration-300 hover:bg-[#d4a853]/90 hover:shadow-lg hover:shadow-[#d4a853]/40"
            >
              {t.ctaPrimary}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </button>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#e8d5b7]/40 px-8 py-4 text-sm font-medium text-[#e8d5b7] transition-all duration-300 hover:bg-[#e8d5b7]/10"
            >
              <MessageCircle className="h-4 w-4" />
              {t.heroCtaSecondary}
            </a>
          </div>

          {/* Newsletter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mx-auto mt-20 max-w-xl"
          >
            <div className="rounded-3xl border border-white/20 bg-white/10 p-8 backdrop-blur-md">
              <MessageCircle className="mx-auto mb-4 h-8 w-8 text-[#d4a853]" strokeWidth={1.5} />
              <h3 className="text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                {t.newsletterTitle}
              </h3>
              <p className="mt-2 text-sm text-[#e8d5b7]/80">
                {t.newsletterSubtitle}
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.newsletterPlaceholder}
                  className="flex-1 rounded-full border border-white/20 bg-white/10 px-6 py-3.5 text-sm text-white outline-none placeholder:text-white/40 backdrop-blur-sm transition-all focus:border-[#d4a853]/60"
                  style={{ fontFamily: "'Tajawal', sans-serif" }}
                />
                <button className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#d4a853] px-8 py-3.5 text-sm font-bold text-[#1a3a5c] transition-all duration-300 hover:bg-[#d4a853]/90">
                  <Send className="h-4 w-4" />
                  {t.newsletterButton}
                </button>
              </div>
              <p className="mt-4 text-xs text-white/40">
                {t.newsletterPrivacy}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Bottom wave */}
        <div className="relative z-10">
          <svg viewBox="0 0 1440 60" fill="none" className="h-16 w-full">
            <path d="M0 0V30C240 60 480 45 720 30C960 15 1200 30 1440 30V0H0Z" fill="#fdf8f2" />
          </svg>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[#fdf8f2] text-[#2a1f14]">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:px-8">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            <div>
              <div
                className="text-2xl font-bold text-[#1a3a5c]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Loft Algérie
              </div>
              <p className="mt-3 max-w-xs text-sm text-[#c8513b]/70">
                {t.footerTagline}
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-sm">
                <div className="flex">
                  {[...Array(5)].map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-[#d4a853] text-[#d4a853]" strokeWidth={0} />
                  ))}
                </div>
                <span className="font-bold text-[#1a3a5c]">4,9</span>
                <span className="text-[#c8513b]/50">/ 5</span>
              </div>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] text-[#c8513b]">{t.footerExplore}</h4>
              <ul className="mt-5 space-y-3 text-sm">
                <li>
                  <a href={`/${locale}/client/search`} className="text-[#1a3a5c]/70 transition-colors hover:text-[#c8513b]">{t.footerLofts}</a>
                </li>
                <li>
                  <a href={`/${locale}/register?role=partner`} className="text-[#1a3a5c]/70 transition-colors hover:text-[#c8513b]">{t.footerOwners}</a>
                </li>
                <li>
                  <a href={`/${locale}/public/about`} className="text-[#1a3a5c]/70 transition-colors hover:text-[#c8513b]">{t.footerAbout}</a>
                </li>
                <li>
                  <a href={`/${locale}/login`} className="text-[#1a3a5c]/70 transition-colors hover:text-[#c8513b]">{t.footerClient}</a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] text-[#c8513b]">{t.footerContact}</h4>
              <ul className="mt-5 space-y-3 text-sm">
                <li>
                  <a href={PHONE_LINK} className="flex items-center gap-2 text-[#1a3a5c]/70 transition-colors hover:text-[#c8513b]">
                    <Phone className="h-4 w-4" />
                    <span dir="ltr">{PHONE_DISPLAY}</span>
                  </a>
                </li>
                <li>
                  <a href={`mailto:${EMAIL}`} className="flex items-center gap-2 text-[#1a3a5c]/70 transition-colors hover:text-[#c8513b]">
                    <Mail className="h-4 w-4" />
                    {EMAIL}
                  </a>
                </li>
                <li>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#1a3a5c]/70 transition-colors hover:text-[#c8513b]">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-[#e8d5b7] pt-8 text-sm text-[#c8513b]/60 sm:flex-row">
            <span>&copy; {new Date().getFullYear()} Loft Algérie — {t.rights}</span>
            <span className="flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5 text-[#c8513b]" /> Made with love in Algeria
            </span>
          </div>
        </div>
      </footer>

      <BackToTop />
    </div>
  );
}
