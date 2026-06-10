'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Sparkles,
  KeyRound,
  LineChart,
  Star,
} from 'lucide-react';
import PublicHeader from '@/components/public/PublicHeader';
import BackToTop from '@/components/ui/BackToTop';
import SmoothScroll from '@/components/ui/SmoothScroll';

interface LandingPremiumProps {
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

// Fallback hero/lofts (used only until the Supabase API responds)
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
    heroEyebrow: 'Lofts d\u2019exception \u2014 Alger \u00b7 Oran \u00b7 Constantine',
    heroTitle: 'L\u2019art de s\u00e9journer en Alg\u00e9rie',
    heroSubtitle:
      'Une collection de lofts choisis pour leur caract\u00e8re, leur lumi\u00e8re et leur emplacement. R\u00e9servation directe, accueil soign\u00e9, exp\u00e9rience irr\u00e9prochable.',
    heroCtaPrimary: 'D\u00e9couvrir la collection',
    heroCtaSecondary: 'Parler \u00e0 un conseiller',
    scroll: 'D\u00e9couvrir',
    statsGuests: 'Voyageurs accueillis',
    statsLofts: 'Lofts d\u2019exception',
    statsCities: 'Villes',
    statsRating: 'Note moyenne',
    collectionEyebrow: 'La collection',
    collectionTitle: 'Des adresses qui ont une \u00e2me',
    collectionSubtitle:
      'Chaque loft est inspect\u00e9, photographi\u00e9 et entretenu avec le m\u00eame niveau d\u2019exigence.',
    perNight: '/ nuit',
    view: 'Voir le loft',
    viewAll: 'Voir tous les lofts',
    promiseEyebrow: 'Notre promesse',
    promiseTitle: 'Le confort d\u2019un h\u00f4tel, l\u2019\u00e2me d\u2019un chez-soi',
    feat1Title: 'S\u00e9lection exigeante',
    feat1Desc:
      'Moins de lofts, mieux choisis. Nous ne r\u00e9f\u00e9ren\u00e7ons que des biens qui nous s\u00e9duisent vraiment.',
    feat2Title: 'Arriv\u00e9e sans friction',
    feat2Desc:
      'Check-in flexible, instructions claires, \u00e9quipe joignable \u00e0 toute heure pour un s\u00e9jour serein.',
    feat3Title: 'Confiance & s\u00e9curit\u00e9',
    feat3Desc:
      'Paiement s\u00e9curis\u00e9, lofts v\u00e9rifi\u00e9s, photos r\u00e9elles. Ce que vous voyez est ce que vous vivez.',
    ownerEyebrow: 'Propri\u00e9taires',
    ownerTitle: 'Valorisez votre bien, sans les contraintes',
    ownerSubtitle:
      'Confiez-nous la gestion de votre loft et augmentez vos revenus locatifs jusqu\u2019\u00e0 40%, en toute s\u00e9r\u00e9nit\u00e9.',
    ownerB1: 'Gestion compl\u00e8te et transparente',
    ownerB2: 'Photographie et mise en valeur professionnelle',
    ownerB3: 'Service voyageurs disponible en continu',
    ownerB4: 'Revenus s\u00e9curis\u00e9s, sans frais cach\u00e9s',
    ownerCta: 'Estimer mes revenus',
    ownerCtaSecondary: 'Nous appeler',
    avgRevenue: 'Revenu mensuel moyen',
    revenueUp: 'Hausse moyenne des revenus',
    ctaTitle: 'Votre prochain s\u00e9jour commence ici',
    ctaSubtitle:
      'Dites-nous o\u00f9 et quand. Nous nous occupons du reste.',
    ctaPrimary: 'Explorer les lofts',
    ctaSecondary: 'WhatsApp',
    footerTagline: 'Locations de lofts haut de gamme en Alg\u00e9rie',
    footerExplore: 'Explorer',
    footerLofts: 'Nos lofts',
    footerOwners: 'Devenir partenaire',
    footerAbout: '\u00c0 propos',
    footerContact: 'Contact',
    footerClient: 'Espace client',
    rights: 'Tous droits r\u00e9serv\u00e9s',
  },
  en: {
    heroEyebrow: 'Exceptional lofts \u2014 Algiers \u00b7 Oran \u00b7 Constantine',
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
    ownerEyebrow: 'Owners',
    ownerTitle: 'Grow your property\u2019s value, without the hassle',
    ownerSubtitle:
      'Entrust us with your loft and increase your rental income by up to 40%, with complete peace of mind.',
    ownerB1: 'Complete, transparent management',
    ownerB2: 'Professional photography and styling',
    ownerB3: 'Round-the-clock guest service',
    ownerB4: 'Secured income, no hidden fees',
    ownerCta: 'Estimate my income',
    ownerCtaSecondary: 'Call us',
    avgRevenue: 'Average monthly revenue',
    revenueUp: 'Average revenue increase',
    ctaTitle: 'Your next stay begins here',
    ctaSubtitle: 'Tell us where and when. We take care of the rest.',
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
    heroEyebrow: '\u0634\u0642\u0642 \u0627\u0633\u062a\u062b\u0646\u0627\u0626\u064a\u0629 \u2014 \u0627\u0644\u062c\u0632\u0627\u0626\u0631 \u00b7 \u0648\u0647\u0631\u0627\u0646 \u00b7 \u0642\u0633\u0646\u0637\u064a\u0646\u0629',
    heroTitle: '\u0641\u0646 \u0627\u0644\u0625\u0642\u0627\u0645\u0629 \u0641\u064a \u0627\u0644\u062c\u0632\u0627\u0626\u0631',
    heroSubtitle:
      '\u0645\u062c\u0645\u0648\u0639\u0629 \u0645\u0646 \u0627\u0644\u0634\u0642\u0642 \u0627\u0644\u0645\u062e\u062a\u0627\u0631\u0629 \u0628\u0639\u0646\u0627\u064a\u0629 \u0644\u0637\u0627\u0628\u0639\u0647\u0627 \u0648\u0625\u0636\u0627\u0621\u062a\u0647\u0627 \u0648\u0645\u0648\u0642\u0639\u0647\u0627. \u062d\u062c\u0632 \u0645\u0628\u0627\u0634\u0631 \u0648\u0627\u0633\u062a\u0642\u0628\u0627\u0644 \u0631\u0627\u0642\u064d \u0648\u062a\u062c\u0631\u0628\u0629 \u0644\u0627 \u062a\u0634\u0648\u0628\u0647\u0627 \u0634\u0627\u0626\u0628\u0629.',
    heroCtaPrimary: '\u0627\u0643\u062a\u0634\u0641 \u0627\u0644\u0645\u062c\u0645\u0648\u0639\u0629',
    heroCtaSecondary: '\u062a\u062d\u062f\u0651\u062b \u0625\u0644\u0649 \u0645\u0633\u062a\u0634\u0627\u0631',
    scroll: '\u0627\u0643\u062a\u0634\u0641',
    statsGuests: '\u0636\u064a\u0648\u0641 \u0627\u0633\u062a\u0642\u0628\u0644\u0646\u0627\u0647\u0645',
    statsLofts: '\u0634\u0642\u0642 \u0627\u0633\u062a\u062b\u0646\u0627\u0626\u064a\u0629',
    statsCities: '\u0645\u062f\u0646',
    statsRating: '\u0645\u062a\u0648\u0633\u0637 \u0627\u0644\u062a\u0642\u064a\u064a\u0645',
    collectionEyebrow: '\u0627\u0644\u0645\u062c\u0645\u0648\u0639\u0629',
    collectionTitle: '\u0639\u0646\u0627\u0648\u064a\u0646 \u0644\u0647\u0627 \u0631\u0648\u062d',
    collectionSubtitle:
      '\u064a\u062a\u0645 \u0641\u062d\u0635 \u0643\u0644 \u0634\u0642\u0629 \u0648\u062a\u0635\u0648\u064a\u0631\u0647\u0627 \u0648\u0635\u064a\u0627\u0646\u062a\u0647\u0627 \u0628\u0646\u0641\u0633 \u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u062f\u0642\u0629.',
    perNight: '/ \u0644\u064a\u0644\u0629',
    view: '\u0639\u0631\u0636 \u0627\u0644\u0634\u0642\u0629',
    viewAll: '\u0639\u0631\u0636 \u0643\u0644 \u0627\u0644\u0634\u0642\u0642',
    promiseEyebrow: '\u0648\u0639\u062f\u0646\u0627',
    promiseTitle: '\u0631\u0627\u062d\u0629 \u0627\u0644\u0641\u0646\u062f\u0642 \u0648\u0631\u0648\u062d \u0627\u0644\u0645\u0646\u0632\u0644',
    feat1Title: '\u0627\u062e\u062a\u064a\u0627\u0631 \u062f\u0642\u064a\u0642',
    feat1Desc:
      '\u0634\u0642\u0642 \u0623\u0642\u0644 \u0648\u0644\u0643\u0646 \u0623\u0641\u0636\u0644. \u0644\u0627 \u0646\u062f\u0631\u062c \u0625\u0644\u0627 \u0645\u0627 \u064a\u0639\u062c\u0628\u0646\u0627 \u062d\u0642\u0627\u064b.',
    feat2Title: '\u0648\u0635\u0648\u0644 \u0633\u0644\u0633',
    feat2Desc:
      '\u062a\u0633\u062c\u064a\u0644 \u062f\u062e\u0648\u0644 \u0645\u0631\u0646 \u0648\u062a\u0639\u0644\u064a\u0645\u0627\u062a \u0648\u0627\u0636\u062d\u0629 \u0648\u0641\u0631\u064a\u0642 \u0645\u062a\u0627\u062d \u0641\u064a \u0623\u064a \u0648\u0642\u062a.',
    feat3Title: '\u062b\u0642\u0629 \u0648\u0623\u0645\u0627\u0646',
    feat3Desc:
      '\u062f\u0641\u0639 \u0622\u0645\u0646 \u0648\u0634\u0642\u0642 \u0645\u0648\u062b\u0651\u0642\u0629 \u0648\u0635\u0648\u0631 \u062d\u0642\u064a\u0642\u064a\u0629. \u0645\u0627 \u062a\u0631\u0627\u0647 \u0647\u0648 \u0645\u0627 \u062a\u0639\u064a\u0634\u0647.',
    ownerEyebrow: '\u0627\u0644\u0645\u0627\u0644\u0643\u0648\u0646',
    ownerTitle: '\u0627\u0631\u0641\u0639 \u0642\u064a\u0645\u0629 \u0639\u0642\u0627\u0631\u0643 \u062f\u0648\u0646 \u0639\u0646\u0627\u0621',
    ownerSubtitle:
      '\u0627\u0639\u0647\u062f \u0625\u0644\u064a\u0646\u0627 \u0628\u0625\u062f\u0627\u0631\u0629 \u0634\u0642\u062a\u0643 \u0648\u0627\u0631\u0641\u0639 \u062f\u062e\u0644\u0643 \u0627\u0644\u0625\u064a\u062c\u0627\u0631\u064a \u062d\u062a\u0649 40% \u0628\u0643\u0644 \u0627\u0637\u0645\u0626\u0646\u0627\u0646.',
    ownerB1: '\u0625\u062f\u0627\u0631\u0629 \u0643\u0627\u0645\u0644\u0629 \u0648\u0634\u0641\u0627\u0641\u0629',
    ownerB2: '\u062a\u0635\u0648\u064a\u0631 \u0627\u062d\u062a\u0631\u0627\u0641\u064a',
    ownerB3: '\u062e\u062f\u0645\u0629 \u0636\u064a\u0648\u0641 \u0639\u0644\u0649 \u0645\u062f\u0627\u0631 \u0627\u0644\u0633\u0627\u0639\u0629',
    ownerB4: '\u062f\u062e\u0644 \u0645\u0636\u0645\u0648\u0646 \u062f\u0648\u0646 \u0631\u0633\u0648\u0645 \u062e\u0641\u064a\u0629',
    ownerCta: '\u0642\u062f\u0651\u0631 \u062f\u062e\u0644\u064a',
    ownerCtaSecondary: '\u0627\u062a\u0635\u0644 \u0628\u0646\u0627',
    avgRevenue: '\u0645\u062a\u0648\u0633\u0637 \u0627\u0644\u062f\u062e\u0644 \u0627\u0644\u0634\u0647\u0631\u064a',
    revenueUp: '\u0645\u062a\u0648\u0633\u0637 \u0632\u064a\u0627\u062f\u0629 \u0627\u0644\u062f\u062e\u0644',
    ctaTitle: '\u0625\u0642\u0627\u0645\u062a\u0643 \u0627\u0644\u0642\u0627\u062f\u0645\u0629 \u062a\u0628\u062f\u0623 \u0647\u0646\u0627',
    ctaSubtitle: '\u0623\u062e\u0628\u0631\u0646\u0627 \u0623\u064a\u0646 \u0648\u0645\u062a\u0649. \u0646\u062d\u0646 \u0646\u062a\u0648\u0644\u0651\u0649 \u0627\u0644\u0628\u0627\u0642\u064a.',
    ctaPrimary: '\u062a\u0635\u0641\u062d \u0627\u0644\u0634\u0642\u0642',
    ctaSecondary: '\u0648\u0627\u062a\u0633\u0627\u0628',
    footerTagline: '\u062a\u0623\u062c\u064a\u0631 \u0634\u0642\u0642 \u0641\u0627\u062e\u0631\u0629 \u0641\u064a \u0627\u0644\u062c\u0632\u0627\u0626\u0631',
    footerExplore: '\u0627\u0633\u062a\u0643\u0634\u0641',
    footerLofts: '\u0634\u0642\u0642\u0646\u0627',
    footerOwners: '\u0643\u0646 \u0634\u0631\u064a\u0643\u0627\u064b',
    footerAbout: '\u062d\u0648\u0644\u0646\u0627',
    footerContact: '\u0627\u062a\u0635\u0627\u0644',
    footerClient: '\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0639\u0645\u064a\u0644',
    rights: '\u062c\u0645\u064a\u0639 \u0627\u0644\u062d\u0642\u0648\u0642 \u0645\u062d\u0641\u0648\u0638\u0629',
  },
} as const;

