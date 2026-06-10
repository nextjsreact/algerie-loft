'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import PublicHeader from '@/components/public/PublicHeader';
import BackToTop from '@/components/ui/BackToTop';

interface LandingV7Props {
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
    photo: 'https://mhngbluefyucoesgcjoy.supabase.co/storage/v1/object/public/loft-photos/lofts/c4931c00-1792-492d-9101-4bc583484749/e43a66e0-1929-4bd1-8df8-ddf676cf70f8.jpeg',
  },
  {
    id: 'fallback-2',
    name: 'Swan Loft',
    zone: 'El Mouradia, Alger',
    price_per_night: 9000,
    photo: 'https://mhngbluefyucoesgcjoy.supabase.co/storage/v1/object/public/loft-photos/lofts/b305b744-5ae6-40ed-bf91-00a848a4b1bc/e4defb1a-3b52-4128-b6d5-f3155766b913.jpeg',
  },
  {
    id: 'fallback-3',
    name: 'Dary Loft',
    zone: 'Hussein Dey, Alger',
    price_per_night: 9000,
    photo: 'https://mhngbluefyucoesgcjoy.supabase.co/storage/v1/object/public/loft-photos/lofts/bcbf0c9f-a179-49e3-be64-f61339de4c8c/f0ec4489-a4fb-4a0a-9113-8ff8bdf6f643.jpg',
  },
  {
    id: 'fallback-4',
    name: 'Choco Loft',
    zone: 'Alger Centre',
    price_per_night: 10000,
    photo: 'https://mhngbluefyucoesgcjoy.supabase.co/storage/v1/object/public/loft-photos/lofts/0d79d0fd-41e5-4206-97d1-cb217279c7e8/ea5bfb99-18a6-47f5-8534-4b74a14cb896.jpg',
  },
  {
    id: 'fallback-5',
    name: 'Dounia Loft',
    zone: 'Hussein Dey, Alger',
    price_per_night: 9000,
    photo: 'https://mhngbluefyucoesgcjoy.supabase.co/storage/v1/object/public/loft-photos/lofts/9be87001-9977-4f1b-8bf5-e183f9ee8d27/c5ebd720-8dc8-42d6-b6b1-88de54a6f4e4.jpg',
  },
  {
    id: 'fallback-6',
    name: 'Talia Loft',
    zone: 'Alger Centre',
    price_per_night: 9000,
    photo: 'https://mhngbluefyucoesgcjoy.supabase.co/storage/v1/object/public/loft-photos/lofts/c8f109bc-86c2-4aa5-a472-d155b3085c15/6ba33f2e-2fb0-4503-991a-857916aca347.jpg',
  },
];