function formatPrice(value?: number) {
  return (value || 0).toLocaleString('fr-FR');
}

export default function LandingPremium({ locale }: LandingPremiumProps) {
  const t = copy[locale as keyof typeof copy] || copy.fr;
  const isRtl = locale === 'ar';
  const [lofts, setLofts] = useState<Loft[]>(fallbackLofts);
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
    { city: 'Alger \u00b7 Hydra', amount: '45 000 DA' },
    { city: 'Oran \u00b7 Centre', amount: '38 000 DA' },
    { city: 'Constantine', amount: '28 000 DA' },
  ];

  const ownerBenefits = [t.ownerB1, t.ownerB2, t.ownerB3, t.ownerB4];

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
      <SmoothScroll />
      <PublicHeader locale={locale} text={{ login: t.footerClient }} />

      {/* HERO */}
      <section ref={heroRef} className="relative h-[92vh] min-h-[620px] w-full overflow-hidden">
        <motion.div style={{ y: heroImageY }} className="absolute inset-0 scale-110">
          {heroLoft?.photo && (
            <Image
              src={heroLoft.photo}
              alt={heroLoft.name || 'Loft Alg\u00e9rie'}
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
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-medium text-neutral-900 transition-all duration-300 hover:bg-white/90"
            >
              {t.heroCtaPrimary}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </button>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 px-7 py-3.5 text-sm font-medium text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/10"
            >
              <Phone className="h-4 w-4" />
              {t.heroCtaSecondary}
            </a>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
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
              <div className="text-4xl font-medium tracking-tight sm:text-5xl">{s.value}</div>
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

      {/* COLLECTION */}
      <section id="featured-lofts" className="mx-auto max-w-6xl px-6 py-24 sm:px-8">
        <div className="mb-14 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p
              className="mb-3 text-xs uppercase tracking-[0.3em] text-neutral-500 dark:text-neutral-400"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {t.collectionEyebrow}
            </p>
            <h2 className="max-w-xl text-3xl font-medium leading-tight sm:text-5xl">
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
            <motion.a
              key={loft.id}
              href={loft.id.startsWith('fallback') ? `/${locale}/client/search` : `/${locale}/client/lofts/${loft.id}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, delay: (i % 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="group block"
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
                  <h3 className="text-xl font-medium">{loft.name}</h3>
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
                  <div className="text-base font-semibold">{formatPrice(loft.price_per_night)} DA</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">{t.perNight}</div>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </section>

      {/* PROMISE */}
      <section className="bg-neutral-900 text-white dark:bg-black">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:px-8">
          <div className="mb-16 max-w-2xl">
            <p
              className="mb-3 text-xs uppercase tracking-[0.3em] text-white/50"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {t.promiseEyebrow}
            </p>
            <h2 className="text-3xl font-medium leading-tight sm:text-5xl">{t.promiseTitle}</h2>
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
                  <h3 className="mt-6 text-xl font-medium">{f.title}</h3>
                  <p
                    className="mt-3 text-sm leading-relaxed text-white/60"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {f.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* OWNERS */}
      <section className="mx-auto max-w-6xl px-6 py-24 sm:px-8">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7 }}
          >
            <p
              className="mb-3 text-xs uppercase tracking-[0.3em] text-neutral-500 dark:text-neutral-400"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {t.ownerEyebrow}
            </p>
            <h2 className="max-w-md text-3xl font-medium leading-tight sm:text-5xl">{t.ownerTitle}</h2>
            <p
              className="mt-5 max-w-md text-neutral-600 dark:text-neutral-400"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {t.ownerSubtitle}
            </p>
            <ul className="mt-8 space-y-4" style={{ fontFamily: "'Inter', sans-serif" }}>
              {ownerBenefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-neutral-900 dark:border-neutral-100">
                    <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6.5L5 9L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="text-neutral-700 dark:text-neutral-300">{b}</span>
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row" style={{ fontFamily: "'Inter', sans-serif" }}>
              <button
                onClick={goToPartner}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-neutral-900 px-7 py-3.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-white/90"
              >
                {t.ownerCta}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
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

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="rounded-3xl border border-neutral-200 bg-white p-9 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400" style={{ fontFamily: "'Inter', sans-serif" }}>
              <LineChart className="h-5 w-5" strokeWidth={1.5} />
              <span className="text-sm">{t.avgRevenue}</span>
            </div>
            <div className="mt-7 space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
              {revenues.map((r, i) => (
                <div key={i} className="flex items-center justify-between border-b border-neutral-100 pb-4 last:border-0 dark:border-neutral-800">
                  <span className="text-neutral-600 dark:text-neutral-300">{r.city}</span>
                  <span className="text-xl font-semibold">{r.amount}</span>
                </div>
              ))}
            </div>
            <div className="mt-7 rounded-2xl bg-neutral-900 p-6 text-center text-white dark:bg-black">
              <div className="text-4xl font-medium">+40%</div>
              <div className="mt-1 text-sm text-white/60" style={{ fontFamily: "'Inter', sans-serif" }}>
                {t.revenueUp}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CLOSING CTA */}
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
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-medium text-neutral-900 transition-all hover:bg-white/90"
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

      {/* FOOTER */}
      <footer className="bg-[#faf9f7] text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:px-8" style={{ fontFamily: "'Inter', sans-serif" }}>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            <div>
              <div className="text-2xl font-medium" style={{ fontFamily: "'Fraunces', serif" }}>
                Loft Alg\u00e9rie
              </div>
              <p className="mt-3 max-w-xs text-sm text-neutral-500 dark:text-neutral-400">{t.footerTagline}</p>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] text-neutral-400">{t.footerExplore}</h4>
              <ul className="mt-5 space-y-3 text-sm">
                <li><a href="#featured-lofts" className="text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">{t.footerLofts}</a></li>
                <li><a href={`/${locale}/register?role=partner`} className="text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">{t.footerOwners}</a></li>
                <li><a href={`/${locale}/public/about`} className="text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">{t.footerAbout}</a></li>
                <li><a href={`/${locale}/login`} className="text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">{t.footerClient}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] text-neutral-400">{t.footerContact}</h4>
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
              </ul>
            </div>
          </div>
          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-neutral-200 pt-8 text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400 sm:flex-row">
            <span>&copy; {new Date().getFullYear()} Loft Alg\u00e9rie \u2014 {t.rights}</span>
            <span className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 fill-current" /> 4,9 / 5
            </span>
          </div>
        </div>
      </footer>

      <BackToTop />
    </div>
  );
}