const copy = {
  fr: {
    heroTitle: 'Algérie',
    heroTagline: 'L\'art de l\'ailleurs',
    heroCta: 'Explorer les lofts',
    statsGuests: 'Voyageurs',
    statsLofts: 'Lofts',
    statsCities: 'Villes',
    statsRating: 'Note',
    featuredTitle: 'Séjourner',
    perNight: '/nuit',
    promiseTitle: 'Curated.',
    promiseSub: 'Chaque loft est choisi pour son âme. Pas pour remplir un catalogue.',
    promiseCta: 'Découvrir',
    ownerTitle: 'Host.',
    ownerSub: 'Confiez-nous votre bien. On s\'occupe du reste.',
    ownerCta: 'Devenir partenaire',
    testimonial1: 'Une expérience unique. Le loft était encore plus beau que les photos.',
    testimonial1Name: 'Inès M.',
    testimonial2: 'Séjour parfait. Accueil impeccable, loft magnifique.',
    testimonial2Name: 'Karim S.',
    testimonial3: 'Je ne voyagerai plus autrement. Un confort exceptionnel.',
    testimonial3Name: 'Lina K.',
    ctaTitle: 'Prêt à changer d\'air ?',
    ctaSub: 'Trouvez le loft qui vous ressemble.',
    footerLofts: 'Lofts',
    footerOwners: 'Propriétaires',
    footerAbout: 'À propos',
    footerContact: 'Contact',
    rights: 'Tous droits réservés',
  },
  en: {
    heroTitle: 'Algeria',
    heroTagline: 'The art of elsewhere',
    heroCta: 'Explore lofts',
    statsGuests: 'Guests',
    statsLofts: 'Lofts',
    statsCities: 'Cities',
    statsRating: 'Rating',
    featuredTitle: 'Stay.',
    perNight: '/night',
    promiseTitle: 'Curated.',
    promiseSub: 'Every loft chosen for its soul. Not to fill a catalog.',
    promiseCta: 'Discover',
    ownerTitle: 'Host.',
    ownerSub: 'Trust us with your property. We handle the rest.',
    ownerCta: 'Become a partner',
    testimonial1: 'A unique experience. The loft was even more beautiful than the photos.',
    testimonial1Name: 'Inès M.',
    testimonial2: 'Perfect stay. Flawless welcome, stunning loft.',
    testimonial2Name: 'Karim S.',
    testimonial3: 'I won\'t travel any other way. Exceptional comfort.',
    testimonial3Name: 'Lina K.',
    ctaTitle: 'Ready for a change?',
    ctaSub: 'Find the loft that fits you.',
    footerLofts: 'Lofts',
    footerOwners: 'Owners',
    footerAbout: 'About',
    footerContact: 'Contact',
    rights: 'All rights reserved',
  },
  ar: {
    heroTitle: 'الجزائر',
    heroTagline: 'فن الإقامة في مكان آخر',
    heroCta: 'استكشف الشقق',
    statsGuests: 'الضيوف',
    statsLofts: 'الشقق',
    statsCities: 'المدن',
    statsRating: 'التقييم',
    featuredTitle: 'أقم.',
    perNight: '/ليلة',
    promiseTitle: 'مختار.',
    promiseSub: 'كل شقة تختار لروحها. ليس لملء كتالوج.',
    promiseCta: 'اكتشف',
    ownerTitle: 'مضيف.',
    ownerSub: 'ثق بنا في عقارك. نحن نعتني بالباقي.',
    ownerCta: 'كن شريكاً',
    testimonial1: 'تجربة فريدة. كانت الشقة أجمل من الصور.',
    testimonial1Name: 'إيناس م.',
    testimonial2: 'إقامة مثالية. استقبال لا تشوبه شائبة وشقة رائعة.',
    testimonial2Name: 'كريم س.',
    testimonial3: 'لن أسافر بطريقة أخرى. راحة استثنائية.',
    testimonial3Name: 'لينا ك.',
    ctaTitle: 'مستعد للتغيير؟',
    ctaSub: 'اعثر على الشقة التي تناسبك.',
    footerLofts: 'الشقق',
    footerOwners: 'الملاك',
    footerAbout: 'حول',
    footerContact: 'اتصال',
    rights: 'جميع الحقوق محفوظة',
  },
} as const;

function formatPrice(value?: number) {
  return (value || 0).toLocaleString('fr-FR');
}

export default function LandingV7({ locale }: LandingV7Props) {
  const t = copy[locale as keyof typeof copy] || copy.fr;
  const isRtl = locale === 'ar';
  const [lofts, setLofts] = useState<Loft[]>(fallbackLofts);
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

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

  const goToSearch = () => {
    window.location.href = `/${locale}/client/search`;
  };
  const goToPartner = () => {
    window.location.href = `/${locale}/register?role=partner`;
  };

  const scrollRef = useRef<HTMLDivElement>(null);

  const stats = [
    { value: '2 500+', label: t.statsGuests },
    { value: '150+', label: t.statsLofts },
    { value: '12', label: t.statsCities },
    { value: '4,9', label: t.statsRating },
  ];

  const testimonials = [
    { quote: t.testimonial1, name: t.testimonial1Name },
    { quote: t.testimonial2, name: t.testimonial2Name },
    { quote: t.testimonial3, name: t.testimonial3Name },
  ];

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen w-full overflow-x-hidden bg-white text-neutral-900 antialiased"
    >
      <PublicHeader locale={locale} text={{ login: locale === 'fr' ? 'Connexion' : locale === 'en' ? 'Login' : 'تسجيل الدخول' }} />

      {/* HERO — Full screen, minimal */}
      <section
        ref={heroRef}
        className="relative flex h-screen min-h-[600px] w-full items-center justify-center overflow-hidden"
      >
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="absolute inset-0">
          {lofts[0]?.photo && (
            <Image
              src={lofts[0].photo}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-white/40" />
        </motion.div>

        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6 text-sm font-medium uppercase tracking-[0.3em] text-neutral-500"
          >
            Loft Algérie
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-7xl font-medium tracking-tight sm:text-8xl lg:text-9xl"
          >
            {t.heroTitle}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-6 max-w-md text-lg text-neutral-500 sm:text-xl"
          >
            {t.heroTagline}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10"
          >
            <button
              onClick={goToSearch}
              className="inline-flex items-center justify-center bg-neutral-900 px-10 py-4 text-sm font-medium text-white transition-all hover:bg-neutral-800"
            >
              {t.heroCta}
            </button>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-[#fafafa]">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8">
          <div className="grid grid-cols-2 gap-16 md:grid-cols-4">
            {stats.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className="text-center"
              >
                <div className="text-5xl font-medium tracking-tight text-neutral-900 sm:text-6xl">
                  {s.value}
                </div>
                <div className="mt-2 text-xs uppercase tracking-[0.2em] text-neutral-400">
                  {s.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED LOFTS — Full-bleed horizontal scroll */}
      <section id="featured-lofts" className="overflow-hidden bg-white py-24">
        <div className="mb-12 px-6 sm:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-6xl font-medium tracking-tight sm:text-7xl lg:text-8xl"
          >
            {t.featuredTitle}
          </motion.h2>
        </div>
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto px-6 pb-8 sm:px-8"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {lofts.slice(0, 8).map((loft, i) => (
            <motion.a
              key={loft.id}
              href={
                loft.id.startsWith('fallback')
                  ? `/${locale}/client/search`
                  : `/${locale}/client/lofts/${loft.id}`
              }
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="group relative flex h-[70vh] w-[85vw] flex-shrink-0 items-end overflow-hidden bg-neutral-100 sm:w-[70vw] lg:w-[55vw]"
            >
              {loft.photo && (
                <Image
                  src={loft.photo}
                  alt={loft.name}
                  fill
                  sizes="(max-width: 640px) 85vw, (max-width: 1024px) 70vw, 55vw"
                  className="object-cover transition-all duration-700 ease-out group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="relative z-10 w-full p-8 sm:p-12">
                <h3 className="text-3xl font-medium text-white sm:text-4xl">
                  {loft.name}
                </h3>
                <p className="mt-2 text-lg text-white/80">
                  {formatPrice(loft.price_per_night)} DA <span className="text-sm text-white/50">{t.perNight}</span>
                </p>
              </div>
            </motion.a>
          ))}
        </div>
      </section>

      {/* SPLIT — Our Promise */}
      <section className="bg-[#fafafa]">
        <div className="mx-auto grid min-h-[70vh] grid-cols-1 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-center px-8 py-20 lg:px-16"
          >
            <div className="max-w-md">
              <p className="mb-2 text-xs uppercase tracking-[0.25em] text-emerald-600">
                {locale === 'fr' ? 'Notre promesse' : locale === 'en' ? 'Our promise' : 'وعدنا'}
              </p>
              <h2 className="text-6xl font-medium tracking-tight sm:text-7xl lg:text-8xl">
                {t.promiseTitle}
              </h2>
              <p className="mt-6 max-w-sm text-base leading-relaxed text-neutral-500 sm:text-lg">
                {t.promiseSub}
              </p>
              <button
                onClick={goToSearch}
                className="mt-8 inline-flex items-center justify-center bg-neutral-900 px-8 py-3.5 text-sm font-medium text-white transition-all hover:bg-neutral-800"
              >
                {t.promiseCta}
              </button>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative min-h-[50vh] bg-neutral-200 lg:min-h-full"
          >
            {lofts[1]?.photo && (
              <Image
                src={lofts[1].photo}
                alt=""
                fill
                sizes="50vw"
                className="object-cover"
              />
            )}
          </motion.div>
        </div>
      </section>

      {/* SPLIT — For Owners (reversed) */}
      <section className="bg-white">
        <div className="mx-auto grid min-h-[70vh] grid-cols-1 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative min-h-[50vh] order-last bg-neutral-200 lg:order-first lg:min-h-full"
          >
            {lofts[2]?.photo && (
              <Image
                src={lofts[2].photo}
                alt=""
                fill
                sizes="50vw"
                className="object-cover"
              />
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-center px-8 py-20 lg:px-16"
          >
            <div className="max-w-md">
              <p className="mb-2 text-xs uppercase tracking-[0.25em] text-emerald-600">
                {locale === 'fr' ? 'Propriétaires' : locale === 'en' ? 'Owners' : 'الملاك'}
              </p>
              <h2 className="text-6xl font-medium tracking-tight sm:text-7xl lg:text-8xl">
                {t.ownerTitle}
              </h2>
              <p className="mt-6 max-w-sm text-base leading-relaxed text-neutral-500 sm:text-lg">
                {t.ownerSub}
              </p>
              <button
                onClick={goToPartner}
                className="mt-8 inline-flex items-center justify-center bg-neutral-900 px-8 py-3.5 text-sm font-medium text-white transition-all hover:bg-neutral-800"
              >
                {t.ownerCta}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-[#fafafa] py-24">
        <div className="mx-auto max-w-6xl px-6 sm:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-6xl font-medium tracking-tight sm:text-7xl lg:text-8xl"
          >
            {locale === 'fr' ? 'Mots.' : locale === 'en' ? 'Voices.' : 'كلمات.'}
          </motion.h2>
          <div className="mt-16 grid grid-cols-1 gap-10 md:grid-cols-3">
            {testimonials.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="text-7xl font-light leading-none text-emerald-600/20">
                  &ldquo;
                </div>
                <p className="mt-2 text-lg leading-relaxed text-neutral-600">
                  {item.quote}
                </p>
                <p className="mt-4 text-sm font-medium text-neutral-900">
                  &mdash; {item.name}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-32">
        <div className="mx-auto max-w-3xl px-6 text-center sm:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl font-medium tracking-tight sm:text-6xl lg:text-7xl"
          >
            {t.ctaTitle}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-6 max-w-sm text-lg text-neutral-500"
          >
            {t.ctaSub}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10"
          >
            <button
              onClick={goToSearch}
              className="inline-flex items-center justify-center bg-neutral-900 px-12 py-4 text-sm font-medium text-white transition-all hover:bg-neutral-800"
            >
              {t.heroCta}
            </button>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-neutral-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:px-8">
          <div className="flex flex-col items-center justify-between gap-8 text-center sm:flex-row sm:text-left">
            <div>
              <div className="text-lg font-medium tracking-tight">Loft Algérie</div>
              <p className="mt-1 text-sm text-neutral-400">
                &copy; {new Date().getFullYear()} &mdash; {t.rights}
              </p>
            </div>
            <nav className="flex flex-wrap justify-center gap-6 text-sm">
              <a
                href={`/${locale}/client/search`}
                className="text-neutral-500 underline-offset-4 hover:underline hover:text-neutral-900"
              >
                {t.footerLofts}
              </a>
              <a
                href={`/${locale}/register?role=partner`}
                className="text-neutral-500 underline-offset-4 hover:underline hover:text-neutral-900"
              >
                {t.footerOwners}
              </a>
              <a
                href={`/${locale}/public/about`}
                className="text-neutral-500 underline-offset-4 hover:underline hover:text-neutral-900"
              >
                {t.footerAbout}
              </a>
              <a
                href={`/${locale}#contact-section`}
                className="text-neutral-500 underline-offset-4 hover:underline hover:text-neutral-900"
              >
                {t.footerContact}
              </a>
            </nav>
          </div>
          <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-neutral-100 pt-8 text-sm text-neutral-400 sm:flex-row">
            <span>{PHONE_DISPLAY}</span>
            <a href={`mailto:${EMAIL}`} className="underline-offset-4 hover:underline hover:text-neutral-900">
              {EMAIL}
            </a>
          </div>
        </div>
      </footer>

      <BackToTop />
    </div>
  );
}
